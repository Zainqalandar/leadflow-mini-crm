import { LeadStatus, LEAD_STATUSES } from "../constants/lead";

export interface LeadInput {
  name: string;
  email: string;
  phone: string;
  service: string;
  budgetRange: string;
  message: string;
}

export type ValidationResult =
  | { success: true; data: LeadInput }
  | { success: false; errors: Record<string, string> };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toRequiredString = (
  value: unknown,
  field: string,
  errors: Record<string, string>,
  maxLength: number,
): string => {
  if (typeof value !== "string") {
    errors[field] = `${field} is required.`;
    return "";
  }

  const normalized = value.trim();
  if (!normalized) {
    errors[field] = `${field} is required.`;
  } else if (normalized.length > maxLength) {
    errors[field] = `${field} must be at most ${maxLength} characters.`;
  }

  return normalized;
};

export const normalizePhone = (phone: string): string => phone.replace(/\D/g, "");

export const validateLeadInput = (input: unknown): ValidationResult => {
  const errors: Record<string, string> = {};
  const payload = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  const name = toRequiredString(payload.name, "name", errors, 100);
  const email = toRequiredString(payload.email, "email", errors, 254).toLowerCase();
  const phone = toRequiredString(payload.phone, "phone", errors, 30);
  const service = toRequiredString(payload.service, "service", errors, 120);
  const budgetRange = toRequiredString(payload.budgetRange, "budgetRange", errors, 100);
  const message = toRequiredString(payload.message, "message", errors, 2000);

  if (name && name.length < 2) {
    errors.name = "name must be at least 2 characters.";
  }

  if (email && !emailPattern.test(email)) {
    errors.email = "email must be valid.";
  }

  if (phone && normalizePhone(phone).length < 7) {
    errors.phone = "phone must contain at least 7 digits.";
  }

  if (message && message.length < 10) {
    errors.message = "message must be at least 10 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { name, email, phone, service, budgetRange, message },
  };
};

export const calculateLeadScore = (lead: LeadInput): number => {
  let score = 20;
  const budget = lead.budgetRange.toLowerCase().replace(/,/g, "");
  const service = lead.service.toLowerCase();

  // Budget intent: high = 30, medium = 20, starter/unknown = 10.
  if (/10\s?000|10k|enterprise|custom quote|above/.test(budget)) {
    score += 30;
  } else if (/5\s?000|5k|2\s?500|2\.5k/.test(budget)) {
    score += 20;
  } else {
    score += 10;
  }

  // More involved services carry higher commercial intent.
  if (/e-?commerce|web development|website development|custom development|mobile app/.test(service)) {
    score += 20;
  } else if (/branding|seo|digital marketing|ui\/?ux|web design/.test(service)) {
    score += 12;
  } else {
    score += 8;
  }

  if (lead.email) score += 10;
  if (normalizePhone(lead.phone).length >= 7) score += 10;
  if (lead.message.trim().length >= 40) score += 10;

  return Math.min(score, 100);
};

export const isLeadStatus = (value: unknown): value is LeadStatus =>
  typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);

export const createStatusCounts = (): Record<LeadStatus, number> => ({
  New: 0,
  Contacted: 0,
  Qualified: 0,
  Won: 0,
  Lost: 0,
});
