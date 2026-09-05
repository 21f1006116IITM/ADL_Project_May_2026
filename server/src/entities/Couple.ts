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
  name!: string;

  @Column()
  partner_name!: string;

  // --- Mandatory to provide, always visible to everyone ---

  @Column()
  location!: string;

  @Column({ type: "simple-array" })
  interests!: string[];

  @Column({ type: "simple-array" })
  languages_spoken!: string[];

  // --- Mandatory to provide, but locked until a connection is accepted ---
  // (contact info — required at signup so it exists, but not shown until trust is established)

  @Column()
  phone_number!: string;

  // --- Optional, also locked until a connection is accepted ---

  @Column({ type: "text", nullable: true })
  bio?: string;

  @Column({ nullable: true })
  photo_url?: string;

  @Column({ type: "simple-array", nullable: true })
  favourite_movies?: string[];

  @Column({ type: "simple-array", nullable: true })
  favourite_books?: string[];

  @Column({ type: "simple-array", nullable: true })
  favourite_cuisine?: string[];

  @Column({ type: "simple-array", nullable: true })
  favourite_music_genres?: string[];

  @Column({ type: "simple-array", nullable: true })
  pets?: string[];

  @Column({ type: "text", nullable: true })
  ideal_weekend_activity?: string;

  @Column({ default: false })
  verified!: boolean;
}
