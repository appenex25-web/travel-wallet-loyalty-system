import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FlightsService } from './flights.service';

@Controller('flights')
export class FlightsController {
  constructor(private flightsService: FlightsService) {}

  @Get()
  async list() {
    return this.flightsService.findAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.flightsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'agent')
  async create(
    @Body()
    body: {
      origin: string;
      destination: string;
      flightNumber?: string;
      departureAt?: string;
      price: number;
      currency?: string;
    },
  ) {
    return this.flightsService.create({
      ...body,
      departureAt: body.departureAt ? new Date(body.departureAt) : undefined,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin', 'agent')
  async update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      origin: string;
      destination: string;
      flightNumber: string;
      departureAt: string;
      price: number;
      currency: string;
    }>,
  ) {
    return this.flightsService.update(id, {
      ...body,
      departureAt: body.departureAt != null ? new Date(body.departureAt) : undefined,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  async remove(@Param('id') id: string) {
    await this.flightsService.remove(id);
  }
}
