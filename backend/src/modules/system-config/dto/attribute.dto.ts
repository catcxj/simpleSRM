import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsJSON } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AttributeType {
    Text = 'Text',
    Number = 'Number',
    Date = 'Date',
    Select = 'Select',
}

export class CreateAttributeDefinitionDto {
    @ApiProperty({ example: 'Supplier' })
    @IsString()
    targetEntity: string;

    @ApiProperty({ example: 'capacity' })
    @IsString()
    key: string;

    @ApiProperty({ example: 'Production Capacity' })
    @IsString()
    label: string;

    @ApiProperty({ enum: AttributeType })
    @IsEnum(AttributeType)
    type: string;

    @ApiPropertyOptional({ example: '["Small", "Medium", "Large"]' })
    @IsOptional()
    @IsString()
    options?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isRequired?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    order?: number;
}

import { PartialType } from '@nestjs/mapped-types';
export class UpdateAttributeDefinitionDto extends PartialType(CreateAttributeDefinitionDto) { }
