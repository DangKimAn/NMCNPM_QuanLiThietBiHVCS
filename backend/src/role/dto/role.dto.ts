import {IS_ALPHA, IsDate, IsIn, IsInt, IsOptional, IsString, IsUUID}from'class-validator'
import { dateTimestampProvider } from 'rxjs/internal/scheduler/dateTimestampProvider'
export class RoleDto{
    
    @IsInt()
    roleId : number

    @IsString()
    roleName: string

    @IsOptional()
    @IsString()
    description : string | null 

    @IsDate()
    createdAt 

    @IsDate()
    updatedAt 
}