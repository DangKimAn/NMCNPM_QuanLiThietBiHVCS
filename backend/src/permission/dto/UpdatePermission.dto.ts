import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdatePermissionDto{
    @IsString()
     @IsOptional()
    
        @ApiProperty()
        permissionName : string 
    
        @IsOptional()
        @IsString()
    
        @ApiProperty()
    
        decription : string
}