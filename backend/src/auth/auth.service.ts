import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
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
  ) { }

  // ================= GENERATE TOKENS =================
  async generateTokens(
    userId: number,
    username: string,
    role: string,
  ) {
    const payload = {
      sub: userId,
      username,
      role,
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
  async register(dto: RegisterDto) {
    const userExists = await this.prismaService.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          { email: dto.email },
        ],
      },
    });

    if (userExists) {
      throw new BadRequestException(
        'Username hoặc Email học viện đã được sử dụng',
      );
    }

    // ================= AUTO ROLE =================
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

    // ================= FIND ROLE =================
    const defaultRole = await this.prismaService.role.findFirst({
      where: {
        roleName: roleTarget,
      },
    });

    // ================= CHECK ROLE EXISTS =================
    if (!defaultRole) {
      throw new InternalServerErrorException(
        `Role [${roleTarget}] không tồn tại trong hệ thống`,
      );
    }

    // ================= HASH PASSWORD =================
    const hashedPassword = await hashPassword(dto.password);

    // ================= CREATE USER =================
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

  // ================= LOGIN (HOÀN CHỈNH) =================
  async login(dto: LoginDto) {
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [
          { username: dto.usernameOrEmail },
          { email: dto.usernameOrEmail },
        ],
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

    // ================= GENERATE TOKENS =================
    const tokens = await this.generateTokens(
      user.userId,
      user.username,
      user.role.roleName,
    );

    // ================= SAVE REFRESH TOKEN =================
    const hashedRefreshToken = await hashPassword(
      tokens.refreshToken,
    );

    await this.prismaService.user.update({
      where: {
        userId: user.userId,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });

    // 🛠️ CHUẨN HÓA DỮ LIỆU USER TRƯỚC KHI TRẢ VỀ FRONTEND
    const userWithRoleField = {
      ...user,
      role: user.role.roleName, // Gán chuỗi tên quyền trực tiếp vào đây
    };

    // Đi qua plainToInstance để lọc bỏ hashedPassword & giữ lại các trường có @Expose()
    const userData = plainToInstance(UserDto, userWithRoleField, { excludeExtraneousValues: true });

    // Trả về cả token lẫn thông tin user đầy đủ
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

  // ================= REFRESH TOKENS (AN TOÀN & GIỮ NGUYÊN LUỒNG CŨ) =================
  async refreshTokens(refreshToken: string) {
    let payload: { sub: number; username: string };

    //ĐÃ SỬA: Bọc riêng phần verify JWT để bắt chính xác lỗi hết hạn token từ client
    try {
      payload = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch (err) {
      throw new UnauthorizedException(
        'Refresh token hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại',
      );
    }

    //ĐÃ SỬA: Đưa các logic DB ra ngoài try-catch để hệ thống log lỗi chuẩn xác (nếu sập Supabase, lỗi code...)
    const user = await this.prismaService.user.findUnique({
      where: {
        userId: payload.sub,
      },
      include: {
        role: true,
      },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException(
        'Phiên đăng nhập không tồn tại',
      );
    }

    const isValid = await verifyPassword(
      refreshToken,
      user.refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ',
      );
    }

    // ================= GENERATE NEW TOKENS =================
    const tokens = await this.generateTokens(
      user.userId,
      user.username,
      user.role.roleName,
    );

    // ================= UPDATE REFRESH TOKEN =================
    const hashedRefreshToken = await hashPassword(
      tokens.refreshToken,
    );

    await this.prismaService.user.update({
      where: {
        userId: user.userId,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });

    // 🛠️ Cập nhật map dữ liệu trả về tương tự như hàm Login
    const userWithRoleField = {
      ...user,
      role: user.role.roleName,
    };
    const userData = plainToInstance(UserDto, userWithRoleField, { excludeExtraneousValues: true });

    return {
      ...tokens,
      user: userData,
    };
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

  // ================= FORGOT PASSWORD (GỬI OTP) =================
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này');
    }

    // Tạo mã OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP trước khi lưu vào DB
    const hashedOtp = await hashPassword(otp);

    // Thời hạn 15 phút
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prismaService.user.update({
      where: { email: dto.email },
      data: {
        resetPasswordCode: hashedOtp,
        resetPasswordExpires: expiresAt,
      },
    });

    // Gửi email chứa OTP gốc (chưa hash)
    await this.mailerService.sendOtpEmail(dto.email, otp);

    return { message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.' };
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

    return { valid: true, message: 'Xác minh OTP thành công' };
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
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng bắt đầu lại từ đầu');
    }

    const isValid = await verifyPassword(dto.otp, user.resetPasswordCode);
    if (!isValid) {
      throw new BadRequestException('Mã OTP không chính xác');
    }

    // Hash mật khẩu mới và xóa OTP
    const hashedPassword = await hashPassword(dto.newPassword);

    await this.prismaService.user.update({
      where: { email: dto.email },
      data: {
        hashedPassword,
        resetPasswordCode: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.' };
  }
}