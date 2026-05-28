import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { CreateActivityLogDto } from '../modules/activity-logs/dto/create-activity-log.dto';

@Injectable()
export class ActivityLogsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createActivityLog(
    userId: string,
    createActivityLogDto: CreateActivityLogDto,
  ) {
    const salesOrder =
      await this.prisma.salesOrder.findFirst({
        where: {
          id: createActivityLogDto.soId,
          isDeleted: false,
        },
      });

    if (!salesOrder) {
      throw new BadRequestException(
        'Sales order not found',
      );
    }

    const department =
      await this.prisma.department.findFirst({
        where: {
          id: createActivityLogDto.departmentId,
          isDeleted: false,
        },
      });

    if (!department) {
      throw new BadRequestException(
        'Department not found',
      );
    }

    const activity =
      await this.prisma.activity.findFirst({
        where: {
          id: createActivityLogDto.activityId,
          isDeleted: false,
        },
      });

    if (!activity) {
      throw new BadRequestException(
        'Activity not found',
      );
    }

    const activityLog =
      await this.prisma.activityLog.create({
        data: {
          userId,

          soId:
            createActivityLogDto.soId,

          departmentId:
            createActivityLogDto.departmentId,

          activityId:
            createActivityLogDto.activityId,

          activityDate:
            new Date(),

          remarks:
            createActivityLogDto.remarks,

          status: 'COMPLETED',

          slots: {
            create: {
              startTime: new Date(),

              endTime: new Date(),

              durationMinutes:
                createActivityLogDto.durationMinutes,
            },
          },
        },

        include: {
          slots: true,
        },
      });

    if (
      createActivityLogDto.coworkerEmployeeIds
        ?.length
    ) {
      const coworkers =
        await this.prisma.user.findMany({
          where: {
            employeeId: {
              in:
                createActivityLogDto.coworkerEmployeeIds,
            },

            isDeleted: false,
          },
        });

      for (const coworker of coworkers) {
        await this.prisma.activityCoworker.create({
          data: {
            activitySlotId:
              activityLog.slots[0].id,

            coworkerUserId:
              coworker.id,
          },
        });
      }
    }

    return {
      message:
        'Activity log submitted successfully',

      activityLogId:
        activityLog.id,
    };
  }

  async getActivityLogs() {
  const logs =
    await this.prisma.activityLog.findMany({
      include: {
        user: true,

        SalesOrder: true,

        department: true,

        activity: true,

        slots: {
          include: {
            coworkers: {
              include: {
                coworker: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

  return logs;
}
}