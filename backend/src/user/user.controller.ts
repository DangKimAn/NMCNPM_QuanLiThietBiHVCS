import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; 
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return await this.userService.createUser(createUserDto);
  }

  @Get()
  async findAll(): Promise<UserDto[]> {
    return await this.userService.getAllUser();
  }

  @Get('getUserbyEmail/:email')
  async findByEmail(@Param('email') email: string): Promise<UserDto> {
    return await this.userService.getUserByEmail(email);
  }

  @Get('getUserbyUserId/:userID')
  async findOne(@Param('userID', ParseIntPipe) userID: number): Promise<UserDto> {
    return await this.userService.getUserByUserId(userID);
  }

  @Get('getUserbyUsername/:username')
  async findByUsername(@Param('username') username: string){
    return await this.userService.getUserByUsername(username);
  }

  @Patch(':userId')
  async update(
    @Param('userId', ParseIntPipe) userId: number, 
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserDto> {
    return await this.userService.updateUser(userId, updateUserDto);
  }

  @Delete(':userId')
  async remove(@Param('userId', ParseIntPipe) userId: number): Promise<{ message: string }> {
    return await this.userService.deleteUser(userId);
  }

  // --- API MỚI: CHUYỂN ĐỔI QUYỀN SANG MANAGER (HOẶC ROLE KHÁC) ---
  // API này được bảo mật nghiêm ngặt, chỉ cho phép tài khoản có Role 'Quản trị viên' thực hiện
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Patch(':userId/role')
  async changeRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('roleName') roleName: string, // Frontend chỉ cần đẩy lên chuỗi dạng: "manager"
  ) {
    return await this.userService.changeUserRole(userId, roleName);
  }
}