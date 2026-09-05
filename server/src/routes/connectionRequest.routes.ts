import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ConnectionRequest } from "../entities/ConnectionRequest";
import { Couple } from "../entities/Couple";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

async function getOwnCouple(userId: string) {
  const coupleRepo = AppDataSource.getRepository(Couple);
  return coupleRepo.findOne({ where: { user: { id: userId } } });
}

// Send a ConnectionRequest — Couple only
router.post("/", authenticate, authorize("couple"), async (req: Request, res: Response) => {
  const { target_couple_id } = req.body;

  if (!target_couple_id) {
    return res.status(400).json({ error: "target_couple_id is required" });
  }

  const couple = await getOwnCouple(req.user!.sub);
  if (!couple) {
    return res.status(404).json({ error: "Couple profile not found for this account" });
  }

  if (couple.id === target_couple_id) {
    return res.status(400).json({ error: "You cannot send a connection request to yourself" });
  }

  const crRepo = AppDataSource.getRepository(ConnectionRequest);

  // Check for any existing request/block between these two couples, in either direction
  const existing = await crRepo.findOne({
    where: [
      { requester: { id: couple.id }, target: { id: target_couple_id } },
      { requester: { id: target_couple_id }, target: { id: couple.id } },
    ],
    relations: { requester: true, target: true },
  });

  if (existing) {
    if (existing.status === "blocked") {
      return res.status(403).json({ error: "You cannot connect with this couple" });
    }
    if (existing.status === "pending" || existing.status === "accepted") {
      return res.status(409).json({ error: "A connection request already exists between you and this couple" });
    }
  }

  const request = crRepo.create({
    requester: { id: couple.id },
    target: { id: target_couple_id },
    status: "pending",
  });

  await crRepo.save(request);

  return res.status(201).json(request);
});

// View own ConnectionRequests (sent and received) — Couple only
router.get("/my", authenticate, authorize("couple"), async (req: Request, res: Response) => {
  const couple = await getOwnCouple(req.user!.sub);
  if (!couple) {
    return res.status(404).json({ error: "Couple profile not found for this account" });
  }

  const crRepo = AppDataSource.getRepository(ConnectionRequest);
  const requests = await crRepo.find({
    where: [{ requester: { id: couple.id } }, { target: { id: couple.id } }],
    relations: { requester: true, target: true },
    order: { created_at: "DESC" },
  });

  return res.json(requests);
});

// Accept a ConnectionRequest — target Couple only
router.patch("/:id/accept", authenticate, authorize("couple"), async (req: Request, res: Response) => {
  const couple = await getOwnCouple(req.user!.sub);
  if (!couple) {
    return res.status(404).json({ error: "Couple profile not found for this account" });
  }

  const crRepo = AppDataSource.getRepository(ConnectionRequest);
  const request = await crRepo.findOne({
    where: { id: req.params.id as string },
    relations: { target: true },
  });

  if (!request) {
    return res.status(404).json({ error: "Connection request not found" });
  }
  if (request.target.id !== couple.id) {
    return res.status(403).json({ error: "Only the recipient can accept this request" });
  }
  if (request.status !== "pending") {
    return res.status(409).json({ error: "This request is no longer pending" });
  }

  request.status = "accepted";
  await crRepo.save(request);

  return res.json(request);
});

// Reject a ConnectionRequest — target Couple only
router.patch("/:id/reject", authenticate, authorize("couple"), async (req: Request, res: Response) => {
  const couple = await getOwnCouple(req.user!.sub);
  if (!couple) {
    return res.status(404).json({ error: "Couple profile not found for this account" });
  }

  const crRepo = AppDataSource.getRepository(ConnectionRequest);
  const request = await crRepo.findOne({
    where: { id: req.params.id as string },
    relations: { target: true },
  });

  if (!request) {
    return res.status(404).json({ error: "Connection request not found" });
  }
  if (request.target.id !== couple.id) {
    return res.status(403).json({ error: "Only the recipient can reject this request" });
  }
  if (request.status !== "pending") {
    return res.status(409).json({ error: "This request is no longer pending" });
  }

  request.status = "rejected";
  await crRepo.save(request);

  return res.json(request);
});

// Cancel own pending ConnectionRequest — requester Couple only
router.patch("/:id/cancel", authenticate, authorize("couple"), async (req: Request, res: Response) => {
  const couple = await getOwnCouple(req.user!.sub);
  if (!couple) {
    return res.status(404).json({ error: "Couple profile not found for this account" });
  }

  const crRepo = AppDataSource.getRepository(ConnectionRequest);
  const request = await crRepo.findOne({
    where: { id: req.params.id as string },
    relations: { requester: true },
  });

  if (!request) {
    return res.status(404).json({ error: "Connection request not found" });
  }
  if (request.requester.id !== couple.id) {
    return res.status(403).json({ error: "Only the sender can cancel this request" });
  }
  if (request.status !== "pending") {
    return res.status(409).json({ error: "This request is no longer pending" });
  }

  request.status = "cancelled";
  await crRepo.save(request);

  return res.json(request);
});

// Block another Couple — Couple only, works whether or not a prior request exists
router.post("/block", authenticate, authorize("couple"), async (req: Request, res: Response) => {
  const { target_couple_id } = req.body;

  if (!target_couple_id) {
    return res.status(400).json({ error: "target_couple_id is required" });
  }

  const couple = await getOwnCouple(req.user!.sub);
  if (!couple) {
    return res.status(404).json({ error: "Couple profile not found for this account" });
  }

  if (couple.id === target_couple_id) {
    return res.status(400).json({ error: "You cannot block yourself" });
  }

  const crRepo = AppDataSource.getRepository(ConnectionRequest);

  const existing = await crRepo.findOne({
    where: [
      { requester: { id: couple.id }, target: { id: target_couple_id } },
      { requester: { id: target_couple_id }, target: { id: couple.id } },
    ],
  });

  if (existing) {
    existing.status = "blocked";
    await crRepo.save(existing);
    return res.json(existing);
  }

  const block = crRepo.create({
    requester: { id: couple.id },
    target: { id: target_couple_id },
    status: "blocked",
  });

  await crRepo.save(block);

  return res.status(201).json(block);
});

export default router;