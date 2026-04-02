import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { DashboardFilterDto } from '../dto/bi.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BiService {
    constructor(private prisma: PrismaService) { }

    async getDashboardData(filter: DashboardFilterDto) {
        const year = filter.year || new Date().getFullYear();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Build base supplier filter
        const supplierWhere: Prisma.SupplierWhereInput = { 
            deletedAt: null,
            status: { not: 'Suspended' }
        };
        if (filter.businessType && filter.businessType !== 'all') {
            supplierWhere.businessType = filter.businessType;
        }

        // Fetch tasks to get grades for the selected year
        const tasks = await this.prisma.evaluationTask.findMany({ where: { year } });
        const taskIds = tasks.map(t => t.id);

        let recordsData: any[] = [];
        if (taskIds.length > 0) {
            recordsData = await this.prisma.evaluationRecord.findMany({
                where: {
                    taskId: { in: taskIds },
                    supplier: supplierWhere
                },
                select: { totalScore: true, updatedAt: true, supplierId: true }
            });
        }

        // Apply grade filter
        if (filter.grade && filter.grade !== 'all') {
            const validSupplierIds = recordsData.filter(r => {
                const s = r.totalScore;
                let g = '不推荐';
                if (s >= 80) g = '推荐';
                else if (s >= 60) g = '审慎';
                return g === filter.grade;
            }).map(r => r.supplierId);

            supplierWhere.id = { in: validSupplierIds };

            // Also filter recordsData since it now must match the grade
            recordsData = recordsData.filter(r => validSupplierIds.includes(r.supplierId));
        }

        // 1. Quantity Analysis: Resource Total & Distribution
        const totalResources = await this.prisma.supplier.count({
            where: supplierWhere
        });

        const statusDistributionRaw = await this.prisma.supplier.groupBy({
            by: ['status'],
            _count: { status: true },
            where: supplierWhere
        });
        const statusDistribution = statusDistributionRaw.map(item => ({
            status: item.status,
            _count: { status: item._count.status }
        }));

        const typeDistributionRaw = await this.prisma.supplier.groupBy({
            by: ['businessType'],
            _count: { businessType: true },
            where: supplierWhere
        });
        const typeDistribution = typeDistributionRaw.map(item => ({
            businessType: item.businessType,
            _count: { businessType: item._count.businessType }
        }));

        // 2. Trend Analysis
        const selectedYearStart = new Date(year, 0, 1);
        const selectedYearEnd = new Date(year, 11, 31, 23, 59, 59);
        const lastYearStart = new Date(year - 1, 0, 1);
        const lastYearEnd = new Date(year - 1, 11, 31, 23, 59, 59);

        const newThisYear = await this.prisma.supplier.count({
            where: { ...supplierWhere, createdAt: { gte: selectedYearStart, lte: selectedYearEnd } }
        });
        
        // Calculate newThisMonth
        let newThisMonth = 0;
        if (year === currentYear) {
            const currentMonthStart = new Date(currentYear, currentMonth, 1);
            newThisMonth = await this.prisma.supplier.count({
                where: { ...supplierWhere, createdAt: { gte: currentMonthStart } }
            });
        }

        const newLastYear = await this.prisma.supplier.count({
            where: { ...supplierWhere, createdAt: { gte: lastYearStart, lte: lastYearEnd } }
        });

        // 3. Quality Analysis
        let gradeDistribution = { '推荐': 0, '审慎': 0, '不推荐': 0 };
        let scoreRange = { '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '<60': 0 };

        recordsData.forEach(r => {
            const s = r.totalScore;
            if (s >= 80) { gradeDistribution['推荐']++; }
            else if (s >= 60) { gradeDistribution['审慎']++; }
            else { gradeDistribution['不推荐']++; }

            if (s >= 90) { scoreRange['90-100']++; }
            else if (s >= 80) { scoreRange['80-89']++; }
            else if (s >= 70) { scoreRange['70-79']++; }
            else if (s >= 60) { scoreRange['60-69']++; }
            else { scoreRange['<60']++; }
        });

        const totalScoreSum = recordsData.reduce((sum, r) => sum + r.totalScore, 0);
        const avgScore = recordsData.length > 0 ? Number((totalScoreSum / recordsData.length).toFixed(1)) : 0;

        // 4. Monthly Trend (New Suppliers & Avg Score)
        const monthlyTrend = [];
        const qualityTrend = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 0; i < 12; i++) {
            const start = new Date(year, i, 1);
            const end = new Date(year, i + 1, 0, 23, 59, 59);

            const count = await this.prisma.supplier.count({
                where: { ...supplierWhere, createdAt: { gte: start, lte: end } }
            });
            monthlyTrend.push({ name: months[i], value: count });

            const monthRecords = recordsData.filter(r => {
                const d = new Date(r.updatedAt);
                return d.getMonth() === i;
            });
            const monthAvg = monthRecords.length > 0
                ? monthRecords.reduce((sum, r) => sum + r.totalScore, 0) / monthRecords.length
                : 0;
            qualityTrend.push({ name: months[i], value: Number(monthAvg.toFixed(1)) });
        }

        const highQuality = gradeDistribution['推荐'];
        const lowQuality = gradeDistribution['审慎'] + gradeDistribution['不推荐'];

        return {
            overview: {
                totalResources,
                newThisYear,
                newThisMonth,
                avgScore,
                growthRate: newLastYear === 0 ? 100 : Number(((newThisYear - newLastYear) / newLastYear * 100).toFixed(2))
            },
            distributions: {
                status: statusDistribution,
                businessType: typeDistribution,
                grade: gradeDistribution,
                scoreRange: scoreRange
            },
            trend: monthlyTrend,
            qualityTrend,
            quality: { high: highQuality, low: lowQuality, total: highQuality + lowQuality }
        };
    }
}
