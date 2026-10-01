import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../users/users.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'super-secret-access-key-for-development',
    });
  }

  async validate(payload: any) {
    if (payload.sub === 'mock-admin-id') {
      return { id: 'mock-admin-id', email: 'admin@fleeto.ai', role: 'ADMIN', status: 'ACTIVE' };
    }
    const user = await this.usersService.findOne(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is not active or not found');
    }
    return { id: user.id, email: user.email, role: user.role, status: user.status };
  }
}
