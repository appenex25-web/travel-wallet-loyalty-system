import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flight } from '../entities/flight.entity';

@Injectable()
export class FlightsService {
  constructor(
    @InjectRepository(Flight)
    private flightRepo: Repository<Flight>,
  ) {}

  async findAll(): Promise<Flight[]> {
    return this.flightRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Flight> {
    const flight = await this.flightRepo.findOne({ where: { id } });
    if (!flight) throw new NotFoundException('Flight not found');
    return flight;
  }

  async create(dto: {
    origin: string;
    destination: string;
    flightNumber?: string;
    departureAt?: Date;
    price: number;
    currency?: string;
  }): Promise<Flight> {
    const flight = this.flightRepo.create({
      origin: dto.origin,
      destination: dto.destination,
      flightNumber: dto.flightNumber ?? null,
      departureAt: dto.departureAt ?? null,
      price: dto.price,
      currency: dto.currency ?? 'USD',
    });
    return this.flightRepo.save(flight);
  }

  async update(
    id: string,
    dto: Partial<{ origin: string; destination: string; flightNumber: string; departureAt: Date; price: number; currency: string }>,
  ): Promise<Flight> {
    await this.findById(id);
    await this.flightRepo.update(id, dto as Record<string, unknown>);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.flightRepo.delete(id);
  }
}
