import json
from typing import Literal
from pydantic import BaseModel
from app.core.config import settings

_INTENT_VALUES = (
    "greeting", "small_talk", "company_information", "product_inquiry", "features",
    "pricing", "comparison", "demo_request", "quote_request", "contact_sales",
    "purchase_intent", "support", "lead_qualification", "complaint", "feedback",
    "off_topic", "farewell", "other",
)

# A real question always wins over "hi" when both are present in one message —
# this preserves today's de-facto behavior for single-intent messages while
# letting compound ones (e.g. "Hi, tell me about pricing") route on the part
# that actually needs an agent, with the conversational part passed through
# as a secondary intent (see pipeline.py) so it isn't silently dropped.
_SUBSTANTIVE_INTENTS = frozenset({
    "company_information", "product_inquiry", "features", "pricing", "comparison",
    "demo_request", "quote_request", "contact_sales", "purchase_intent",
    "support", "complaint", "feedback", "lead_qualification", "off_topic",
})


class IntentItem(BaseModel):
    intent: Literal[_INTENT_VALUES]
    confidence: float


class IntentResult(BaseModel):
    intents: list[IntentItem]
    intent: str        # back-compat: resolved primary intent
    confidence: float  # back-compat: primary intent's confidence
    lead_score: float
    capture_lead: bool
    reasoning: str


def _resolve_primary(intents: list[IntentItem]) -> IntentItem:
    substantive = [i for i in intents if i.intent in _SUBSTANTIVE_INTENTS]
    pool = substantive or intents
    return max(pool, key=lambda i: i.confidence)


class IntentClassifier:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    async def classify(self, message: str, conversation_history: list, company_name: str = "") -> IntentResult:
        system_prompt = f"""You are an intent classifier for a sales and support chatbot.
Company context: {company_name}

A single message can contain MORE THAN ONE intent — detect ALL of them, not just one.

Available intents:
- greeting: Hello, hi, hey, good morning etc.
- small_talk: Casual conversational chat not about the business — "how are you", "what's up", pleasantries
- company_information: Questions about the company itself — company name, "who are you", "who developed/built you", what you (the AI) can do, address, location, founder, history, certifications, "how can you help my business"
- product_inquiry: Questions about what products/services exist, listings, HOW to order/buy (process questions)
- features: Asking specifically what features/capabilities a product has
- pricing: Questions about prices, costs, plans, packages, quotes for bulk orders
- comparison: Asking to compare plans/products/tiers against each other
- demo_request: Explicitly asking for a demo or walkthrough
- quote_request: Explicitly asking for a formal price quote/quotation (distinct from a general pricing question)
- contact_sales: Explicitly asking to speak with/be connected to a sales person or the sales team
- purchase_intent: Expressing intent to buy/purchase NOW ("I want to buy", "let's get started", "sign me up") — NOT yet providing contact details
- support: Technical issues, problems, bugs, help requests
- lead_qualification: User is ACTIVELY SUBMITTING their contact details (name, email, phone, company, requirement) in response to being asked — NOT just expressing interest
- complaint: Negative feedback, dissatisfaction
- feedback: Positive or neutral feedback/praise about the product or experience — not a complaint
- off_topic: Completely unrelated to the company (e.g. weather, sports, politics)
- farewell: Goodbye, bye, thank you and leaving
- other: Doesn't fit other categories

COMPOUND EXAMPLES (return every intent that applies, each with its own confidence):
- "Hi" -> [{{"intent":"greeting","confidence":0.98}}]
- "How are you?" -> [{{"intent":"greeting","confidence":0.7}}, {{"intent":"small_talk","confidence":0.9}}]
- "Hi, tell me about pricing" -> [{{"intent":"greeting","confidence":0.9}}, {{"intent":"pricing","confidence":0.95}}]
- "Hello, what products do you have?" -> [{{"intent":"greeting","confidence":0.9}}, {{"intent":"product_inquiry","confidence":0.95}}]
- "I need pricing for your AI Agent" -> [{{"intent":"pricing","confidence":0.95}}]
- "I need a demo" -> [{{"intent":"demo_request","confidence":0.95}}]
- "I want to buy" -> [{{"intent":"purchase_intent","confidence":0.95}}]
- "I need support" -> [{{"intent":"support","confidence":0.95}}]
- "Compare your plans" -> [{{"intent":"comparison","confidence":0.95}}]
- "Who are you?" -> [{{"intent":"company_information","confidence":0.9}}]
- "What is your company name?" -> [{{"intent":"company_information","confidence":0.95}}]
- "Who developed you?" -> [{{"intent":"company_information","confidence":0.95}}]
- "How can you help my business?" -> [{{"intent":"company_information","confidence":0.85}}]
- "What features do you offer?" -> [{{"intent":"features","confidence":0.9}}]
- "Can I get a formal quote?" -> [{{"intent":"quote_request","confidence":0.9}}]
- "Can I speak to sales?" -> [{{"intent":"contact_sales","confidence":0.9}}]
- "This is amazing, great job!" -> [{{"intent":"feedback","confidence":0.9}}]

CRITICAL RULES:
- "List your products" / "Show me products" = product_inquiry
- "How do I place an order?" / "How to buy?" = product_inquiry
- "I want to place an order" / "I want to buy" = purchase_intent (NOT product_inquiry)
- "I need contact details / address / phone / email" = company_information
- lead_qualification is ONLY when user is actively providing their name/email/phone/company
- capture_lead = true when lead_score > 0.7 (strong buying intent or providing contact details)
- NEVER classify a product or order question as lead_qualification

Also estimate:
- lead_score: 0.0-1.0 (likelihood this person is a potential buyer)
- capture_lead: true if user is providing contact info OR has very strong buying intent (score > 0.7)
- reasoning: brief explanation

Respond with JSON only, shaped exactly as:
{{"intents": [{{"intent":"...","confidence":0.0-1.0}}, ...], "lead_score":0.0, "capture_lead":false, "reasoning":"..."}}"""

        history_text = ""
        if conversation_history:
            history_text = "\n".join([f"{m['role']}: {m['content']}" for m in conversation_history[-5:]])

        user_prompt = f"Conversation history:\n{history_text}\n\nCurrent message: {message}"

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )
            data = json.loads(response.choices[0].message.content)
            raw_intents = data.get("intents") or []
            intents = [
                IntentItem(intent=i["intent"], confidence=float(i.get("confidence", 0.5)))
                for i in raw_intents
                if isinstance(i, dict) and i.get("intent") in _INTENT_VALUES
            ]
            if not intents:
                # Legacy/malformed shape fallback — tolerate a bare {"intent": "..."}.
                legacy = data.get("intent")
                intents = [IntentItem(intent=legacy if legacy in _INTENT_VALUES else "other", confidence=float(data.get("confidence", 0.5)))]

            primary = _resolve_primary(intents)
            return IntentResult(
                intents=intents,
                intent=primary.intent,
                confidence=primary.confidence,
                lead_score=float(data.get("lead_score", 0.0)),
                capture_lead=bool(data.get("capture_lead", False)),
                reasoning=data.get("reasoning", ""),
            )
        except Exception:
            fallback = IntentItem(intent="other", confidence=0.5)
            return IntentResult(
                intents=[fallback],
                intent="other",
                confidence=0.5,
                lead_score=0.0,
                capture_lead=False,
                reasoning="Classification failed",
            )
