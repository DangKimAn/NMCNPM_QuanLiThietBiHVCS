import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API Quản Lý Thiết Bị')
    .setDescription('Tài liệu API cho dự án Quản Lý Thiết Bị HVCS')
    .setVersion('1.0')
    .addBearerAuth() // Thêm dòng này nếu dự án của bạn có sử dụng xác thực bằng JWT Token
    .build();

  // 2. Tạo document từ cấu hình
  const document = SwaggerModule.createDocument(app, config);
  // 3. Setup đường dẫn để truy cập Swagger UI (ở đây là '/api-docs')
  SwaggerModule.setup('api', app, document);

  const port =  process.env.PORT ?? 3000
  await app.listen(port);
  console.log(`website: http://localhost:${port}/api`)
}
bootstrap();
