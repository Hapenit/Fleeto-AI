import { Controller, Get, UseGuards } from '@nestjs/common';
import { AiConfigService } from '../services/ai-config.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('api/admin/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class AiConfigController {
  constructor(private readonly aiConfigService: AiConfigService) {}

  @Get('providers')
  getProviders() {
    return this.aiConfigService.getProviders();
  }

  @Get('models')
  getModels() {
    return this.aiConfigService.getModels();
  }

  @Get('features')
  getFeatures() {
    return this.aiConfigService.getFeatures();
  }

  @Get('prompts')
  getPrompts() {
    return this.aiConfigService.getPrompts();
  }
}
