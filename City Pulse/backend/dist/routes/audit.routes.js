"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditLog_model_1 = require("../models/auditLog.model");
const auth_middleware_1 = require("../middlerware/auth.middleware");
const requireRole_1 = require("../middlerware/requireRole");
const router = (0, express_1.Router)();
router.get("/logs", auth_middleware_1.authMiddleware, (0, requireRole_1.requireRole)(["MAIN_ADMIN"]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logs = yield auditLog_model_1.AuditLogModel.find()
            .sort({ timestamp: -1 })
            .limit(200)
            .populate("actorId", "fullName email");
        res.status(200).json({ success: true, logs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Fetch failed" });
    }
}));
exports.default = router;
