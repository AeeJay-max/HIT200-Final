import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CitizenModel } from "../../models/citizen.model";
import { AdminModel } from "../../models/admin.model";

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(401).json({ message: "Refresh token is missing" });
            return;
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_PASSWORD!) as { id: string, role: string };

        let user: any = null;
        if (decoded.role === "citizen") {
            user = await CitizenModel.findById(decoded.id);
        } else {
            user = await AdminModel.findById(decoded.id);
        }

        if (!user || user.refreshToken !== refreshToken) {
            res.status(403).json({ message: "Invalid refresh token" });
            return;
        }

        // Generate new tokens
        const newAccessToken = jwt.sign(
            { id: user._id, role: decoded.role },
            process.env.JWT_PASSWORD!,
            { expiresIn: "15m" }
        );

        const newRefreshToken = jwt.sign(
            { id: user._id, role: decoded.role },
            process.env.JWT_PASSWORD!,
            { expiresIn: "7d" }
        );

        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({ token: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(403).json({ message: "Refresh token expired or invalid" });
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ message: "No refresh token provided" });
            return;
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_PASSWORD!) as { id: string, role: string };

        if (decoded.role === "citizen") {
            await CitizenModel.findByIdAndUpdate(decoded.id, { refreshToken: null });
        } else {
            await AdminModel.findByIdAndUpdate(decoded.id, { refreshToken: null });
        }

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(200).json({ message: "Logged out successfully (token invalid)" });
    }
};
