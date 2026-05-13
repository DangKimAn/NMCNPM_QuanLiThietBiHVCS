import { IsIn, IsInt } from "class-validator";

export class Role_PermissionDto{
    @IsInt()
    roleId : number 

    @IsInt()
    permissionId : number
}