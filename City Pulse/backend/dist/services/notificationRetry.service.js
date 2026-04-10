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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initNotificationRetryCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const notification_model_1 = require("../models/notification.model");
const citizen_model_1 = require("../models/citizen.model");
const admin_model_1 = require("../models/admin.model");
const web_push_1 = __importDefault(require("web-push"));
const mongoose_1 = __importDefault(require("mongoose"));
const initNotificationRetryCron = () => {
    // PART 5: Retry every 10 minutes
    node_cron_1.default.schedule("*/10 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
        if (mongoose_1.default.connection.readyState !== 1) {
            console.warn("Skipping notification retry: Database not connected.");
            return;
        }
        console.log("Running Notification Retry Service...");
        const failedNotifications = yield notification_model_1.NotificationModel.find({
            deliveryStatus: { $in: ["failed", "pending"] },
            retryCount: { $lt: 5 } // Max 5 retries
        });
        for (const notification of failedNotifications) {
            try {
                notification.deliveryStatus = "retrying";
                yield notification.save();
                if (notification.recipientId) {
                    // Targeted retry
                    const user = (yield citizen_model_1.CitizenModel.findById(notification.recipientId)) ||
                        (yield admin_model_1.AdminModel.findById(notification.recipientId));
                    if (user === null || user === void 0 ? void 0 : user.pushSubscription) {
                        yield web_push_1.default.sendNotification(user.pushSubscription, JSON.stringify({
                            title: notification.title,
                            message: notification.message,
                            type: notification.type
                        }));
                    }
                }
                notification.deliveryStatus = "sent";
                yield notification.save();
            }
            catch (error) {
                notification.deliveryStatus = "failed";
                notification.retryCount += 1;
                yield notification.save();
                console.error(`Retry failed for notification ${notification._id}:`, error);
            }
        }
    }));
};
exports.initNotificationRetryCron = initNotificationRetryCron;
