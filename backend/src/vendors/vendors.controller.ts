import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { VendorsService } from './vendors.service.js';
import { CreateVendorSchema, UpdateVendorSchema, ChangeVendorStatusSchema, VendorQuerySchema } from './dto/vendor.dto.js';
import type { CreateVendorDto, UpdateVendorDto, ChangeVendorStatusDto, VendorQueryDto } from './dto/vendor.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@Controller('api/vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(CreateVendorSchema)) createVendorDto: CreateVendorDto, @Req() req: any) {
    const result = await this.vendorsService.create(createVendorDto, req.user.id, req.ip, req.headers['user-agent']);
    return { success: true, data: result };
  }

  @Get()
  async findAll(@Query(new ZodValidationPipe(VendorQuerySchema)) query: VendorQueryDto) {
    const result = await this.vendorsService.findAll(query);
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.vendorsService.findOne(id);
    return { success: true, data: result };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body(new ZodValidationPipe(UpdateVendorSchema)) updateVendorDto: UpdateVendorDto, @Req() req: any) {
    const result = await this.vendorsService.update(id, updateVendorDto, req.user.id, req.ip, req.headers['user-agent']);
    return { success: true, data: result };
  }

  @Post(':id/status')
  async changeStatus(@Param('id') id: string, @Body(new ZodValidationPipe(ChangeVendorStatusSchema)) changeVendorStatusDto: ChangeVendorStatusDto, @Req() req: any) {
    const result = await this.vendorsService.changeStatus(id, changeVendorStatusDto, req.user.id, req.user.role, req.ip, req.headers['user-agent']);
    return { success: true, data: result };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.vendorsService.remove(id, req.user.id, req.user.role, req.ip, req.headers['user-agent']);
    return { success: true, data: result };
  }
}
