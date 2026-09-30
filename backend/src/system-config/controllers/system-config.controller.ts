import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemConfigService } from '../services/system-config.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('api/admin/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get('voice')
  getVoiceConfig() {
    return this.configService.getVoiceConfig();
  }

  @Get('telephony')
  getTelephonyConfig() {
    return this.configService.getTelephonyConfig();
  }

  @Get('calling-policies')
  getCallingPolicies() {
    return this.configService.getCallingPolicies();
  }

  @Get('settings')
  getSettings() {
    return this.configService.getSettings();
  }
}
