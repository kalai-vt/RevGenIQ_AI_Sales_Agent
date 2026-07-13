"""
CORS for the public widget API.

The widget is embedded on arbitrary third-party client sites (unknown,
unbounded set of origins), unlike the dashboard frontend which comes from a
fixed, configured origin. The global CORSMiddleware only allow-lists
`settings.cors_origins`, which would block every client's own website.

These endpoints take no cookies and require no credentials (identity comes
from the `widget_key` in the request body/path), so a wildcard origin is
safe here — it does not expose authenticated dashboard data.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class WidgetCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if not request.url.path.startswith("/widget/"):
            return await call_next(request)

        if request.method == "OPTIONS":
            response = Response(status_code=204)
        else:
            response = await call_next(request)

        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
