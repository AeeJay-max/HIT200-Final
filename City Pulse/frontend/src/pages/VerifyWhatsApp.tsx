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

const VerifyWhatsApp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(300); // 5 minutes
    const [canResend, setCanResend] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [tempPhone, setTempPhone] = useState("");

    const fetchPhoneNumber = async () => {
        if (!email) return;
        setIsLoading(true);
        try {
            console.log("Fetching phone for:", email);
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/auth/phone?email=${encodeURIComponent(email)}`);
            const data = await response.json();
            console.log("Phone API Response:", data);
            if (response.ok) {
                setPhoneNumber(data.phonenumber || "");
                setTempPhone(data.phonenumber || "");
            } else {
                console.error("Lookup failed:", data.message);
            }
        } catch (error) {
            console.error("Error fetching phone number:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!email) {
            navigate("/signup");
            return;
        }

        fetchPhoneNumber();

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

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            toast.error("Please enter a 6-digit code.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/auth/verify-whatsapp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Account verified successfully! You can now sign in.");
                navigate("/signin");
            } else {
                toast.error(data.message || "Verification failed");
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePhone = async () => {
        if (!tempPhone) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/auth/update-phone`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, newPhoneNumber: tempPhone }),
            });

            const data = await response.json();

            if (response.ok) {
                setPhoneNumber(data.phonenumber);
                setIsEditingPhone(false);
                toast.success("Phone number updated successfully");
                handleResend(true);
            } else {
                toast.error(data.message || "Failed to update phone number");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async (ignoreCanResend = false) => {
        if (!canResend && !ignoreCanResend) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/auth/resend-whatsapp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("New verification code sent via WhatsApp");
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
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
                        <CardTitle className="text-center">Verify WhatsApp</CardTitle>
                        <CardDescription className="text-center text-gray-500">
                            We've sent a 6-digit verification code to your WhatsApp.
                            Please enter it below to verify your account.
                        </CardDescription>

                        <div className="mt-4 p-3 bg-muted rounded-lg border border-border">
                            {isEditingPhone ? (
                                <div className="space-y-3">
                                    <Label className="text-xs">Correct your phone number</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={tempPhone}
                                            onChange={(e) => setTempPhone(e.target.value)}
                                            className="h-9"
                                            placeholder="e.g. 0771234567"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleUpdatePhone}
                                            disabled={isLoading}
                                            className="h-9"
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setIsEditingPhone(false);
                                                setTempPhone(phoneNumber);
                                            }}
                                            className="h-9"
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Confirming will save the number and resend the code.</p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium">Sending to WhatsApp:</p>
                                        <p className="text-sm font-bold tracking-tight">
                                            {phoneNumber || (
                                                <span className="flex items-center gap-1 italic text-muted-foreground">
                                                    Loading... {email && `(${email})`}
                                                </span>
                                            )}
                                        </p>
                                        {!phoneNumber && !isLoading && email && (
                                            <button
                                                onClick={fetchPhoneNumber}
                                                className="text-[10px] text-blue-500 hover:underline"
                                            >
                                                Retry lookup
                                            </button>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditingPhone(true)}
                                        className="h-8 text-xs px-3"
                                    >
                                        Edit Number
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVerify} className="space-y-6">
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
                                        onClick={() => handleResend(false)}
                                        className="text-primary hover:underline font-semibold"
                                        disabled={isLoading}
                                    >
                                        Resend Verification Code
                                    </button>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full civic-gradient text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? "Verifying..." : "Verify Account"}
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

export default VerifyWhatsApp;
