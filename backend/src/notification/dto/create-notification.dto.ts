import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export enum NotificationTargetRoleDto {
  ALL = 'ALL',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsEnum(NotificationTargetRoleDto)
  targetRole!: NotificationTargetRoleDto;
}