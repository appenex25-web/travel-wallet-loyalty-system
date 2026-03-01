import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CustomersService } from '../customers/customers.service';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    private customersService: CustomersService,
    private bookingsService: BookingsService,
  ) {}

  async create(customerId: string, dto: { bookingId: string; title?: string; body: string; imageUrls?: string[] }): Promise<Post> {
    await this.customersService.findById(customerId);
    const booking = await this.bookingsService.findById(dto.bookingId);
    if (booking.customerId !== customerId) throw new ForbiddenException('Not your booking');
    const existing = await this.postRepo.findOne({ where: { bookingId: dto.bookingId } });
    if (existing) throw new BadRequestException('This booking already has a review');
    const post = this.postRepo.create({
      customerId,
      bookingId: dto.bookingId,
      title: dto.title ?? null,
      body: dto.body,
      imageUrls: dto.imageUrls ?? null,
      status: 'pending',
    });
    return this.postRepo.save(post);
  }

  async findMyPosts(customerId: string): Promise<Post[]> {
    return this.postRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async findAll(): Promise<Post[]> {
    return this.postRepo.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
