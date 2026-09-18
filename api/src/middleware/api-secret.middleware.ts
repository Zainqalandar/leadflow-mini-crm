import { timingSafeEqual } from "crypto";
import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status";

const secretsMatch = (received: string, expected: string): boolean => {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
};

export const requireApiSecret = (req: Request, res: Response, next: NextFunction): void => {
  const expectedSecret = process.env.API_SECRET;
  const receivedSecret = req.header("x-api-secret");

  if (!expectedSecret) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ message: "API secret is not configured." });
    return;
  }

  if (!receivedSecret || !secretsMatch(receivedSecret, expectedSecret)) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Invalid API secret." });
    return;
  }

  next();
};
