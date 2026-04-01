import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefixes
    app.setGlobalPrefix('api');

    // Validation Pipe
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));

    // Global Interceptors & Filters
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());

    // Swagger Configuration
    const config = new DocumentBuilder()
        .setTitle('SimpleSRM API')
        .setDescription('The Internal Supply Chain Management API description')
        .setVersion('1.0')
        .addTag('resources', 'Supply Chain Resources')
        .addTag('evaluations', 'Annual Evaluation Tasks')
        .addTag('bi', 'Business Intelligence Analytics')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(3000);
}
bootstrap();
