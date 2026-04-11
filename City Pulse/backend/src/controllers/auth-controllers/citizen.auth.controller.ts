import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CitizenModel } from "../../models/citizen.model";
import { RefreshTokenModel } from "../../models/refreshToken.model";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const signupSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required" }).trim(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      {
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      }
    )
    .trim(),
  email: z.string().email({ message: "Invalid email format" }).trim(),
  phonenumber: z
    .string()
    .length(10, { message: "Phone number must be exactly 10 digits" }),
});

export const citizenSignup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parsedData = signupSchema.parse(req.body);
    const { fullName, password, email, phonenumber } = parsedData;

    const existingCitizen = await CitizenModel.findOne({ email });
    if (existingCitizen) {
      res.status(400).json({ message: " Citizen already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await CitizenModel.create({
      fullName,
      password: hashedPassword,
      email,
      phonenumber,
    });
    console.log("Citizen created!");
    res.status(201).json({ message: "Citizen Signed up!" });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({
        message: "Validation failed",
        errors: err.errors,
      });
      return;
    }

    console.error("Error creating CitizenModel:", err);
    res
      .status(411)
      .json({ message: "Citizen already exists or another error occurred" });
  }
};

export const citizenSignin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const existingCitizen = await CitizenModel.findOne({ email });

    if (!existingCitizen) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingCitizen.password as string
    );
    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    const accessToken = jwt.sign(
      { id: existingCitizen._id, role: "CITIZEN" },
      process.env.JWT_PASSWORD!,
      { expiresIn: "10h" }
    );

    const refreshToken = crypto.randomBytes(40).toString("hex");
    await RefreshTokenModel.create({
      token: refreshToken,
      userId: existingCitizen._id,
      userType: "Citizen",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token: accessToken,
      user: {
        id: existingCitizen._id,
        fullName: existingCitizen.fullName,
        email: existingCitizen.email,
        phonenumber: existingCitizen.phonenumber,
        role: "CITIZEN",
      },
    });
    console.log("Citizen signed in with refresh token!");
  } catch (error) {
    console.error("Error during citizen signin:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
export const refreshCitizenToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }

    const tokenDoc = await RefreshTokenModel.findOne({ token: refreshToken, userType: "Citizen" });
    if (!tokenDoc) {
      res.status(403).json({ message: "Invalid refresh token" });
      return;
    }

    const citizen = await CitizenModel.findById(tokenDoc.userId);
    if (!citizen) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const newAccessToken = jwt.sign(
      { id: citizen._id, role: "CITIZEN" },
      process.env.JWT_PASSWORD!,
      { expiresIn: "10h" }
    );

    res.json({ token: newAccessToken });
  } catch (error) {
    res.status(500).json({ message: "Refresh failed" });
  }
};

export const citizenLogout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await RefreshTokenModel.deleteOne({ token: refreshToken });
  }
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out" });
};
