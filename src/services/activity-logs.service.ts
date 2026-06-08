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
    try {
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
                startTime: createActivityLogDto.startTime
                  ? new Date(createActivityLogDto.startTime)
                  : new Date(),

                endTime: createActivityLogDto.endTime
                  ? new Date(createActivityLogDto.endTime)
                  : new Date(),

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
    } catch (error) {
      console.error('CRITICAL SUBMIT ERROR IN BACKEND:', error);
      throw error;
    }
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

  async reviewActivityLog(
    logId: string,
    status: 'COMPLETED' | 'PENDING' | 'REWORK_ASSIGNED',
    managerRemarks?: string,
  ) {
    const log = await this.prisma.activityLog.findUnique({
      where: { id: logId },
      include: { SalesOrder: true },
    });

    if (!log) {
      throw new BadRequestException('Activity log not found');
    }

    const updatedLog = await this.prisma.activityLog.update({
      where: { id: logId },
      data: {
        status,
        managerRemarks,
        isRework: status === 'REWORK_ASSIGNED',
      },
    });

    // Create a Notification for the user
    const soNumber = log.SalesOrder?.soNumber || 'Activity Log';
    const title = status === 'COMPLETED' ? 'Activity Log Approved' : 'Rework Assigned';
    const message = status === 'COMPLETED'
      ? `Your log for Sales Order ${soNumber} has been approved.`
      : `Rework required for Sales Order ${soNumber}: ${managerRemarks || 'Please review.'}`;

    await this.prisma.notification.create({
      data: {
        userId: log.userId,
        title,
        message,
        type: status === 'COMPLETED' ? 'APPROVED' : 'REWORK',
        referenceId: logId,
        isRead: false,
      },
    });

    return {
      message: 'Activity log reviewed successfully',
      activityLog: updatedLog,
    };
  }
}