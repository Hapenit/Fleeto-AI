import { Injectable } from '@nestjs/common';

const durationBucketsSeconds = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

interface RequestMetric {
  controller: string;
  method: string;
  route: string;
  statusCode: number;
  count: number;
  durationSeconds: number;
  buckets: number[];
}

interface WebSocketEventMetric {
  gateway: string;
  event: string;
  outcome: 'success' | 'error';
  count: number;
  durationSeconds: number;
  buckets: number[];
}

@Injectable()
export class TelemetryService {
  private readonly requests = new Map<string, RequestMetric>();
  private readonly websocketEvents = new Map<string, WebSocketEventMetric>();

  recordRequest(
    labels: Pick<RequestMetric, 'controller' | 'method' | 'route' | 'statusCode'>,
    durationSeconds: number,
  ): void {
    const key = JSON.stringify(labels);
    const metric = this.requests.get(key) ?? {
      ...labels,
      count: 0,
      durationSeconds: 0,
      buckets: durationBucketsSeconds.map(() => 0),
    };

    metric.count += 1;
    metric.durationSeconds += durationSeconds;
    durationBucketsSeconds.forEach((bucket, index) => {
      if (durationSeconds <= bucket) metric.buckets[index] += 1;
    });
    this.requests.set(key, metric);
  }

  recordWebSocketEvent(
    labels: Pick<WebSocketEventMetric, 'gateway' | 'event' | 'outcome'>,
    durationSeconds: number,
  ): void {
    const key = JSON.stringify(labels);
    const metric = this.websocketEvents.get(key) ?? {
      ...labels,
      count: 0,
      durationSeconds: 0,
      buckets: durationBucketsSeconds.map(() => 0),
    };

    metric.count += 1;
    metric.durationSeconds += durationSeconds;
    durationBucketsSeconds.forEach((bucket, index) => {
      if (durationSeconds <= bucket) metric.buckets[index] += 1;
    });
    this.websocketEvents.set(key, metric);
  }

  toPrometheusMetrics(): string {
    const lines = [
      '# HELP fleeto_http_requests_total Total HTTP requests handled by the application.',
      '# TYPE fleeto_http_requests_total counter',
    ];

    for (const metric of this.requests.values()) {
      const labels = this.formatLabels(metric);
      lines.push(`fleeto_http_requests_total${labels} ${metric.count}`);
    }

    lines.push(
      '# HELP fleeto_http_request_duration_seconds HTTP request duration in seconds.',
      '# TYPE fleeto_http_request_duration_seconds histogram',
    );

    for (const metric of this.requests.values()) {
      const labels = this.formatLabels(metric);
      for (const [index, bucket] of durationBucketsSeconds.entries()) {
        lines.push(
          `fleeto_http_request_duration_seconds_bucket${this.formatLabels(metric, String(bucket))} ${metric.buckets[index]}`,
        );
      }
      lines.push(
        `fleeto_http_request_duration_seconds_bucket${this.formatLabels(metric, '+Inf')} ${metric.count}`,
        `fleeto_http_request_duration_seconds_sum${labels} ${metric.durationSeconds}`,
        `fleeto_http_request_duration_seconds_count${labels} ${metric.count}`,
      );
    }

    lines.push(
      '# HELP fleeto_websocket_events_total Total WebSocket events handled by the application.',
      '# TYPE fleeto_websocket_events_total counter',
    );
    for (const metric of this.websocketEvents.values()) {
      lines.push(
        `fleeto_websocket_events_total${this.formatWebSocketLabels(metric)} ${metric.count}`,
      );
    }

    lines.push(
      '# HELP fleeto_websocket_event_duration_seconds WebSocket event duration in seconds.',
      '# TYPE fleeto_websocket_event_duration_seconds histogram',
    );
    for (const metric of this.websocketEvents.values()) {
      for (const [index, bucket] of durationBucketsSeconds.entries()) {
        lines.push(
          `fleeto_websocket_event_duration_seconds_bucket${this.formatWebSocketLabels(metric, String(bucket))} ${metric.buckets[index]}`,
        );
      }
      lines.push(
        `fleeto_websocket_event_duration_seconds_bucket${this.formatWebSocketLabels(metric, '+Inf')} ${metric.count}`,
        `fleeto_websocket_event_duration_seconds_sum${this.formatWebSocketLabels(metric)} ${metric.durationSeconds}`,
        `fleeto_websocket_event_duration_seconds_count${this.formatWebSocketLabels(metric)} ${metric.count}`,
      );
    }

    return `${lines.join('\n')}\n`;
  }

  private formatLabels(
    metric: Pick<RequestMetric, 'controller' | 'method' | 'route' | 'statusCode'>,
    bucket?: string,
  ): string {
    const labels = [
      `controller="${this.escapeLabel(metric.controller)}"`,
      `method="${this.escapeLabel(metric.method)}"`,
      `route="${this.escapeLabel(metric.route)}"`,
      `status_code="${metric.statusCode}"`,
    ];
    if (bucket !== undefined) labels.push(`le="${bucket}"`);
    return `{${labels.join(',')}}`;
  }

  private formatWebSocketLabels(
    metric: Pick<WebSocketEventMetric, 'gateway' | 'event' | 'outcome'>,
    bucket?: string,
  ): string {
    const labels = [
      `gateway="${this.escapeLabel(metric.gateway)}"`,
      `event="${this.escapeLabel(metric.event)}"`,
      `outcome="${metric.outcome}"`,
    ];
    if (bucket !== undefined) labels.push(`le="${bucket}"`);
    return `{${labels.join(',')}}`;
  }

  private escapeLabel(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll('"', '\\"');
  }
}
