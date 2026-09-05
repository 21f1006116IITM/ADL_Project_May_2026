import { Router, Request, Response } from "express";
import { Between, ILike } from "typeorm";
import { AppDataSource } from "../data-source";
import { Listing } from "../entities/Listing";
import { Booking } from "../entities/Booking";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

// Create a Listing — Organizer only
router.post("/", authenticate, authorize("organizer"), async (req: Request, res: Response) => {
  const { title, description, event_date, category, capacity, image_url, location } = req.body;

  if (!title || !description || !event_date || !category || !capacity || !location) {
    return res.status(400).json({ error: "title, description, event_date, category, capacity, and location are required" });
  }

  if (!["event", "activity"].includes(category)) {
    return res.status(400).json({ error: "category must be 'event' or 'activity'" });
  }

  if (new Date(event_date) <= new Date()) {
    return res.status(400).json({ error: "event_date must be in the future" });
  }

  const listingRepo = AppDataSource.getRepository(Listing);

  const listing = listingRepo.create({
    title,
    description,
    event_date,
    category,
    capacity,
    image_url,
    location,
    organizer: { id: req.user!.sub },
  });

  await listingRepo.save(listing);

  return res.status(201).json(listing);
});

// Browse/search Listings — Couple and Admin, with filters
router.get("/", authenticate, authorize("couple", "admin"), async (req: Request, res: Response) => {
  const { category, location, dateFrom, dateTo, page = "1", limit = "10", sortBy = "event_date" } = req.query;

  const listingRepo = AppDataSource.getRepository(Listing);

  const where: Record<string, unknown> = {};

  if (category) where.category = category;
  if (location) where.location = ILike(`%${location}%`);
  if (dateFrom && dateTo) {
    where.event_date = Between(new Date(dateFrom as string), new Date(dateTo as string));
  }

  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.max(1, parseInt(limit as string));

  const [listings, total] = await listingRepo.findAndCount({
    where,
    order: { [sortBy as string]: "ASC" },
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
    relations: { organizer: true },
  });

  return res.json({
    data: listings,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

// Get the logged-in Organizer's own Listings
router.get("/mine", authenticate, authorize("organizer"), async (req: Request, res: Response) => {
  const listingRepo = AppDataSource.getRepository(Listing);
  const listings = await listingRepo.find({
    where: { organizer: { id: req.user!.sub } },
    order: { created_at: "DESC" },
  });
  return res.json(listings);
});

// Get a single Listing by id
router.get("/:id", authenticate, authorize("couple", "admin", "organizer"), async (req: Request, res: Response) => {
  const listingRepo = AppDataSource.getRepository(Listing);
  const listing = await listingRepo.findOne({
    where: { id: req.params.id as string },
    relations: { organizer: true },
  });

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  return res.json(listing);
});

// Edit a Listing — owning Organizer or Admin
router.put("/:id", authenticate, authorize("organizer", "admin"), async (req: Request, res: Response) => {
  const listingRepo = AppDataSource.getRepository(Listing);
  const listing = await listingRepo.findOne({
    where: { id: req.params.id as string },
    relations: { organizer: true },
  });

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  if (req.user!.role === "organizer" && listing.organizer.id !== req.user!.sub) {
    return res.status(403).json({ error: "You can only edit your own Listings" });
  }

  const { title, description, event_date, category, capacity, image_url, location } = req.body;

  Object.assign(listing, {
    ...(title && { title }),
    ...(description && { description }),
    ...(event_date && { event_date }),
    ...(category && { category }),
    ...(capacity && { capacity }),
    ...(image_url && { image_url }),
    ...(location && { location }),
  });

  await listingRepo.save(listing);

  return res.json(listing);
});

// Delete/unpublish a Listing — owning Organizer or Admin
router.delete("/:id", authenticate, authorize("organizer", "admin"), async (req: Request, res: Response) => {
  const listingRepo = AppDataSource.getRepository(Listing);
  const bookingRepo = AppDataSource.getRepository(Booking);

  const listing = await listingRepo.findOne({
    where: { id: req.params.id as string },
    relations: { organizer: true },
  });

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  if (req.user!.role === "organizer" && listing.organizer.id !== req.user!.sub) {
    return res.status(403).json({ error: "You can only delete your own Listings" });
  }

  const anyBookingCount = await bookingRepo.count({
    where: { listing: { id: listing.id } },
  });

  if (anyBookingCount > 0) {
    return res.status(409).json({
      error: `This Listing has ${anyBookingCount} booking(s) on record (including any cancelled ones) and cannot be deleted, since booking history must be preserved. Ask an Admin if it needs to be unpublished instead.`,
    });
  }

  try {
    await listingRepo.remove(listing);
    return res.status(204).send();
  } catch (err) {
    return res.status(409).json({ error: "This Listing could not be deleted because other records still reference it." });
  }
});

export default router;
