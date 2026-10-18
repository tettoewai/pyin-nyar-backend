import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { AppLogger } from './common/logger/app-logger.service.js';
import { httpLogger, setLogLevel } from './common/logger/logger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new AppLogger());
  app.use(httpLogger);

  if (process.env.LOG_LEVEL) {
    setLogLevel(process.env.LOG_LEVEL);
  }

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Pyin Nyar API')
    .setDescription(
      'Pyin Nyar API is a RESTful API built with NestJS and Prisma, designed to provide backend services for the Pyin Nyar application',
    )
    .setVersion('1.0')
    .addTag('AI Tutor')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
