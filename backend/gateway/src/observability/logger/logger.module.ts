/**
 * Logging module of the gateway.
 * Centralises the configuration of structured logs.
 */

import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
	imports: [
		LoggerModule.forRoot({
			pinoHttp: isProduction
				? {
					level: 'info',
				}
				: {
					transport: {
						target: 'pino-pretty',
						options: {
							colorize: true,
							translateTime: 'SYS:standard',
							ignore: 'pid,hostname',
						},
					},
				},
		}),
	],
})
export class AppLoggerModule { }