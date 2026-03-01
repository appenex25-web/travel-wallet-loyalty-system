import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MessageThread } from './message-thread.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  threadId: string;

  @Column({ type: 'varchar', length: 50 })
  sender: string; // customer | support

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => MessageThread, (t) => t.messages, { onDelete: 'CASCADE' })
  @JoinColumn()
  thread: MessageThread;
}
