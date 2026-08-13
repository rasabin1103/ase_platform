from __future__ import annotations

from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response

# Swagger UI (/docs) and ReDoc (/redoc) load their JS/CSS from a CDN and run
# inline scripts — a strict CSP would break them. The API itself only ever
# returns JSON, so everywhere else gets the strict, no-exceptions policy.
_DOCS_PATHS = frozenset({"/docs", "/redoc", "/docs/oauth2-redirect"})

_API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"


def _is_https_request(request: Request) -> bool:
    if request.url.scheme == "https":
        return True
    # Deployed behind a reverse proxy / load balancer (Vercel, Render, etc.)
    # terminates TLS before the app ever sees the request, so the app-level
    # scheme is plain http even though the browser connection was https.
    forwarded_proto = request.headers.get("x-forwarded-proto", "")
    return forwarded_proto.split(",")[0].strip().lower() == "https"


def install_security_headers(app: FastAPI) -> None:
    """Adds the standard defensive HTTP security headers to every response:
    HSTS, X-Frame-Options, X-Content-Type-Options, a restrictive
    Content-Security-Policy for the JSON API, Referrer-Policy and a minimal
    Permissions-Policy. Registered as the outermost middleware so it still
    decorates error responses raised by other middleware/handlers."""

    @app.middleware("http")
    async def _add_security_headers(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)

        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        if _is_https_request(request):
            # 2 years, apply to subdomains, eligible for browser preload lists.
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"

        if request.url.path not in _DOCS_PATHS:
            response.headers["Content-Security-Policy"] = _API_CSP

        return response
