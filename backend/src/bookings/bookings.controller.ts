import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { BookingsService } from './bookings.service';
import { CustomersService } from '../customers/customers.service';

@Controller('bookings')
export class BookingsController {
  constructor(
    private bookingsService: BookingsService,
    private customersService: CustomersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin')
  async create(
    @Body()
    body: {
      customerId: string;
      totalAmount: number;
      currency?: string;
      externalReference?: string;
      bookingType?: string;
      title?: string;
      hotelId?: string;
      flightId?: string;
    },
  ) {
    return this.bookingsService.create(body.customerId, body.totalAmount, body.currency || 'USD', {
      externalReference: body.externalReference,
      bookingType: body.bookingType,
      title: body.title,
      hotelId: body.hotelId,
      flightId: body.flightId,
    });
  }

  @Post('from-catalog')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async createFromCatalog(
    @CurrentUser() user: User,
    @Body() body: {
      hotelId?: string;
      flightId?: string;
      pin: string;
      checkInAt?: string;
      checkOutAt?: string;
      roomType?: string;
    },
  ) {
    const customer = await this.customersService.findByUserId(user.id);
    const hasPin = await this.customersService.hasPin(customer.id);
    if (!hasPin) throw new (await import('@nestjs/common')).BadRequestException('Set your 6-digit security PIN in Account settings first');
    const ok = await this.customersService.verifyPin(customer.id, body.pin);
    if (!ok) throw new (await import('@nestjs/common')).UnauthorizedException('Invalid PIN');
    return this.bookingsService.createFromCatalog(customer.id, body.hotelId, body.flightId, {
      checkInAt: body.checkInAt,
      checkOutAt: body.checkOutAt,
      roomType: body.roomType,
    });
  }

  @Post('from-campaign')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async createFromCampaign(
    @CurrentUser() user: User,
    @Body() body: { campaignId: string; startDate?: string; endDate?: string; addOnIds?: string[]; pin: string },
  ) {
    const customer = await this.customersService.findByUserId(user.id);
    const hasPin = await this.customersService.hasPin(customer.id);
    if (!hasPin) throw new (await import('@nestjs/common')).BadRequestException('Set your 6-digit security PIN in Account settings first');
    const ok = await this.customersService.verifyPin(customer.id, body.pin);
    if (!ok) throw new (await import('@nestjs/common')).UnauthorizedException('Invalid PIN');
    return this.bookingsService.createFromCampaign(customer.id, body.campaignId, {
      startDate: body.startDate,
      endDate: body.endDate,
      addOnIds: body.addOnIds,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'super_admin')
  async list(
    @Query('customerId') customerId?: string,
    @Query('bookingType') bookingType?: string,
  ) {
    return this.bookingsService.listAll(customerId, bookingType);
  }

  @Get('customer/me')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async myBookings(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.bookingsService.listByCustomer(customer.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('agent', 'admin', 'super_admin', 'customer')
  async getById(@Param('id') id: string, @CurrentUser() user: User) {
    const booking = await this.bookingsService.findById(id);
    if (user.role === 'customer') {
      const customer = await this.customersService.findByUserId(user.id);
      if (booking.customerId !== customer.id) throw new (await import('@nestjs/common')).ForbiddenException();
    }
    return booking;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'super_admin')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; denialReason?: string },
  ) {
    return this.bookingsService.updateStatus(id, body.status, body.denialReason);
  }

  @Post(':id/apply-wallet')
  @UseGuards(JwtAuthGuard)
  @Roles('customer', 'agent', 'admin', 'super_admin')
  async applyWallet(@Param('id') id: string, @Body() body: { amount: number; pin?: string }, @CurrentUser() user: User) {
    const booking = await this.bookingsService.findById(id);
    if (user.role === 'customer') {
      const customer = await this.customersService.findByUserId(user.id);
      if (booking.customerId !== customer.id) throw new (await import('@nestjs/common')).ForbiddenException();
      const hasPin = await this.customersService.hasPin(customer.id);
      if (!hasPin) throw new (await import('@nestjs/common')).BadRequestException('Set your 6-digit security PIN in Account settings first');
      const ok = await this.customersService.verifyPin(customer.id, body.pin ?? '');
      if (!ok) throw new (await import('@nestjs/common')).UnauthorizedException('Invalid PIN');
    }
    return this.bookingsService.applyWallet(id, body.amount);
  }
}
