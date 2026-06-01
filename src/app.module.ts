import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './database/prisma.module';

import { HealthModule } from './modules/health/health.module';

import { AuthModule } from './modules/auth/auth.module';

import { UsersModule } from './modules/users/users.module';

import { DepartmentsModule } from './modules/departments/departments.module';

import { ActivitiesModule } from './modules/activities/activities.module';
import { SalesOrdersModule } from './modules/sales-orders/sales-orders.module';
import { SalesOrdersController } from './controllers/sales-orders.controller';
import { SalesOrdersService } from './services/sales-orders.service'
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { ActivityLogsController } from './controllers/activity-logs.controller';
import { ActivityLogsService } from './services/activity-logs.service';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      envFilePath: '.env',
    }),

    PrismaModule,

    HealthModule,

    AuthModule,

    UsersModule,

    DepartmentsModule,

    ActivitiesModule,

    SalesOrdersModule,

    ActivityLogsModule,

    DashboardModule,

  ],
  controllers: [SalesOrdersController, ActivityLogsController, DashboardController],
  providers: [SalesOrdersService, ActivityLogsService, DashboardService],
})
export class AppModule {}