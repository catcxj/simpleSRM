import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne({ username });
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const permissions = user.role?.permissions?.map((p: any) => `${p.action}:${p.resource}`) || [];
        let businessTypes = [];
        try {
            if (user.role?.businessTypes) {
                businessTypes = JSON.parse(user.role.businessTypes);
            }
        } catch (e) {
            console.error('Failed to parse businessTypes', e);
        }

        const payload = {
            username: user.username,
            sub: user.id,
            role: user.role?.name,
            name: user.name,
            permissions,
            businessTypes
        };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
