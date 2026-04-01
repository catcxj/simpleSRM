import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EvaluationIndicatorDto {
    @ApiProperty({ example: 'quality' })
    @IsString()
    key: string;

    @ApiProperty({ example: 'Quality Control' })
    @IsString()
    name: string;

    @ApiProperty({ example: 40 })
    @IsNumber()
    weight: number;

    @ApiProperty({ example: 'Quantitative' })
    @IsString()
    type: string;
}

export class CreateEvaluationTemplateDto {
    @ApiProperty({ example: 'Engineering Construction Template' })
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ type: [EvaluationIndicatorDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EvaluationIndicatorDto)
    indicators: EvaluationIndicatorDto[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

import { PartialType } from '@nestjs/mapped-types';
export class UpdateEvaluationTemplateDto extends PartialType(CreateEvaluationTemplateDto) { }
