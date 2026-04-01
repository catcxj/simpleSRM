import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from '../dto/template.dto';

@Injectable()
export class TemplateService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateTemplateDto) {
        return this.prisma.evaluationTemplate.create({
            data: dto
        });
    }

    async findAll() {
        return this.prisma.evaluationTemplate.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        const template = await this.prisma.evaluationTemplate.findUnique({
            where: { id }
        });
        if (!template) throw new NotFoundException('评价模板未找到');
        return template;
    }

    async update(id: string, dto: UpdateTemplateDto) {
        await this.findOne(id); // verify exists
        return this.prisma.evaluationTemplate.update({
            where: { id },
            data: dto
        });
    }

    async remove(id: string) {
        await this.findOne(id); // verify exists
        return this.prisma.evaluationTemplate.delete({
            where: { id }
        });
    }
}
