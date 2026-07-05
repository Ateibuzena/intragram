import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig } from 'axios';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

interface GatewayHttpRequestOptions<TData = unknown>
	extends Omit<AxiosRequestConfig<TData>, 'method' | 'url' | 'data' | 'timeout'> {
	timeoutMs?: number;
	retries?: number;
	retryable?: boolean;
}

const SAFE_RETRY_METHODS = new Set<HttpMethod>(['get', 'head', 'options', 'put', 'delete']);

const DEFAULT_TIMEOUT_MS = 3000;
const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 250;
const RETRYABLE_ERROR_CODES = new Set([
	'ECONNABORTED',
	'ECONNRESET',
	'ETIMEDOUT',
	'EAI_AGAIN',
	'ENETUNREACH',
	'ECONNREFUSED',
	'ERR_NETWORK',
]);

@Injectable()
export class GatewayHttpClientService {
	private readonly defaultTimeoutMs = this.readPositiveInteger('SERVICE_HTTP_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
	private readonly defaultRetries = this.readPositiveInteger('SERVICE_HTTP_RETRIES', DEFAULT_RETRIES);
	private readonly baseBackoffMs = this.readPositiveInteger('SERVICE_HTTP_RETRY_DELAY_MS', DEFAULT_BACKOFF_MS);

	constructor(private readonly httpService: HttpService) {}

	get<TResponse>(url: string, options: GatewayHttpRequestOptions = {}): Promise<TResponse> {
		return this.request<TResponse>({ ...options, method: 'get', url });
	}

	post<TResponse, TData = unknown>(url: string, data?: TData, options: GatewayHttpRequestOptions<TData> = {}): Promise<TResponse> {
		return this.request<TResponse, TData>({ ...options, method: 'post', url, data });
	}

	delete<TResponse>(url: string, options: GatewayHttpRequestOptions = {}): Promise<TResponse> {
		return this.request<TResponse>({ ...options, method: 'delete', url });
	}

	patch<TResponse, TData = unknown>(url: string, data?: TData, options: GatewayHttpRequestOptions<TData> = {}): Promise<TResponse> {
		return this.request<TResponse, TData>({ ...options, method: 'patch', url, data });
	}

	private async request<TResponse, TData = unknown>(
		options: GatewayHttpRequestOptions<TData> & { method: HttpMethod; url: string; data?: TData },
	): Promise<TResponse> {
		const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
		const retries = options.retries ?? this.defaultRetries;
		const shouldRetry = options.retryable ?? SAFE_RETRY_METHODS.has(options.method);
		const requestConfig: AxiosRequestConfig<TData> = {
			...options,
			method: options.method,
			url: options.url,
			data: options.data,
			timeout: timeoutMs,
		};

		let lastError: unknown;

		for (let attempt = 0; attempt <= retries; attempt += 1) {
			try {
				const response = await this.httpService.axiosRef.request<TResponse>(requestConfig);
				return response.data;
			} catch (error) {
				lastError = error;

				if (!this.shouldRetry(error, shouldRetry, attempt, retries)) {
					throw error;
				}

				await this.delay(this.calculateBackoffMs(attempt));
			}
		}

		throw lastError;
	}

	private shouldRetry(error: unknown, shouldRetry: boolean, attempt: number, retries: number): boolean {
		if (!shouldRetry || attempt >= retries) {
			return false;
		}

		const axiosError = error as AxiosError;

		if (axiosError.response) {
			return axiosError.response.status >= 500;
		}

		if (axiosError.code && RETRYABLE_ERROR_CODES.has(axiosError.code)) {
			return true;
		}

		const message = axiosError.message?.toLowerCase() ?? '';
		return message.includes('timeout') || message.includes('network');
	}

	private calculateBackoffMs(attempt: number): number {
		return this.baseBackoffMs * 2 ** attempt;
	}

	private async delay(ms: number): Promise<void> {
		await new Promise<void>((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	private readPositiveInteger(name: string, fallback: number): number {
		const rawValue = process.env[name];
		if (!rawValue) {
			return fallback;
		}

		const parsedValue = Number.parseInt(rawValue, 10);
		return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
	}
}