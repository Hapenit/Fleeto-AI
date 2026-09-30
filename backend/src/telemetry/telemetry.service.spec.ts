import { TelemetryService } from './telemetry.service.js';

describe('TelemetryService', () => {
  it('records request counters and cumulative duration buckets', () => {
    const telemetry = new TelemetryService();
    const labels = {
      controller: 'RequirementsController',
      method: 'GET',
      route: '/api/requirements/:id',
      statusCode: 200,
    };

    telemetry.recordRequest(labels, 0.008);
    telemetry.recordRequest(labels, 0.3);

    const metrics = telemetry.toPrometheusMetrics();
    expect(metrics).toContain(
      'fleeto_http_requests_total{controller="RequirementsController",method="GET",route="/api/requirements/:id",status_code="200"} 2',
    );
    expect(metrics).toContain(
      'fleeto_http_request_duration_seconds_bucket{controller="RequirementsController",method="GET",route="/api/requirements/:id",status_code="200",le="0.01"} 1',
    );
    expect(metrics).toContain(
      'fleeto_http_request_duration_seconds_bucket{controller="RequirementsController",method="GET",route="/api/requirements/:id",status_code="200",le="0.5"} 2',
    );
    expect(metrics).toContain(
      'fleeto_http_request_duration_seconds_bucket{controller="RequirementsController",method="GET",route="/api/requirements/:id",status_code="200",le="+Inf"} 2',
    );
  });

  it('escapes Prometheus label values', () => {
    const telemetry = new TelemetryService();
    telemetry.recordRequest(
      {
        controller: 'Health"Controller',
        method: 'GET',
        route: '/line\nbreak',
        statusCode: 500,
      },
      0.01,
    );

    expect(telemetry.toPrometheusMetrics()).toContain(
      'controller="Health\\"Controller",method="GET",route="/line\\nbreak"',
    );
  });

  it('records WebSocket event counts and latency', () => {
    const telemetry = new TelemetryService();
    telemetry.recordWebSocketEvent(
      { gateway: 'LiveVoiceGateway', event: 'handleJoinCall', outcome: 'success' },
      0.1,
    );

    expect(telemetry.toPrometheusMetrics()).toContain(
      'fleeto_websocket_events_total{gateway="LiveVoiceGateway",event="handleJoinCall",outcome="success"} 1',
    );
    expect(telemetry.toPrometheusMetrics()).toContain(
      'fleeto_websocket_event_duration_seconds_bucket{gateway="LiveVoiceGateway",event="handleJoinCall",outcome="success",le="0.1"} 1',
    );
  });
});
