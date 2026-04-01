import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BiService } from '../services/bi.service';
import { DashboardFilterDto } from '../dto/bi.dto';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('bi')
@Controller('analytics')
// @UseInterceptors(CacheInterceptor) // Requires CacheModule registration
export class BiController {
    constructor(private readonly biService: BiService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get BI Dashboard Data (Cached)' })
    // @CacheKey('dashboard_data')
    // @CacheTTL(60000) // 1 minute cache
    getDashboardData(@Query() filter: DashboardFilterDto) {
        return this.biService.getDashboardData(filter);
    }
}
