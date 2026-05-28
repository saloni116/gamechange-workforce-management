import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateActivityLogDto {
  @IsString()
  @IsNotEmpty()
  soId: string;

  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsString()
  @IsNotEmpty()
  activityId: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsArray()
  coworkerEmployeeIds?: string[];
}