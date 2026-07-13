import json
from typing import Literal
from pydantic import BaseModel
from app.core.config import settings


class IntentResult(BaseModel):
    intent: Literal["greeting", "product_inquiry", "pricing", "support", "lead_qualification", "complaint", "off_topic", "farewell", "other"]
    confidence: float
    lead_score: float
    capture_lead: bool
    reasoning: str


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

Classify the user message into one of these intents:
- greeting: Hello, hi, hey, good morning etc.
- product_inquiry: Questions about products, services, features, certifications, company info, address, contact details, location, founder, packaging, HOW to order/buy (process questions), list of products
- pricing: Questions about prices, costs, plans, packages, quotes for bulk orders
- support: Technical issues, problems, bugs, help requests
- lead_qualification: User is ACTIVELY SUBMITTING their contact details (name, email, phone, company, requirement) in response to being asked — NOT just expressing interest
- complaint: Negative feedback, dissatisfaction
- off_topic: Completely unrelated to the company (e.g. weather, sports, politics)
- farewell: Goodbye, bye, thank you and leaving
- other: Doesn't fit other categories

CRITICAL RULES:
- "List your products" / "Show me products" = product_inquiry
- "How do I place an order?" / "How to buy?" = product_inquiry
- "I want to place an order" / "I want to buy" = product_inquiry
- "I need contact details / address / phone / email" = product_inquiry
- lead_qualification is ONLY when user is actively providing their name/email/phone/company
- capture_lead = true when lead_score > 0.7 (strong buying intent or providing contact details)
- NEVER classify a product or order question as lead_qualification

Also estimate:
- confidence: 0.0-1.0
- lead_score: 0.0-1.0 (likelihood this person is a potential buyer)
- capture_lead: true if user is providing contact info OR has very strong buying intent (score > 0.7)
- reasoning: brief explanation

Respond with JSON only."""

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
            return IntentResult(
                intent=data.get("intent", "other"),
                confidence=float(data.get("confidence", 0.5)),
                lead_score=float(data.get("lead_score", 0.0)),
                capture_lead=bool(data.get("capture_lead", False)),
                reasoning=data.get("reasoning", ""),
            )
        except Exception:
            return IntentResult(
                intent="other",
                confidence=0.5,
                lead_score=0.0,
                capture_lead=False,
                reasoning="Classification failed",
            )
