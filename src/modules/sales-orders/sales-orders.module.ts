import { Module } from '@nestjs/common';

import { SalesOrdersController } from '../../controllers/sales-orders.controller';

import { SalesOrdersService } from '../../services/sales-orders.service';

import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],

  controllers: [SalesOrdersController],

  providers: [SalesOrdersService],
})
export class SalesOrdersModule {}