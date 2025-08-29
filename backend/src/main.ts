import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   app.use(express.json());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away properties that do not have any decorators
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Helps convert string params to numbers, etc.
      }, // ✅ THIS IS THE FIX. It enables the @Transform decorator.
    }),
  );

  
  app.enableCors();
  await app.listen(5000);
}
bootstrap();
