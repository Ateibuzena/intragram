import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
	private readonly registry: Registry;
	public readonly httpRequestDuration: Histogram<string>;
	public readonly requestCount: Counter<string>;

	constructor() {
		this.registry = new Registry();
		collectDefaultMetrics({ register: this.registry });

		this.httpRequestDuration = new Histogram({
			name: 'http_request_duration_seconds',
			help: 'Duration of HTTP requests in seconds',
			labelNames: ['method', 'route', 'status_code'],
			buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
			registers: [this.registry],
		});

		this.requestCount = new Counter({
			name: 'request_count_total',
			help: 'Total HTTP requests',
			labelNames: ['method', 'route', 'status_code'],
			registers: [this.registry],
		});
	}

	observeRequest(method: string, route: string, statusCode: number, durationSeconds: number) {
		const status = statusCode.toString();
		this.httpRequestDuration.labels(method, route, status).observe(durationSeconds);
		this.requestCount.labels(method, route, status).inc();
	}

	getMetrics(): Promise<string> {
		return this.registry.metrics();
	}

	getContentType(): string {
		return this.registry.contentType;
	}
}