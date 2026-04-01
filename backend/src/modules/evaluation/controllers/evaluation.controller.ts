import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EvaluationService } from '../services/evaluation.service';
import { SubmitEvaluationDto, CreateEvaluationTaskDto } from '../dto/evaluation-task.dto';

@ApiTags('evaluations')
@Controller('evaluations')
export class EvaluationController {
    constructor(private readonly evaluationService: EvaluationService) { }

    @Post('tasks')
    @ApiOperation({ summary: 'Trigger evaluation task generation' })
    createTask(@Body() dto: CreateEvaluationTaskDto) {
        return this.evaluationService.createEvaluationTask(dto);
    }

    @Get('tasks')
    @ApiOperation({ summary: 'List all evaluation tasks' })
    getTasks() {
        return this.evaluationService.getTasks();
    }

    @Get('records')
    @ApiOperation({ summary: 'List all evaluation records' })
    getRecords() {
        return this.evaluationService.getRecords();
    }

    @Get('records/:id')
    @ApiOperation({ summary: 'Get evaluation record details' })
    getRecord(@Param('id') id: string) {
        return this.evaluationService.getRecord(id);
    }

    @Get('pending-count')
    @ApiOperation({ summary: 'Get pending evaluation count (Red Dot)' })
    getPendingCount() {
        // In real app, we would get UserId from @User() decorator
        return this.evaluationService.getPendingCount('system-user');
    }

    @Post('submit')
    @ApiOperation({ summary: 'Submit evaluation score' })
    submitEvaluation(@Body() dto: SubmitEvaluationDto) {
        return this.evaluationService.submitEvaluation(dto);
    }

    @Get('history/:supplierId')
    @ApiOperation({ summary: 'Get evaluation history for a supplier' })
    async getHistory(@Param('supplierId') supplierId: string) {
        return this.evaluationService.getSupplierHistory(supplierId);
    }
}
