# 03 — RevGenIQ AI Sales & Marketing Agent

Standalone Python package (`revgeniq_agent`) containing the full AI pipeline.

## Package: `revgeniq_agent`

| Module | Description |
|--------|-------------|
| `pipeline.py` | Main orchestrator — intent routing to agents |
| `intent_classifier/` | GPT-4o intent classification (greeting, product, pricing, support…) |
| `rag/` | Retrieval-Augmented Generation — Qdrant + PostgreSQL fallback |
| `agents/greeting_agent.py` | Greeting & farewell handler |
| `agents/rag_agent.py` | Product/pricing/FAQ answers via RAG |
| `agents/lead_agent.py` | Lead capture conversation handler |
| `agents/support_agent.py` | Support & complaint handler |
| `agents/redirect_agent.py` | Off-topic redirect |
| `embeddings/` | OpenAI embeddings + chunk storage |
| `vector_db/` | Qdrant vector DB client wrapper |
| `crawler/` | Website crawler for knowledge base ingestion |
| `response_formatter/` | Structured response schema for widget rendering |

## How it's used

The `02_RevGenIQ_AI_Dashboard/backend/main.py` adds this package to `sys.path` at startup, making `revgeniq_agent` importable alongside the `app` package.

## Requirements

See `02_RevGenIQ_AI_Dashboard/backend/requirements.txt` for full dependencies.
