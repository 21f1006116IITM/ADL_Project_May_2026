import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Report } from "../entities/Report";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

// File a Report — Couple or Organizer
router.post("/", authenticate, authorize("couple", "organizer"), async (req: Request, res: Response) => {
  const { reported_couple_id, reported_listing_id, reason } = req.body;

  if (!reason || (!reported_couple_id && !reported_listing_id)) {
    return res.status(400).json({ error: "reason and exactly one of reported_couple_id or reported_listing_id are required" });
  }

  if (reported_couple_id && reported_listing_id) {
    return res.status(400).json({ error: "Provide only one of reported_couple_id or reported_listing_id, not both" });
  }

  const reportRepo = AppDataSource.getRepository(Report);

  const report = reportRepo.create({
    reporter: { id: req.user!.sub },
    reason,
    status: "open",
    ...(reported_couple_id && { reported_couple: { id: reported_couple_id } }),
    ...(reported_listing_id && { reported_listing: { id: reported_listing_id } }),
  });

  await reportRepo.save(report);

  return res.status(201).json(report);
});

// List all Reports — Admin only
router.get("/", authenticate, authorize("admin"), async (req: Request, res: Response) => {
  const { status } = req.query;

  const reportRepo = AppDataSource.getRepository(Report);
  const reports = await reportRepo.find({
    where: status ? { status: status as "open" | "reviewed" | "resolved" } : {},
    relations: { reporter: true, reported_couple: true, reported_listing: true },
    select: {
      id: true,
      reason: true,
      status: true,
      created_at: true,
      reporter: { id: true, email: true, role: true },
      reported_couple: { id: true, partner_name: true, location: true },
      reported_listing: { id: true, title: true },
    },
    order: { created_at: "DESC" },
  });

  return res.json(reports);
});

// Update a Report's status — Admin only
router.patch("/:id", authenticate, authorize("admin"), async (req: Request, res: Response) => {
  const { status } = req.body;

  if (!["open", "reviewed", "resolved"].includes(status)) {
    return res.status(400).json({ error: "status must be 'open', 'reviewed', or 'resolved'" });
  }

  const reportRepo = AppDataSource.getRepository(Report);
  const report = await reportRepo.findOne({ where: { id: req.params.id as string } });

  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }

  report.status = status;
  await reportRepo.save(report);

  return res.json(report);
});

export default router;