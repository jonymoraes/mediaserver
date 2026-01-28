import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './platform/config/modules/app.module';

import { join } from 'path';

//  Pipes
import { ValidationPipe, Logger } from '@nestjs/common';

//  Pino
import { PinoConfig } from './platform/shared/logger/pino.config';

//  Fastify
import fastifyCors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';

//  Helpers
import { FileHelper } from './platform/shared/helpers/file.helper';

async function bootstrap() {
  //  Create app
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger:
        'development' === process.env.NODE_ENV
          ? {
              level: 'debug',
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'HH:MM:ss',
                  ignore: 'pid,hostname',
                },
              },
            }
          : {
              level: 'info',
            },
    }),
    { logger: false },
  );

  //  Load config
  const fastify = app.getHttpAdapter().getInstance() as any;
  const configService = app.get(ConfigService);

  //  Configure pino
  app.useLogger(new PinoConfig(fastify.log));

  //  Init file helper
  FileHelper.init(configService);

  //  Helmet
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  //  CORS config
  await fastify.register(fastifyCors as any, {
    origin: '*',
    credentials: false,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  //  Set cookie secret
  await fastify.register(fastifyCookie, {
    secret: configService.get<string>('COOKIE_SECRET'),
  });

  //  Configure fastify file upload
  await fastify.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024,
    },
    attachFieldsToBody: true,
  });

  await fastify.register(fastifyStatic, {
    root: join(process.cwd(), 'public'),
    serve: false,
  });

  //  Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      validationError: { target: false },
    }),
  );

  //  Global prefix
  app.setGlobalPrefix('');

  const port = configService.get<number>('PORT') || 4200;
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`App is ready and listening on port ${port} 🚀`);
}

bootstrap().catch(handleError);

/**
 * @description Uncaught exception handler
 * @param error
 */
function handleError(error: unknown) {
  const logger = new Logger('Bootstrap');
  logger.error('Uncaught exception', error as any);
  process.exit(1);
}
