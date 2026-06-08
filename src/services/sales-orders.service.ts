import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { CreateSalesOrderDto } from '../modules/sales-orders/dto/create-sales-order.dto';

import { UpdateSODepartmentsDto } from '../modules/sales-orders/dto/update-so-departments.dto';

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createSalesOrder(
    createSalesOrderDto: CreateSalesOrderDto,
  ) {
    // Enforce uppercase regardless of input casing
    createSalesOrderDto.soNumber =
      createSalesOrderDto.soNumber.toUpperCase();
    createSalesOrderDto.customerName =
      createSalesOrderDto.customerName.toUpperCase();

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
      await this.prisma.$transaction(
        async (tx) => {
          const so =
            await tx.salesOrder.create({
              data: {
                soNumber:
                  createSalesOrderDto.soNumber,

                customerName:
                  createSalesOrderDto.customerName,

                projectName:
                  createSalesOrderDto.projectName || null,

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

          // Create department and activity mappings if provided
          if (
            createSalesOrderDto.departments
              ?.length
          ) {
            for (const dept of createSalesOrderDto.departments) {
              const soDept =
                await tx.sODepartment.create({
                  data: {
                    soId: so.id,
                    departmentId:
                      dept.departmentId,
                  },
                });

              if (dept.activityIds?.length) {
                await tx.sODepartmentActivity.createMany(
                  {
                    data: dept.activityIds.map(
                      (activityId) => ({
                        soDepartmentId:
                          soDept.id,
                        activityId,
                      }),
                    ),
                  },
                );
              }
            }
          }

          return so;
        },
      );

    // Re-fetch with relations
    const result =
      await this.prisma.salesOrder.findUnique({
        where: { id: salesOrder.id },
        include: {
          soDepartments: {
            include: {
              department: true,
              soDepartmentActivities: {
                include: {
                  activity: true,
                },
              },
            },
          },
        },
      });

    return {
      message:
        'Sales order created successfully',

      salesOrder:
        this.formatSalesOrderResponse(result),
    };
  }

  async getSalesOrders() {
    const salesOrders =
      await this.prisma.salesOrder.findMany({
        where: {
          isDeleted: false,
        },

        include: {
          soDepartments: {
            include: {
              department: true,
              soDepartmentActivities: {
                include: {
                  activity: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    return salesOrders.map((so) =>
      this.formatSalesOrderResponse(so),
    );
  }

  async getSalesOrderById(id: string) {
    const so =
      await this.prisma.salesOrder.findFirst({
        where: {
          id,
          isDeleted: false,
        },

        include: {
          soDepartments: {
            include: {
              department: true,
              soDepartmentActivities: {
                include: {
                  activity: true,
                },
              },
            },
          },
        },
      });

    if (!so) {
      throw new NotFoundException(
        'Sales order not found',
      );
    }

    return this.formatSalesOrderResponse(so);
  }

  async updateSODepartments(
    soId: string,
    updateDto: UpdateSODepartmentsDto,
  ) {
    const so =
      await this.prisma.salesOrder.findFirst({
        where: {
          id: soId,
          isDeleted: false,
        },
      });

    if (!so) {
      throw new NotFoundException(
        'Sales order not found',
      );
    }

    await this.prisma.$transaction(
      async (tx) => {
        // Delete existing activities first (child records)
        await tx.sODepartmentActivity.deleteMany(
          {
            where: {
              soDepartment: {
                soId,
              },
            },
          },
        );

        // Delete existing department mappings
        await tx.sODepartment.deleteMany({
          where: { soId },
        });

        // Create new mappings
        for (const dept of updateDto.departments) {
          const soDept =
            await tx.sODepartment.create({
              data: {
                soId,
                departmentId:
                  dept.departmentId,
              },
            });

          if (dept.activityIds?.length) {
            await tx.sODepartmentActivity.createMany(
              {
                data: dept.activityIds.map(
                  (activityId) => ({
                    soDepartmentId:
                      soDept.id,
                    activityId,
                  }),
                ),
              },
            );
          }
        }
      },
    );

    // Re-fetch with relations
    const result =
      await this.prisma.salesOrder.findUnique({
        where: { id: soId },
        include: {
          soDepartments: {
            include: {
              department: true,
              soDepartmentActivities: {
                include: {
                  activity: true,
                },
              },
            },
          },
        },
      });

    return {
      message:
        'SO departments updated successfully',

      salesOrder:
        this.formatSalesOrderResponse(result),
    };
  }

  /**
   * Get departments linked to a specific SO.
   * Used by users when selecting a department for activity logging.
   */
  async getDepartmentsBySO(soId: string) {
    const so =
      await this.prisma.salesOrder.findFirst({
        where: {
          id: soId,
          isDeleted: false,
        },
      });

    if (!so) {
      throw new NotFoundException(
        'Sales order not found',
      );
    }

    const soDepartments =
      await this.prisma.sODepartment.findMany({
        where: { soId },
        include: {
          department: true,
        },
      });

    return soDepartments.map((sd) => ({
      id: sd.department.id,
      name: sd.department.name,
      code: sd.department.code,
      description: sd.department.description,
    }));
  }

  /**
   * Get activities linked to a specific SO + department pair.
   * These are the admin-selected activities for the user's activity logging.
   */
  async getActivitiesBySODepartment(
    soId: string,
    departmentId: string,
  ) {
    const soDept =
      await this.prisma.sODepartment.findUnique(
        {
          where: {
            soId_departmentId: {
              soId,
              departmentId,
            },
          },
        },
      );

    if (!soDept) {
      throw new NotFoundException(
        'Department not found for this SO',
      );
    }

    const soActivities =
      await this.prisma.sODepartmentActivity.findMany(
        {
          where: {
            soDepartmentId: soDept.id,
          },
          include: {
            activity: true,
          },
        },
      );

    return soActivities.map((sa) => ({
      id: sa.activity.id,
      activityName: sa.activity.activityName,
      standardManMinutes:
        sa.activity.standardManMinutes,
    }));
  }

  /**
   * Get "other" activities — activities under the same department
   * but NOT selected by admin for this SO+department pair.
   * User must provide a reason if they pick one of these.
   */
  async getOtherActivitiesBySODepartment(
    soId: string,
    departmentId: string,
  ) {
    const soDept =
      await this.prisma.sODepartment.findUnique(
        {
          where: {
            soId_departmentId: {
              soId,
              departmentId,
            },
          },
          include: {
            soDepartmentActivities: true,
          },
        },
      );

    if (!soDept) {
      throw new NotFoundException(
        'Department not found for this SO',
      );
    }

    // Get IDs of admin-selected activities
    const selectedActivityIds =
      soDept.soDepartmentActivities.map(
        (sa) => sa.activityId,
      );

    // Find all activities in this department that are NOT selected
    const otherActivities =
      await this.prisma.activity.findMany({
        where: {
          departmentId,
          isDeleted: false,
          id: {
            notIn: selectedActivityIds,
          },
        },
      });

    return otherActivities.map((a) => ({
      id: a.id,
      activityName: a.activityName,
      standardManMinutes:
        a.standardManMinutes,
      isOtherActivity: true,
    }));
  }

  /**
   * Format the raw Prisma response into a clean API response
   * with departments and activities nested.
   */
  private formatSalesOrderResponse(so: any) {
    if (!so) return null;

    return {
      id: so.id,
      soNumber: so.soNumber,
      customerName: so.customerName,
      projectName: so.projectName,
      soDescription: so.soDescription,
      startDate: so.startDate,
      endDate: so.endDate,
      status: so.status,
      isActive: so.isActive,
      createdAt: so.createdAt,
      departments: (so.soDepartments || []).map(
        (sd: any) => ({
          id: sd.department.id,
          name: sd.department.name,
          code: sd.department.code,
          activities: (
            sd.soDepartmentActivities || []
          ).map((sa: any) => ({
            id: sa.activity.id,
            activityName:
              sa.activity.activityName,
            standardManMinutes:
              sa.activity.standardManMinutes,
          })),
        }),
      ),
    };
  }
}