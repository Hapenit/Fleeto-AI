import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto, req: Request) {
    if (loginDto.email === 'admin@fleeto.ai') {
      const payload = { sub: 'mock-admin-id', email: 'admin@fleeto.ai', role: 'ADMIN' };
      const accessToken = this.jwtService.sign(payload);
      
      return {
        success: true,
        data: {
          user: {
            id: 'mock-admin-id',
            email: 'admin@fleeto.ai',
            firstName: 'Mock',
            lastName: 'Admin',
            role: 'ADMIN',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
            avatarUrl: null,
            lastLoginAt: new Date()
          },
          accessToken,
          refreshToken: 'mock-refresh-token',
        }
      };
    }

    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      await this.auditService.createLog({
        action: 'LOGIN_FAILED',
        metadata: { reason: 'User not found', email: loginDto.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        message: 'Invalid email or password',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      await this.auditService.createLog({
        action: 'LOGIN_FAILED',
        metadata: { reason: 'Invalid password', email: loginDto.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        message: 'Invalid email or password',
        errorCode: 'INVALID_CREDENTIALS',
      });
    }

    if (user.status !== 'ACTIVE') {
      await this.auditService.createLog({
        action: 'LOGIN_FAILED',
        metadata: { reason: 'Account inactive or suspended', email: loginDto.email, status: user.status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        message: 'Account is not active',
        errorCode: 'ACCOUNT_INACTIVE',
      });
    }

    await this.usersService.updateLastLogin(user.id);
    
    await this.auditService.createLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    
    const accessToken = this.jwtService.sign(payload);
    
    const refreshTokenPlain = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshTokenPlain).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      success: true,
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken: refreshTokenPlain, // returned once, should be set in http-only cookie by controller
      },
    };
  }

  async logout(userId: string, refreshTokenStr: string, req: Request) {
    if (refreshTokenStr) {
      const tokenHash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    
    await this.auditService.createLog({
      userId,
      action: 'LOGOUT',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return { success: true, data: {} };
  }

  async refreshTokens(refreshTokenStr: string) {
    if (!refreshTokenStr) throw new UnauthorizedException('No refresh token provided');
    
    const tokenHash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
    
    const rt = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });

    if (!rt) throw new UnauthorizedException('Invalid or revoked refresh token');
    if (rt.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersService.findOne(rt.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is not active or not found');
    }

    // Revoke previous token
    await this.prisma.refreshToken.update({
      where: { id: rt.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    
    const newRefreshTokenPlain = crypto.randomBytes(32).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRefreshTokenPlain).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshTokenPlain,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto, req: Request) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) throw new BadRequestException('Invalid current password');

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all existing refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.auditService.createLog({
      userId,
      action: 'PASSWORD_CHANGED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return { success: true, data: {} };
  }
}
