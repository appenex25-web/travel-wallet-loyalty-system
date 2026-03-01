import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Agent } from './agent.entity';

export type UserRole = 'customer' | 'agent' | 'admin' | 'super_admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', length: 32 })
  role: UserRole;

  @Column({ default: true })
  active: boolean;

  /** When true, customer must set a new password on next login (e.g. after admin created with default password). */
  @Column({ type: 'boolean', default: false })
  mustChangePassword: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Customer, (c) => c.user)
  customer?: Customer;

  @OneToOne(() => Agent, (a) => a.user)
  agent?: Agent;
}
