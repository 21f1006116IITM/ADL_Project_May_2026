import { Router, Request, Response } from "express";
import { ILike } from "typeorm";
import { AppDataSource } from "../data-source";
import { Couple } from "../entities/Couple";
import { ConnectionRequest } from "../entities/ConnectionRequest";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

async function getOwnCouple(userId: string) {
  const coupleRepo = AppDataSource.getRepository(Couple);
  return coupleRepo.findOne({ where: { user: { id: userId } } });
}

const PROFILE_SELECT = {
  id: true,
  name: true,
  partner_name: true,
  location: true,
  interests: true,
  languages_spoken: true,
  verified: true,
  phone_number: true,
  bio: true,
  photo_url: true,
  favourite_movies: true,
  favourite_books: true,
  favourite_cuisine: true,
  favourite_music_genres: true,
  pets: true,
  ideal_weekend_activity: true,
  user: { email: true },
} as const;

const PROFILE_RELATIONS = { user: true } as const;

function shapeProfile(c: any, status: string, fullAccess: boolean) {
  return {
    id: c.id,
    name: c.name,
    partner_name: c.partner_name,
    display_name: `${c.name} & ${c.partner_name}`,
    location: c.location,
    interests: c.interests || [],
    languages_spoken: c.languages_spoken || [],
    verified: c.verified,
    connection_status: status,
    // Contact info and optional fields — only included once the connection is accepted (or it's your own profile)
    ...(fullAccess && {
      email: c.user?.email || null,
      phone_number: c.phone_number,
      bio: c.bio,
      photo_url: c.photo_url,
      favourite_movies: c.favourite_movies || [],
      favourite_books: c.favourite_books || [],
      favourite_cuisine: c.favourite_cuisine || [],
      favourite_music_genres: c.favourite_music_genres || [],
      pets: c.pets || [],
      ideal_weekend_activity: c.ideal_weekend_activity || null,
    }),
  };
}

// Browse other Couples — Couple only, mandatory fields visible to all, optional/contact fields gated
router.get("/", authenticate, authorize("couple"), async (req: Request, res: Response) => {
  const { location, interest } = req.query;

  const me = await getOwnCouple(req.user!.sub);
  if (!me) {
    return res.status(404).json({ error: "Couple profile not found for this account" });
  }

  const coupleRepo = AppDataSource.getRepository(Couple);
  const crRepo = AppDataSource.getRepository(ConnectionRequest);

  const where: Record<string, unknown> = {};
  if (location) where.location = ILike(`%${location}%`);

  const couples = await coupleRepo.find({
    where,
    select: PROFILE_SELECT,
    relations: PROFILE_RELATIONS,
    order: { verified: "DESC" },
  });

  // Pull every connection involving "me" once, instead of querying per-couple
  const myConnections = await crRepo.find({
    where: [{ requester: { id: me.id } }, { target: { id: me.id } }],
    relations: { requester: true, target: true },
  });

  function connectionStatusWith(otherId: string): string {
    const match = myConnections.find(
      (c) => c.requester.id === otherId || c.target.id === otherId
    );
    return match ? match.status : "none";
  }

  const interestFilter = typeof interest === "string" ? interest.trim().toLowerCase() : "";

  const results = couples
    .filter((c) => c.id !== me.id)
    .map((c) => {
      const status = connectionStatusWith(c.id);
      return shapeProfile(c, status, status === "accepted");
    })
    // Hide couples that have blocked, or been blocked by, "me"
    .filter((c) => c.connection_status !== "blocked")
    .filter((c) =>
      interestFilter
        ? c.interests.some((i: string) => i.toLowerCase().includes(interestFilter))
        : true
    );

  return res.json(results);
});

// View a single Couple's profile — Couple only, respects connection-gated visibility
router.get("/:id", authenticate, authorize("couple"), async (req: Request, res: Response) => {
  const me = await getOwnCouple(req.user!.sub);
  if (!me) {
    return res.status(404).json({ error: "Couple profile not found for this account" });
  }

  const coupleRepo = AppDataSource.getRepository(Couple);
  const crRepo = AppDataSource.getRepository(ConnectionRequest);

  const target = await coupleRepo.findOne({
    where: { id: req.params.id as string },
    select: PROFILE_SELECT,
    relations: PROFILE_RELATIONS,
  });

  if (!target) {
    return res.status(404).json({ error: "Couple not found" });
  }

  const isSelf = target.id === me.id;

  const connection = await crRepo.findOne({
    where: [
      { requester: { id: me.id }, target: { id: target.id } },
      { requester: { id: target.id }, target: { id: me.id } },
    ],
  });

  const status = connection ? connection.status : "none";

  if (status === "blocked" && !isSelf) {
    return res.status(403).json({ error: "This profile is not available" });
  }

  const fullAccess = status === "accepted" || isSelf;

  return res.json(shapeProfile(target, isSelf ? "self" : status, fullAccess));
});

export default router;
