import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageThread } from '../entities/message-thread.entity';
import { Message } from '../entities/message.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageThread)
    private threadRepo: Repository<MessageThread>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    private customersService: CustomersService,
  ) {}

  async findThreadsForCustomer(customerId: string): Promise<MessageThread[]> {
    return this.threadRepo.find({
      where: { customerId },
      relations: ['messages'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async findThreadsForAdmin(customerId?: string, filter?: 'read' | 'unread'): Promise<MessageThread[]> {
    const qb = this.threadRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.customer', 'customer')
      .leftJoinAndSelect('customer.user', 'user')
      .leftJoinAndSelect('t.messages', 'messages')
      .orderBy('t.createdAt', 'DESC')
      .take(100);
    if (customerId) qb.andWhere('t.customerId = :customerId', { customerId });
    if (filter === 'read') qb.andWhere('t.readBySupportAt IS NOT NULL');
    if (filter === 'unread') qb.andWhere('t.readBySupportAt IS NULL');
    const threads = await qb.getMany();
    threads.forEach((t) => {
      if (t.messages) t.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
    return threads;
  }

  async findThreadByBookingId(bookingId: string): Promise<MessageThread | null> {
    return this.threadRepo.findOne({
      where: { bookingId },
      relations: ['messages'],
    });
  }

  async markThreadReadBySupport(threadId: string): Promise<void> {
    await this.threadRepo.update(threadId, { readBySupportAt: new Date() });
  }

  async findThreadById(threadId: string, customerId?: string): Promise<MessageThread> {
    const thread = await this.threadRepo.findOne({
      where: { id: threadId },
      relations: ['messages'],
    });
    if (thread?.messages) thread.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (!thread) throw new NotFoundException('Thread not found');
    if (customerId && thread.customerId !== customerId) throw new ForbiddenException();
    return thread;
  }

  async createThread(customerId: string, dto: { type?: string; subject?: string; bookingId?: string }): Promise<MessageThread> {
    await this.customersService.findById(customerId);
    const thread = this.threadRepo.create({
      customerId,
      type: dto.type ?? 'support',
      subject: dto.subject ?? null,
      bookingId: dto.bookingId ?? null,
    });
    return this.threadRepo.save(thread);
  }

  async addMessage(threadId: string, sender: 'customer' | 'support', body: string, customerId?: string): Promise<Message> {
    const thread = await this.findThreadById(threadId, customerId ?? undefined);
    if (sender === 'customer' && thread.customerId !== customerId) throw new ForbiddenException();
    const msg = this.messageRepo.create({ threadId, sender, body });
    const saved = await this.messageRepo.save(msg);
    if (sender === 'support') await this.markThreadReadBySupport(threadId);
    return saved;
  }

  async createBookingNotification(customerId: string, bookingId: string, body: string): Promise<MessageThread> {
    const thread = await this.createThread(customerId, { type: 'booking_notification', subject: 'Booking update', bookingId });
    await this.addMessage(thread.id, 'support', body);
    return this.findThreadById(thread.id);
  }
}
