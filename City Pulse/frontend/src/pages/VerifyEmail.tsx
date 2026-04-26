import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card.tsx";
import { Label } from "../components/ui/label.tsx";
import { Input } from "../components/ui/input.tsx";
import { Button } from "../components/ui/button.tsx";
import { VITE_BACKEND_URL } from "../config/config.tsx";
import logo from "../assets/logo.png";

const VerifyEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(300); // 5 minutes
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (!email) {
            navigate("/signup");
            return;
        }

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [email, navigate]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            toast.error("Please enter a 6-digit code.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/auth/verify-email-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Email verified successfully! Now let's verify your WhatsApp.");
                // Fetch new WhatsApp OTP or just redirect if signup sends both?
                // Actually, my signup sends Email OTP. After email verify, we should trigger WhatsApp OTP.
                // Re-sending WhatsApp OTP here for the next step.
                await fetch(`${VITE_BACKEND_URL}/api/v1/auth/resend-whatsapp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });

                navigate("/verify-whatsapp", { state: { email } });
            } else {
                toast.error(data.message || "Verification failed");
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = async () => {
        if (!canResend) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/auth/resend-email-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("New verification code sent to your email");
                setCountdown(300);
                setCanResend(false);
            } else {
                toast.error(data.message || "Failed to resend code");
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-1 mb-4">
                        <div className="flex items-center justify-center w-16 h-14 rounded-l-full bg-white dark:bg-gray-500 dark:border dark:border-white/10 shadow">
                            <img src={logo} alt="Logo" className="w-15 h-14 object-contain" />
                        </div>
                        <div className="civic-gradient h-14 bg-clip-text rounded-r-full rounded-l-sm w-92">
                            <h1 className="text-3xl font-extrabold text-white">City Pulse</h1>
                        </div>
                    </Link>
                </div>

                <Card className="rounded-2xl shadow-2xl bg-white dark:bg-gray-500 border border-white dark:border-white/10">
                    <CardHeader>
                        <CardTitle className="text-center">Verify Your Email</CardTitle>
                        <CardDescription className="text-center text-gray-500">
                            We've sent a 6-digit verification code to <span className="font-bold text-foreground">{email}</span>.
                            Please enter it below to proceed to WhatsApp verification.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVerifyEmail} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="verification-code">Verification Code</Label>
                                <Input
                                    id="verification-code"
                                    type="text"
                                    placeholder="123456"
                                    maxLength={6}
                                    className="text-center text-2xl tracking-[1em] font-bold"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                    required
                                />
                            </div>

                            <div className="text-center text-sm font-medium">
                                {countdown > 0 ? (
                                    <span className="text-muted-foreground">
                                        Resend code in {formatTime(countdown)}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendEmail}
                                        className="text-primary hover:underline font-semibold"
                                        disabled={isLoading}
                                    >
                                        Resend Email Code
                                    </button>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full civic-gradient text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? "Verifying..." : "Verify Email"}
                            </Button>

                            <div className="text-center">
                                <Link to="/signup" className="text-sm text-muted-foreground hover:text-primary">
                                    ← Back to SignUp
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default VerifyEmail;
