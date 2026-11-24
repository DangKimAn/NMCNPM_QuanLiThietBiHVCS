import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailerService } from 'src/common/mailer.service';
import { createMockPrismaService } from 'src/test-utils/mock-prisma';
import * as bcryptUtils from 'src/common/bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;
  let mailerService: jest.Mocked<Partial<MailerService>>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        return null;
      }),
    };
    mailerService = {
      sendOtpEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: MailerService, useValue: mailerService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('TC-AUTH-02: Đăng nhập thành công với username và password đúng', async () => {
      const mockUser = {
        userId: 1,
        username: 'admin',
        email: 'admin@ptithcm.edu.vn',
        fullName: 'Admin User',
        hashedPassword: 'hashed-password',
        status: 'ACTIVE',
        role: { roleName: 'ADMIN' },
      };

      prisma.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(bcryptUtils, 'verifyPassword').mockResolvedValue(true);
      jest
        .spyOn(bcryptUtils, 'hashPassword')
        .mockResolvedValue('hashed-refresh-token');
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await authService.login({
        username: 'admin',
        password: 'Password123!',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.username).toBe('admin');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
          data: expect.objectContaining({
            refreshToken: 'hashed-refresh-token',
          }),
        }),
      );
    });

    it('TC-AUTH-03: Báo lỗi UnauthorizedException khi username không tồn tại', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.login({
          username: 'nonexistent',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('TC-AUTH-04: Báo lỗi UnauthorizedException khi mật khẩu không chính xác', async () => {
      prisma.user.findFirst.mockResolvedValue({
        userId: 1,
        username: 'admin',
        hashedPassword: 'hashed-password',
        status: 'ACTIVE',
        role: { roleName: 'ADMIN' },
      });
      jest.spyOn(bcryptUtils, 'verifyPassword').mockResolvedValue(false);

      await expect(
        authService.login({ username: 'admin', password: 'WrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('TC-AUTH-05: Báo lỗi UnauthorizedException khi tài khoản không ở trạng thái ACTIVE', async () => {
      prisma.user.findFirst.mockResolvedValue({
        userId: 1,
        username: 'locked_user',
        hashedPassword: 'hashed-password',
        status: 'SUSPENDED',
        role: { roleName: 'STUDENT' },
      });
      jest.spyOn(bcryptUtils, 'verifyPassword').mockResolvedValue(true);

      await expect(
        authService.login({
          username: 'locked_user',
          password: 'Password123!',
        }),
      ).rejects.toThrow('Tài khoản đã bị khóa');
    });
  });

  describe('forgotPassword', () => {
    it('TC-AUTH-09: Gửi OTP thành công khi email tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 1,
        email: 'user@student.ptithcm.edu.vn',
      });
      prisma.user.update.mockResolvedValue({});
      jest.spyOn(bcryptUtils, 'hashPassword').mockResolvedValue('hashed-otp');

      const result = await authService.forgotPassword({
        email: 'user@student.ptithcm.edu.vn',
      });

      expect(result.message).toContain('Mã OTP đã được gửi');
      expect(mailerService.sendOtpEmail).toHaveBeenCalledWith(
        'user@student.ptithcm.edu.vn',
        expect.stringMatching(/^\d{6}$/),
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'user@student.ptithcm.edu.vn' },
          data: expect.objectContaining({
            resetPasswordCode: 'hashed-otp',
          }),
        }),
      );
    });

    it('TC-AUTH-10: Báo lỗi NotFoundException khi email không tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.forgotPassword({ email: 'notfound@ptithcm.edu.vn' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyOtp', () => {
    it('TC-AUTH-11: Xác minh OTP thành công khi đúng mã và còn hạn', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 1,
        email: 'user@ptithcm.edu.vn',
        resetPasswordCode: 'hashed-otp',
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000),
      });
      jest.spyOn(bcryptUtils, 'verifyPassword').mockResolvedValue(true);

      const result = await authService.verifyOtp({
        email: 'user@ptithcm.edu.vn',
        otp: '123456',
      });

      expect(result.valid).toBe(true);
      expect(result.message).toContain('Xác minh OTP thành công');
    });

    it('TC-AUTH-12: Báo lỗi BadRequestException khi mã OTP đã hết hạn', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 1,
        email: 'user@ptithcm.edu.vn',
        resetPasswordCode: 'hashed-otp',
        resetPasswordExpires: new Date(Date.now() - 1000), // đã hết hạn
      });

      await expect(
        authService.verifyOtp({ email: 'user@ptithcm.edu.vn', otp: '123456' }),
      ).rejects.toThrow('Mã OTP đã hết hạn');
    });

    it('TC-AUTH-12b: Báo lỗi BadRequestException khi mã OTP không chính xác', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 1,
        email: 'user@ptithcm.edu.vn',
        resetPasswordCode: 'hashed-otp',
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000),
      });
      jest.spyOn(bcryptUtils, 'verifyPassword').mockResolvedValue(false);

      await expect(
        authService.verifyOtp({ email: 'user@ptithcm.edu.vn', otp: '999999' }),
      ).rejects.toThrow('Mã OTP không chính xác');
    });
  });

  describe('resetPassword', () => {
    it('TC-AUTH-13: Đặt lại mật khẩu thành công và thu hồi refreshToken (set null)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        userId: 1,
        email: 'user@ptithcm.edu.vn',
        resetPasswordCode: 'hashed-otp',
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000),
      });
      jest.spyOn(bcryptUtils, 'verifyPassword').mockResolvedValue(true);
      jest
        .spyOn(bcryptUtils, 'hashPassword')
        .mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue({});

      const result = await authService.resetPassword({
        email: 'user@ptithcm.edu.vn',
        otp: '123456',
        newPassword: 'NewPassword123!',
      });

      expect(result.message).toContain('Đặt lại mật khẩu thành công');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'user@ptithcm.edu.vn' },
        data: {
          hashedPassword: 'new-hashed-password',
          refreshToken: null, // Bảo mật: thu hồi session cũ
          resetPasswordCode: null,
          resetPasswordExpires: null,
        },
      });
    });
  });
});
