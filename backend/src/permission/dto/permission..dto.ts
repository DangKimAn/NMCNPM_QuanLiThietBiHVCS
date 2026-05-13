import { IsDate, IsIn, IsInt, IsOptional, IsString } from "class-validator";

export class PermissionDto{
    @IsInt()
    permissionId: number

    @IsString()
    permissionName : string 

    @IsDate()
    createdAt : Date

    @IsDate()
    updatedAt : Date 

    @IsOptional()
    @IsString()
    description: string | null
}