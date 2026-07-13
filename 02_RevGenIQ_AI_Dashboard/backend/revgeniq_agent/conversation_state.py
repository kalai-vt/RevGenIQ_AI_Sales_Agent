"""
Conversation stage — a lightweight, per-turn read on where this conversation
is in the sales journey (Greeting -> Discovery -> Information -> Interest ->
Lead Capture -> Closing -> Farewell).

Deliberately NOT a persisted state machine: conversation_history is already
resent by the client every turn (there's no backend session store to persist
a stage into), so the stage is recomputed fresh each turn from the intent(s)
and history rather than tracked as new durable state.
"""

_INTEREST_INTENTS = frozenset({"pricing", "comparison", "demo_request", "quote_request", "contact_sales", "purchase_intent"})
_INFORMATION_INTENTS = frozenset({"company_information", "product_inquiry", "features", "support", "complaint", "feedback"})


def determine_stage(
    intent: str,
    conversation_history: list[dict],
    is_mid_capture: bool = False,
    lead_capture_allowed: bool = True,
    lead_captured: bool = False,
) -> str:
    if lead_captured:
        return "closing"
    if intent == "farewell":
        return "farewell"
    if is_mid_capture or (intent in ("lead_qualification", "purchase_intent") and lead_capture_allowed):
        return "lead_capture"
    if intent in _INTEREST_INTENTS:
        return "interest"
    if intent in _INFORMATION_INTENTS:
        return "information"
    if intent in ("greeting", "small_talk"):
        return "discovery" if conversation_history else "greeting"
    return "discovery"
