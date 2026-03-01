import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { PointsService } from './points.service';
import { CustomersService } from '../customers/customers.service';

@Controller('points')
export class PointsController {
  constructor(
    private pointsService: PointsService,
    private customersService: CustomersService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async me(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.pointsService.getPoints(customer.id);
  }

  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async meHistory(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.pointsService.getHistory(customer.id);
  }

  @Get('offers/active')
  @UseGuards(JwtAuthGuard)
  async activeOffers() {
    return this.pointsService.getActiveOffers();
  }
}
