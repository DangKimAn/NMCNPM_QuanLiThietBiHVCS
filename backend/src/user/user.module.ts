import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RoleModule } from 'src/role/role.module';
import { PermissionModule } from 'src/permission/permission.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  //ĐƯA AUTHMODULE VÀO ĐÂY để UserController hiểu được chiến lược 'jwt'
  imports:[AuthModule, forwardRef(()=> RoleModule), forwardRef(() => PermissionModule), forwardRef(() => PrismaModule)]
})
export class UserModule {}
