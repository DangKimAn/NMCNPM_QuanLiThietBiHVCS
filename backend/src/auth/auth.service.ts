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
  async generateTokens(userId: number, username: string, roleName: string) {
    const payload = { sub: userId, username, role: roleName };

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

    const role = await this.getRoleByEmailDomain(dto.email);

    const newUser = await this.prismaService.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        hashedPassword,
        phoneNumber: dto.phoneNumber,
        roleId: role.roleId, 
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
      include: { role: true },
    });

    if (!user) throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');

    const isPasswordMatches = await verifyPassword(dto.password, user.hashedPassword);
    if (!isPasswordMatches) throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Tài khoản đã bị khóa');

    const tokens = await this.generateTokens(user.userId, user.username, user.role.roleName);
    
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
        include: { role: true },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Phiên đăng nhập không tồn tại hoặc đã hết hạn!');
      }

      // 3. Sử dụng hàm `verifyPassword` có sẵn trong tầng common của bạn để so khớp mã hash
      const isRefreshTokenMatches = await verifyPassword(refreshToken, user.refreshToken);
      if (!isRefreshTokenMatches) {
        throw new UnauthorizedException('Mã xác thực không hợp lệ!');
      }

      // 4. Khớp chính xác tham số theo định nghĩa của hàm generateTokens phía trên
      const tokens = await this.generateTokens(user.userId, user.username, user.role.roleName);
      
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

  // Logic đăng nhập bằng Google
  async googleLogin(req: any) {
    if (!req.user) {
      throw new BadRequestException('Không nhận được thông tin từ Google');
    }

    const { email, firstName, lastName, googleId } = req.user;

    // Kiểm tra xem user đã tồn tại chưa
    let user = await this.prismaService.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      const role = await this.getRoleByEmailDomain(email);

      // Tạo mật khẩu ngẫu nhiên cho user Google
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(randomPassword);

      // Đảm bảo username là duy nhất
      let username = email.split('@')[0];
      let existingUser = await this.prismaService.user.findUnique({ where: { username } });
      while (existingUser) {
        username = `${email.split('@')[0]}_${Math.floor(Math.random() * 1000)}`;
        existingUser = await this.prismaService.user.findUnique({ where: { username } });
      }

      user = await this.prismaService.user.create({
        data: {
          username,
          email,
          hashedPassword,
          roleId: role.roleId,
        },
        include: { role: true },
      });
    } else {
      if (user.status !== 'ACTIVE') throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const tokens = await this.generateTokens(user.userId, user.username, user.role.roleName);
    
    const hashedRefreshToken = await hashPassword(tokens.refreshToken);
    await this.prismaService.user.update({
      where: { userId: user.userId },
      data: { refreshToken: hashedRefreshToken },
    });

    return { message: 'Đăng nhập Google thành công', ...tokens };
  }

  private async getRoleByEmailDomain(email: string) {
    let roleName = '';
    if (email.endsWith('@student.ptithcm.edu.vn')) {
      roleName = 'STUDENT';
    } else if (email.endsWith('@ptithcm.edu.vn')) {
      roleName = 'TEACHER';
    } else if (email.endsWith('@system.com')) {
      roleName = 'MANAGER';
    } else {
      throw new BadRequestException('Email không hợp lệ. Vui lòng sử dụng email đuôi @student.ptithcm.edu.vn, @ptithcm.edu.vn hoặc @system.com.');
    }

    const role = await this.prismaService.role.findUnique({ where: { roleName } });
    if (!role) {
      throw new InternalServerErrorException(`Hệ thống chưa thiết lập phân quyền (${roleName})! Vui lòng chạy seed database hoặc liên hệ Admin.`);
    }

    return role;
  }
}