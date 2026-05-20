import { BadRequestException, Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, verifyPassword } from 'src/common/bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async generateTokens(userId: number, username: string) {
    const payload = { sub: userId, username };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: 'ACCESS_TOKEN_SECRET_KEY_123',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: 'REFRESH_TOKEN_SECRET_KEY_456',
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // ================= REGISTER =================
  async register(dto: RegisterDto) {
    const userExists = await this.prismaService.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });

    if (userExists) {
      throw new BadRequestException('Username hoặc Email học viện đã được sử dụng');
    }

    // --- LOGIC PHÂN QUYỀN TỰ ĐỘNG DỰA TRÊN EMAIL ---
    const emailLower = dto.email.trim().toLowerCase();

    let roleTarget = '';

    if (emailLower.endsWith('@student.ptithcm.edu.vn')) {
      roleTarget = 'Student';
    } else if (emailLower.endsWith('@ptithcm.edu.vn')) {
      roleTarget = 'Teacher';
    } else {
      throw new BadRequestException(
        'Email không hợp lệ! Hệ thống chỉ chấp nhận email thuộc học viện.'
      );
    }

    // Tìm role trong DB
    let defaultRole = await this.prismaService.role.findFirst({
      where: { roleName: roleTarget },
    });

    // Auto-create role nếu DB chưa có
    if (!defaultRole) {
      try {
        defaultRole = await this.prismaService.role.create({
          data: { roleName: roleTarget },
        });

        console.log(
          `[AuthService] Đã tự động tạo role mới: ${roleTarget}`
        );
      } catch (dbError) {
        throw new InternalServerErrorException(
          `Không thể tạo role [${roleTarget}] trong DB`
        );
      }
    }

    const hashedPassword = await hashPassword(dto.password);

    const newUser = await this.prismaService.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        hashedPassword,
        phoneNumber: dto.phoneNumber,
        roleId: defaultRole.roleId,
        status: 'ACTIVE',
      },
    });

    return {
      message: 'Đăng ký tài khoản học viện thành công',
      userId: newUser.userId,
      role: roleTarget,
    };
  }

  // ================= LOGIN =================
  async login(dto: LoginDto) {
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ username: dto.usernameOrEmail }, { email: dto.usernameOrEmail }],
      },
    });

    if (!user)
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');

    const isPasswordMatches = await verifyPassword(dto.password, user.hashedPassword);
    if (!isPasswordMatches)
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');

    if (user.status !== 'ACTIVE')
      throw new UnauthorizedException('Tài khoản đã bị khóa hoặc chưa được kích hoạt');

    const tokens = await this.generateTokens(user.userId, user.username);

    const hashedRefreshToken = await hashPassword(tokens.refreshToken);
    await this.prismaService.user.update({
      where: { userId: user.userId },
      data: { refreshToken: hashedRefreshToken },
    });

    return tokens;
  }

  // ================= LOGOUT =================
  async logout(userId: number) {
    await this.prismaService.user.update({
      where: { userId },
      data: { refreshToken: null },
    });

    return { message: 'Đăng xuất thành công' };
  }

  // ================= REFRESH TOKEN =================
  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: 'REFRESH_TOKEN_SECRET_KEY_456',
      });

      const user = await this.prismaService.user.findUnique({
        where: { userId: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Phiên đăng nhập không tồn tại');
      }

      const isValid = await verifyPassword(refreshToken, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      const tokens = await this.generateTokens(user.userId, user.username);

      const hashedRefreshToken = await hashPassword(tokens.refreshToken);
      await this.prismaService.user.update({
        where: { userId: user.userId },
        data: { refreshToken: hashedRefreshToken },
      });

      return tokens;
    } catch (err) {
      throw new UnauthorizedException('Refresh token hết hạn, vui lòng đăng nhập lại');
    }
  }
}