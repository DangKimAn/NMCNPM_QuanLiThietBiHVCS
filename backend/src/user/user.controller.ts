import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; 
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard) //Bắt buộc mọi API phải ĐĂNG NHẬP (Nhưng chưa check Role vội)
export class UserController {
  constructor(private readonly userService: UserService) {}

  //CHỈ ADMIN: Mới được tạo User bằng tay
  @Post()
  @Roles('ADMIN')
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return await this.userService.createUser(createUserDto);
  }

  //CHỈ ADMIN: Xem toàn bộ danh sách User
  @Get()
  @Roles('ADMIN')
  async findAll(): Promise<UserDto[]> {
    return await this.userService.getAllUser();
  }

  //ADMIN & MANAGER: Xem thông tin user qua Email
  @Get('getUserbyEmail/:email')
  @Roles('ADMIN', 'MANAGER')
  async findByEmail(@Param('email') email: string): Promise<UserDto> {
    return await this.userService.getUserByEmail(email);
  }

  //MỌI USER (Đã đăng nhập): Được phép xem thông tin chi tiết bằng ID
  @Get('getUserbyUserId/:userID')
  async findOne(@Param('userID', ParseIntPipe) userID: number): Promise<UserDto> {
    return await this.userService.getUserByUserId(userID);
  }

  //ADMIN & MANAGER: Tìm kiếm bằng username
  @Get('getUserbyUsername/:username')
  @Roles('ADMIN', 'MANAGER')
  async findByUsername(@Param('username') username: string){
    return await this.userService.getUserByUsername(username);
  }

  //MỌI USER: Tự cập nhật thông tin cá nhân của chính mình (hoặc Admin sửa hộ)
  @Patch(':userId')
  async update(
    @Param('userId', ParseIntPipe) userId: number, 
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserDto> {
    return await this.userService.updateUser(userId, updateUserDto);
  }

  //CHỈ ADMIN: Mới được quyền xóa User
  @Delete(':userId')
  @Roles('ADMIN')
  async remove(@Param('userId', ParseIntPipe) userId: number): Promise<{ message: string }> {
    return await this.userService.deleteUser(userId);
  }

  //CHỈ ADMIN: Quyền tối cao nâng cấp tài khoản thành MANAGER hoặc hạ quyền
  @Patch(':userId/role')
  @Roles('ADMIN') 
  async changeRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('roleName') roleName: string, 
  ) {
    return await this.userService.changeUserRole(userId, roleName);
  }
}