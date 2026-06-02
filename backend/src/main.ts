import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Tắt logger mặc định của NestJS để dùng Winston
    bufferLogs: true,
  });

  // Dùng Winston làm logger chính của NestJS
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Đặt prefix /api cho tất cả các route
  app.setGlobalPrefix('api');

  // Cho phép frontend React/Vite gọi API backend
  // Bao gồm: localhost (dev) và domain trong biến FRONTEND_URL (production)
  const envFrontendUrls = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  const allowedOrigins: (string | RegExp)[] = [
    'http://localhost:5173',
    'http://localhost:4173',
    // Cho phép mọi subdomain của vercel.app (deploy preview + production)
    /https:\/\/.*\.vercel\.app$/,
    // Thêm domain từ biến môi trường FRONTEND_URL
    ...envFrontendUrls,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (Postman, cron ping, ...)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((o) =>
        typeof o === 'string' ? o === origin : o.test(origin),
      );
      callback(null, isAllowed);
    },
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

  // Global Exception Filter — chuẩn hóa response lỗi và log nhất quán
  app.useGlobalFilters(app.get(GlobalExceptionFilter));

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

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Backend đang chạy tại: http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger API: http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();