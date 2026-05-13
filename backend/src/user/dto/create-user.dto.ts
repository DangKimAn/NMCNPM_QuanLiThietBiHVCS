import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn, IsInt, IsOptional, IsString } from "class-validator";

export class CreateUserDto {


    @ApiProperty()
    @IsString()
    @IsEmail()
    email: string

    @ApiProperty()
    @IsString()
    username: string 

    @IsString()
    @ApiProperty()
    password: string

    @IsString()
    @IsOptional()
    @ApiProperty()

    phoneNumber: string
    
    @IsOptional()
    @IsInt()
    @ApiProperty()
    roleId : number
}