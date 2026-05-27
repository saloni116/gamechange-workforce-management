import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from '../services/auth.service';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

import { LoginDto } from '../modules/auth/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    return {
      message: 'Protected profile data',

      user: req.user,
    };
  }
}