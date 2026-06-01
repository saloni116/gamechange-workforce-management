import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { UpdateUserDto } from '../modules/users/dto/update-user.dto';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';

import { PasswordUtil } from '../common/utils/password.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ) {
    const existingUser =
      await this.prisma.user.findFirst({
        where: {
          OR: [
            {
              employeeId:
                createUserDto.employeeId,
            },
            {
              mobile:
                createUserDto.mobile,
            },
          ],
        },
      });

    if (existingUser) {
      throw new BadRequestException(
        'Employee already exists',
      );
    }

    const generatedPassword =
      this.generatePassword(
        createUserDto.firstName,
        createUserDto.mobile,
      );

    const hashedPassword =
      await PasswordUtil.hash(
        generatedPassword,
      );

    const user =
      await this.prisma.user.create({
        data: {
          employeeId:
            createUserDto.employeeId,

          firstName:
            createUserDto.firstName,

          lastName:
            createUserDto.lastName,

          mobile:
            createUserDto.mobile,

          email:
            createUserDto.email,

          passwordHash:
            hashedPassword,

          roleId:
            createUserDto.roleId,
        },

        include: {
          role: true,
        },
      });

    return {
      message:
        'User created successfully',

      generatedPassword,

      user: {
        id: user.id,

        employeeId:
          user.employeeId,

        firstName:
          user.firstName,

        lastName:
          user.lastName,

        mobile:
          user.mobile,

        email:
          user.email,

        role:
          user.role.name,
      },
    };
  }

  async getUsers() {
    const users =
      await this.prisma.user.findMany({
        where: {
          isDeleted: false,
        },

        include: {
          role: true,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    return users.map((user) => ({
      id: user.id,

      employeeId:
        user.employeeId,

      firstName:
        user.firstName,

      lastName:
        user.lastName,

      mobile:
        user.mobile,

      email:
        user.email,

      status:
        user.status,

      role:
        user.role.name,

      isActive:
        user.isActive,

      createdAt:
        user.createdAt,
    }));
  }

  async getUserById(id: string) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          id,
          isDeleted: false,
        },

        include: {
          role: true,
        },
      });

    if (!user) {
      throw new BadRequestException(
        'User not found',
      );
    }

    return {
      id: user.id,

      employeeId:
        user.employeeId,

      firstName:
        user.firstName,

      lastName:
        user.lastName,

      mobile:
        user.mobile,

      email:
        user.email,

      status:
        user.status,

      role: {
        id: user.role.id,

        name: user.role.name,
      },

      isActive:
        user.isActive,

      createdAt:
        user.createdAt,
    };
  }

  private generatePassword(
    firstName: string,
    mobile: string,
  ): string {
    const namePart =
      firstName
        .substring(0, 3)
        .toLowerCase();

    const mobilePart =
      mobile.slice(-3);

    return `${namePart}${mobilePart}`;
  }

    async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ) {
    const existingUser =
      await this.prisma.user.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

    if (!existingUser) {
      throw new BadRequestException(
        'User not found',
      );
    }

    const updatedUser =
      await this.prisma.user.update({
        where: {
          id,
        },

        data: {
          ...updateUserDto,
        },

        include: {
          role: true,
        },
      });

    return {
      message:
        'User updated successfully',

      user: {
        id: updatedUser.id,

        employeeId:
          updatedUser.employeeId,

        firstName:
          updatedUser.firstName,

        lastName:
          updatedUser.lastName,

        mobile:
          updatedUser.mobile,

        email:
          updatedUser.email,

        role:
          updatedUser.role.name,

        isActive:
          updatedUser.isActive,
      },
    };
  }

    async deleteUser(id: string) {
    const existingUser =
      await this.prisma.user.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

    if (!existingUser) {
      throw new BadRequestException(
        'User not found',
      );
    }

    await this.prisma.user.update({
      where: {
        id,
      },

      data: {
        isDeleted: true,
      },
    });

    return {
      message:
        'User deleted successfully',
    };
  }
}