import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CampaignsService } from '../campaigns/campaigns.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'agent')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private campaignsService: CampaignsService,
  ) {}

  @Get('dashboard/summary')
  async getSummary() {
    return this.adminService.getDashboardSummary();
  }

  @Get('dashboard/recent-transactions')
  async getRecentTransactions(@Query('limit') limit?: string) {
    const n = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20;
    return this.adminService.getRecentTransactions(isNaN(n) ? 20 : n);
  }

  @Post('customers')
  @Roles('admin', 'super_admin')
  async createCustomer(
    @Body() body: { email: string; password?: string; name: string; phone?: string },
  ) {
    return this.adminService.createCustomer(
      body.email,
      body.password,
      body.name,
      body.phone,
    );
  }

  @Get('customers')
  async listCustomers(@Query('search') search?: string) {
    return this.adminService.listCustomers(search);
  }

  @Post('customers/:id/reset-pin')
  @Roles('admin', 'super_admin')
  async resetCustomerPin(@Param('id') id: string) {
    return this.adminService.resetCustomerPin(id);
  }

  @Get('branches')
  async listBranches() {
    return this.adminService.listBranches();
  }

  @Get('campaigns')
  async listTripCampaigns() {
    return this.campaignsService.findAll(false);
  }

  @Get('offers')
  async listOffers(@Query('activeOnly') activeOnly?: string) {
    return this.adminService.listOffers(activeOnly === 'true');
  }

  @Post('offers')
  @Roles('admin', 'super_admin')
  async createOffer(
    @Body()
    body: {
      name: string;
      description?: string;
      type: string;
      conditions?: Record<string, unknown>;
      startAt: string;
      endAt: string;
      maxRedemptionsPerCustomer?: number;
    },
  ) {
    return this.adminService.createOffer({
      ...body,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
    });
  }

  @Patch('offers/:id')
  @Roles('admin', 'super_admin')
  async updateOffer(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; status?: string; endAt?: string },
  ) {
    const dto: Record<string, unknown> = {};
    if (body.name != null) dto.name = body.name;
    if (body.description != null) dto.description = body.description;
    if (body.status != null) dto.status = body.status;
    if (body.endAt != null) dto.endAt = new Date(body.endAt);
    return this.adminService.updateOffer(id, dto);
  }
}
