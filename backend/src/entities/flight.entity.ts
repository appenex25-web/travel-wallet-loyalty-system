import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('flights')
export class Flight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  origin: string;

  @Column({ type: 'varchar', length: 100 })
  destination: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  flightNumber: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  departureAt: Date | null;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;
}
