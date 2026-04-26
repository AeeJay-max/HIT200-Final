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
exports.sendBulkWhatsAppAlert = exports.sendWhatsAppCode = void 0;
const twilio_1 = __importDefault(require("twilio"));
const phone_utils_1 = require("../utils/phone.utils");
let client = null;
const getTwilioClient = () => {
    if (client)
        return client;
    const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    if (!ACCOUNT_SID || !ACCOUNT_SID.startsWith("AC")) {
        console.warn("WARNING: TWILIO_ACCOUNT_SID is missing or invalid. WhatsApp messages will not be sent.");
        return null;
    }
    if (!AUTH_TOKEN) {
        console.warn("WARNING: TWILIO_AUTH_TOKEN is missing. WhatsApp messages will not be sent.");
        return null;
    }
    client = (0, twilio_1.default)(ACCOUNT_SID, AUTH_TOKEN);
    return client;
};
const sendWhatsAppCode = (phoneNumber, code) => __awaiter(void 0, void 0, void 0, function* () {
    const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
    const CONTENT_SID = process.env.TWILIO_CONTENT_SID;
    try {
        const twilioClient = getTwilioClient();
        if (!twilioClient) {
            console.log(`[SIMULATED] WhatsApp code for ${phoneNumber}: ${code}`);
            return;
        }
        const formattedNumber = (0, phone_utils_1.formatZimbabweNumber)(phoneNumber);
        const messagePayload = {
            from: WHATSAPP_FROM,
            to: `whatsapp:${formattedNumber}`,
        };
        if (CONTENT_SID) {
            // Use Content API (Templates)
            messagePayload.contentSid = CONTENT_SID;
            // Assuming variable "1" is the code. Adjust if template uses different indices.
            messagePayload.contentVariables = JSON.stringify({ "1": code });
        }
        else {
            // Fallback to free-form text message
            messagePayload.body = `Your CityPulse signup verification code is ${code}`;
        }
        yield twilioClient.messages.create(messagePayload);
        console.log(`WhatsApp code sent to ${formattedNumber} ${CONTENT_SID ? "(via template)" : "(via text)"}`);
    }
    catch (error) {
        console.error("Error sending WhatsApp code:", error);
        // Special handling for common Twilio errors during setup
        if (error.code === 21608) {
            throw new Error("This number is not yet in the Twilio WhatsApp Sandbox. Please join the sandbox first.");
        }
        throw new Error("Failed to send verification code via WhatsApp. Ensure your credentials are correct.");
    }
});
exports.sendWhatsAppCode = sendWhatsAppCode;
const sendBulkWhatsAppAlert = (phoneNumbers, message) => __awaiter(void 0, void 0, void 0, function* () {
    const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
    const twilioClient = getTwilioClient();
    if (!twilioClient) {
        console.log(`[SIMULATED BULK] WhatsApp Alert to ${phoneNumbers.length} recipients: ${message}`);
        return;
    }
    console.log(`Starting bulk WhatsApp alert to ${phoneNumbers.length} recipients...`);
    // Using Promise.allSettled to ensure all messages are attempted even if some fail
    const results = yield Promise.allSettled(phoneNumbers.map((num) => __awaiter(void 0, void 0, void 0, function* () {
        const formattedNumber = (0, phone_utils_1.formatZimbabweNumber)(num);
        return twilioClient.messages.create({
            from: WHATSAPP_FROM,
            to: `whatsapp:${formattedNumber}`,
            body: message
        });
    })));
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`Bulk WhatsApp alert finished. Success: ${successful}, Failed: ${failed}`);
});
exports.sendBulkWhatsAppAlert = sendBulkWhatsAppAlert;
