import { Controller, Post, Get, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto'; 
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; 

@ApiTags('Auth')
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

  // 5. Route Đăng nhập Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ 
    summary: 'Đăng nhập bằng Google', 
    description: 'API này chuyển hướng người dùng đến trang đăng nhập của Google.\\n\\n**LƯU Ý ĐỂ TEST:** Do tính chất của OAuth2 là chuyển hướng trang, bạn **KHÔNG THỂ** test bằng nút "Try it out" trong Swagger. Bạn hãy **copy và dán trực tiếp đường dẫn này vào thanh địa chỉ trình duyệt:**\\n👉 `http://localhost:3000/api/auth/google`' 
  })
  @ApiResponse({ status: 302, description: 'Chuyển hướng đến trang đăng nhập Google' })
  async googleAuth(@Req() req: any) {
    // Khởi tạo quy trình xác thực bằng Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ 
    summary: 'Callback URL cho Google (Không gọi trực tiếp)',
    description: 'Đây là endpoint Google gọi về sau khi người dùng đăng nhập thành công. Nó sẽ xử lý lưu thông tin vào DB và trả về Token.'
  })
  @ApiResponse({ status: 200, description: 'Trả về chuỗi AccessToken và RefreshToken' })
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    try {
      const data = await this.authService.googleLogin(req);
      return res.redirect(`http://localhost:5173/login?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`);
    } catch (error: any) {
      const errorMessage = encodeURIComponent(error.message || 'Đăng nhập Google thất bại');
      return res.redirect(`http://localhost:5173/login?error=${errorMessage}`);
    }
  }
}