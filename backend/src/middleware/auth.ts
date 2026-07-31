import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokens";
import { UserRole } from "../types";

export interface AuthRequest extends Request {
  user?: { userId: string; role: UserRole };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No access token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (err) {
    // Expired or invalid — client should call /api/auth/refresh and retry
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}
