import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';

@Injectable()
export class RolesService {
    constructor(private prisma: PrismaService) { }

    async create(data: any): Promise<Role> {
        const { permissions, ...roleData } = data;
        return this.prisma.role.create({
            data: {
                ...roleData,
                permissions: this.buildPermissionsConnectOrCreate(permissions),
            },
            include: { permissions: true }
        });
    }

    findAll(): Promise<Role[]> {
        return this.prisma.role.findMany({
            include: { permissions: true },
        });
    }

    findOne(id: string): Promise<Role | null> {
        return this.prisma.role.findUnique({
            where: { id },
            include: { permissions: true },
        });
    }

    async update(id: string, data: any): Promise<Role> {
        const { permissions, ...roleData } = data;

        // If permissions are provided, overwrite existing permissions completely.
        if (permissions) {
            return this.prisma.role.update({
                where: { id },
                data: {
                    ...roleData,
                    permissions: {
                        set: [], // clear existing
                        ...this.buildPermissionsConnectOrCreate(permissions),
                    },
                },
                include: { permissions: true }
            });
        }

        return this.prisma.role.update({
            where: { id },
            data: roleData,
            include: { permissions: true }
        });
    }

    remove(id: string): Promise<Role> {
        return this.prisma.role.delete({ where: { id } });
    }

    private buildPermissionsConnectOrCreate(permissions?: string[]) {
        if (!permissions || !Array.isArray(permissions)) return undefined;

        return {
            connectOrCreate: permissions.map(perm => {
                const [action, resource] = perm.split(':');
                return {
                    where: {
                        action_resource: { action, resource }
                    },
                    create: {
                        action,
                        resource,
                        description: `Permission to ${action} ${resource}`
                    }
                };
            })
        };
    }
}
