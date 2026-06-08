import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ActivityLogsService } from '../services/activity-logs.service';

import { CreateActivityLogDto } from '../modules/activity-logs/dto/create-activity-log.dto';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

@Controller('activity-logs')
export class ActivityLogsController {
  constructor(
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @UseGuards(JwtAuthGuard)

  @Post()
  async createActivityLog(
    @Req() req: any,

    @Body()
    createActivityLogDto: CreateActivityLogDto,
  ) {
    console.log('USER DATA =>', req.user);

    return this.activityLogsService.createActivityLog(
      req.user.userId,

      createActivityLogDto,
);
  }

  @UseGuards(JwtAuthGuard)

@Get()
async getActivityLogs() {
  return this.activityLogsService.getActivityLogs();
}

  @UseGuards(JwtAuthGuard)
  @Patch(':id/review')
  async reviewActivityLog(
    @Param('id') id: string,
    @Body() body: { status: 'COMPLETED' | 'PENDING' | 'REWORK_ASSIGNED'; managerRemarks?: string },
  ) {
    return this.activityLogsService.reviewActivityLog(
      id,
      body.status,
      body.managerRemarks,
    );
  }
}