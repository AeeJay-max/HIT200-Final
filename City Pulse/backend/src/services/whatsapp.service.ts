import twilio from "twilio";
import { formatZimbabweNumber } from "../utils/phone.utils";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

let client: any;

if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

/**
 * Sends a message via Twilio WhatsApp API
 */
const sendTwilioMessage = async (to: string, message: string) => {
    if (!client) {
        console.warn("WARNING: Twilio credentials missing. Message will be simulated.");
        console.log(`[SIMULATED WhatsApp via Twilio] to ${to}: ${message}`);
        return { success: true, simulated: true };
    }

    try {
        const formattedNumber = formatZimbabweNumber(to);
        const toWhatsApp = `whatsapp:+${formattedNumber}`;

        const response = await client.messages.create({
            body: message,
            from: fromPhoneNumber,
            to: toWhatsApp
        });

        console.log(`WhatsApp message sent successfully to ${toWhatsApp} via Twilio. SID: ${response.sid}`);
        return { success: true, sid: response.sid };
    } catch (error: any) {
        console.error("Twilio WhatsApp Error:", error.message);
        // We do not re-throw here to prevent crashing the server
        return { success: false, error: error.message };
    }
};

export const sendWhatsAppCode = async (phoneNumber: string, code: string) => {
    const message = `Your CityPulse signup verification code is: ${code}`;
    await sendTwilioMessage(phoneNumber, message);
};

export const sendBulkWhatsAppAlert = async (phoneNumbers: string[], message: string) => {
    console.log(`Starting bulk WhatsApp alert via Twilio to ${phoneNumbers.length} recipients...`);

    const results = await Promise.allSettled(phoneNumbers.map(async (num) => {
        return sendTwilioMessage(num, message);
    }));

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Bulk WhatsApp alert finished. Success: ${successful}, Failed: ${failed}`);
};

