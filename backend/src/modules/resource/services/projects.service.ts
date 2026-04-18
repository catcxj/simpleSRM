import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, ProjectFilterDto } from '../dto/project-contract.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    async create(createProjectDto: CreateProjectDto) {
        const existing = await this.prisma.project.findFirst({
            where: { code: createProjectDto.code, deletedAt: null },
        });
        if (existing) {
            throw new ConflictException('项目编号已存在');
        }

        return this.prisma.project.create({
            data: createProjectDto,
        });
    }

    async findAll(filter: ProjectFilterDto) {
        const page = Number(filter.page) || 1;
        const limit = Number(filter.limit) || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.ProjectWhereInput = {
            deletedAt: null,
            ...(filter.name && { name: { contains: filter.name } }),
            ...(filter.code && { code: { contains: filter.code } }),
            ...(filter.status && { status: filter.status }),
        };

        const [total, data] = await Promise.all([
            this.prisma.project.count({ where }),
            this.prisma.project.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            contracts: { where: { deletedAt: null } }
                        }
                    }
                }
            }),
        ]);

        return { total, page, limit, data };
    }

    async findOne(id: string) {
        const project = await this.prisma.project.findFirst({
            where: { id, deletedAt: null },
            include: { contracts: { where: { deletedAt: null } } }
        });
        if (!project) throw new NotFoundException(`未找到 ID 为 ${id} 的项目`);
        return project;
    }

    async update(id: string, updateProjectDto: UpdateProjectDto) {
        await this.findOne(id);
        return this.prisma.project.update({
            where: { id },
            data: updateProjectDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.project.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
