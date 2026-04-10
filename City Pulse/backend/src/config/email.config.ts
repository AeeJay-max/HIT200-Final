import nodemailer from 'nodemailer';

export const getTransporter = (authOptions?: { user: string; pass: string }) => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: authOptions?.user || process.env.SMTP_USER || 'default@citypulse.com',
            pass: authOptions?.pass || process.env.SMTP_PASS || 'password',
        },
    });
};
