/**
 * Configuración del Microservicio de Chat
 * Define el transporte TCP y puerto de escucha
 */

import { Transport } from '@nestjs/microservices';

export const CHAT_MICROSERVICE_CONFIG = {
  transport: Transport.TCP,
  options: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '3004'),
  },
};
