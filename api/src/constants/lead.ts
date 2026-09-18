export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Won", "Lost"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ["wordpress", "dashboard"] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
