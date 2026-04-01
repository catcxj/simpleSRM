import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProjectStatus {
    Active = 'Active',
    Completed = 'Completed',
    Suspended = 'Suspended',
}

export class CreateProjectDto {
    @ApiProperty({ example: 'PRJ-2023-001', description: 'Unique Project Code' })
    @IsString()
    code: string;

    @ApiProperty({ example: 'Headquarters Construction', description: 'Project Name' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'John Doe', description: 'Project Manager Name', required: false })
    @IsOptional()
    @IsString()
    projectManager?: string;

    @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.Active })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;
}

export class UpdateProjectDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    projectManager?: string;

    @ApiPropertyOptional({ enum: ProjectStatus })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;
}

export class CreateContractDto {
    @ApiProperty({ example: 'CTR-2023-001', required: false })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiProperty({ example: 'Steel Supply Contract' })
    @IsString()
    name: string;

    @ApiProperty({ example: 1000000, required: false })
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiProperty({ example: '2023-01-01T00:00:00Z', required: false })
    @IsOptional()
    @IsDateString()
    signedAt?: string;

    @ApiProperty({ description: 'ID of the Project' })
    @IsUUID()
    projectId: string;

    @ApiProperty({ description: 'ID of the Supplier' })
    @IsUUID()
    supplierId: string;
}

export class UpdateContractDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    signedAt?: string;

    @ApiPropertyOptional({ description: 'ID of the Project' })
    @IsOptional()
    @IsUUID()
    projectId?: string;

    @ApiPropertyOptional({ description: 'ID of the Supplier' })
    @IsOptional()
    @IsUUID()
    supplierId?: string;
}

export class ProjectFilterDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ enum: ProjectStatus })
    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

    @ApiPropertyOptional()
    @IsOptional()
    page?: number;

    @ApiPropertyOptional()
    @IsOptional()
    limit?: number;
}

export class ContractFilterDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional()
    @IsOptional()
    page?: number;

    @ApiPropertyOptional()
    @IsOptional()
    limit?: number;
}
