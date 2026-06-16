import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CreateActivityLogDto } from './create-activity-log.dto';

export class UpdateActivityLogDto extends PartialType(CreateActivityLogDto) {
  @IsOptional()
  @IsString()
  managerRemarks?: string;

  @IsOptional()
  @IsBoolean()
  isRework?: boolean;

  @IsOptional()
  @IsString()
  reworkAssignedToId?: string;
}
