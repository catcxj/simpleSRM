import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, UseGuards, Request, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SuppliersService } from '../services/suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto, SupplierFilterDto } from '../dto/supplier.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Express, Response } from 'express';

@ApiTags('resources')
@Controller('suppliers')
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    @ApiOperation({ summary: 'Create a new supplier' })
    @ApiResponse({ status: 201, description: 'The supplier has been successfully created.' })
    create(@Body() createSupplierDto: CreateSupplierDto, @Request() req) {
        return this.suppliersService.create(createSupplierDto, req.user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('import')
    @ApiOperation({ summary: 'Import suppliers from JSON/CSV data' })
    @ApiResponse({ status: 201, description: 'Suppliers imported successfully.' })
    import(@Body() dtos: CreateSupplierDto[], @Request() req) {
        return this.suppliersService.importSuppliers(dtos, req.user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('import/file')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Import suppliers from Excel/CSV file' })
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
    uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
        return this.suppliersService.importFromFile(file, req.user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('export')
    @ApiOperation({ summary: 'Export suppliers to XLSX' })
    async exportSuppliers(
        @Query() filter: SupplierFilterDto,
        @Request() req,
        @Res() res: Response
    ) {
        const buffer = await this.suppliersService.exportSuppliers(filter, req.user);
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="suppliers.xlsx"',
        });
        res.send(buffer);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    @ApiOperation({ summary: 'List all suppliers with filtering' })
    findAll(@Query() filter: SupplierFilterDto, @Request() req) {
        return this.suppliersService.findAll(filter, req.user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a supplier by ID' })
    findOne(@Param('id') id: string) {
        return this.suppliersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a supplier' })
    update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
        return this.suppliersService.update(id, updateSupplierDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete a supplier' })
    remove(@Param('id') id: string) {
        return this.suppliersService.remove(id);
    }
}
