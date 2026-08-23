import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Couple } from "./Couple";

@Entity()
export class ConnectionRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Couple)
  @JoinColumn({ name: "requester_couple_id" })
  requester!: Couple;

  @ManyToOne(() => Couple)
  @JoinColumn({ name: "target_couple_id" })
  target!: Couple;

  @Column({ type: "enum", enum: ["pending", "accepted", "rejected", "cancelled", "blocked"] })
  status!: "pending" | "accepted" | "rejected" | "cancelled" | "blocked";

  @CreateDateColumn()
  created_at!: Date;
}