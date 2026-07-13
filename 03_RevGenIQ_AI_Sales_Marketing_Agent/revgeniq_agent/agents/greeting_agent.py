from revgeniq_agent.persona import resolve_persona
from revgeniq_agent.response_formatter import normalize


class GreetingAgent:
    async def respond(self, message: str, company_context: dict, conversation_history: list) -> dict:
        company_name = company_context.get("name", "our company")
        agent_name   = company_context.get("agent_name", "AI Assistant")
        welcome_msg  = company_context.get("welcome_message", "")
        industry     = company_context.get("industry")

        persona = resolve_persona(industry)
        msg = welcome_msg or f"Hello! I'm {agent_name}, the AI Sales & Support Assistant for {company_name}. How can I help you today?"

        return normalize({
            "response_type": "greeting",
            "message": msg,
            "actions": [
                *persona["info_actions"],
                {"label": persona["primary_action"]["label"], "action": persona["primary_action"]["action"]},
                {"label": persona["secondary_action"]["label"], "action": persona["secondary_action"]["action"]},
            ],
            "suggestions": persona["suggestions"],
        })
