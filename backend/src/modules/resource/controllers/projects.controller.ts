import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProjectsService } from '../services/projects.service';
import { CreateProjectDto, UpdateProjectDto, ProjectFilterDto } from '../dto/project-contract.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('resources')
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new project' })
    create(@Body() createProjectDto: CreateProjectDto) {
        return this.projectsService.create(createProjectDto);
    }

    @Get()
    @ApiOperation({ summary: 'List projects' })
    findAll(@Query() filter: ProjectFilterDto) {
        return this.projectsService.findAll(filter);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get project details' })
    findOne(@Param('id') id: string) {
        return this.projectsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update project' })
    update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
        return this.projectsService.update(id, updateProjectDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete project' })
    remove(@Param('id') id: string) {
        return this.projectsService.remove(id);
    }
}
