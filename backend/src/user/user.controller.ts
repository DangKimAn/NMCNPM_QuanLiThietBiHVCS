import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, ForbiddenException} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';
import { Role } from 'src/auth/decorators/role.enum';
import { UpdateUserDto } from './dto/updateUser.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; 
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard) //Bắt buộc mọi API phải ĐĂNG NHẬP (Nhưng chưa check Role vội)
export class UserController {
  constructor(private readonly userService: UserService) {}

  //CHỈ ADMIN: Mới được tạo User bằng tay
  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return await this.userService.createUser(createUserDto);
  }

  //CHỈ ADMIN: Xem toàn bộ danh sách User
  @Get()
  @Roles(Role.ADMIN)
  async findAll(): Promise<UserDto[]> {
    return await this.userService.getAllUser();
  }

  //ADMIN & MANAGER: Xem thông tin user qua Email
  @Get('getUserbyEmail/:email')
  @Roles(Role.ADMIN, Role.MANAGER)
  async findByEmail(@Param('email') email: string): Promise<UserDto> {
    return await this.userService.getUserByEmail(email);
  }

  //CHỈ CHÍNH USER ĐÓ HOẶC ADMIN: Được phép xem thông tin chi tiết bằng ID
  @Get('getUserbyUserId/:userID')
  async findOne(
    @Param('userID', ParseIntPipe) userID: number,
    @GetUser() currentUser: { userId: number; role: string }
  ): Promise<UserDto> {
    const isSelf = currentUser.userId === userID;
    const isAdmin = currentUser.role === Role.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException(
        'Bạn không có quyền xem thông tin chi tiết của người dùng khác!',
      );
    }

    return await this.userService.getUserByUserId(userID);
  }

  //ADMIN & MANAGER: Tìm kiếm bằng username
  @Get('getUserbyUsername/:username')
  @Roles(Role.ADMIN, Role.MANAGER)
  async findByUsername(@Param('username') username: string) {
    return await this.userService.getUserByUsername(username);
  }

  //MỌI USER: Tự cập nhật thông tin cá nhân của chính mình (hoặc Admin sửa hộ)
  @Patch(':userId')
  async update(
    @Param('userId', ParseIntPipe) userId: number, 
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: { userId: number; role: string }
  ): Promise<UserDto> {
    const isSelf = currentUser.userId === userId;
    const isAdmin = currentUser.role === Role.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa thông tin của người dùng khác!',
      );
    }

    return await this.userService.updateUser(userId, updateUserDto);
  }

  //CHỈ ADMIN: Mới được quyền xóa User
  @Delete(':userId')
  @Roles(Role.ADMIN)
  async remove(@Param('userId', ParseIntPipe) userId: number): Promise<{ message: string }> {
    return await this.userService.deleteUser(userId);
  }

  //CHỈ ADMIN: Quyền tối cao nâng cấp tài khoản thành MANAGER hoặc hạ quyền
  @Patch(':userId/role')
  @Roles(Role.ADMIN) 
  async changeRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('roleName') roleName: string, 
  ) {
    return await this.userService.changeUserRole(userId, roleName);
  }
}