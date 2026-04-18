import { IsString, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested, IsDateString, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum SupplierStatus {
    Draft = 'Draft',
    Active = 'Active',
    Suspended = 'Suspended',
    Blacklisted = 'Blacklisted',
}

export class CreateSupplierContactDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'Sales Manager' })
    @IsOptional()
    @IsString()
    position?: string;

    @ApiProperty({ example: '13800000000' })
    @IsString()
    phone: string;

    @ApiPropertyOptional({ example: 'john@example.com' })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;
}

export class CreateSupplierQualificationDto {
    @ApiProperty({ example: 'ISO9001' })
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    issuingAuthority?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    certificateNo?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    effectiveDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expiryDate?: Date;

    @ApiPropertyOptional({ example: 'https://example.com/cert.pdf' })
    @IsOptional()
    @IsString()
    attachmentUrl?: string;
}

export class CreateSupplierBankInfoDto {
    @ApiProperty({ example: 'ICBC' })
    @IsString()
    bankName: string;

    @ApiProperty({ example: '622202...' })
    @IsString()
    accountNumber: string;

    @ApiPropertyOptional({ example: 'General Taxpayer' })
    @IsOptional()
    @IsString()
    taxpayerType?: string;
}

export class CreateSupplierDto {
    @ApiProperty({ example: 'Acme Corp' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: '911100000000000000' })
    @IsOptional()
    @IsString()
    registrationNumber?: string;

    @ApiProperty({ example: 'Active' })
    @IsOptional()
    @IsEnum(SupplierStatus)
    status?: SupplierStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    legalRepresentative?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    registeredCapital?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    establishDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    companyType?: string;

    @ApiProperty({ example: 'Construction' })
    @IsString()
    businessType: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    industry?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    serviceRegion?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    website?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isInLibrary?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    cooperationYears?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    problemRecord?: string;

    // Relations
    @ApiPropertyOptional({ type: [CreateSupplierContactDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSupplierContactDto)
    contacts?: CreateSupplierContactDto[];

    @ApiPropertyOptional({ type: [CreateSupplierQualificationDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSupplierQualificationDto)
    qualifications?: CreateSupplierQualificationDto[];

    @ApiPropertyOptional({ type: [CreateSupplierBankInfoDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSupplierBankInfoDto)
    bankInfos?: CreateSupplierBankInfoDto[];
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) { }

export class SupplierFilterDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    ids?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    registrationNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    businessType?: string;

    @ApiPropertyOptional({ enum: SupplierStatus })
    @IsOptional()
    @IsEnum(SupplierStatus)
    status?: SupplierStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    projectId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    contractCode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    grade?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    serviceRegion?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    contactPerson?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    contractCount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc';
}
