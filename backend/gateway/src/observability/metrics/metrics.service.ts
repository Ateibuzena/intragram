/**
 * Metrics service of the gateway.
 * Records counters and latencies for Prometheus.
 */

import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Histogram } from 'prom-client';
import { Counter, Gauge } from 'prom-client'

@Injectable()
export class MetricsService {
	private readonly registry: Registry;
	public httpRequestDuration: Histogram<string>;
	public activeUsers: Gauge<string>;
	public requestCount: Counter<string>;

	constructor() {
		this.registry = new Registry();
		collectDefaultMetrics({ register: this.registry });

		this.httpRequestDuration = new Histogram({
			name: 'http_request_duration_seconds',
			help: 'Duration of HTTP requests in seconds',
			labelNames: ['method', 'route', 'status_code'],
			registers: [this.registry],
		});

		this.activeUsers = new Gauge({
			name: 'active_users',
			help: 'Active users connected',
			registers: [this.registry],
		});

		this.requestCount = new Counter({
			name: 'request_count_total',
			help: 'Total HTTP requests',
			labelNames: ['method', 'route', 'status_code'],
			registers: [this.registry],
		});
	}

	incrementRequests(method: string, route: string, status: string) {
		this.requestCount.labels(method, route, status).inc();
	}

	async getTotalRequests(): Promise<number> {
		const metric = await this.requestCount.get();
		return metric.values.reduce((sum, value) => sum + value.value, 0);
	}

	setActiveUsers(count: number) {
		this.activeUsers.set(count);
	}

	getMetrics(): Promise<string> {
		return this.registry.metrics();
	}
}