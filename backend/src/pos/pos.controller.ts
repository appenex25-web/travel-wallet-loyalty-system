import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { PosService } from './pos.service';
import { QrService } from '../qr/qr.service';

@Controller('pos')
export class PosController {
  constructor(
    private posService: PosService,
    private qrService: QrService,
  ) {}

  @Get('customer/:customerId')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async getCustomerSummary(@Param('customerId') customerId: string) {
    return this.posService.identifyByCustomerId(customerId);
  }

  @Post('identify/nfc')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async identifyNfc(@Body() body: { tagUid: string }) {
    return this.posService.identifyByNfc(body.tagUid);
  }

  @Post('identify/qr')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async identifyQr(@Body() body: { token: string }) {
    const customerId = this.qrService.resolveSession(body.token);
    if (!customerId) return { customer: null, balance: 0, points: 0 };
    return this.posService.identifyByCustomerId(customerId);
  }

  @Get('rewards-rate')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async getRewardsRate() {
    const pointsPerDollar = await this.posService.getPointsPerDollar();
    return { pointsPerDollar };
  }

  @Post('customer/:customerId/purchase')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async createPurchase(
    @Param('customerId') customerId: string,
    @Body() body: { amount: number; reference?: string },
  ) {
    return this.posService.createPurchase(customerId, body.amount ?? 0, body.reference);
  }

  @Post('redemptions')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async createRedemption(
    @CurrentUser() user: User & { agent?: { id: string; branchId: string } },
    @Body() body: { customerId: string; branchId?: string; walletAmount: number; pointsUsed: number; bookingId?: string },
  ) {
    const agent = user.agent;
    if (!agent) throw new (await import('@nestjs/common')).ForbiddenException('Agent profile required');
    const branchId = body.branchId ?? agent.branchId;
    if (!branchId) throw new (await import('@nestjs/common')).BadRequestException('branchId required');
    return this.posService.createRedemption(
      body.customerId,
      agent.id,
      branchId,
      body.walletAmount ?? 0,
      body.pointsUsed ?? 0,
      body.bookingId,
    );
  }
}
