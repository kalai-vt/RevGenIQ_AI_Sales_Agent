"""
Dynamic suggestion-chip picker for the template-only agents (greeting/redirect/
lead-capture) that don't go through an LLM call and so can't generate
contextual suggestions on their own the way RAGAgent/SupportAgent do.

Filters out persona suggestions whose topic the visitor already asked about,
then shuffles what's left so repeat greetings don't show the identical three
chips every time.
"""
import random


def _topic_words(suggestion: str) -> set[str]:
    stopwords = {
        "what", "how", "do", "you", "your", "is", "are", "the", "a", "an", "to",
        "for", "of", "in", "i", "can", "does", "with", "we", "us", "our",
    }
    words = [w.strip("?.,!").lower() for w in suggestion.split()]
    return {w for w in words if w and w not in stopwords}


def _already_asked(suggestion: str, user_messages: list[str]) -> bool:
    topic = _topic_words(suggestion)
    if not topic:
        return False
    for msg in user_messages:
        msg_words = _topic_words(msg)
        overlap = topic & msg_words
        if len(overlap) >= max(1, len(topic) // 2):
            return True
    return False


def pick_dynamic_suggestions(persona_suggestions: list[str], conversation_history: list[dict], k: int = 2) -> list[str]:
    if not persona_suggestions:
        return []

    user_messages = [m.get("content", "") for m in conversation_history if m.get("role") == "user"]
    fresh = [s for s in persona_suggestions if not _already_asked(s, user_messages)]

    pool = list(fresh) if fresh else list(persona_suggestions)
    random.shuffle(pool)

    if len(pool) < k:
        # Pad back with already-asked ones rather than showing an empty/short row.
        remainder = [s for s in persona_suggestions if s not in pool]
        random.shuffle(remainder)
        pool = pool + remainder

    return pool[:k]
