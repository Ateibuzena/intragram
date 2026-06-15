/**
 * HTTP metrics interceptor.
 * Records request duration, request count and active users without exposing PII.
 */

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { MetricsService } from '../../observability/metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	constructor(private readonly metrics: MetricsService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const start = Date.now();
		const request = context.switchToHttp().getRequest();
		const method = request.method;
		const route = request.route?.path || request.url;

		// increment concurrent requests
		try {
			this.metrics.activeUsers.inc();
		} catch (e) {
			// ignore metric errors
		}

		return next.handle().pipe(
			tap(() => {
				// no-op here; finalization handles latency and counts
			}),
			finalize(() => {
				const response = context.switchToHttp().getResponse();
				const statusCode = response?.statusCode ?? 500;
				const duration = (Date.now() - start) / 1000;

				try {
					this.metrics.httpRequestDuration
						.labels(method, route, statusCode.toString())
						.observe(duration);

					this.metrics.incrementRequests(method, route, statusCode.toString());
				} catch (e) {
					// swallow metric errors
				}

				try {
					this.metrics.activeUsers.dec();
				} catch (e) {
					// swallow
				}
			})
		);
	}
}