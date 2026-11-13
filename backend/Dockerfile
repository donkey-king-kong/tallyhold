FROM ghcr.io/astral-sh/uv:0.13.7 AS uv

FROM python:3.12-slim

COPY --from=uv /uv /usr/local/bin/uv
WORKDIR /app

ENV UV_PYTHON=/usr/local/bin/python \
    UV_LINK_MODE=copy \
    UV_SYSTEM_CERTS=true \
    PATH="/app/.venv/bin:${PATH}"

COPY pyproject.toml uv.lock .python-version ./
RUN --mount=type=secret,id=local_ca,required=false \
    if [ -f /run/secrets/local_ca ]; then \
      SSL_CERT_FILE=/run/secrets/local_ca uv sync --locked --no-dev --no-install-project; \
    else \
      uv sync --locked --no-dev --no-install-project; \
    fi

COPY app ./app
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
