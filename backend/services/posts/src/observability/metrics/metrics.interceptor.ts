import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	constructor(private readonly metrics: MetricsService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const startedAt = process.hrtime.bigint();
		const request = context.switchToHttp().getRequest();
		const method = request.method;
		const route = request.route?.path || request.originalUrl || request.url;

		return next.handle().pipe(
			finalize(() => {
				const response = context.switchToHttp().getResponse();
				const statusCode = response?.statusCode ?? 500;
				const elapsedNs = process.hrtime.bigint() - startedAt;
				const durationSeconds = Number(elapsedNs) / 1_000_000_000;

				try {
					this.metrics.observeRequest(method, route, statusCode, durationSeconds);
				} catch {
					// Never fail the request because of telemetry.
				}
			}),
		);
	}
}
