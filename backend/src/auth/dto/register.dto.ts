import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Username không được để trống' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  // Regex tối ưu hóa kiểm tra chính xác 2 đuôi email được cung cấp
  @Matches(/^[^@]+@(student\.)?ptithcm\.edu\.vn$/, {
    message: 'Hệ thống chỉ chấp nhận email thuộc học viện (*@ptithcm.edu.vn hoặc *@student.ptithcm.edu.vn)!',
  })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' })
  password: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}