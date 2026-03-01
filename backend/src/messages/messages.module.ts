import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageThread } from '../entities/message-thread.entity';
import { Message } from '../entities/message.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageThread, Message]),
    CustomersModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
