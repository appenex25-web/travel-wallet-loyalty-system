import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { WalletService } from './wallet.service';
import { CustomersService } from '../customers/customers.service';

@Controller('wallet')
export class WalletController {
  constructor(
    private walletService: WalletService,
    private customersService: CustomersService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async meBalance(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.walletService.getBalance(customer.id);
  }

  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async meHistory(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.walletService.getHistory(customer.id);
  }

  @Get(':customerId')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async getBalance(@Param('customerId') customerId: string) {
    return this.walletService.getBalance(customerId);
  }

  @Post(':customerId/topup')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async topUp(
    @Param('customerId') customerId: string,
    @Body() body: { amount: number; source?: string; reference?: string },
  ) {
    return this.walletService.topUp(
      customerId,
      body.amount,
      body.source || 'cash',
      body.reference,
    );
  }
}
