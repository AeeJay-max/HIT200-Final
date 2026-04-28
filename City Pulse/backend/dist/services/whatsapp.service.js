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
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
let client;
if (accountSid && authToken) {
    client = (0, twilio_1.default)(accountSid, authToken);
}
/**
 * Sends a message via Twilio WhatsApp API
 */
const sendTwilioMessage = (to, message) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client) {
        console.warn("WARNING: Twilio credentials missing. Message will be simulated.");
        console.log(`[SIMULATED WhatsApp via Twilio] to ${to}: ${message}`);
        return { success: true, simulated: true };
    }
    try {
        const formattedNumber = (0, phone_utils_1.formatZimbabweNumber)(to);
        const toWhatsApp = `whatsapp:+${formattedNumber}`;
        const response = yield client.messages.create({
            body: message,
            from: fromPhoneNumber,
            to: toWhatsApp
        });
        console.log(`WhatsApp message sent successfully to ${toWhatsApp} via Twilio. SID: ${response.sid}`);
        return { success: true, sid: response.sid };
    }
    catch (error) {
        console.error("Twilio WhatsApp Error:", error.message);
        // We do not re-throw here to prevent crashing the server
        return { success: false, error: error.message };
    }
});
const sendWhatsAppCode = (phoneNumber, code) => __awaiter(void 0, void 0, void 0, function* () {
    const message = `Your CityPulse signup verification code is: ${code}`;
    yield sendTwilioMessage(phoneNumber, message);
});
exports.sendWhatsAppCode = sendWhatsAppCode;
const sendBulkWhatsAppAlert = (phoneNumbers, message) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Starting bulk WhatsApp alert via Twilio to ${phoneNumbers.length} recipients...`);
    const results = yield Promise.allSettled(phoneNumbers.map((num) => __awaiter(void 0, void 0, void 0, function* () {
        return sendTwilioMessage(num, message);
    })));
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`Bulk WhatsApp alert finished. Success: ${successful}, Failed: ${failed}`);
});
exports.sendBulkWhatsAppAlert = sendBulkWhatsAppAlert;
