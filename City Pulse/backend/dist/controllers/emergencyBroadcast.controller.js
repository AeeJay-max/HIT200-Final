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
exports.getActiveBroadcasts = exports.createEmergencyBroadcast = void 0;
const emergencyBroadcast_model_1 = require("../models/emergencyBroadcast.model");
const socket_1 = require("../utils/socket");
const createEmergencyBroadcast = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.adminId;
        if (!adminId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { title, message, priorityLevel, type, expiresAt } = req.body;
        if (!title || !message || !type) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        const broadcast = yield emergencyBroadcast_model_1.EmergencyBroadcastModel.create({
            title,
            message,
            priorityLevel: priorityLevel || "Normal",
            type,
            expiresAt,
            createdBy: adminId,
        });
        // Extract socket instance
        const io = (0, socket_1.getIO)();
        // Broadcast to all connected clients
        io.emit("new_emergency_broadcast", broadcast);
        res.status(201).json({ success: true, broadcast });
    }
    catch (error) {
        console.error("Error creating emergency broadcast:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.createEmergencyBroadcast = createEmergencyBroadcast;
const getActiveBroadcasts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const broadcasts = yield emergencyBroadcast_model_1.EmergencyBroadcastModel.find({
            $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
        }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, broadcasts });
    }
    catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getActiveBroadcasts = getActiveBroadcasts;
