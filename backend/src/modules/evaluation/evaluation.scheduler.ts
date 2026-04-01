import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { EvaluationService } from './services/evaluation.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class EvaluationScheduler implements OnModuleInit {
    private readonly logger = new Logger(EvaluationScheduler.name);
    private readonly JOB_NAME = 'periodic_evaluation_task';

    constructor(
        private readonly evaluationService: EvaluationService,
        private readonly systemConfigService: SystemConfigService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly prisma: PrismaService,
    ) { }

    async onModuleInit() {
        await this.scheduleEvaluationTask();
    }

    async scheduleEvaluationTask() {
        // Fetch cron expression from SystemConfig or use default
        // Requirement: "每年12月20日发起任务" => '0 0 20 12 *'
        const cronConfig = await this.systemConfigService.findByKey('EvaluationTask_Cron');
        const cronExpression = cronConfig?.value || '0 0 20 12 *';

        // Remove existing job if any (for updates)
        try {
            this.schedulerRegistry.deleteCronJob(this.JOB_NAME);
        } catch (e) {
            // Ignore if not found
        }

        const job = new CronJob(cronExpression, () => {
            this.handleEvaluationTask();
        });

        this.schedulerRegistry.addCronJob(this.JOB_NAME, job);
        job.start();

        this.logger.log(`Scheduled Evaluation Task with cron: ${cronExpression}`);
    }

    async handleEvaluationTask() {
        this.logger.log('Triggering periodic evaluation task generation...');

        const year = new Date().getFullYear();
        // Default deadline: Dec 30th of current year (Requirement: "12月30日截止")
        const deadline = new Date(year, 11, 30, 23, 59, 59);

        // Fetch EvaluationTask_Period from config (Yearly, Quarterly, Monthly)
        const periodConfig = await this.systemConfigService.findByKey('EvaluationTask_Period');
        const period = periodConfig?.value || 'Yearly';

        // Requirement: "评价按项目来"
        const activeProjects = await this.prisma.project.findMany({
            where: { status: 'Active', deletedAt: null }
        });

        if (activeProjects.length === 0) {
            this.logger.log('No active projects found. Skipping task generation.');
            return;
        }

        let createdCount = 0;
        for (const project of activeProjects) {
            try {
                await this.evaluationService.createEvaluationTask({
                    year,
                    deadline: deadline.toISOString(),
                    period,
                    projectId: project.id
                });
                createdCount++;
            } catch (e) {
                // If conflict (already exists), just skip
                if (e.status === 409) {
                    this.logger.debug(`Task for project ${project.name} already exists.`);
                } else {
                    this.logger.error(`Failed to create task for project ${project.name}`, e);
                }
            }
        }
        this.logger.log(`Created ${createdCount} evaluation tasks for ${activeProjects.length} projects.`);
    }
}
