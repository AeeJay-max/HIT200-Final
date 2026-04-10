import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface DecodedToken {
  id: string;
  role: "admin" | "citizen" | "worker";
}

declare global {
  namespace Express {
    interface Request {
      citizenId?: string;
      adminId?: string;
      workerId?: string;
      role?: "admin" | "citizen" | "worker";
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    res.status(401).json({
      message: "Authorization header is missing or malformed",
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_PASSWORD!
    ) as DecodedToken;

    const r = String(decoded.role).toUpperCase();
    if (r === "CITIZEN") {
      req.citizenId = decoded.id;
    } else if (r === "ADMIN" || r === "MAIN_ADMIN" || r === "DEPARTMENT_ADMIN" || r === "DEPT_ADMIN") {
      req.adminId = decoded.id;
    } else if (r === "WORKER" || r === "DEPARTMENT_WORKER" || r === "DEPT_WORKER") {
      req.workerId = decoded.id;
    }
    req.role = decoded.role;
    next();
  } catch (e) {
    console.error("Error verifying JWT:", e);
    res.status(403).json({
      message: "Invalid token or expired",
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.role) {
      res.status(403).json({ message: "Forbidden: insufficient permissions" });
      return;
    }

    const r = String(req.role).toUpperCase();
    let normalizedRole = r;
    if (r === "ADMIN" || r === "MAIN_ADMIN" || r === "DEPARTMENT_ADMIN" || r === "DEPT_ADMIN") normalizedRole = "admin";
    else if (r === "WORKER" || r === "DEPARTMENT_WORKER" || r === "DEPT_WORKER") normalizedRole = "worker";
    else if (r === "CITIZEN") normalizedRole = "citizen";

    if (!allowedRoles.includes(normalizedRole)) {
      res.status(403).json({ message: "Forbidden: insufficient permissions" });
      return;
    }
    next();
  };
};
