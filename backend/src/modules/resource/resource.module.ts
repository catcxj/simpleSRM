import { Module } from '@nestjs/common';
import { SuppliersController } from './controllers/suppliers.controller';
import { SuppliersService } from './services/suppliers.service';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsService } from './services/projects.service';
import { ContractsController } from './controllers/contracts.controller';
import { ContractsService } from './services/contracts.service';

@Module({
    controllers: [SuppliersController, ProjectsController, ContractsController],
    providers: [SuppliersService, ProjectsService, ContractsService],
})
export class ResourceModule { }
