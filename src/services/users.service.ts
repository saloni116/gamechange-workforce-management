import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { CreateUserDto } from '../modules/users/dto/create-user.dto';

import { PasswordUtil } from '../common/utils/password.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const existingUser =
      await this.prisma.user.findFirst({
        where: {
          OR: [
            {
              employeeId:
                createUserDto.employeeId,
            },
            {
              mobile: createUserDto.mobile,
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

    const user = await this.prisma.user.create({
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
}