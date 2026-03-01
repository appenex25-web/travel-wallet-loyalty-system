import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TripCampaign } from './trip-campaign.entity';

@Entity('campaign_add_ons')
export class CampaignAddOn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** Price to add (positive) or subtract (negative) from base */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  priceDelta: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @ManyToOne(() => TripCampaign, (c) => c.addOns, { onDelete: 'CASCADE' })
  @JoinColumn()
  campaign: TripCampaign;
}
