import { Controller, Get, Res } from '@nestjs/common';
import { register } from 'prom-client';

@Controller()
export class MetricsController {
    @Get('metrics')
    async metrics(@Res() res: any) {
        try {
            res.set('Content-Type', register.contentType || 'text/plain; version=0.0.4');
            const metrics = await register.metrics();
            res.send(metrics);
        } catch (e) {
            res.status(500).send('error collecting metrics');
        }
    }
}
