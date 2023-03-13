import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Define Nest App
  const app = await NestFactory.create(AppModule);

  // Setup Cross Origin Security Rules (CORS)
  const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  };
  app.enableCors(corsOptions);

  // Add Swagger API documenter App to /apidocs endpoint
  const swg = new DocumentBuilder()
      .setTitle('Week 4 API Docs')
      .setDescription('Solidity Bootcamp dAPP - Backend project documentation, using NestJS')
      .setVersion('1.0')
      .build();
  const doc = SwaggerModule.createDocument(app, swg);
  SwaggerModule.setup('apidocs', app, doc);

  // Launch App on port 3000
  await app.listen(3000);
}
bootstrap();
