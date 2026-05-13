import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreatePermissionDto{
    @IsString()

    @ApiProperty()
    permissionName : string 

    @IsOptional()
    @IsString()

    @ApiProperty()

    description : string
}