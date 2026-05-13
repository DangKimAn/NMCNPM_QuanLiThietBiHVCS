import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class createRoleDto{


    @ApiProperty()
    @IsString()
    roleName : string

    @ApiProperty({
        required: false
    })

    @IsOptional()
    @IsString()
    description : string

}