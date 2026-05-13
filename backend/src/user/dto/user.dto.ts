import { Expose } from "class-transformer";
import { IsDate, IsEmail, IsIn, IsInt, IsISBN, IsOptional, IsString } from "class-validator";

export class UserDto {

    @Expose()
    @IsInt()
    userId : number 

    @Expose()
    @IsString()
    username : string

    @Expose()
    @IsString()
    @IsEmail()
    email : string 

    @Expose()
    @IsOptional()
    @IsString()
    phoneNumber : string | null

    @IsString()
    hashedPassword: string 

    @IsOptional()
    @IsString()
    refreshToken: string |null
    @Expose()
    @IsInt()
    roleId : number

    
    @Expose()
    @IsString()
    status: string
}