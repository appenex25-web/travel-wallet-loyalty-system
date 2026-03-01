import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { PostsService } from './posts.service';
import { CustomersService } from '../customers/customers.service';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private customersService: CustomersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async create(
    @CurrentUser() user: User,
    @Body() body: { bookingId: string; title?: string; body: string; imageUrls?: string[] },
  ) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.postsService.create(customer.id, body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Roles('customer')
  async myPosts(@CurrentUser() user: User) {
    const customer = await this.customersService.findByUserId(user.id);
    return this.postsService.findMyPosts(customer.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'super_admin')
  async list() {
    return this.postsService.findAll();
  }
}
