import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFilterDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    year?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    businessType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    grade?: string;
}
