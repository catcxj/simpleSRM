import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractsService } from '../services/contracts.service';
import { CreateContractDto, UpdateContractDto, ContractFilterDto } from '../dto/project-contract.dto';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Express } from 'express';

@ApiTags('resources')
@Controller('contracts')
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new contract' })
    create(@Body() createContractDto: CreateContractDto) {
        return this.contractsService.create(createContractDto);
    }

    @Post('import')
    @ApiOperation({ summary: 'Import contracts' })
    importData(@Body() data: any[]) {
        return this.contractsService.importContracts(data);
    }

    @Post('import/file')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Import contracts from Excel/CSV file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        return this.contractsService.importFromFile(file);
    }

    @Get()
    @ApiOperation({ summary: 'List contracts with pagination and filter' })
    findAll(@Query() filter: ContractFilterDto) {
        return this.contractsService.findAll(filter);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get contract details' })
    findOne(@Param('id') id: string) {
        return this.contractsService.findOne(id);
    }

    @Get('project/:projectId')
    @ApiOperation({ summary: 'List contracts by project' })
    findByProject(@Param('projectId') projectId: string) {
        return this.contractsService.findByProject(projectId);
    }

    @Get('supplier/:supplierId')
    @ApiOperation({ summary: 'List contracts by supplier' })
    findBySupplier(@Param('supplierId') supplierId: string) {
        return this.contractsService.findBySupplier(supplierId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update contract' })
    update(@Param('id') id: string, @Body() updateDto: UpdateContractDto) {
        return this.contractsService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete contract' })
    remove(@Param('id') id: string) {
        return this.contractsService.remove(id);
    }
}
