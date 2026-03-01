import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { CampaignAddOn } from './campaign-addon.entity';

@Entity('trip_campaigns')
export class TripCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  shortDescription: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Up to 3 image URLs for slideshow; stored as JSON array */
  @Column({ type: 'jsonb', nullable: true })
  imageUrls: string[] | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  basePrice: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ default: 'active' })
  status: string; // draft | active | ended

  @Column({ type: 'timestamptz', nullable: true })
  startAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => CampaignAddOn, (a) => a.campaign)
  addOns: CampaignAddOn[];
}
