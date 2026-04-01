import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) {
            return true; // No permissions required
        }

        const { user } = context.switchToHttp().getRequest();

        // Super admin bypass
        if (user && user.username === 'admin') {
            return true;
        }

        if (!user || (!user.permissions && user.username !== 'admin')) {
            throw new ForbiddenException('用户未分配任何权限');
        }

        const hasPermission = () => requiredPermissions.every((permission) =>
            user.permissions.includes(permission)
        );

        if (!hasPermission()) {
            throw new ForbiddenException('权限不足');
        }

        return true;
    }
}
