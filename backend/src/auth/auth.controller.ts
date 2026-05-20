import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto'; 
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; 

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 1. Route Đăng ký
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // 2. Route Đăng nhập
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // 3. Route Đăng xuất
  @Post('logout')
  @UseGuards(JwtAuthGuard) 
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.sub); 
  }

  // 4. Route Làm mới Token - Chỉ truyền duy nhất 1 tham số chuỗi string
  @Post('refresh')
  async refresh(@Body('refreshToken') token: string) {
    return this.authService.refreshTokens(token);
  }
}