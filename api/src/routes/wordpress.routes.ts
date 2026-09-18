import { Router } from "express";
import { receiveWordPressLead } from "../controllers/lead.controller";
import { requireApiSecret } from "../middleware/api-secret.middleware";

const router = Router();

router.post("/leads", requireApiSecret, receiveWordPressLead);

export default router;
