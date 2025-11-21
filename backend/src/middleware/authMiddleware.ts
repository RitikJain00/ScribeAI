import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// ✅ EXPORT this so routes can import it
export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.cookie) {
    const cookies = parse(req.headers.cookie);
    token = cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token" });
  }

  try {
    const payload: any = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: "Unauthorized: User not found" });

    req.user = user; // ⬅️ attach user
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
