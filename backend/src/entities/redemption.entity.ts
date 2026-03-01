import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Agent } from './agent.entity';
import { Branch } from './branch.entity';

@Entity('redemptions')
export class Redemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  walletAmountUsed: number;

  @Column({ type: 'int', default: 0 })
  pointsUsed: number;

  @Column({ type: 'uuid', nullable: true })
  bookingId: string | null;

  @Column({ type: 'uuid' })
  branchId: string;

  @Column({ type: 'uuid' })
  agentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Customer)
  @JoinColumn()
  customer: Customer;

  @ManyToOne(() => Agent)
  @JoinColumn()
  agent: Agent;

  @ManyToOne(() => Branch)
  @JoinColumn()
  branch: Branch;
}
