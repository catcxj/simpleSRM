import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AttributeService } from './attribute.service';
import { CreateAttributeDefinitionDto, UpdateAttributeDefinitionDto } from './dto/attribute.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System Config - Attributes')
@Controller('system-config/attributes')
export class AttributeController {
    constructor(private readonly attributeService: AttributeService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new dynamic attribute definition' })
    create(@Body() createDto: CreateAttributeDefinitionDto) {
        return this.attributeService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'List attributes (optional filter by targetEntity)' })
    findAll(@Query('targetEntity') targetEntity?: string) {
        return this.attributeService.findAll(targetEntity);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an attribute definition' })
    update(@Param('id') id: string, @Body() updateDto: UpdateAttributeDefinitionDto) {
        return this.attributeService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an attribute definition' })
    remove(@Param('id') id: string) {
        return this.attributeService.remove(id);
    }
}
