import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Couple {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column()
  partner_name!: string;

  @Column({ type: "text", nullable: true })
  bio?: string;

  @Column()
  location!: string;

  @Column({ nullable: true })
  photo_url?: string;

  @Column({ default: false })
  verified!: boolean;
}