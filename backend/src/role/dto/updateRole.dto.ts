import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateRoleDto{

    @ApiProperty()
    @IsOptional()
    @IsString()
    roleName : string 

    @ApiProperty()
    @IsOptional()
    @IsString()
    description : string 

}