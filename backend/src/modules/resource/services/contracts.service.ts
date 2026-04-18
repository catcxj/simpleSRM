import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateContractDto, UpdateContractDto, ContractFilterDto } from '../dto/project-contract.dto';
import { Prisma } from '@prisma/client';
import * as Papa from 'papaparse';
import * as xlsx from 'xlsx';
import { Express } from 'express';

@Injectable()
export class ContractsService {
    constructor(private prisma: PrismaService) { }

    async generateContractCode(projectCode: string): Promise<string> {
        const prefix = `${projectCode}-`;
        const count = await this.prisma.contract.count({
            where: { code: { startsWith: prefix } }
        });

        let seq = count + 1;
        let generatedCode = `${prefix}${String(seq).padStart(3, '0')}`;
        // Verify uniqueness just in case
        while (await this.prisma.contract.findFirst({ where: { code: generatedCode, deletedAt: null } })) {
            seq++;
            generatedCode = `${prefix}${String(seq).padStart(3, '0')}`;
        }
        return generatedCode;
    }

    async create(createContractDto: CreateContractDto) {

        // 2. Validate Project
        const project = await this.prisma.project.findUnique({
            where: { id: createContractDto.projectId },
        });
        if (!project || project.deletedAt) throw new BadRequestException('无效的项目 ID');

        let contractCode = createContractDto.code;
        if (!contractCode) {
            contractCode = await this.generateContractCode(project.code);
        } else {
            // 1. Check Code Uniqueness only if explicitly provided
            const existing = await this.prisma.contract.findFirst({
                where: { code: contractCode, deletedAt: null },
            });
            if (existing) throw new ConflictException('合同编号已存在');
        }

        // 3. Validate Supplier (Must strictly exist in DB)
        const supplier = await this.prisma.supplier.findUnique({
            where: { id: createContractDto.supplierId },
        });
        if (!supplier || supplier.deletedAt) throw new BadRequestException('无效的供应商 ID');
        if (supplier.status !== 'Active') throw new BadRequestException('供应商状态非活跃，无法签订合同');

        return this.prisma.contract.create({
            data: {
                code: contractCode,
                name: createContractDto.name,
                amount: createContractDto.amount,
                signedAt: createContractDto.signedAt ? new Date(createContractDto.signedAt) : null,
                projectId: createContractDto.projectId,
                supplierId: createContractDto.supplierId,
            },
        });
    }

    async importContracts(data: any[]) {
        const results = { success: 0, failed: 0, errors: [] as string[] };
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                if (!row.name || !row.projectName || !row.supplierName) {
                    throw new Error('Missing required fields (Name, Project Name, Supplier Name)');
                }

                const project = await this.prisma.project.findFirst({
                    where: { name: row.projectName, deletedAt: null }
                });
                if (!project) throw new Error(`Project [${row.projectName}] not found`);

                const supplier = await this.prisma.supplier.findUnique({
                    where: { name: row.supplierName }
                });
                if (!supplier || supplier.deletedAt) throw new Error(`Supplier [${row.supplierName}] not found or deleted`);

                let contractCode = String(row.code || '').trim();
                if (!contractCode) {
                    contractCode = await this.generateContractCode(project.code);
                } else {
                    const existing = await this.prisma.contract.findFirst({ where: { code: contractCode, deletedAt: null } });
                    if (existing) throw new Error(`Contract code [${contractCode}] already exists`);
                }

                await this.prisma.contract.create({
                    data: {
                        code: contractCode,
                        name: String(row.name),
                        amount: row.amount != null ? Number(row.amount) : null,
                        signedAt: row.signedAt ? new Date(row.signedAt) : null,
                        projectId: project.id,
                        supplierId: supplier.id,
                    }
                });
                results.success++;
            } catch (err: any) {
                results.failed++;
                results.errors.push(`Row ${i + 1} (${row.code || 'Unknown'}): ${err.message}`);
            }
        }
        return results;
    }

    async findAll(filter: ContractFilterDto) {
        const page = Number(filter.page) || 1;
        const limit = Number(filter.limit) || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.ContractWhereInput = {
            deletedAt: null,
            ...(filter.name && { name: { contains: filter.name } }),
            ...(filter.code && { code: { contains: filter.code } }),
        };

        const [total, data] = await Promise.all([
            this.prisma.contract.count({ where }),
            this.prisma.contract.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { project: true, supplier: true }
            }),
        ]);

        return { total, page, limit, data };
    }

    async findOne(id: string) {
        const contract = await this.prisma.contract.findFirst({
            where: { id, deletedAt: null },
            include: { project: true, supplier: true }
        });
        if (!contract) throw new NotFoundException(`未找到 ID 为 ${id} 的合同`);
        return contract;
    }

    async update(id: string, updateDto: UpdateContractDto) {
        await this.findOne(id);
        return this.prisma.contract.update({
            where: { id },
            data: {
                ...updateDto,
                ...(updateDto.signedAt && { signedAt: new Date(updateDto.signedAt) }),
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.contract.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async findByProject(projectId: string) {
        return this.prisma.contract.findMany({
            where: { projectId, deletedAt: null },
            include: { supplier: true }
        });
    }

    async findBySupplier(supplierId: string) {
        return this.prisma.contract.findMany({
            where: { supplierId, deletedAt: null },
            include: { project: true }
        });
    }

    async importFromFile(file: Express.Multer.File) {
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

        const formattedData = rawData.map(row => {
            const getStr = (key: string) => row[key]?.toString()?.trim() || '';
            let parsedDate = getStr('签订时间');
            if (typeof row['签订时间'] === 'number') {
                const dateInfo = xlsx.SSF.parse_date_code(row['签订时间']);
                if (dateInfo) {
                    parsedDate = `${dateInfo.y}-${String(dateInfo.m).padStart(2, '0')}-${String(dateInfo.d).padStart(2, '0')}`;
                }
            }

            return {
                code: getStr('合同编号'),
                name: getStr('合同名称'),
                amount: getStr('合同金额') ? Number(getStr('合同金额')) : null,
                signedAt: parsedDate,
                projectName: getStr('关联项目'),
                supplierName: getStr('供应商')
            };
        }).filter(d => Boolean(d.name)); // Changed filtering to require name instead of code

        return this.importContracts(formattedData);
    }
}
