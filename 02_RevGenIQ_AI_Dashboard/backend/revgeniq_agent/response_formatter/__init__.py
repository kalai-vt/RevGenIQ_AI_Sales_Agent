"""
Structured response schema for all AI agents.
Every agent must return a dict matching this shape; the widget renders it.
"""
import json
import re
from typing import Any

from revgeniq_agent.persona import PersonaProfile, resolve_persona

_JSON_BLOCK_RE = re.compile(r'```(?:json)?\s*(\{.*?\})\s*```', re.DOTALL)

# Action codes the widget frontend knows how to render as real UI (see
# widget/static/loader.js). Anything else collapses to "CHAT" so a button
# never renders with a dead/unhandled action.
_ALLOWED_ACTIONS = {"CHAT", "URL", "OPEN_QUOTE_FORM", "OPEN_DEMO_FORM", "OPEN_CONTACT_FORM", "DOWNLOAD_BROCHURE"}
# Older prompts/agents may still emit these lowercase legacy tokens — map them
# forward instead of breaking existing in-flight conversations.
_LEGACY_ACTION_MAP = {"lead_form": "OPEN_QUOTE_FORM", "chat": "CHAT", "url": "URL"}


def _normalize_action(action: str) -> str:
    if action in _ALLOWED_ACTIONS:
        return action
    mapped = _LEGACY_ACTION_MAP.get(action.lower())
    if mapped:
        return mapped
    return "CHAT"


def parse_llm_json(text: str) -> dict:
    """Extract the first valid JSON object from LLM output."""
    text = text.strip()
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass
    m = _JSON_BLOCK_RE.search(text)
    if m:
        try:
            return json.loads(m.group(1))
        except (json.JSONDecodeError, ValueError):
            pass
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except (json.JSONDecodeError, ValueError):
            pass
    return {}


def normalize(raw: dict, fallback_message: str = "") -> dict:
    """Ensure every required key exists with a sane default."""
    result = {
        "response_type": raw.get("response_type", "message"),
        "title":         raw.get("title") or None,
        "subtitle":      raw.get("subtitle") or None,
        "message":       raw.get("message") or fallback_message,
        "cards":         raw.get("cards") or [],
        "table":         raw.get("table") or None,
        "actions":       raw.get("actions") or [],
        "suggestions":   raw.get("suggestions") or [],
        "metadata":      raw.get("metadata") or {},
    }
    cleaned_actions = []
    for a in result["actions"]:
        if isinstance(a, dict) and a.get("label"):
            cleaned_actions.append({
                "label":   a["label"],
                "action":  _normalize_action(str(a.get("action", "CHAT"))),
                "message": a.get("message", a["label"]),
                "url":     a.get("url", ""),
                "color":   a.get("color", "primary"),
            })
    # UI budget: at most one CTA button and two suggestion chips per turn,
    # enforced here so it holds for every agent regardless of what an LLM
    # prompt drifts toward emitting — this is the fix for "too many buttons".
    result["actions"] = cleaned_actions[:1]
    result["suggestions"] = list(result["suggestions"])[:2]
    return result


def make_error(message: str = "Something went wrong. Please try again.") -> dict:
    return normalize({
        "response_type": "error",
        "message": message,
        "actions": [{"label": "Try Again", "action": "CHAT", "message": "Hello"}],
    })


def make_not_found(company_name: str = "our company", industry: str | None = None, conversation_history: list | None = None) -> dict:
    persona = resolve_persona(industry)
    # A redirect needs to nudge the visitor back on-topic — one CTA does that;
    # pairing it with suggestion chips too is exactly the clutter being fixed.
    return normalize({
        "response_type": "not_found",
        "message": f"I'm here to help with questions about {company_name}. What would you like to know?",
        "actions": [{"label": persona["primary_action"]["label"], "action": persona["primary_action"]["action"]}],
        "suggestions": [],
    })
