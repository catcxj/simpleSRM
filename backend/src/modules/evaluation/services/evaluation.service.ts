import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateIndicatorDto } from '../dto/indicator.dto';
import { CreateEvaluationTaskDto, SubmitEvaluationDto } from '../dto/evaluation-task.dto';

@Injectable()
export class EvaluationService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    // --- Task Management ---

    async createEvaluationTask(dto: CreateEvaluationTaskDto) {
        // Check uniqueness for this specific project/year/period combination
        const existing = await this.prisma.evaluationTask.findFirst({
            where: {
                year: dto.year,
                period: dto.period || 'Yearly',
                projectId: dto.projectId
            }
        });
        if (existing) throw new ConflictException('该项目在此周期内已存在评价任务');

        // 1. Create Task
        const task = await this.prisma.evaluationTask.create({
            data: {
                year: dto.year,
                period: dto.period || 'Yearly',
                deadline: dto.deadline,
                templateId: dto.templateId,
                projectId: dto.projectId,
                status: 'Pending'
            }
        });

        // 2. Find Target Suppliers
        // If ProjectID is present, find suppliers in that project.
        // If Yearly, find ALL Active suppliers.
        // [New in 3.3.2]: If dto.supplierIds is provided, strictly filter by those IDs
        let suppliers = [];
        if (dto.projectId && dto.projectId !== 'none') {
            const contracts = await this.prisma.contract.findMany({
                where: { projectId: dto.projectId },
                select: { supplierId: true }
            });
            let supplierIds = [...new Set(contracts.map(c => c.supplierId))];

            if (dto.supplierIds && dto.supplierIds.length > 0) {
                supplierIds = supplierIds.filter(id => dto.supplierIds.includes(id));
            }

            suppliers = await this.prisma.supplier.findMany({
                where: { id: { in: supplierIds }, status: 'Active' }
            });
        } else {
            let whereClause: any = { status: 'Active', deletedAt: null };
            if (dto.supplierIds && dto.supplierIds.length > 0) {
                whereClause.id = { in: dto.supplierIds };
            }
            suppliers = await this.prisma.supplier.findMany({
                where: whereClause
            });
        }

        // 3. Create Records
        if (suppliers.length > 0) {
            for (const s of suppliers) {
                await this.prisma.evaluationRecord.create({
                    data: {
                        taskId: task.id,
                        supplierId: s.id,
                        totalScore: 0,
                        status: 'Draft'
                    }
                });
            }
        }

        return task;
    }

    async getTasks() {
        return this.prisma.evaluationTask.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { records: true } },
                template: true,
                project: true
            }
        });
    }

    async getRecords() {
        // Return records, including supplier and task (with project and template)
        return this.prisma.evaluationRecord.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                supplier: true,
                task: {
                    include: {
                        project: true,
                        template: true
                    }
                }
            }
        });
    }

    // --- Scoring Logic ---

    async getPendingCount(userId: string) {
        // Find all records that are in 'Draft' status (need evaluation)
        return this.prisma.evaluationRecord.count({
            where: { status: 'Draft' }
        });
    }

    async submitEvaluation(dto: SubmitEvaluationDto) {
        const record = await this.prisma.evaluationRecord.findUnique({
            where: { id: dto.recordId }
        });
        if (!record) throw new NotFoundException('评价记录未找到');

        // 1. Determine Score from Grade
        // Mapping: 推荐=100, 审慎=66, 不推荐=0
        let totalScore = 0;
        const grade = dto.grade || record.grade || '不推荐';

        if (grade === '推荐') totalScore = 100;
        else if (grade === '审慎') totalScore = 66;
        else totalScore = 0;

        // 2. Validate Mandatory Problem Record for "不推荐"
        if (grade === '不推荐' && !dto.problem?.trim()) {
            throw new BadRequestException('评价结果为“不推荐”时，必须填写问题记录');
        }

        // 3. Update Transaction
        return this.prisma.$transaction(async (tx) => {
            // Clear details as they are no longer used in simplified system
            await tx.evaluationDetail.deleteMany({ where: { recordId: record.id } });

            return tx.evaluationRecord.update({
                where: { id: record.id },
                data: {
                    totalScore,
                    grade,
                    problem: dto.problem,
                    suggestion: dto.suggestion,
                    status: 'Submitted',
                    updatedAt: new Date()
                }
            });
        });
    }

    async getRecord(id: string) {
        return this.prisma.evaluationRecord.findUnique({
            where: { id },
            include: {
                details: true,
                task: { include: { template: true } },
                supplier: true
            }
        });
    }

    async getSupplierHistory(supplierId: string) {
        return this.prisma.evaluationRecord.findMany({
            where: {
                supplierId,
                status: 'Submitted' // Changed from Completed to Submitted for now
            },
            orderBy: { createdAt: 'desc' },
            include: {
                details: true,
                task: true,
                evaluator: true
            }
        });
    }
}
