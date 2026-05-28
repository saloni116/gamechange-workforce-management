import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from '../services/users.service';

import { CreateUserDto } from '../modules/users/dto/create-user.dto';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

import { RolesGuard } from '../modules/auth/guards/roles.guard';

import { Roles } from '../modules/auth/decorators/roles.decorator';

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
}