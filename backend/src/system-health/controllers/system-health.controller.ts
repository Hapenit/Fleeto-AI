import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemHealthService } from '../services/system-health.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('api/admin/system-health')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class SystemHealthController {
  constructor(private readonly healthService: SystemHealthService) {}

  @Get()
  getHealth() {
    return this.healthService.checkHealth();
  }
}
