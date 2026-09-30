import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginSchema, ChangePasswordSchema } from './dto/auth.dto.js';
import type { LoginDto, ChangePasswordDto } from './dto/auth.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { Request, Response } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body(new ZodValidationPipe(LoginSchema)) loginDto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto, req);
    
    res.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { refreshToken: _, ...data } = result.data;
    
    return { success: true, data };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    const result = await this.authService.logout((req.user as any).id, refreshToken, req);
    
    res.clearCookie('refreshToken');
    return result;
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    const tokens = await this.authService.refreshTokens(refreshToken);
    
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      data: { accessToken: tokens.accessToken }
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    return {
      success: true,
      data: req.user,
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: Request, @Body(new ZodValidationPipe(ChangePasswordSchema)) dto: ChangePasswordDto) {
    return this.authService.changePassword((req.user as any).id, dto, req);
  }
}
