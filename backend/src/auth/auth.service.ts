import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserDto } from '../user/dto/user.dto';
import { plainToInstance } from 'class-transformer';

import { hashPassword, verifyPassword } from 'src/common/bcrypt';
import { MailerService } from 'src/common/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {}

  // ================= GENERATE TOKENS =================
  async generateTokens(
    userId: number,
    username: string,
    role: string,
    fullName?: string | null,
  ) {
    const payload = {
      sub: userId,
      username,
      role,
      fullName: fullName || username,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  // ================= REGISTER =================
  // Lưu ý: API register bên controller đã bị chặn.
  // Hàm này giữ lại để tránh lỗi phụ thuộc code cũ.
  async register(dto: RegisterDto) {
    const userExists = await this.prismaService.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (userExists) {
      throw new BadRequestException(
        'Username hoặc Email học viện đã được sử dụng',
      );
    }

    const emailLower = dto.email.trim().toLowerCase();
    let roleTarget = '';

    if (emailLower.endsWith('@student.ptithcm.edu.vn')) {
      roleTarget = 'STUDENT';
    } else if (emailLower.endsWith('@ptithcm.edu.vn')) {
      roleTarget = 'TEACHER';
    } else {
      throw new BadRequestException(
        'Email không hợp lệ! Hệ thống chỉ chấp nhận email thuộc học viện.',
      );
    }

    const defaultRole = await this.prismaService.role.findFirst({
      where: {
        roleName: roleTarget,
      },
    });

    if (!defaultRole) {
      throw new InternalServerErrorException(
        `Role [${roleTarget}] không tồn tại trong hệ thống`,
      );
    }

    const hashedPassword = await hashPassword(dto.password);

    const newUser = await this.prismaService.user.create({
      data: {
        username: dto.username,
        fullName: dto.username,
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
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Tài khoản hoặc mật khẩu không chính xác',
      );
    }

    const isPasswordMatches = await verifyPassword(
      dto.password,
      user.hashedPassword,
    );

    if (!isPasswordMatches) {
      throw new UnauthorizedException(
        'Tài khoản hoặc mật khẩu không chính xác',
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Tài khoản đã bị khóa hoặc chưa được kích hoạt',
      );
    }

    const tokens = await this.generateTokens(
      user.userId,
      user.username,
      user.role.roleName,
      user.fullName,
    );

    const hashedRefreshToken = await hashPassword(tokens.refreshToken);

    await this.prismaService.user.update({
      where: {
        userId: user.userId,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });

    const userWithRoleField = {
      ...user,
      role: user.role.roleName,
    };

    const userData = plainToInstance(UserDto, userWithRoleField, {
      excludeExtraneousValues: true,
    });

    return {
      ...tokens,
      user: userData,
    };
  }

  // ================= LOGOUT =================
  async logout(userId: number) {
    await this.prismaService.user.update({
      where: {
        userId,
      },
      data: {
        refreshToken: null,
      },
    });

    return {
      message: 'Đăng xuất thành công',
    };
  }

  // ================= REFRESH TOKENS =================
  async refreshTokens(refreshToken: string) {
    let payload: { sub: number; username: string; fullName?: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (err) {
      throw new UnauthorizedException(
        'Refresh token hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại',
      );
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        userId: payload.sub,
      },
      include: {
        role: true,
      },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Phiên đăng nhập không tồn tại');
    }

    const isValid = await verifyPassword(refreshToken, user.refreshToken);

    if (!isValid) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const tokens = await this.generateTokens(
      user.userId,
      user.username,
      user.role.roleName,
      user.fullName,
    );

    const hashedRefreshToken = await hashPassword(tokens.refreshToken);

    await this.prismaService.user.update({
      where: {
        userId: user.userId,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });

    const userWithRoleField = {
      ...user,
      role: user.role.roleName,
    };

    const userData = plainToInstance(UserDto, userWithRoleField, {
      excludeExtraneousValues: true,
    });

    return {
      ...tokens,
      user: userData,
    };
  }

  // ================= GOOGLE LOGIN =================
  // Chỉ cho phép đăng nhập Google nếu tài khoản đã được Admin tạo trước
  async googleLogin(req: any) {
    if (!req.user) {
      throw new BadRequestException('Không nhận được thông tin từ Google');
    }

    const { email } = req.user;

    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Tài khoản này chưa được Quản trị viên cấp. Vui lòng liên hệ Admin để được tạo tài khoản.',
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const tokens = await this.generateTokens(
      user.userId,
      user.username,
      user.role.roleName,
      user.fullName,
    );

    const hashedRefreshToken = await hashPassword(tokens.refreshToken);

    await this.prismaService.user.update({
      where: { userId: user.userId },
      data: { refreshToken: hashedRefreshToken },
    });

    const userWithRoleField = {
      ...user,
      role: user.role.roleName,
    };

    const userData = plainToInstance(UserDto, userWithRoleField, {
      excludeExtraneousValues: true,
    });

    return {
      message: 'Đăng nhập Google thành công',
      ...tokens,
      user: userData,
    };
  }

  // ================= FORGOT PASSWORD =================
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await hashPassword(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prismaService.user.update({
      where: { email: dto.email },
      data: {
        resetPasswordCode: hashedOtp,
        resetPasswordExpires: expiresAt,
      },
    });

    await this.mailerService.sendOtpEmail(dto.email, otp);

    return {
      message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
    };
  }

  // ================= VERIFY OTP =================
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.resetPasswordCode || !user.resetPasswordExpires) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc chưa được tạo');
    }

    if (new Date() > user.resetPasswordExpires) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới');
    }

    const isValid = await verifyPassword(dto.otp, user.resetPasswordCode);

    if (!isValid) {
      throw new BadRequestException('Mã OTP không chính xác');
    }

    return {
      valid: true,
      message: 'Xác minh OTP thành công',
    };
  }

  // ================= RESET PASSWORD =================
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.resetPasswordCode || !user.resetPasswordExpires) {
      throw new BadRequestException('Yêu cầu đặt lại mật khẩu không hợp lệ');
    }

    if (new Date() > user.resetPasswordExpires) {
      throw new BadRequestException(
        'Mã OTP đã hết hạn. Vui lòng bắt đầu lại từ đầu',
      );
    }

    const isValid = await verifyPassword(dto.otp, user.resetPasswordCode);

    if (!isValid) {
      throw new BadRequestException('Mã OTP không chính xác');
    }

    const hashedPassword = await hashPassword(dto.newPassword);

    await this.prismaService.user.update({
      where: { email: dto.email },
      data: {
        hashedPassword,
        resetPasswordCode: null,
        resetPasswordExpires: null,
      },
    });

    return {
      message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.',
    };
  }
}