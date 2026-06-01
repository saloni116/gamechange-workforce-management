import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';

import { UsersService } from '../services/users.service';

import { CreateUserDto } from '../modules/users/dto/create-user.dto';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

import { RolesGuard } from '../modules/auth/guards/roles.guard';

import { Roles } from '../modules/auth/decorators/roles.decorator';

import { UpdateUserDto } from '../modules/users/dto/update-user.dto';
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.createUser(
      createUserDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Get()
  async getUsers() {
    return this.usersService.getUsers();
  }
    @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Get(':id')
  async getUserById(
    @Param('id') id: string,
  ) {
    return this.usersService.getUserById(id);
  }

    @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,

    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(
      id,
      updateUserDto,
    );
  }

    @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
  ) {
    return this.usersService.deleteUser(
      id,
    );
  }
}