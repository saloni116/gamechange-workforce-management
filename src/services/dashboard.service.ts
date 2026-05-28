import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getSummary() {
    const totalUsers =
      await this.prisma.user.count({
        where: {
          isDeleted: false,
        },
      });

    const totalDepartments =
      await this.prisma.department.count({
        where: {
          isDeleted: false,
        },
      });

    const totalActivities =
      await this.prisma.activity.count({
        where: {
          isDeleted: false,
        },
      });

    const totalSalesOrders =
      await this.prisma.salesOrder.count({
        where: {
          isDeleted: false,
        },
      });

    const totalActivityLogs =
      await this.prisma.activityLog.count();

    const slots =
      await this.prisma.activitySlot.findMany();

    const totalManMinutes =
      slots.reduce(
        (sum, slot) =>
          sum + slot.durationMinutes,
        0,
      );

    const totalManHours =
      Number(
        (totalManMinutes / 60).toFixed(2),
      );

    return {
      totalUsers,

      totalDepartments,

      totalActivities,

      totalSalesOrders,

      totalActivityLogs,

      totalManHours,
    };
  }
}