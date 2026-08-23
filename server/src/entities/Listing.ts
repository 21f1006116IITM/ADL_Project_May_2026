import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Listing {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "organizer_id" })
  organizer!: User;

  @Column()
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "timestamp" })
  event_date!: Date;

  @Column({ type: "enum", enum: ["event", "activity"] })
  category!: "event" | "activity";

  @Column()
  capacity!: number;

  @Column({ nullable: true })
  image_url?: string;

  @Column()
  location!: string;

  @CreateDateColumn()
  created_at!: Date;
}