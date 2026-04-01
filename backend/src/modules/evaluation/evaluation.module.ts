import { Module } from '@nestjs/common';
import { EvaluationController } from './controllers/evaluation.controller';
import { TemplateController } from './controllers/template.controller';
import { EvaluationService } from './services/evaluation.service';
import { TemplateService } from './services/template.service';
import { EvaluationScheduler } from './evaluation.scheduler';

import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
    imports: [SystemConfigModule],
    controllers: [EvaluationController, TemplateController],
    providers: [EvaluationService, EvaluationScheduler, TemplateService],
})
export class EvaluationModule { }
