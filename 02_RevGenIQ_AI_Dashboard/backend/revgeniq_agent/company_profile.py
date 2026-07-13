"""
Company Profile — the reliable, structured ground truth for a tenant (as
opposed to the fuzzy RAG-retrieved Knowledge Base). Built fresh per request
from whatever fields the tenant has actually configured, so direct questions
("what's your company name", "where are you located") don't depend on
retrieval succeeding — they read straight from verified data.

Fields the schema doesn't carry as dedicated columns (mission/vision/target
audience/brand tone) are expected to live in the tenant's own knowledge base
content instead — that's what it's for.
"""


def _format_business_hours(hours: dict | None) -> str | None:
    if not hours:
        return None
    parts = [f"{day}: {value}" for day, value in hours.items() if value]
    return "; ".join(parts) if parts else None


def build_profile_block(company_context: dict) -> str:
    lines = []
    if company_context.get("name"):
        lines.append(f"Company Name: {company_context['name']}")
    if company_context.get("industry"):
        lines.append(f"Industry: {company_context['industry']}")
    if company_context.get("description"):
        lines.append(f"Description: {company_context['description']}")
    if company_context.get("website_url"):
        lines.append(f"Website: {company_context['website_url']}")
    if company_context.get("country"):
        lines.append(f"Country: {company_context['country']}")
    if company_context.get("phone"):
        lines.append(f"Phone: {company_context['phone']}")
    if company_context.get("support_email"):
        lines.append(f"Support Email: {company_context['support_email']}")
    if company_context.get("sales_email"):
        lines.append(f"Sales Email: {company_context['sales_email']}")
    hours_text = _format_business_hours(company_context.get("business_hours"))
    if hours_text:
        lines.append(f"Business Hours: {hours_text}")

    if not lines:
        return ""

    return "Company Profile (verified facts about this business — use these directly, never contradict them):\n" + "\n".join(lines)
