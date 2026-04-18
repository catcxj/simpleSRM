import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto, SupplierFilterDto, SupplierStatus } from '../dto/supplier.dto';
import { Prisma } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as Papa from 'papaparse';

@Injectable()
export class SuppliersService {
    constructor(private prisma: PrismaService) { }

    async create(createSupplierDto: CreateSupplierDto, user?: any) {
        // Check uniqueness
        const existingName = await this.prisma.supplier.findFirst({
            where: { name: createSupplierDto.name, deletedAt: null },
        });
        if (existingName) {
            throw new ConflictException('供应商名称已存在');
        }

        if (createSupplierDto.registrationNumber) {
            const existingReg = await this.prisma.supplier.findFirst({
                where: { registrationNumber: createSupplierDto.registrationNumber, deletedAt: null },
            });
            if (existingReg) {
                throw new ConflictException('统一社会信用代码已存在');
            }
        }

        const { contacts, qualifications, bankInfos, isInLibrary, ...baseData } = createSupplierDto;

        const created = await this.prisma.supplier.create({
            data: {
                ...baseData,
                createdById: user?.id,
                contacts: contacts?.length ? { create: contacts } : undefined,
                qualifications: qualifications?.length ? { create: qualifications } : undefined,
                bankInfos: bankInfos?.length ? { create: bankInfos } : undefined,
            },
            include: {
                contacts: true,
                qualifications: true,
                bankInfos: true,
            }
        });

        return {
            ...created,
            isInLibrary: isInLibrary ?? true,
        };
    }

    async findAll(filter: SupplierFilterDto, user?: any) {
        const page = Number(filter.page) || 1;
        const limit = Number(filter.limit) || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.SupplierWhereInput = {
            deletedAt: null,
            ...(filter.ids && { id: { in: filter.ids.split(',') } }),
            ...(filter.name && { name: { contains: filter.name } }),
            ...(filter.registrationNumber && { registrationNumber: filter.registrationNumber }),
            ...(filter.status && { status: filter.status as any }),
            ...(filter.projectId && { contracts: { some: { projectId: filter.projectId } } }),
            ...(filter.contractCode && { contracts: { some: { code: { contains: filter.contractCode } } } }),
            ...(filter.grade && { evaluationRecords: { some: { grade: filter.grade } } }),
        };

        let requestedType = filter.businessType;

        // Data Permission Filtering
        if (user && user.role !== '系统管理员') {
            const allowedBusinessTypes = user.businessTypes || [];

            // Build the OR conditions for businessType access
            let businessTypeConditions: any[] = [];
            if (allowedBusinessTypes.length > 0) {
                if (requestedType && allowedBusinessTypes.includes(requestedType)) {
                    businessTypeConditions.push({ businessType: { contains: `"${requestedType}"` } });
                } else if (!requestedType) {
                    businessTypeConditions = allowedBusinessTypes.map((type: string) => ({
                        businessType: { contains: `"${type}"` }
                    }));
                }
            }

            // Build the self-created condition
            // If requestedType is set, it must match requestedType AND createdById
            let selfCreatedCondition: any = { createdById: user.id };
            if (requestedType) {
                selfCreatedCondition.businessType = { contains: `"${requestedType}"` };
            }

            if (businessTypeConditions.length > 0) {
                where.OR = [
                    ...businessTypeConditions,
                    selfCreatedCondition
                ];
            } else {
                where.OR = [selfCreatedCondition];
            }

            // Clear requestedType so we don't accidentally override the OR logic below
            requestedType = undefined;
        }

        // Apply specific business type search if allowable (only happens for System Admin now if requestedType is cleared)
        if (requestedType) {
            where.businessType = { contains: `"${requestedType}"` };
        }

        const total = await this.prisma.supplier.count({ where });

        let data = [];
        if (filter.sortBy === 'averageScore') {
            const allSuppliers = await this.prisma.supplier.findMany({
                where,
                include: {
                    contacts: { where: { isPrimary: true }, take: 1 },
                    evaluationRecords: { select: { totalScore: true } },
                    contracts: { where: { deletedAt: null }, include: { project: true } }
                }
            });

            const mapped = allSuppliers.map(s => {
                const evals = s.evaluationRecords || [];
                let averageScore = 66;
                if (evals.length > 0) {
                    averageScore = evals.reduce((sum, e) => sum + e.totalScore, 0) / evals.length;
                    averageScore = Math.round(averageScore * 100) / 100;
                }
                const { evaluationRecords, ...rest } = s;
                return { ...rest, averageScore, contractCount: s.contracts?.length || 0 };
            });

            mapped.sort((a, b) => {
                const aScore = a.averageScore ?? -1;
                const bScore = b.averageScore ?? -1;
                if (filter.sortOrder === 'asc') return aScore - bScore;
                return bScore - aScore;
            });

            data = mapped.slice(skip, skip + limit);
        } else {
            const orderBy: any = {};
            if (filter.sortBy) {
                orderBy[filter.sortBy] = filter.sortOrder || 'asc';
            } else {
                orderBy.createdAt = 'desc';
            }

            const dbData = await this.prisma.supplier.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    contacts: { where: { isPrimary: true }, take: 1 },
                    evaluationRecords: { select: { totalScore: true } },
                    contracts: { where: { deletedAt: null }, include: { project: true } }
                }
            });

            data = dbData.map(s => {
                const evals = s.evaluationRecords || [];
                let averageScore = 66;
                if (evals.length > 0) {
                    averageScore = evals.reduce((sum, e) => sum + e.totalScore, 0) / evals.length;
                    averageScore = Math.round(averageScore * 100) / 100;
                }
                const { evaluationRecords, ...rest } = s;
                return { ...rest, averageScore, contractCount: s.contracts?.length || 0 };
            });
        }

        return {
            total,
            page,
            limit,
            data,
        };
    }

    async findOne(id: string) {
        const supplier = await this.prisma.supplier.findFirst({
            where: { id, deletedAt: null },
            include: {
                contacts: true,
                qualifications: true,
                bankInfos: true,
                attributeValues: {
                    include: { attribute: true }
                }
            }
        });
        if (!supplier) {
            throw new NotFoundException(`未找到 ID 为 ${id} 的供应商`);
        }
        return supplier;
    }

    async update(id: string, updateSupplierDto: UpdateSupplierDto) {
        const existing = await this.findOne(id);

        if (updateSupplierDto.name && updateSupplierDto.name !== existing.name) {
            const duplicate = await this.prisma.supplier.findFirst({ where: { name: updateSupplierDto.name, deletedAt: null } });
            if (duplicate) throw new ConflictException('企业名称已被占用');
        }

        if (updateSupplierDto.registrationNumber && updateSupplierDto.registrationNumber !== existing.registrationNumber) {
            const duplicateReg = await this.prisma.supplier.findFirst({ where: { registrationNumber: updateSupplierDto.registrationNumber, deletedAt: null } });
            if (duplicateReg) throw new ConflictException('统一社会信用代码已存在');
        }

        // Separate relations for handling
        // Note: For update, handling nested relation updates (add/remove/update) is complex. 
        // For 'Simple SRM', we might just support updating base fields here, 
        // or simplistic replacement if provided.
        // A full implementation would require dedicated endpoints for managing contacts/qualifications 
        // or a diffing strategy. 
        // Let's implement strict atomic updates for base fields only in this method for safety, 
        // and assume relation management happens via specific APIs or re-creation if simpler.
        // HOWEVER, to support the "Edit Form" which sends everything:

        const { contacts, qualifications, bankInfos, isInLibrary, ...baseData } = updateSupplierDto;

        const updated = await this.prisma.supplier.update({
            where: { id },
            data: {
                ...baseData,
                establishDate: baseData.establishDate ? new Date(baseData.establishDate) : undefined,
                ...(contacts && {
                    contacts: {
                        deleteMany: {},
                        create: contacts.map(c => {
                            const { id, ...rest } = c as any;
                            return rest;
                        }),
                    }
                }),
                ...(qualifications && {
                    qualifications: {
                        deleteMany: {},
                        create: qualifications.map(q => {
                            const { id, ...rest } = q as any;
                            return {
                                ...rest,
                                effectiveDate: rest.effectiveDate ? new Date(rest.effectiveDate) : null,
                                expiryDate: rest.expiryDate ? new Date(rest.expiryDate) : null,
                            };
                        }),
                    }
                }),
                ...(bankInfos && {
                    bankInfos: {
                        deleteMany: {},
                        create: bankInfos.map(b => {
                            const { id, ...rest } = b as any;
                            return rest;
                        }),
                    }
                })
            },
            include: {
                contacts: true,
                qualifications: true,
                bankInfos: true,
            }
        });

        return {
            ...updated,
            isInLibrary: isInLibrary ?? true,
        };
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.supplier.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    // Bulk Import Logic (Simplified)
    async importSuppliers(dtos: CreateSupplierDto[], user?: any) {
        let createdCount = 0;
        const errors = [];

        for (const dto of dtos) {
            try {
                await this.create(dto, user);
                createdCount++;
            } catch (e: any) {
                errors.push({ name: dto.name, error: e.message });
            }
        }

        return { count: createdCount, errors };
    }

    async importFromFile(file: Express.Multer.File, user?: any) {
        let rawData: any[] = [];

        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            const csvContent = file.buffer.toString('utf-8');
            const parseResult = Papa.parse(csvContent, {
                header: true,
                skipEmptyLines: true,
            });
            rawData = parseResult.data;
        } else {
            const wb = xlsx.read(file.buffer, { type: 'buffer' });
            const sheetName = wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            rawData = xlsx.utils.sheet_to_json(sheet);
        }

        // Fetch valid configured values for proper filtering
        const systemConfigs = await this.prisma.systemConfig.findMany({
            where: { category: 'SupplierAttribute', key: { in: ['BusinessType', 'Industry'] } }
        });
        const dynamicBusinessTypes = systemConfigs.filter(c => c.key === 'BusinessType').map(c => c.value);
        const dynamicIndustries = systemConfigs.filter(c => c.key === 'Industry').map(c => c.value);

        const validBusinessTypes = new Set(dynamicBusinessTypes);
        const validIndustries = new Set(dynamicIndustries);

        const dtos: CreateSupplierDto[] = rawData.map((row: any) => {
            // Helper to safely get string value
            const getStr = (key: string) => row[key]?.toString()?.trim() || '';

            // Map CSV columns to DTO
            const name = getStr('供应商名称');
            const businessContentStr = getStr('业务内容 (业务领域）') || getStr('行业领域') || getStr('业务内容');
            const businessTypeStr = getStr('业务类别');
            const serviceRegion = getStr('服务国别');
            const website = getStr('公司网站');
            const contactName = getStr('联系人');
            const email = getStr('邮箱');
            const phone = getStr('联系电话');
            const position = getStr('职务');
            const city = getStr('城市');
            const address = getStr('公司地址');

            // Status mapping
            let status = SupplierStatus.Pending;
            const statusStr = getStr('是否入库');
            if (statusStr.includes('已入库')) status = SupplierStatus.Active;

            // Build contacts array
            const contacts: any[] = [];
            if (contactName) {
                contacts.push({
                    name: contactName,
                    phone: phone || 'N/A',
                    email: email,
                    position: position,
                    isPrimary: true
                });
            }

            // Multi-select parse logic
            const parseMultiSelect = (str: string, validSet: Set<string>) => {
                if (!str) return [];
                const splitValues = str.split(/[,，、]+/).map(v => v.trim()).filter(Boolean);
                return splitValues.filter(v => validSet.has(v));
            };

            const parsedBusinessTypes = parseMultiSelect(businessTypeStr, validBusinessTypes);
            const parsedIndustries = parseMultiSelect(businessContentStr, validIndustries);

            const businessTypeJson = JSON.stringify(parsedBusinessTypes);
            const industryJson = parsedIndustries.length ? JSON.stringify(parsedIndustries) : undefined;

            return {
                name: name,
                businessType: businessTypeJson,
                industry: industryJson,
                serviceRegion: serviceRegion,
                contacts: contacts,
                status: status,
                address: address,
                website: website,
                isInLibrary: status === SupplierStatus.Active,
            } as CreateSupplierDto;
        }).filter(dto => dto.name);

        return this.importSuppliers(dtos, user);
    }

    async exportSuppliers(filter: SupplierFilterDto, user?: any) {
        // Fetch all matching without pagination limits
        const { data } = await this.findAll({ ...filter, page: 1, limit: 100000 }, user);

        const exportData = data.map((supplier: any) => {
            const primaryContact = supplier.contacts?.[0];

            let printableBusinessType = supplier.businessType;
            try {
                if (supplier.businessType && supplier.businessType.startsWith('[')) {
                    const parsed = JSON.parse(supplier.businessType);
                    if (Array.isArray(parsed)) {
                        printableBusinessType = parsed.join(', ');
                    }
                }
            } catch (e) { }

            return {
                '供应商名称': supplier.name,
                '业务类别': printableBusinessType || '',
                '是否入库': supplier.status === SupplierStatus.Active ? '已入库' : supplier.status,
                '服务国别': supplier.serviceRegion || '',
                '公司网站': supplier.website || '',
                '联系人': primaryContact?.name || '',
                '邮箱': primaryContact?.email || '',
                '联系电话': primaryContact?.phone || '',
                '职务': primaryContact?.position || '',
                '公司地址': supplier.address || ''
            };
        });

        const worksheet = xlsx.utils.json_to_sheet(exportData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }
}
