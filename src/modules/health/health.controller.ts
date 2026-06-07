import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      success: true,
      message: 'GameChange Workforce API is running',
      dbUrl: process.env.DATABASE_URL,
      timestamp: new Date().toISOString(),
    };
  }
}