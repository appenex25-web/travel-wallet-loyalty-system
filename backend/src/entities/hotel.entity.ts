import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/** Room type stored in Hotel.roomTypes jsonb: full in-depth or legacy { name, priceDelta }. */
export interface HotelRoomTypeJson {
  name: string;
  description?: string;
  size?: string;
  amenities?: string[];
  pricePerNight?: number;
  priceDelta?: number;
  imageUrls?: string[];
}

@Entity('hotels')
export class Hotel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  imageUrl: string | null;

  /** Multiple images for slideshow (URLs or paths) */
  @Column({ type: 'jsonb', nullable: true })
  imageUrls: string[] | null;

  /**
   * Room types: each has name, description, size, amenities, pricePerNight, optional imageUrls.
   * Legacy: { name, priceDelta } still supported for price resolution.
   */
  @Column({ type: 'jsonb', nullable: true })
  roomTypes: HotelRoomTypeJson[] | null;

  /** Fallback price per night when room types lack pricePerNight (legacy) */
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  pricePerNight: number | null;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;
}
