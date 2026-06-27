export const OKCode : number = 200
export const CreateCode : number = 201  
export const BadRequestCode: number = 400 
export const UnauthorizedCode: number = 401
export const ForbiddenCode : number = 403 
export const NotFoundCode : number = 404 
export const ConflictCode : number = 409 

export const BadGateway : number = 502
export const InternalServerErrorCode  : number = 500 

export class PrismaErrorCode{
    
 static readonly RecordNotFound : string  = 'P2025'
    static readonly ConFlictCode : string = 'P2002'
    static readonly ForeignKeyConstraintFailed : string = 'P2003'
}

export const roleName_admin ='ADMIN'
export const roleName_manager = 'MANAGER'
export const roleName_teacher = 'TEACHER'
export const roleName_student = 'STUDENT'
