import twilio from "twilio";
import { formatZimbabweNumber } from "../utils/phone.utils";

let client: any = null;

const getTwilioClient = () => {
    if (client) return client;

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

    client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    return client;
};

export const sendWhatsAppCode = async (phoneNumber: string, code: string) => {
    const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
    const CONTENT_SID = process.env.TWILIO_CONTENT_SID;

    try {
        const twilioClient = getTwilioClient();
        if (!twilioClient) {
            console.log(`[SIMULATED] WhatsApp code for ${phoneNumber}: ${code}`);
            return;
        }

        const formattedNumber = formatZimbabweNumber(phoneNumber);

        const messagePayload: any = {
            from: WHATSAPP_FROM,
            to: `whatsapp:${formattedNumber}`,
        };

        if (CONTENT_SID) {
            // Use Content API (Templates)
            messagePayload.contentSid = CONTENT_SID;
            // Assuming variable "1" is the code. Adjust if template uses different indices.
            messagePayload.contentVariables = JSON.stringify({ "1": code });
        } else {
            // Fallback to free-form text message
            messagePayload.body = `Your CityPulse signup verification code is ${code}`;
        }

        await twilioClient.messages.create(messagePayload);
        console.log(`WhatsApp code sent to ${formattedNumber} ${CONTENT_SID ? "(via template)" : "(via text)"}`);
    } catch (error: any) {
        console.error("Error sending WhatsApp code:", error);
        // Special handling for common Twilio errors during setup
        if (error.code === 21608) {
            throw new Error("This number is not yet in the Twilio WhatsApp Sandbox. Please join the sandbox first.");
        }
        throw new Error("Failed to send verification code via WhatsApp. Ensure your credentials are correct.");
    }
};
export const sendBulkWhatsAppAlert = async (phoneNumbers: string[], message: string) => {
    const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
    const twilioClient = getTwilioClient();

    if (!twilioClient) {
        console.log(`[SIMULATED BULK] WhatsApp Alert to ${phoneNumbers.length} recipients: ${message}`);
        return;
    }

    console.log(`Starting bulk WhatsApp alert to ${phoneNumbers.length} recipients...`);

    // Using Promise.allSettled to ensure all messages are attempted even if some fail
    const results = await Promise.allSettled(phoneNumbers.map(async (num) => {
        const formattedNumber = formatZimbabweNumber(num);
        return twilioClient.messages.create({
            from: WHATSAPP_FROM,
            to: `whatsapp:${formattedNumber}`,
            body: message
        });
    }));

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Bulk WhatsApp alert finished. Success: ${successful}, Failed: ${failed}`);
};
