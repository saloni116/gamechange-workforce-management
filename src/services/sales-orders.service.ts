import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { CreateSalesOrderDto } from '../modules/sales-orders/dto/create-sales-order.dto';

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createSalesOrder(
    createSalesOrderDto: CreateSalesOrderDto,
  ) {
    const existingSO =
      await this.prisma.salesOrder.findFirst({
        where: {
          soNumber:
            createSalesOrderDto.soNumber,

          isDeleted: false,
        },
      });

    if (existingSO) {
      throw new BadRequestException(
        'SO number already exists',
      );
    }

    const salesOrder =
      await this.prisma.salesOrder.create({
        data: {
          soNumber:
            createSalesOrderDto.soNumber,

          customerName:
            createSalesOrderDto.customerName,

          projectName:
            createSalesOrderDto.projectName,

          soDescription:
            createSalesOrderDto.soDescription,

          startDate:
            new Date(
              createSalesOrderDto.startDate,
            ),

          endDate:
            new Date(
              createSalesOrderDto.endDate,
            ),
        },
      });

    return {
      message:
        'Sales order created successfully',

      salesOrder,
    };
  }

    async getSalesOrders() {
    const salesOrders =
      await this.prisma.salesOrder.findMany({
        where: {
          isDeleted: false,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    return salesOrders.map((so) => ({
      id: so.id,

      soNumber:
        so.soNumber,

      customerName:
        so.customerName,

      projectName:
        so.projectName,

      soDescription:
        so.soDescription,

      startDate:
        so.startDate,

      endDate:
        so.endDate,

      status:
        so.status,

      isActive:
        so.isActive,

      createdAt:
        so.createdAt,
    }));
  }
}