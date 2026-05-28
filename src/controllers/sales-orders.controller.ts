import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SalesOrdersService } from '../services/sales-orders.service';

import { CreateSalesOrderDto } from '../modules/sales-orders/dto/create-sales-order.dto';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

import { RolesGuard } from '../modules/auth/guards/roles.guard';

import { Roles } from '../modules/auth/decorators/roles.decorator';

@Controller('sales-orders')
export class SalesOrdersController {
  constructor(
    private readonly salesOrdersService: SalesOrdersService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Post()
  async createSalesOrder(
    @Body()
    createSalesOrderDto: CreateSalesOrderDto,
  ) {
    return this.salesOrdersService.createSalesOrder(
      createSalesOrderDto,
    );
  }

    @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Get()
  async getSalesOrders() {
    return this.salesOrdersService.getSalesOrders();
  }
}