"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        res.status(401).json({
            message: "Authorization header is missing or malformed",
        });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_PASSWORD);
        const r = String(decoded.role).toUpperCase();
        if (r === "CITIZEN") {
            req.citizenId = decoded.id;
        }
        else if (r === "ADMIN" || r === "MAIN_ADMIN" || r === "DEPARTMENT_ADMIN" || r === "DEPT_ADMIN") {
            req.adminId = decoded.id;
        }
        else if (r === "WORKER" || r === "DEPARTMENT_WORKER" || r === "DEPT_WORKER") {
            req.workerId = decoded.id;
        }
        req.role = decoded.role;
        next();
    }
    catch (e) {
        console.error("Error verifying JWT:", e);
        res.status(403).json({
            message: "Invalid token or expired",
        });
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.role) {
            res.status(403).json({ message: "Forbidden: insufficient permissions" });
            return;
        }
        const r = String(req.role).toUpperCase();
        let normalizedRole = r;
        if (r === "ADMIN" || r === "MAIN_ADMIN" || r === "DEPARTMENT_ADMIN" || r === "DEPT_ADMIN")
            normalizedRole = "admin";
        else if (r === "WORKER" || r === "DEPARTMENT_WORKER" || r === "DEPT_WORKER")
            normalizedRole = "worker";
        else if (r === "CITIZEN")
            normalizedRole = "citizen";
        if (!allowedRoles.includes(normalizedRole)) {
            res.status(403).json({ message: "Forbidden: insufficient permissions" });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
