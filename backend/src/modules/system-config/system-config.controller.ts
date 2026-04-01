import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { Prisma } from '@prisma/client';

@Controller('system-config')
export class SystemConfigController {
    constructor(private readonly systemConfigService: SystemConfigService) { }

    @Post()
    create(@Body() createSystemConfigDto: Prisma.SystemConfigCreateInput) {
        return this.systemConfigService.create(createSystemConfigDto);
    }

    @Get()
    findAll(
        @Query('category') category?: string,
    ) {
        const where: Prisma.SystemConfigWhereInput = category ? { category } : {};
        return this.systemConfigService.findAll({ where });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.systemConfigService.findOne({ id });
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateSystemConfigDto: Prisma.SystemConfigUpdateInput,
    ) {
        return this.systemConfigService.update({
            where: { id },
            data: updateSystemConfigDto,
        });
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.systemConfigService.remove({ id });
    }
}
