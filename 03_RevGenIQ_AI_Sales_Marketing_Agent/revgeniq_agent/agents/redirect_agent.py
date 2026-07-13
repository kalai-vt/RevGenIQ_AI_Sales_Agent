from revgeniq_agent.response_formatter import make_not_found


class RedirectAgent:
    async def respond(self, message: str, company_context: dict, conversation_history: list) -> dict:
        company_name = company_context.get("name", "our company")
        return make_not_found(company_name, company_context.get("industry"))
