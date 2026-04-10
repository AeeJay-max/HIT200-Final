"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.role;
        if (!userRole) {
            res.status(401).json({ message: "Role not found in token" });
            return;
        }
        if (!allowedRoles.includes(userRole)) {
            res.status(403).json({
                message: `Access denied. Required one of: ${allowedRoles.join(", ")}`,
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
