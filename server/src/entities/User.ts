import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({ type: "enum", enum: ["admin", "organizer", "couple"] })
  role!: "admin" | "organizer" | "couple";

  @CreateDateColumn()
  created_at!: Date;
}