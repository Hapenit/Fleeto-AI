import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/api/seed')
  async seedAdmin() {
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcrypt');
    const prisma = new PrismaClient();
    const email = 'admin@fleeto.ai';
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: {
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    
    return { success: true, message: 'Admin user seeded: admin@fleeto.ai / password123' };
  }
}
