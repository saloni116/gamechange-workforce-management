import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSalesOrderDto {
  @IsString()
  @IsNotEmpty()
  soNumber: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  projectName: string;

  @IsOptional()
  @IsString()
  soDescription?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsString({ each: true })
  activityIds?: string[];
}