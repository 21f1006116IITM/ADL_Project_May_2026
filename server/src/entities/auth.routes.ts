import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Couple } from "../entities/Couple";

const router = Router();

router.post("/signup", async (req: Request, res: Response) => {
  const {
    email,
    password,
    role,
    name,
    partner_name,
    location,
    interests,
    languages_spoken,
    favourite_movies,
    favourite_books,
    favourite_cuisine,
    favourite_music_genres,
    pets,
    ideal_weekend_activity,
  } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "email, password, and role are required" });
  }

  if (!["couple", "organizer"].includes(role)) {
    return res.status(400).json({ error: "role must be 'couple' or 'organizer'" });
  }

  if (role === "couple") {
    if (!name || !partner_name || !location) {
      return res.status(400).json({ error: "name, partner_name, and location are required for couple signup" });
    }
    if (!Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ error: "interests is required and must be a non-empty list" });
    }
    if (!Array.isArray(languages_spoken) || languages_spoken.length === 0) {
      return res.status(400).json({ error: "languages_spoken is required and must be a non-empty list" });
    }
  }

  const userRepo = AppDataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const user = userRepo.create({ email, password_hash, role });
  await userRepo.save(user);

  if (role === "couple") {
    const coupleRepo = AppDataSource.getRepository(Couple);
    const couple = coupleRepo.create({
      user,
      name,
      partner_name,
      location,
      interests,
      languages_spoken,
      // Optional fields — stored as-is if provided, otherwise left undefined
      ...(Array.isArray(favourite_movies) && { favourite_movies }),
      ...(Array.isArray(favourite_books) && { favourite_books }),
      ...(Array.isArray(favourite_cuisine) && { favourite_cuisine }),
      ...(Array.isArray(favourite_music_genres) && { favourite_music_genres }),
      ...(Array.isArray(pets) && { pets }),
      ...(ideal_weekend_activity && { ideal_weekend_activity }),
      verified: false,
    });
    await coupleRepo.save(couple);
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

export default router;
