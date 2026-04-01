import { Module } from '@nestjs/common';
import { BiController } from './controllers/bi.controller';
import { BiService } from './services/bi.service';

@Module({
    controllers: [BiController],
    providers: [BiService],
})
export class BiModule { }
