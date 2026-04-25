/**
 * Normalizes Zimbabwe phone numbers to international format (+263)
 * @param phone The raw phone number input
 * @returns Normalized phone number in format +263XXXXXXXXX
 * @throws Error if the phone number is invalid
 */
export const formatZimbabweNumber = (phone: string): string => {
    // 1. Remove spaces and dashes
    let normalized = phone.replace(/\s|-/g, "");

    // 2. Reject if not numeric (allowing leading +)
    if (!/^\+?\d+$/.test(normalized)) {
        throw new Error("Invalid Zimbabwe phone number: contains non-numeric characters");
    }

    // 3. Handle different formats
    if (normalized.startsWith("0")) {
        // 0712345678 -> +263712345678
        normalized = "+263" + normalized.substring(1);
    } else if (normalized.startsWith("263")) {
        // 263712345678 -> +263712345678
        normalized = "+" + normalized;
    } else if (normalized.startsWith("+263")) {
        // Already correct format
    } else {
        // Fallback for numbers that might be just the subscriber part (e.g. 771234567)
        if (normalized.length === 9) {
            normalized = "+263" + normalized;
        } else {
            throw new Error("Invalid Zimbabwe phone number format");
        }
    }

    // 4. Final validation: +263 followed by 9 digits
    if (!/^\+263\d{9}$/.test(normalized)) {
        throw new Error("Invalid Zimbabwe phone number: must be in format +263XXXXXXXXX");
    }

    console.log("Formatted phone:", normalized);
    return normalized;
};
