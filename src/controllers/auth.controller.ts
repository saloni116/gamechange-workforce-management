import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from '../services/auth.service';

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
}