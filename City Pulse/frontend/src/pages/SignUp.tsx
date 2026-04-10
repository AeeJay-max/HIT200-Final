import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logo from '../assets/logo.png'
import { Link, useNavigate } from "react-router-dom";
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
import { Checkbox } from "../components/ui/checkbox.tsx";
import { motion, AnimatePresence } from "framer-motion";
import { VITE_BACKEND_URL } from "../config/config.tsx";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [citizenForm, setCitizenForm] = useState({
    fullName: "",
    email: "",
    phonenumber: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [citizenErrors, setCitizenErrors] = useState<Record<string, string>>(
    {}
  );
  const [activeTab] = useState("citizen");
  const navigate = useNavigate();

  // Password validation: min 8 chars, uppercase, lowercase, digit, special char
  const validatePassword = (password: string) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  // Citizen signup handler
  const handleCitizenSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setCitizenErrors({});

    if (!validatePassword(citizenForm.password)) {
      toast.error(
        "Password must be at least 8 characters, include uppercase, lowercase, number and special character."
      );
      return;
    }
    if (citizenForm.password !== citizenForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!citizenForm.agreeToTerms) {
      toast.error("Please agree to the terms and conditions.");
      return;
    }
    if (
      citizenForm.phonenumber.trim().length !== 10 ||
      !/^\d{10}$/.test(citizenForm.phonenumber.trim())
    ) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      const response = await fetch(
        `${VITE_BACKEND_URL}/api/v1/citizen/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: citizenForm.fullName,
            email: citizenForm.email,
            password: citizenForm.password,
            phonenumber: citizenForm.phonenumber,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Registration Successful! You can now sign in.");
        navigate("/signin");
      } else if (data.errors && Array.isArray(data.errors)) {
        const errs: Record<string, string> = {};
        data.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            errs[err.path[0]] = err.message;
          }
        });
        setCitizenErrors(errs);
      } else {
        toast.error(data.message || "Something went wrong! Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong! Please try again.");
      console.error(error);
    }
  };




  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-1 mb-4">
            <div className="flex items-center justify-center w-16 h-14 rounded-l-full bg-white dark:bg-gray-500 dark:border dark:border-white/10 shadow">
              <img
                src={logo}
                alt="civicIssueLogo"
                className="w-15 h-14 object-contain"
              />
            </div>
            <div className="civic-gradient h-14  bg-clip-text rounded-r-full rounded-l-sm w-92">
              <h1 className="text-3xl font-extrabold text-white">
                City Pulse
              </h1>
              <p className="text-sm bg-slate-300">
                Bridging the gap between citizens and service delivery.
              </p>
            </div>
          </Link>
        </div>

        <Card className="rounded-2xl shadow-2xl bg-white dark:bg-gray-500 dark:text-foreground border border-white dark:border-white/10">
          <CardHeader>
            <CardTitle>
              <center>Create Account</center>
            </CardTitle>
            <CardDescription>
              Join our community to report issues and help build better cities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4">
              <AnimatePresence mode="wait">
                {activeTab === "citizen" && (
                  <motion.div
                    key="citizen-motion"
                    initial={{ opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -32 }}
                    transition={{ duration: 0.33, ease: "easeOut" }}
                    className="mt-6"
                  >
                    <form
                      onSubmit={handleCitizenSignUp}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="citizen-fullName">Full Name</Label>
                        <Input
                          id="citizen-fullName"
                          placeholder="John Doe"
                          value={citizenForm.fullName}
                          onChange={(e) =>
                            setCitizenForm({
                              ...citizenForm,
                              fullName: e.target.value,
                            })
                          }
                          required
                        />
                        {citizenErrors.fullName && (
                          <p className="text-red-600 text-sm">
                            {citizenErrors.fullName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="citizen-email">Email</Label>
                        <Input
                          id="citizen-email"
                          type="email"
                          placeholder="citizen@example.com"
                          value={citizenForm.email}
                          onChange={(e) =>
                            setCitizenForm({
                              ...citizenForm,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                        {citizenErrors.email && (
                          <p className="text-red-600 text-sm">
                            {citizenErrors.email}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="citizen-phone">Phone Number</Label>
                        <Input
                          id="citizen-phone"
                          type="tel"
                          placeholder="0123456789"
                          value={citizenForm.phonenumber}
                          onChange={(e) =>
                            setCitizenForm({
                              ...citizenForm,
                              phonenumber: e.target.value,
                            })
                          }
                          required
                        />
                        {citizenErrors.phonenumber && (
                          <p className="text-red-600 text-sm">
                            {citizenErrors.phonenumber}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="citizen-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="citizen-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            value={citizenForm.password}
                            onChange={(e) =>
                              setCitizenForm({
                                ...citizenForm,
                                password: e.target.value,
                              })
                            }
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {citizenErrors.password && (
                          <p className="text-red-600 text-sm">
                            {citizenErrors.password}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="citizen-confirmPassword">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="citizen-confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={citizenForm.confirmPassword}
                            onChange={(e) =>
                              setCitizenForm({
                                ...citizenForm,
                                confirmPassword: e.target.value,
                              })
                            }
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="citizen-terms"
                          checked={citizenForm.agreeToTerms}
                          onCheckedChange={(checked) =>
                            setCitizenForm({
                              ...citizenForm,
                              agreeToTerms: checked as boolean,
                            })
                          }
                        />
                        <Label htmlFor="citizen-terms" className="text-sm">
                          I agree to the{" "}
                          <Link
                            to="/terms"
                            className="text-primary hover:underline"
                          >
                            Terms and Conditions
                          </Link>
                        </Label>
                        {citizenErrors.agreeToTerms && (
                          <p className="text-red-600 text-sm">
                            {citizenErrors.agreeToTerms}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full civic-gradient text-white hover:opacity-70 transition-all duration-500 ease-in-out"
                      >
                        Create Citizen Account
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/signin" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
