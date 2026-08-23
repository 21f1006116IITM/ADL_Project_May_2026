import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Couple } from "./Couple";
import { Listing } from "./Listing";

@Entity()
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Couple)
  @JoinColumn({ name: "couple_id" })
  couple!: Couple;

  @ManyToOne(() => Listing)
  @JoinColumn({ name: "listing_id" })
  listing!: Listing;

  @Column({ type: "enum", enum: ["requested", "confirmed", "cancelled", "completed"] })
  status!: "requested" | "confirmed" | "cancelled" | "completed";

  @CreateDateColumn()
  created_at!: Date;
}