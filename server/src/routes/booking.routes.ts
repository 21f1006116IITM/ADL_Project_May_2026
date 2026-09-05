import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Booking } from "../entities/Booking";
import { Couple } from "../entities/Couple";
import { Listing } from "../entities/Listing";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

// Create a Booking — Couple only, enforces capacity
router.post("/", authenticate, authorize("couple"), async (req: Request, res: Response) => {
  const { listing_id } = req.body;

  if (!listing_id) {
    return res.status(400).json({ error: "listing_id is required" });
  }

  const coupleRepo = AppDataSource.getRepository(Couple);
  const listingRepo = AppDataSource.getRepository(Listing);
  const bookingRepo = AppDataSource.getRepository(Booking);

  const couple = await coupleRepo.findOne({ where: { user: { id: req.user!.sub } } });
  if (!couple) {
    return res.status(404).json({ error: "Couple profile not found for this account" });
  }

  const listing = await listingRepo.findOne({ where: { id: listing_id } });
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  if (new Date(listing.event_date) <= new Date()) {
    return res.status(400).json({ error: "This Listing has already passed and is no longer bookable" });
  }

  const existing = await bookingRepo.findOne({
    where: { couple: { id: couple.id }, listing: { id: listing.id } },
  });
  if (existing && existing.status !== "cancelled") {
    return res.status(409).json({ error: "You already have a booking for this Listing" });
  }

  const confirmedCount = await bookingRepo.count({
    where: { listing: { id: listing.id }, status: "confirmed" },
  });
  if (confirmedCount >= listing.capacity) {
    return res.status(409).json({ error: "This Listing is at full capacity" });
  }

  const booking = bookingRepo.create({
    couple: { id: couple.id },
    listing: { id: listing.id },
    status: "confirmed",
  });

  await bookingRepo.save(booking);

  return res.status(201).json(booking);
});

// View own Bookings — Couple only
router.get("/my", authenticate, authorize("couple"), async (req: Request, res: Response) => {
  const coupleRepo = AppDataSource.getRepository(Couple);
  const bookingRepo = AppDataSource.getRepository(Booking);

  const couple = await coupleRepo.findOne({ where: { user: { id: req.user!.sub } } });
  if (!couple) {
    return res.status(404).json({ error: "Couple profile not found for this account" });
  }

  const bookings = await bookingRepo.find({
    where: { couple: { id: couple.id } },
    relations: { listing: true },
    order: { created_at: "DESC" },
  });

  return res.json(bookings);
});

// View Bookings on a specific Listing — owning Organizer or Admin
router.get("/listing/:listingId", authenticate, authorize("organizer", "admin"), async (req: Request, res: Response) => {
  const listingRepo = AppDataSource.getRepository(Listing);
  const bookingRepo = AppDataSource.getRepository(Booking);

  const listing = await listingRepo.findOne({
    where: { id: req.params.listingId as string },
    relations: { organizer: true },
  });

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  if (req.user!.role === "organizer" && listing.organizer.id !== req.user!.sub) {
    return res.status(403).json({ error: "You can only view bookings on your own Listings" });
  }

  const bookings = await bookingRepo.find({
    where: { listing: { id: listing.id } },
    relations: { couple: true },
    order: { created_at: "DESC" },
  });

  return res.json(bookings);
});

// Cancel own Booking — Couple only
router.patch("/:id/cancel", authenticate, authorize("couple"), async (req: Request, res: Response) => {
  const coupleRepo = AppDataSource.getRepository(Couple);
  const bookingRepo = AppDataSource.getRepository(Booking);

  const couple = await coupleRepo.findOne({ where: { user: { id: req.user!.sub } } });
  if (!couple) {
    return res.status(404).json({ error: "Couple profile not found for this account" });
  }

  const booking = await bookingRepo.findOne({
    where: { id: req.params.id as string },
    relations: { couple: true },
  });

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  if (booking.couple.id !== couple.id) {
    return res.status(403).json({ error: "You can only cancel your own Bookings" });
  }

  booking.status = "cancelled";
  await bookingRepo.save(booking);

  return res.json(booking);
});

export default router;