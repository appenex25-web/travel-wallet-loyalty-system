import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async me(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    const { pinHash: _, ...safe } = customer;
    return safe;
  }

  @Get('me/has-pin')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async hasPin(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return { hasPin: await this.customersService.hasPin(customer.id) };
  }

  @Post('me/pin')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async setPin(
    @CurrentUser() user: User,
    @Body() body: { pin: string; confirmPin?: string; oldPin?: string },
  ) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.customersService.setPin(customer.id, body.pin, body.confirmPin, body.oldPin);
  }

  @Get('me/qr-payload')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async getMyQrPayload(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return { payload: `tw:cust:${customer.id}` };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async getById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Get(':id/qr-payload')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async getQrPayload(@Param('id') id: string) {
    await this.customersService.findById(id);
    return { payload: `tw:cust:${id}` };
  }

  @Post(':id/nfc-identifiers')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async addNfc(@Param('id') id: string, @Body() body: { tagUid: string; label?: string }) {
    return this.customersService.addNfcIdentifier(id, body.tagUid, body.label);
  }
}
