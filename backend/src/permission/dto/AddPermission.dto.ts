import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class AddPermissionDto{
    @ApiProperty()
    @IsNumber()
    permissionId :number
}