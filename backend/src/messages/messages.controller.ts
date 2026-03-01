import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { MessagesService } from './messages.service';
import { CustomersService } from '../customers/customers.service';

@Controller('messages')
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private customersService: CustomersService,
  ) {}

  @Get('threads/me')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async myThreads(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.messagesService.findThreadsForCustomer(customer.id);
  }

  @Get('threads/:id/messages')
  @UseGuards(JwtAuthGuard)
  async getThreadMessages(@Param('id') id: string, @CurrentUser() user: User) {
    const customer = user.role === 'customer' ? await this.customersService.findByUserId(user.id) : null;
    const thread = await this.messagesService.findThreadById(id, customer?.id);
    if (!customer) await this.messagesService.markThreadReadBySupport(id);
    return thread;
  }

  @Post('threads')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async createThread(
    @CurrentUser() user: User,
    @Body() body: { type?: string; subject?: string; bookingId?: string },
  ) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.messagesService.createThread(customer.id, body);
  }

  @Post('threads/:id/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Param('id') id: string,
    @Body() body: { body: string },
    @CurrentUser() user: User,
  ) {
    const customer = user.role === 'customer' ? await this.customersService.findByUserId(user.id) : null;
    const sender = customer ? 'customer' : 'support';
    return this.messagesService.addMessage(id, sender, body.body, customer?.id);
  }

  @Get('threads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'super_admin')
  async listThreads(@Query('customerId') customerId?: string, @Query('read') readFilter?: string) {
    const filter = readFilter === 'true' ? 'read' : readFilter === 'false' ? 'unread' : undefined;
    return this.messagesService.findThreadsForAdmin(customerId, filter);
  }
}
