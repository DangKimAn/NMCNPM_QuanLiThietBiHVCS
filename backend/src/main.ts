import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép frontend React/Vite gọi API backend
  // Frontend thường chạy ở http://localhost:5173
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  // ValidationPipe giúp tự kiểm tra DTO:
  // - field nào bắt buộc
  // - kiểu dữ liệu có đúng không
  // - tự chuyển string number thành number nếu có @Type(() => Number)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Cấu hình Swagger để xem API tại /api
  const config = new DocumentBuilder()
    .setTitle('API Quản Lý Thiết Bị HVCS')
    .setDescription('Tài liệu API cho dự án Quản lý thiết bị phòng học HVCS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`Backend đang chạy tại: http://localhost:${port}`);
  console.log(`Swagger API: http://localhost:${port}/api`);
}

bootstrap();