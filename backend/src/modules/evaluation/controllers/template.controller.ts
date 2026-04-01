import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TemplateService } from '../services/template.service';
import { CreateTemplateDto, UpdateTemplateDto } from '../dto/template.dto';

@ApiTags('evaluations/templates')
@Controller('evaluations/templates')
export class TemplateController {
    constructor(private readonly templateService: TemplateService) { }

    @Post()
    @ApiOperation({ summary: 'Create new evaluation template' })
    create(@Body() dto: CreateTemplateDto) {
        return this.templateService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all evaluation templates' })
    findAll() {
        return this.templateService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get evaluation template by id' })
    findOne(@Param('id') id: string) {
        return this.templateService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update evaluation template' })
    update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
        return this.templateService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete evaluation template' })
    remove(@Param('id') id: string) {
        return this.templateService.remove(id);
    }
}
