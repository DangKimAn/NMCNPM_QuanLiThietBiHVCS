import { BadRequestException, Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserDto } from '../user/dto/user.dto';
import { plainToInstance } from 'class-transformer'; 

import { hashPassword, verifyPassword } from 'src/common/bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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
}