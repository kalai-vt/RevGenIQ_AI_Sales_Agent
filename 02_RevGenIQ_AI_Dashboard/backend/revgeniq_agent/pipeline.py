"""
RevGenIQ AI pipeline — full intent-routing orchestrator.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

_INFO_KEYWORDS = frozenset([
    "contact", "address", "phone", "email", "location", "where",
    "certif", "founder", "history", "established", "group", "office",
    "about", "who are", "tell me about",
])

_LEAD_ASKING_PHRASES = [
    "what is your name",
    "what's your name",
    "may i have your name",
    "could i get your name",
    "your full name",
    "your email address",
    "your email id",
    "share your email",
    "your contact email",
    "your company name",
    "your requirement",
    "your quantity",
]


def _is_mid_lead_capture(conversation_history: list) -> bool:
    """Return True if the last assistant turn was explicitly collecting lead info."""
    for msg in reversed(conversation_history[-4:]):
        if msg.get("role") == "assistant":
            content = msg.get("content", "").lower()
            return any(phrase in content for phrase in _LEAD_ASKING_PHRASES)
    return False


async def run_pipeline(
    message: str,
    company_id: str,
    company_context: dict,
    conversation_history: list[dict],
    db: AsyncSession,
    conversation_id: str = "",
) -> dict:
    """
    Full AI pipeline with intent classification and agent routing.

    Stages:
    1. Intent Classification
    2. Mid-lead-capture detection (overrides intent)
    3. Agent selection: greeting / rag / lead / support / redirect
    4. Analytics recording for lead captures
    """
    try:
        from revgeniq_agent.intent_classifier import IntentClassifier
        from revgeniq_agent.agents.greeting_agent import GreetingAgent
        from revgeniq_agent.agents.rag_agent import RAGAgent
        from revgeniq_agent.agents.lead_agent import LeadAgent
        from revgeniq_agent.agents.support_agent import SupportAgent
        from revgeniq_agent.agents.redirect_agent import RedirectAgent

        tenant_id = company_id

        # ── Memory: how much conversation history the agents get to see ────────
        enable_memory = company_context.get("enable_memory", True)
        memory_window = int(company_context.get("memory_window", 10))
        effective_history = conversation_history[-memory_window:] if enable_memory else []

        # ── Lead capture gating ──────────────────────────────────────────────────
        enable_lead_capture = company_context.get("enable_lead_capture", True)
        lead_capture_after = int(company_context.get("lead_capture_after_messages", 2))
        user_turns = sum(1 for m in conversation_history if m.get("role") == "user") + 1
        lead_capture_allowed = enable_lead_capture and user_turns >= lead_capture_after
        company_context = {**company_context, "lead_capture_allowed": lead_capture_allowed}

        classifier = IntentClassifier()
        intent_result = await classifier.classify(
            message, effective_history, company_context.get("name", "")
        )
        intent = intent_result.intent
        secondary_intents = [i.intent for i in intent_result.intents if i.intent != intent]

        # A prior turn asking "what's your name?" shouldn't force-route a
        # *new*, clearly different question (pricing, support, etc.) into
        # lead collection — only genuinely ambiguous replies (a name, "other",
        # or an actual lead_qualification answer) continue the lead flow.
        _TOPICAL_INTENTS = (
            "pricing", "product_inquiry", "support", "complaint", "off_topic", "greeting", "farewell",
            "comparison", "demo_request", "purchase_intent", "small_talk",
            "company_information", "features", "quote_request", "contact_sales", "feedback",
        )
        is_mid_capture = (
            lead_capture_allowed
            and _is_mid_lead_capture(effective_history)
            and intent not in _TOPICAL_INTENTS
        )

        structured = {}
        lead_captured = False

        if is_mid_capture or (intent == "purchase_intent" and lead_capture_allowed):
            agent = LeadAgent(db)
            structured = await agent.respond(
                message, tenant_id, conversation_id, company_context, effective_history
            )
            lead_captured = structured.get("lead_captured", False)

        elif intent in ("greeting", "farewell", "small_talk"):
            agent = GreetingAgent()
            all_intents = [i.intent for i in intent_result.intents]
            structured = await agent.respond(message, intent, company_context, effective_history, all_intents)

        elif intent in ("support", "complaint", "feedback"):
            agent = SupportAgent(db)
            structured = await agent.respond(message, tenant_id, company_context, effective_history, intent, secondary_intents)

        elif intent == "off_topic":
            agent = RedirectAgent()
            structured = await agent.respond(message, company_context, effective_history)

        else:
            agent = RAGAgent(db)
            structured = await agent.respond(message, tenant_id, company_context, effective_history, secondary_intents)

        response_text = structured.get("message") or structured.get("response", "")

        from revgeniq_agent.conversation_state import determine_stage
        stage = determine_stage(
            intent, effective_history,
            is_mid_capture=is_mid_capture,
            lead_capture_allowed=lead_capture_allowed,
            lead_captured=lead_captured,
        )

        if lead_captured:
            try:
                from app.models.analytics import AnalyticsEvent
                from datetime import datetime, timezone
                import uuid
                db.add(AnalyticsEvent(
                    tenant_id=uuid.UUID(tenant_id),
                    event_type="lead",
                    conversation_id=uuid.UUID(conversation_id) if conversation_id else None,
                    created_at=datetime.now(timezone.utc),
                ))
                await db.flush()
            except Exception as exc:
                logger.warning("Lead analytics recording failed: %s", exc)

        return {
            **structured,
            "response": response_text,
            "intent": intent,
            "intents": [{"intent": i.intent, "confidence": i.confidence} for i in intent_result.intents],
            "confidence": intent_result.confidence,
            "lead_score": intent_result.lead_score,
            "capture_lead": intent_result.capture_lead or lead_captured,
            "company_id": company_context.get("id"),
            "conversation_stage": stage,
        }

    except Exception as exc:
        logger.error("Pipeline failed for tenant %s: %s", company_id, exc, exc_info=True)
        from revgeniq_agent.response_formatter import make_error
        err = make_error("I apologize, I'm having trouble processing your request. Please try again or contact us directly.")
        return {
            **err,
            "response": err["message"],
            "intent": "error",
            "intents": [{"intent": "error", "confidence": 0.0}],
            "confidence": 0.0,
            "lead_score": 0.0,
            "capture_lead": False,
            "company_id": company_id,
            "conversation_stage": "error",
        }
