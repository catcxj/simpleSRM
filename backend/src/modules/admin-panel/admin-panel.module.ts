import { Module, DynamicModule } from '@nestjs/common';
import AdminJS from 'adminjs';
import { PrismaClient, Prisma } from '@prisma/client';

@Module({})
export class AdminPanelModule {
    static async register(): Promise<DynamicModule> {
        const dynamicImport = new Function('specifier', 'return import(specifier)');
        // @ts-ignore
        const { AdminModule } = await dynamicImport('@adminjs/nestjs');
        // @ts-ignore
        const AdminJS = (await dynamicImport('adminjs')).default;
        // @ts-ignore
        const AdminJSPrisma = await dynamicImport('@adminjs/prisma');
        const { PrismaClient, Prisma } = await import('@prisma/client');

        AdminJS.registerAdapter({
            Database: AdminJSPrisma.Database,
            Resource: AdminJSPrisma.Resource,
        });

        const prisma = new PrismaClient();

        return {
            module: AdminPanelModule,
            imports: [
                AdminModule.createAdminAsync({
                    useFactory: () => {
                        return {
                            adminJsOptions: {
                                rootPath: '/admin',
                                resources: Prisma.dmmf.datamodel.models.map((model) => ({
                                    resource: { model, client: prisma },
                                })),
                                branding: {
                                    companyName: 'SimpleSRM Database Manager',
                                    withMadeWithLove: false,
                                },
                            },
                            auth: {
                                authenticate: async (email, password) => {
                                    // Only single super admin account is allowed
                                    const adminEmail = process.env.ADMIN_EMAIL || 'admin';
                                    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

                                    if (email === adminEmail && password === adminPassword) {
                                        return { email, role: 'superadmin' };
                                    }
                                    return null;
                                },
                                cookieName: 'adminjs_session',
                                cookiePassword: process.env.ADMIN_COOKIE_PASSWORD || 'simple-srm-secret-admin-cookie-password-2026',
                            },
                            sessionOptions: {
                                secret: process.env.ADMIN_COOKIE_PASSWORD || 'simple-srm-secret-admin-cookie-password-2026',
                                resave: true,
                                saveUninitialized: false,
                            },
                        };
                    },
                }),
            ],
        };
    }
}
