import { getTransporter } from "../config/email.config";

export const sendEmailOTP = async (email: string, code: string) => {
    const transporter = getTransporter();

    const mailOptions = {
        from: process.env.SMTP_USER || "citypulse402@gmail.com",
        to: email,
        subject: "City Pulse - Email Verification Code",
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
                <h2 style="color: #4F46E5; text-align: center;">City Pulse Verification</h2>
                <p>Hello,</p>
                <p>Your verification code for City Pulse is:</p>
                <div style="font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #F3F4F6; border-radius: 8px; letter-spacing: 5px; color: #111827;">
                    ${code}
                </div>
                <p style="margin-top: 20px;">This code will expire in 5 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #6B7280; text-align: center;">City Pulse - Bridging the gap between citizens and service delivery.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Verification email sent to:", email);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
    }
};
