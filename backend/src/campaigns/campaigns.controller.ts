import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { CampaignsService } from './campaigns.service';
import { CustomersService } from '../customers/customers.service';

@Controller('campaigns')
export class CampaignsController {
  constructor(
    private campaignsService: CampaignsService,
    private customersService: CustomersService,
  ) {}

  @Get()
  async list() {
    return this.campaignsService.findAll(true);
  }

  @Get('saved/me')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async mySaved(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.campaignsService.getSavedCampaigns(customer.id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.campaignsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'agent')
  async create(
    @Body()
    body: {
      title: string;
      shortDescription?: string;
      description?: string;
      imageUrls?: string[];
      basePrice: number;
      currency?: string;
      status?: string;
      startAt?: string;
      endAt?: string;
      addOns?: { name: string; priceDelta: number; currency?: string }[];
    },
  ) {
    return this.campaignsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'agent')
  async update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      title: string;
      shortDescription: string;
      description: string;
      imageUrls: string[];
      basePrice: number;
      currency: string;
      status: string;
      startAt: string;
      endAt: string;
      addOns: { name: string; priceDelta: number; currency?: string }[];
    }>,
  ) {
    return this.campaignsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async remove(@Param('id') id: string) {
    await this.campaignsService.remove(id);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async save(@Param('id') id: string, @CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.campaignsService.saveCampaign(customer.id, id);
  }

  @Delete(':id/save')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async unsave(@Param('id') id: string, @CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.campaignsService.unsaveCampaign(customer.id, id);
  }
}
