import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Branch } from './branch.entity';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  branchId: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => User, (u) => u.agent)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Branch, (b) => b.agents)
  branch: Branch;
}
