import { timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status";

const secureCompare = (received: string, expected: string): boolean => {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: unknown; password?: unknown };
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminEmail || (!adminPassword && !adminPasswordHash) || !jwtSecret) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      message: "Admin authentication environment variables are not configured.",
    });
    return;
  }

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "email and password are required." });
    return;
  }

  const emailMatches = secureCompare(email.trim().toLowerCase(), adminEmail);
  const passwordMatches = adminPasswordHash
    ? await bcrypt.compare(password, adminPasswordHash)
    : secureCompare(password, adminPassword as string);

  if (!emailMatches || !passwordMatches) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Invalid email or password." });
    return;
  }

  const token = jwt.sign(
    { email: adminEmail, role: "admin" },
    jwtSecret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as SignOptions["expiresIn"] },
  );

  res.status(200).json({
    token,
    admin: { email: adminEmail },
  });
};
