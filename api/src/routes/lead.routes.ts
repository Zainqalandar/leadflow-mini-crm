import { Router } from "express";
import {
  createDashboardLead,
  deleteLead,
  getLead,
  getLeadInsights,
  getLeadStats,
  listLeads,
  updateLead,
  updateLeadStatus,
} from "../controllers/lead.controller";
import { requireAdminAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAdminAuth);
router.get("/stats", getLeadStats);
router.get("/insights", getLeadInsights);
router.get("/", listLeads);
router.post("/", createDashboardLead);
router.get("/:id", getLead);
router.put("/:id", updateLead);
router.patch("/:id/status", updateLeadStatus);
router.delete("/:id", deleteLead);

export default router;
