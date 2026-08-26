# Production image for the ASE backend (FastAPI + SQLAlchemy + Alembic).
#
# Why this exists: the app previously deployed to Railway purely via
# Nixpacks auto-detection (no Dockerfile in the repo), which works but means
# the exact Python version, system packages, and build steps used in
# production are whatever Railway's buildpack heuristics decide *today* —
# not something reviewable in version control or reproducible locally.
# This Dockerfile pins all of that explicitly.
#
# Multi-stage: the `builder` stage compiles wheels (only needed at build
# time), the final stage copies just the installed packages + app code, so
# the shipped image doesn't carry build tooling.

FROM python:3.11-slim AS builder

WORKDIR /build

# psycopg[binary] and qrcode[pil] ship prebuilt wheels for this base image,
# so no extra system packages (libpq-dev, libjpeg-dev, etc.) are needed to
# build them — keep this stage minimal on purpose.
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt ./
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

FROM python:3.11-slim AS runtime

# Run as a non-root user rather than the container default root.
RUN useradd --create-home --uid 1000 appuser
WORKDIR /app

COPY --from=builder /wheels /wheels
COPY requirements.txt ./
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./

RUN chown -R appuser:appuser /app
USER appuser

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import os,urllib.request,sys; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",\"8000\")}/health', timeout=3) or sys.exit(1)" || exit 1

# Railway (and most PaaS targets) inject $PORT at runtime and expect the
# process to bind to it — shell form so the env var expands. Single worker
# by default: app.core.newsletter/test_execution polling run in-process via
# APScheduler with no leader election, so running >1 worker would duplicate
# scheduled jobs. Scale horizontally via multiple Railway replicas instead
# of multiple workers per container if throughput ever requires it.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
