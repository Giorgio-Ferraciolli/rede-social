"""Traces e métricas com OpenTelemetry, exportados via OTLP/HTTP para o Grafana Alloy.

O endereço vem de OTEL_EXPORTER_OTLP_ENDPOINT (ex.: http://alloy:4318); os exportadores
acrescentam /v1/traces e /v1/metrics sozinhos. O nome do serviço vem de OTEL_SERVICE_NAME.

Métricas geradas pelas instrumentações:
- FastAPI: duração e volume das requisições HTTP (por rota, método e status).
- SQLAlchemy: uso do pool de conexões com o banco.
"""

import logging

from fastapi import FastAPI
from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from app.core.config import Settings
from app.db.session import engine

logger = logging.getLogger(__name__)

# Health checks rodam a cada poucos segundos (Docker/nginx) e só gerariam ruído.
_EXCLUDED_URLS = "/api/health"


def setup_telemetry(app: FastAPI, settings: Settings) -> None:
    # Identifica o serviço no Grafana (filtros por service.name e ambiente).
    resource = Resource.create(
        {
            "service.name": settings.otel_service_name,
            "deployment.environment": settings.environment,
        }
    )

    tracer_provider = TracerProvider(resource=resource)
    # Envio em lotes, em segundo plano: não atrasa as respostas da API.
    tracer_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    trace.set_tracer_provider(tracer_provider)

    # Envia as métricas acumuladas a cada 60 s (ajustável em OTEL_METRIC_EXPORT_INTERVAL, em ms).
    meter_provider = MeterProvider(
        resource=resource, metric_readers=[PeriodicExportingMetricReader(OTLPMetricExporter())]
    )
    metrics.set_meter_provider(meter_provider)

    FastAPIInstrumentor.instrument_app(
        app,
        tracer_provider=tracer_provider,
        meter_provider=meter_provider,
        excluded_urls=_EXCLUDED_URLS,
    )
    # skip_dep_check: a instrumentação 0.66b0 declara suporte só até sqlalchemy < 2.1, mas usa
    # apenas a API pública de eventos (before/after_cursor_execute, pool), estável na 2.1.
    # Remover quando uma versão da instrumentação incluir a 2.1 oficialmente.
    # Uma falha aqui não deve derrubar a API: seguimos só com a telemetria HTTP.
    try:
        SQLAlchemyInstrumentor().instrument(
            engine=engine,
            tracer_provider=tracer_provider,
            meter_provider=meter_provider,
            skip_dep_check=True,
        )
    except Exception:
        logger.exception("Falha ao instrumentar o SQLAlchemy; telemetria segue sem dados do banco.")
