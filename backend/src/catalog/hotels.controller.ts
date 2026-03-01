import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { HotelsService } from './hotels.service';

@Controller('hotels')
export class HotelsController {
  constructor(private hotelsService: HotelsService) {}

  @Get()
  async list() {
    return this.hotelsService.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.hotelsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'agent')
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      location?: string;
      imageUrl?: string;
      imageUrls?: string[];
      roomTypes?: { name: string; description?: string; size?: string; amenities?: string[]; pricePerNight?: number; priceDelta?: number; imageUrls?: string[] }[];
      pricePerNight?: number;
      currency?: string;
    },
  ) {
    return this.hotelsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'agent')
  async update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      description: string;
      location: string;
      imageUrl: string;
      imageUrls: string[];
      roomTypes: { name: string; description?: string; size?: string; amenities?: string[]; pricePerNight?: number; priceDelta?: number; imageUrls?: string[] }[];
      pricePerNight: number;
      currency: string;
    }>,
  ) {
    return this.hotelsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async remove(@Param('id') id: string) {
    await this.hotelsService.remove(id);
  }
}
