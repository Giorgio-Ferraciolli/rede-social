"""Ponto único de configuração de observabilidade.

- Logs estruturados (JSON) com request_id, trace_id e log de acesso por requisição.
- Traces e métricas (OpenTelemetry) das requisições (FastAPI) e do banco (SQLAlchemy),
  exportados via OTLP para o Grafana Alloy (infrastructure/alloy), que encaminha ao
  Grafana Cloud. Só é ativado quando OTEL_EXPORTER_OTLP_ENDPOINT está definido.
"""

from fastapi import FastAPI

from app.core.config import Settings
from app.observability.logging import setup_logging
from app.observability.middleware import RequestContextMiddleware
from app.observability.telemetry import setup_telemetry


def setup_observability(app: FastAPI, settings: Settings) -> None:
    setup_logging(settings.log_level, settings.log_format)
    app.add_middleware(RequestContextMiddleware)
    if settings.otel_exporter_otlp_endpoint:
        setup_telemetry(app, settings)
