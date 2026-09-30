import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: any;
  let prismaService: any;

  beforeEach(async () => {
    usersService = {
      findByEmail: vi.fn(),
      updateLastLogin: vi.fn(),
    };

    prismaService = {
      refreshToken: {
        create: vi.fn(),
      } as any,
    };

    const auditService = {
      createLog: vi.fn(),
    };

    const jwtService = {
      sign: vi.fn().mockReturnValue('token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      await expect(authService.login({ email: 'test@test.com', password: 'password' }, { ip: '127.0.0.1', headers: {} } as any))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should login successfully if credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      usersService.findByEmail!.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        passwordHash,
        status: 'ACTIVE',
        role: 'MARKETING_USER',
      } as any);

      const result = await authService.login({ email: 'test@test.com', password: 'password123' }, { ip: '127.0.0.1', headers: {} } as any);
      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('token');
    });
  });
});
