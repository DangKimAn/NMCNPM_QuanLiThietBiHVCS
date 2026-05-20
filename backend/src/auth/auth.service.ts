import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, verifyPassword } from 'src/common/bcrypt';
import { InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Hàm ký cấp mã token
  async generateTokens(userId: number, username: string) {
    const payload = { sub: userId, username };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: 'ACCESS_TOKEN_SECRET_KEY_123',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: 'REFRESH_TOKEN_SECRET_KEY_456', // Chuỗi này dùng để verify ở hàm refresh bên dưới
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // Logic Đăng ký tài khoản học viện
  async register(dto: RegisterDto) {
    const userExists = await this.prismaService.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });

    if (userExists) {
      throw new BadRequestException('Username hoặc Email học viện đã được sử dụng');
    }

    const hashedPassword = await hashPassword(dto.password);

    // Tìm role mặc định USER
    let defaultRole = await this.prismaService.role.findUnique({ where: { roleName: 'USER' } });

    // Nếu không có USER, lấy đại role đầu tiên trong DB
    if (!defaultRole) {
      defaultRole = await this.prismaService.role.findFirst();
    }

    // Nếu DB hoàn toàn trống trơn (không có role nào hết)
    if (!defaultRole) {
      throw new InternalServerErrorException('Hệ thống chưa thiết lập phân quyền (Role)! Vui lòng liên hệ Admin.');
    }

    const newUser = await this.prismaService.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        hashedPassword,
        phoneNumber: dto.phoneNumber,
        roleId: defaultRole.roleId, 
      },
    });

    return { message: 'Đăng ký tài khoản học viện thành công', userId: newUser.userId };
  }

  // Logic Đăng nhập hệ thống
  async login(dto: LoginDto) {
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ username: dto.usernameOrEmail }, { email: dto.usernameOrEmail }],
      },
    });

    if (!user) throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');

    const isPasswordMatches = await verifyPassword(dto.password, user.hashedPassword);
    if (!isPasswordMatches) throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Tài khoản đã bị khóa');

    const tokens = await this.generateTokens(user.userId, user.username);
    
    const hashedRefreshToken = await hashPassword(tokens.refreshToken);
    await this.prismaService.user.update({
      where: { userId: user.userId },
      data: { refreshToken: hashedRefreshToken },
    });

    return tokens;
  }

  // Logic Đăng xuất - Xóa trắng Token trong DB
  async logout(userId: number) {
    await this.prismaService.user.update({
      where: { userId },
      data: { refreshToken: null },
    });
    return { message: 'Đăng xuất thành công, Refresh Token đã bị vô hiệu hóa' };
  }

  // Logic cấp lại chuỗi Access Token mới bằng Refresh Token
  async refreshTokens(refreshToken: string) {
    try {
      // 1. Giải mã mã microfilm refreshToken bằng Secret Key tương ứng khi tạo
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: 'REFRESH_TOKEN_SECRET_KEY_456', 
      });

      const userId = payload.sub;

      // 2. Tìm thông tin người dùng sử dụng đúng biến `this.prismaService`
      const user = await this.prismaService.user.findUnique({
        where: { userId },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Phiên đăng nhập không tồn tại hoặc đã hết hạn!');
      }

      // 3. Sử dụng hàm `verifyPassword` có sẵn trong tầng common của bạn để so khớp mã hash
      const isRefreshTokenMatches = await verifyPassword(refreshToken, user.refreshToken);
      if (!isRefreshTokenMatches) {
        throw new UnauthorizedException('Mã xác thực không hợp lệ!');
      }

      // 4. Khớp chính xác 2 tham số (userId, username) theo định nghĩa của hàm generateTokens phía trên
      const tokens = await this.generateTokens(user.userId, user.username);
      
      // 5. Băm mã mới bằng `hashPassword` và lưu lại vào DB
      const hashedRefreshToken = await hashPassword(tokens.refreshToken);
      await this.prismaService.user.update({
        where: { userId: user.userId },
        data: { refreshToken: hashedRefreshToken },
      });

      return tokens;

    } catch (error) {
      // Bắt toàn bộ lỗi hết hạn token hoặc token sai cấu trúc hạ tầng
      throw new UnauthorizedException('Mã Refresh Token đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại!');
    }
  }
}