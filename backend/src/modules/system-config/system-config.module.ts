import { Module } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';
import { AttributeService } from './attribute.service';
import { AttributeController } from './attribute.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SystemConfigController, AttributeController],
    providers: [SystemConfigService, AttributeService],
    exports: [SystemConfigService, AttributeService],
})
export class SystemConfigModule { }
