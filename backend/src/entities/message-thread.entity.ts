import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Message } from './message.entity';

@Entity('message_threads')
export class MessageThread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'varchar', length: 50, default: 'support' })
  type: string; // support | booking_notification

  @Column({ type: 'varchar', length: 500, nullable: true })
  subject: string | null;

  @Column({ type: 'uuid', nullable: true })
  bookingId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  readBySupportAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Customer)
  @JoinColumn()
  customer: Customer;

  @OneToMany(() => Message, (m) => m.thread)
  messages: Message[];
}
