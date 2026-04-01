import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

// TODO: Move to environment variable
export const jwtConstants = {
    secret: process.env.JWT_SECRET || 'secretKey',
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: any) {
        return {
            id: payload.sub,
            username: payload.username,
            name: payload.name,
            role: payload.role,
            permissions: payload.permissions,
            businessTypes: payload.businessTypes || []
        };
    }
}
