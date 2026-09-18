import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
};

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

  if (!token) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Authentication token is required." });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === "string" || !(decoded as JwtPayload).email) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Authentication token is invalid." });
      return;
    }

    req.admin = { email: String((decoded as JwtPayload).email) };
    next();
  } catch (_error) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Authentication token is invalid or expired." });
  }
};
