import rateLimit from "express-rate-limit";

// Max 5 issue submissions per minute per citizen
export const issueCreationLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5,
    message: { success: false, message: "Too many issues reported. Please try again after a minute." }
});

// Max 20 login attempts per hour per IP
export const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: { success: false, message: "Too many login attempts. Please try again later." }
});

// Max 10 votes per hour per IP
export const voteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { success: false, message: "You have reached the maximum vote limit. Try again later." }
});

// Max 3 notification broadcasts per hour per Admin IP
export const broadcastLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { success: false, message: "Broadcast limit reached. Reserved for emergency use." }
});
