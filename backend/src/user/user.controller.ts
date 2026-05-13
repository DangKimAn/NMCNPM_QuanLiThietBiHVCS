import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto /create-user.dto';
import { UserDto } from './dto /user.dto';
import { UpdateUserDto } from './dto /updateUser.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}


  
  @Post()
  async create(@Body() createUserDto:CreateUserDto): Promise<UserDto> {
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
    @Body() updateUserDto:UpdateUserDto
  ): Promise<UserDto> {
    return await this.userService.updateUser(userId, updateUserDto);
  }

  
  @Delete(':userId')
  async remove(@Param('userId', ParseIntPipe) userId: number): Promise<{ message: string }> {
    return await this.userService.deleteUser(userId);
  }
}
