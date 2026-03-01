import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name: string; phone?: string },
  ) {
    return this.authService.registerCustomer(
      body.email,
      body.password,
      body.name,
      body.phone,
    );
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: { user: User }) {
    return this.authService.login(req.user);
  }

  @Post('agent/login')
  @UseGuards(LocalAuthGuard)
  async agentLogin(@Req() req: { user: User }) {
    const u = req.user;
    if (u.role !== 'agent' && u.role !== 'admin' && u.role !== 'super_admin') {
      throw new (await import('@nestjs/common')).ForbiddenException('Agent or admin access required');
    }
    return this.authService.login(u);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: { user: { sub: string } },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.sub,
      body.currentPassword,
      body.newPassword,
    );
  }
}
