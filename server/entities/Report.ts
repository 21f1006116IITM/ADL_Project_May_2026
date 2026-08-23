import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "./User";
import { Couple } from "./Couple";
import { Listing } from "./Listing";

@Entity()
export class Report {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "reporter_id" })
  reporter!: User;

  @ManyToOne(() => Couple, { nullable: true })
  @JoinColumn({ name: "reported_couple_id" })
  reported_couple?: Couple;

  @ManyToOne(() => Listing, { nullable: true })
  @JoinColumn({ name: "reported_listing_id" })
  reported_listing?: Listing;

  @Column({ type: "text" })
  reason!: string;

  @Column({ type: "enum", enum: ["open", "reviewed", "resolved"] })
  status!: "open" | "reviewed" | "resolved";

  @CreateDateColumn()
  created_at!: Date;
}