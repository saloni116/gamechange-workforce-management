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

          departments: createSalesOrderDto.departmentIds
            ? {
                connect: createSalesOrderDto.departmentIds.map((id) => ({ id })),
              }
            : undefined,

          activities: createSalesOrderDto.activityIds
            ? {
                connect: createSalesOrderDto.activityIds.map((id) => ({ id })),
              }
            : undefined,
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
          isActive: true,
        },

        include: {
          departments: true,
          activities: true,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    // Load all departments and activities to resolve fallback mappings by name if needed
    const allDepartments = await this.prisma.department.findMany();
    const allActivities = await this.prisma.activity.findMany();

    return salesOrders.map((so) => {
      let departments = so.departments.map((d) => ({
        id: d.id,
        name: d.name,
      }));

      let activities = so.activities.map((a) => ({
        id: a.id,
        activityName: a.activityName,
      }));

      // Fallback parsing of soDescription JSON for older or dynamically added records
      if (so.soDescription) {
        try {
          const descStr = so.soDescription.trim();
          if (descStr.startsWith('{') && descStr.endsWith('}')) {
            const parsed = JSON.parse(descStr);
            
            // Resolve departments by name if empty
            if (departments.length === 0 && Array.isArray(parsed.allowedDepartments)) {
              const allowedNames = parsed.allowedDepartments.map((n: any) => n.toString().toLowerCase().trim());
              departments = allDepartments
                .filter((d) => allowedNames.includes(d.name.toLowerCase().trim()))
                .map((d) => ({ id: d.id, name: d.name }));
            }

            // Resolve activities by name if empty
            if (activities.length === 0 && Array.isArray(parsed.allowedActivities)) {
              const allowedNames = parsed.allowedActivities.map((n: any) => n.toString().toLowerCase().trim());
              activities = allActivities
                .filter((a) => allowedNames.includes(a.activityName.toLowerCase().trim()))
                .map((a) => ({ id: a.id, activityName: a.activityName }));
            }
          }
        } catch (e) {
          // Ignored if not JSON format
        }
      }

      return {
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

        departments,
        activities,
      };
    });
  }
}