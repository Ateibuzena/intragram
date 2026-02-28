/**
 * Configuración del Microservicio de Autenticación
 * Define el transporte TCP y puerto de escucha
 */

import { Transport } from '@nestjs/microservices';

export const AUTH_MICROSERVICE_CONFIG = {
  transport: Transport.TCP,
  options: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '3003'),
  },
};
