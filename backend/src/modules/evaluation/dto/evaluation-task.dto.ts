import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEvaluationTaskDto {
    @ApiProperty({ example: 2023 })
    @IsNumber()
    year: number;

    @ApiPropertyOptional({ example: 'Yearly' })
    @IsOptional()
    @IsString()
    period?: string;

    @ApiProperty({ example: '2023-12-30T23:59:59Z' })
    @IsString()
    deadline: string;

    @ApiPropertyOptional({ description: 'Template ID for indicators' })
    @IsOptional()
    @IsUUID()
    templateId?: string;

    @ApiPropertyOptional({ description: 'Project ID for event-based evaluation' })
    @IsOptional()
    @IsUUID()
    projectId?: string;

    @ApiPropertyOptional({ description: 'Specific supplier IDs to evaluate', type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    supplierIds?: string[];
}

export class SubmitScoreDetailDto {
    @ApiProperty({ example: 'quality' })
    @IsString()
    indicatorKey: string;

    @ApiProperty({ example: 90 })
    @IsNumber()
    score: number;

    @ApiPropertyOptional({ description: 'Mandatory if score < 60' })
    @IsOptional()
    @IsString()
    comment?: string;
}

export class SubmitEvaluationDto {
    @ApiProperty({ example: 'Evaluation Record UUID' })
    @IsUUID()
    recordId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    problem?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    suggestion?: string;

    @ApiPropertyOptional({ example: '推荐' })
    @IsOptional()
    @IsString()
    grade?: string;

    @ApiProperty({ type: [SubmitScoreDetailDto] })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => SubmitScoreDetailDto)
    details: SubmitScoreDetailDto[];
}
