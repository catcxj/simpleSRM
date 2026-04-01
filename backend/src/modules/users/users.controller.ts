import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @RequirePermissions('write:users')
    create(@Body() createUserDto: Prisma.UserCreateInput) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @RequirePermissions('read:users')
    findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('search') search?: string,
    ) {
        const where: Prisma.UserWhereInput = search
            ? {
                OR: [
                    { username: { contains: search } },
                    { name: { contains: search } },
                ],
            }
            : {};

        return this.usersService.findAll({
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
            where,
        });
    }

    @Get(':id')
    @RequirePermissions('read:users')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne({ id });
    }

    @Patch(':id')
    @RequirePermissions('write:users')
    update(
        @Param('id') id: string,
        @Body() updateUserDto: Prisma.UserUpdateInput,
    ) {
        return this.usersService.update({
            where: { id },
            data: updateUserDto,
        });
    }

    @Delete(':id')
    @RequirePermissions('write:users')
    remove(@Param('id') id: string) {
        return this.usersService.remove({ id });
    }
}
