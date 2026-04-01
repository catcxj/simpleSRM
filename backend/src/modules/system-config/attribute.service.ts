import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAttributeDefinitionDto, UpdateAttributeDefinitionDto } from './dto/attribute.dto';

@Injectable()
export class AttributeService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateAttributeDefinitionDto) {
        const existing = await this.prisma.attributeDefinition.findUnique({
            where: {
                targetEntity_key: {
                    targetEntity: dto.targetEntity,
                    key: dto.key
                }
            }
        });
        if (existing) throw new ConflictException('该实体的属性键名已存在');

        return this.prisma.attributeDefinition.create({ data: dto });
    }

    async findAll(targetEntity?: string) {
        return this.prisma.attributeDefinition.findMany({
            where: targetEntity ? { targetEntity } : {},
            orderBy: { order: 'asc' }
        });
    }

    async update(id: string, dto: UpdateAttributeDefinitionDto) {
        const existing = await this.prisma.attributeDefinition.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('属性未找到');

        return this.prisma.attributeDefinition.update({
            where: { id },
            data: dto
        });
    }

    async remove(id: string) {
        return this.prisma.attributeDefinition.delete({ where: { id } });
    }
}
