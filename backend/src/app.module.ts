import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './core/prisma/prisma.module';
import { ResourceModule } from './modules/resource/resource.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { BiModule } from './modules/bi/bi.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { AdminPanelModule } from './modules/admin-panel/admin-panel.module';

@Module({
    imports: [
        // Core Modules
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        PrismaModule,

        // Feature Modules
        ResourceModule,
        EvaluationModule,
        BiModule,
        UsersModule,
        AuthModule,
        RolesModule,
        SystemConfigModule,
        DepartmentsModule,
        AdminPanelModule.register(),
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
