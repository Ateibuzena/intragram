import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { GatewayHttpClientService } from './gateway-http.client';

@Global()
@Module({
	imports: [HttpModule],
	providers: [GatewayHttpClientService],
	exports: [GatewayHttpClientService],
})
export class GatewayHttpModule {}