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

const WorkerSetup = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;
    const role = location.state?.role || "WORKER";

    const [phonenumber, setPhonenumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            navigate("/signin");
            return;
        }
    }, [email, navigate]);

    const handleUpdateDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/auth/update-phone`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, newPhoneNumber: phonenumber, role }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Details updated! Sending verification email...");

                // Trigger Email OTP
                await fetch(`${VITE_BACKEND_URL}/api/v1/auth/resend-email-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, role }),
                });

                navigate("/verify-email", { state: { email, role } });
            } else {
                toast.error(data.message || "Failed to update details");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-1 mb-4">
                        <div className="flex items-center justify-center w-16 h-14 rounded-l-full bg-white shadow">
                            <img src={logo} alt="Logo" className="w-15 h-14 object-contain" />
                        </div>
                        <div className="civic-gradient h-14 bg-clip-text rounded-r-full rounded-l-sm w-92">
                            <h1 className="text-3xl font-extrabold text-white">City Pulse</h1>
                        </div>
                    </Link>
                </div>

                <Card className="rounded-2xl shadow-2xl bg-white border border-white/10">
                    <CardHeader>
                        <CardTitle className="text-center text-slate-800">Complete Your Profile</CardTitle>
                        <CardDescription className="text-center">
                            Welcome! Please provide your WhatsApp number to secure your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateDetails} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="worker-phone" className="text-slate-700">WhatsApp Number</Label>
                                <Input
                                    id="worker-phone"
                                    type="tel"
                                    placeholder="e.g. 0771234567"
                                    value={phonenumber}
                                    onChange={(e) => setPhonenumber(e.target.value)}
                                    required
                                    className="border-slate-200"
                                />
                                <p className="text-[10px] text-muted-foreground">This number will be used for two-factor authentication via WhatsApp.</p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full civic-gradient text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? "Saving..." : "Verify Identity"}
                            </Button>

                            <div className="text-center">
                                <Link to="/signin" className="text-sm text-muted-foreground hover:text-primary">
                                    ← Back to Sign In
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default WorkerSetup;
