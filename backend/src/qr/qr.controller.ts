import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { QrService } from './qr.service';
import { CustomersService } from '../customers/customers.service';
import { WalletService } from '../wallet/wallet.service';
import { PointsService } from '../points/points.service';

@Controller('qr')
export class QrController {
  constructor(
    private qrService: QrService,
    private customersService: CustomersService,
    private walletService: WalletService,
    private pointsService: PointsService,
  ) {}

  @Post('session')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async createSession(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    const token = await this.qrService.createSession(customer.id);
    return { token, expiresIn: 60 };
  }

  @Get('session/:token')
  async resolveSession(@Param('token') token: string) {
    const customerId = this.qrService.resolveSession(token);
    if (!customerId) return { customer: null };
    const customer = await this.customersService.findById(customerId);
    const [balance, points] = await Promise.all([
      this.walletService.getBalance(customerId),
      this.pointsService.getPoints(customerId),
    ]);
    return {
      customer: { id: customer.id, name: customer.name, tier: customer.tier },
      balance: balance.balance,
      points,
    };
  }
}
