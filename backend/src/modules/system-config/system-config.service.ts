import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SystemConfig, Prisma } from '@prisma/client';

@Injectable()
export class SystemConfigService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.SystemConfigCreateInput): Promise<SystemConfig> {
        return this.prisma.systemConfig.create({ data });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.SystemConfigWhereUniqueInput;
        where?: Prisma.SystemConfigWhereInput;
        orderBy?: Prisma.SystemConfigOrderByWithRelationInput;
    }): Promise<SystemConfig[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.systemConfig.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
    }

    async findOne(
        where: Prisma.SystemConfigWhereUniqueInput,
    ): Promise<SystemConfig | null> {
        return this.prisma.systemConfig.findUnique({
            where,
        });
    }

    async findByKey(key: string): Promise<SystemConfig | null> {
        return this.prisma.systemConfig.findFirst({
            where: { key },
        });
    }

    async update(params: {
        where: Prisma.SystemConfigWhereUniqueInput;
        data: Prisma.SystemConfigUpdateInput;
    }): Promise<SystemConfig> {
        const { where, data } = params;
        return this.prisma.systemConfig.update({
            data,
            where,
        });
    }

    async remove(where: Prisma.SystemConfigWhereUniqueInput): Promise<SystemConfig> {
        return this.prisma.systemConfig.delete({
            where,
        });
    }
}
