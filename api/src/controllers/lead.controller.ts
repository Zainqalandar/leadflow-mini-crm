import { Types } from "mongoose";
import { Request, Response } from "express";
import { LEAD_STATUSES, LeadStatus } from "../constants/lead";
import { HTTP_STATUS } from "../constants/http-status";
import LeadModel, { Lead } from "../models/lead.model";
import {
  calculateLeadScore,
  createStatusCounts,
  isLeadStatus,
  normalizePhone,
  validateLeadInput,
} from "../services/lead.service";

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getLeadId = (value: unknown): Types.ObjectId | undefined =>
  typeof value === "string" && Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : undefined;

const createLead = async (req: Request, res: Response, source: "wordpress" | "dashboard"): Promise<void> => {
  const validation = validateLeadInput(req.body);
  if (!validation.success) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Validation failed.", errors: validation.errors });
    return;
  }

  const payload = validation.data;
  const normalizedPhone = normalizePhone(payload.phone);
  const duplicate = await LeadModel.findOne({ email: payload.email, normalizedPhone }).select("_id");

  if (duplicate) {
    res.status(HTTP_STATUS.CONFLICT).json({
      message: "A lead with this email and phone already exists.",
      duplicateLeadId: duplicate.id,
    });
    return;
  }

  const lead = await LeadModel.create({
    ...payload,
    normalizedPhone,
    source,
    leadScore: calculateLeadScore(payload),
  });

  res.status(201).json({ lead });
};

export const createDashboardLead = async (req: Request, res: Response): Promise<void> => {
  await createLead(req, res, "dashboard");
};

export const receiveWordPressLead = async (req: Request, res: Response): Promise<void> => {
  await createLead(req, res, "wordpress");
};

export const listLeads = async (req: Request, res: Response): Promise<void> => {
  const { status, q, page = "1", limit = "20" } = req.query;
  const filter: {
    status?: LeadStatus;
    $or?: Array<Partial<Record<"name" | "email" | "phone" | "service" | "message", RegExp>>>;
  } = {};

  if (status !== undefined) {
    if (!isLeadStatus(status)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: `status must be one of: ${LEAD_STATUSES.join(", ")}.` });
      return;
    }

    filter.status = status;
  }

  if (typeof q === "string" && q.trim()) {
    const query = new RegExp(escapeRegex(q.trim()), "i");
    filter.$or = [
      { name: query },
      { email: query },
      { phone: query },
      { service: query },
      { message: query },
    ];
  }

  const currentPage = Math.max(Number.parseInt(String(page), 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(String(limit), 10) || 20, 1), 100);
  const [leads, total] = await Promise.all([
    LeadModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize),
    LeadModel.countDocuments(filter),
  ]);

  res.status(200).json({
    leads,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
};

export const getLead = async (req: Request, res: Response): Promise<void> => {
  const id = getLeadId(req.params.id);
  if (!id) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Invalid lead ID." });
    return;
  }

  const lead = await LeadModel.findById(id);
  if (!lead) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Lead not found." });
    return;
  }

  res.status(200).json({ lead });
};

export const updateLead = async (req: Request, res: Response): Promise<void> => {
  const id = getLeadId(req.params.id);
  if (!id) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Invalid lead ID." });
    return;
  }

  const validation = validateLeadInput(req.body);
  if (!validation.success) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Validation failed.", errors: validation.errors });
    return;
  }

  const payload = validation.data;
  const normalizedPhone = normalizePhone(payload.phone);
  const duplicate = await LeadModel.findOne({
    email: payload.email,
    normalizedPhone,
    _id: { $ne: id },
  }).select("_id");

  if (duplicate) {
    res.status(HTTP_STATUS.CONFLICT).json({
      message: "A lead with this email and phone already exists.",
      duplicateLeadId: duplicate.id,
    });
    return;
  }

  const lead = await LeadModel.findByIdAndUpdate(
    id,
    {
      ...payload,
      normalizedPhone,
      leadScore: calculateLeadScore(payload),
    },
    { new: true, runValidators: true },
  );

  if (!lead) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Lead not found." });
    return;
  }

  res.status(200).json({ lead });
};

export const updateLeadStatus = async (req: Request, res: Response): Promise<void> => {
  const id = getLeadId(req.params.id);
  const { status } = req.body as { status?: unknown };

  if (!id) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Invalid lead ID." });
    return;
  }

  if (!isLeadStatus(status)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: `status must be one of: ${LEAD_STATUSES.join(", ")}.` });
    return;
  }

  const lead = await LeadModel.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!lead) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Lead not found." });
    return;
  }

  res.status(200).json({ lead });
};

export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  const id = getLeadId(req.params.id);
  if (!id) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Invalid lead ID." });
    return;
  }

  const lead = await LeadModel.findByIdAndDelete(id);
  if (!lead) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: "Lead not found." });
    return;
  }

  res.status(204).send();
};

export const getLeadStats = async (_req: Request, res: Response): Promise<void> => {
  const [totalLeads, groupedStatuses] = await Promise.all([
    LeadModel.countDocuments(),
    LeadModel.aggregate<{ _id: LeadStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);
  const countsByStatus = createStatusCounts();

  groupedStatuses.forEach(({ _id, count }) => {
    if (isLeadStatus(_id)) countsByStatus[_id] = count;
  });

  res.status(200).json({ totalLeads, countsByStatus });
};

export const getLeadInsights = async (_req: Request, res: Response): Promise<void> => {
  const [totalLeads, groupedStatuses, topLeads] = await Promise.all([
    LeadModel.countDocuments(),
    LeadModel.aggregate<{ _id: LeadStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    LeadModel.find()
      .select("name email service budgetRange status source leadScore createdAt")
      .sort({ leadScore: -1, createdAt: -1 })
      .limit(5),
  ]);
  const countsByStatus = createStatusCounts();

  groupedStatuses.forEach(({ _id, count }) => {
    if (isLeadStatus(_id)) countsByStatus[_id] = count;
  });

  res.status(200).json({ totalLeads, countsByStatus, topLeads });
};
