import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { VITE_BACKEND_URL } from "../config/config";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { User, Phone, Mail, ArrowLeft, Activity } from "lucide-react";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Player from "lottie-react";
import starloader from "../assets/animations/starloder.json";

interface Worker {
    _id: string;
    fullName: string;
    email: string;
    phonenumber: string;
    performanceScore?: number;
    averageResolutionTimeHours?: number;
}

export default function AssignWorkerPage() {
    const { id: issueId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState<string | null>(null);

    useEffect(() => {
        const fetchWorkers = async () => {
            try {
                const res = await fetch(`${VITE_BACKEND_URL}/api/v1/workers/department`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
                });
                const data = await res.json();
                if (data.workers) {
                    setWorkers(data.workers);
                }
            } catch (err) {
                console.error("Failed to fetch workers", err);
                toast.error("Failed to fetch workers.");
            } finally {
                setLoading(false);
            }
        };
        fetchWorkers();
    }, []);

    const handleAssign = async (workerId: string) => {
        setAssigning(workerId);
        try {
            // The issue assigns dynamically but requires departmentId if we strictly used it, actually the backend only needs workerId and admin context
            // the backend uses worker.department.toString() automatically.
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/worker/assign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                },
                body: JSON.stringify({ issueId, workerId }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Worker successfully assigned!");
                navigate(-1); // go back
            } else {
                toast.error(data.message || "Failed to assign worker.");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during assignment.");
        } finally {
            setAssigning(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white">
                <Player
                    autoplay
                    loop
                    animationData={starloader}
                    style={{ height: "200px", width: "200px" }}
                />
                <p className="text-muted-foreground mt-4">Loading available workers...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-slate-50"
        >
            <HeaderAfterAuth />
            <main className="container mx-auto px-4 py-8 pt-24 max-w-5xl">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" onClick={() => navigate(-1)} className="rounded-full h-10 w-10 p-0 border-slate-300">
                        <ArrowLeft className="h-5 w-5 text-slate-500" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800">Assign Field Worker</h1>
                        <p className="text-slate-500 mt-1">Select an available worker to resolve this issue.</p>
                    </div>
                </div>

                {workers.length === 0 ? (
                    <div className="text-center py-20 bg-white shadow-sm border border-slate-100 rounded-2xl">
                        <User className="h-16 w-16 mx-auto text-slate-200 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-600">No Workers Found</h3>
                        <p className="text-slate-400 mt-2">There are currently no active workers in your department.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workers.map((worker) => (
                            <Card key={worker._id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="bg-slate-50 pb-4 border-b border-slate-100">
                                    <CardTitle className="flex items-center gap-3 text-lg text-slate-800">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </div>
                                        {worker.fullName}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5 space-y-4">
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                            <span>{worker.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                            <span>{worker.phonenumber}</span>
                                        </div>
                                    </div>

                                    {worker.performanceScore !== undefined && (
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                <Activity className="h-3.5 w-3.5" />
                                                Score: {worker.performanceScore}
                                            </div>
                                            <div className="text-xs text-slate-400 font-medium tracking-wide">
                                                Avg: {worker.averageResolutionTimeHours || 0} hrs
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full mt-2 font-bold shadow-md rounded-xl bg-blue-600 hover:bg-blue-700"
                                        onClick={() => handleAssign(worker._id)}
                                        disabled={assigning === worker._id}
                                    >
                                        {assigning === worker._id ? "Assigning..." : "Assign to Issue"}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </motion.div>
    );
}
