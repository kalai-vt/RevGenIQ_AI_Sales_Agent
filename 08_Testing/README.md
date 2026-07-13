# Testing

## unit / api / integration (backend, Python)

Runs against an isolated SQLite file (`08_Testing/_test_data/test.db`), never the dev `agentdb.db`.

```bash
cd 08_Testing
pip install pytest pytest-asyncio httpx
pytest
```

## ui (Playwright, browser)

Needs the backend and frontend dev server running first (matches the root README's Quick Start):

```bash
# terminal 1
cd 02_RevGenIQ_AI_Dashboard/backend && uvicorn main:app --port 8000

# terminal 2
cd 02_RevGenIQ_AI_Dashboard/frontend && npm run dev -- --port 3000

# terminal 3
pip install pytest-playwright && playwright install chromium
BACKEND_URL=http://localhost:8000 pytest ui --base-url http://localhost:3000
```

## performance (Locust)

Not run automatically — needs a dedicated target environment.

```bash
pip install locust
locust -f performance/locustfile.py --host http://localhost:8000
```
