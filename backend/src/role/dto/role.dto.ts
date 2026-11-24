import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';
export class RoleDto {
  @IsInt()
  roleId: number;

  @IsString()
  roleName: string;

  @IsOptional()
  @IsString()
  description: string | null;

  @IsDate()
  createdAt;

  @IsDate()
  updatedAt;
}
