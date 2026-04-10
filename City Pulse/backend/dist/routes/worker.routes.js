"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlerware/auth.middleware");
const worker_controller_1 = require("../controllers/worker.controller");
const workerAuth_controllers_1 = require("../controllers/workerAuth.controllers");
const router = (0, express_1.Router)();
// Auth for Workers
router.post("/workers/signup", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(["admin"]), workerAuth_controllers_1.workerSignup);
router.post("/workers/login", workerAuth_controllers_1.workerLogin);
// Listing workers for a department
router.get("/departments/:id/workers", auth_middleware_1.authMiddleware, worker_controller_1.getAssignedIssues); // Simplified for listing for now
// Admin actions on Workers
router.post("/worker/create", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(["admin"]), worker_controller_1.createWorker);
router.post("/worker/assign", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(["admin"]), worker_controller_1.assignWorkerToIssue);
// Worker Dashboard endpoints
router.get("/worker/issues", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(["worker"]), worker_controller_1.getAssignedIssues);
router.put("/worker/issues/:issueId/resolve", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(["worker"]), worker_controller_1.markIssueResolved);
// Profile
router.get("/worker/profile/:workerId", auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(["worker"]), worker_controller_1.getWorkerProfile);
exports.default = router;
