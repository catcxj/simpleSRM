import { IsString, IsNumber, IsEnum, IsInt, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IndicatorType {
    Quantitative = 'Quantitative',
    Qualitative = 'Qualitative',
}

export class CreateIndicatorDto {
    @ApiProperty({ example: 2023 })
    @IsInt()
    year: number;

    @ApiProperty({ example: 'Quality', description: 'Name of the indicator' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'quality', description: 'Unique key for the indicator' })
    @IsString()
    key: string;

    @ApiProperty({ example: 0.4, description: 'Weight (0.0 - 1.0)' })
    @IsNumber()
    @Min(0)
    @Max(1)
    weight: number;

    @ApiProperty({ enum: IndicatorType })
    @IsEnum(IndicatorType)
    type: IndicatorType;
}

export class UpdateIndicatorDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    weight?: number;
}
