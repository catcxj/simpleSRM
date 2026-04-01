import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        const admin = await this.prisma.user.findUnique({
            where: { username: 'admin' },
        });
        if (!admin) {
            console.log('Seeding default admin user...');
            const salt = await bcrypt.genSalt();
            const password = await bcrypt.hash('admin123', salt);
            await this.prisma.user.create({
                data: {
                    username: 'admin',
                    password,
                    name: 'Administrator',
                    status: 'Active',
                },
            });
            console.log('Default admin user created.');
        }
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        if (data.password) {
            const salt = await bcrypt.genSalt();
            data.password = await bcrypt.hash(data.password, salt);
        }
        return this.prisma.user.create({
            data,
        });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserWhereUniqueInput;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }): Promise<User[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.user.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: {
                role: true,
                department: true,
            },
        });
    }

    async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
        return this.prisma.user.findUnique({
            where,
            include: {
                role: {
                    include: {
                        permissions: true,
                    },
                },
            },
        });
    }

    async update(params: {
        where: Prisma.UserWhereUniqueInput;
        data: Prisma.UserUpdateInput;
    }): Promise<User> {
        const { where, data } = params;
        if (data.password && typeof data.password === 'string') {
            const salt = await bcrypt.genSalt();
            data.password = await bcrypt.hash(data.password, salt);
        }
        return this.prisma.user.update({
            data,
            where,
        });
    }

    async remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
        return this.prisma.user.delete({
            where,
        });
    }

    async changePassword(userId: string, oldPass: string, newPass: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('auth.change_password.user_not_found');
        }

        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) {
            throw new BadRequestException('auth.change_password.incorrect_old_password');
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPass, salt);

        return this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }
}
