import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('departments')
@UseGuards(AuthGuard('jwt'))
export class DepartmentsController {

    @Get()
    findAll() {
        // Return a mock list of departments / units for the frontend to consume
        return [
            { id: 'dept-1', name: '总经办 (Executive Office)' },
            { id: 'dept-2', name: '采购部 (Procurement Dept)' },
            { id: 'dept-3', name: '工程部 (Engineering Dept)' },
            { id: 'dept-4', name: '财务部 (Finance Dept)' },
            { id: 'dept-5', name: '人力资源部 (HR Dept)' },
            { id: 'dept-6', name: '法务部 (Legal Dept)' },
        ];
    }
}
