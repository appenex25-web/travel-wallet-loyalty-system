import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel, HotelRoomTypeJson } from '../entities/hotel.entity';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel)
    private hotelRepo: Repository<Hotel>,
  ) {}

  async findAll(): Promise<Hotel[]> {
    return this.hotelRepo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<Hotel> {
    const hotel = await this.hotelRepo.findOne({ where: { id } });
    if (!hotel) throw new NotFoundException('Hotel not found');
    return hotel;
  }

  async create(dto: {
    name: string;
    description?: string;
    location?: string;
    imageUrl?: string;
    imageUrls?: string[];
    roomTypes?: HotelRoomTypeJson[];
    pricePerNight?: number;
    currency?: string;
  }): Promise<Hotel> {
    const hotel = this.hotelRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      location: dto.location ?? null,
      imageUrl: dto.imageUrl ?? null,
      imageUrls: dto.imageUrls ?? null,
      roomTypes: dto.roomTypes ?? null,
      pricePerNight: dto.pricePerNight ?? null,
      currency: dto.currency ?? 'USD',
    });
    return this.hotelRepo.save(hotel);
  }

  async update(
    id: string,
    dto: Partial<{
      name: string;
      description: string;
      location: string;
      imageUrl: string;
      imageUrls: string[];
      roomTypes: HotelRoomTypeJson[];
      pricePerNight: number;
      currency: string;
    }>,
  ): Promise<Hotel> {
    await this.findById(id);
    await this.hotelRepo.update(id, dto as Record<string, unknown>);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.hotelRepo.delete(id);
  }
}
