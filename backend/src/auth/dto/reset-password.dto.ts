import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@student.ptithcm.edu.vn' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được trống' })
  email: string;

  @ApiProperty({ example: '483920' })
  @IsString()
  @IsNotEmpty({ message: 'Mã OTP không được trống' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 chữ số' })
  otp: string;

  @ApiProperty({ example: 'NewPass@123' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được trống' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}
