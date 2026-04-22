import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { VITE_BACKEND_URL } from "../config/config";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface Admin {
    _id: string;
    fullName: string;
    department: string;
    role: string;
}

interface Worker {
    _id: string;
    fullName: string;
    department: string;
}

interface Issue {
    _id: string;
    title: string;
    assignedDepartment?: { name: string };
}

export default function AssignIssuePage() {
    const { id: issueId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [issue, setIssue] = useState<Issue | null>(null);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedAdmin, setSelectedAdmin] = useState<string>("");
    const [selectedWorker, setSelectedWorker] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);

    // Fetch issue, admins and workers
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("auth_token");
                // Issue details
                const issueRes = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const issueData = await issueRes.json();
                if (issueData.issue) setIssue(issueData.issue);

                // Admins (department admins only)
                const adminsRes = await fetch(`${VITE_BACKEND_URL}/api/v1/admins`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const adminsData = await adminsRes.json();
                if (adminsData.success) {
                    setAdmins(
                        adminsData.admins.filter(
                            (a: Admin) => a.role === "DEPARTMENT_ADMIN" && a.department === issueData.issue?.assignedDepartment?.name
                        )
                    );
                }

                // Workers for the same department
                const workersRes = await fetch(`${VITE_BACKEND_URL}/api/v1/workers/department`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const workersData = await workersRes.json();
                if (workersData.workers) {
                    setWorkers(
                        workersData.workers.filter((w: Worker) => w.department === issueData.issue?.assignedDepartment?.name)
                    );
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [issueId]);

    const handleAssign = async () => {
        if (!selectedAdmin || !selectedWorker) {
            toast.error("Select both an admin and a worker.");
            return;
        }
        setAssigning(true);
        const token = localStorage.getItem("auth_token");
        try {
            // 1. Assign department admin (escalation assign)
            const adminRes = await fetch(`${VITE_BACKEND_URL}/api/v1/admin/issue/${issueId}/escalation-assign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ adminId: selectedAdmin, departmentId: issue?.assignedDepartment?.name }),
            });
            if (!adminRes.ok) throw new Error("Failed to assign admin");

            // 2. Assign worker
            const workerRes = await fetch(`${VITE_BACKEND_URL}/api/v1/worker/assign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ issueId, workerId: selectedWorker }),
            });
            if (!workerRes.ok) throw new Error("Failed to assign worker");

            toast.success("Admin and worker assigned successfully!");
            navigate("/admin");
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Assignment failed.");
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-slate-600">
            <HeaderAfterAuth />
            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Card className="shadow-lg">
                    <CardHeader className="bg-slate-50">
                        <CardTitle className="text-xl">Assign Issue – {issue?.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div>
                            <label className="block font-medium mb-1">Department Admin</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={selectedAdmin}
                                onChange={(e) => setSelectedAdmin(e.target.value)}
                            >
                                <option value="">Select Admin</option>
                                {admins.map((a) => (
                                    <option key={a._id} value={a._id}>
                                        {a.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Worker</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={selectedWorker}
                                onChange={(e) => setSelectedWorker(e.target.value)}
                            >
                                <option value="">Select Worker</option>
                                {workers.map((w) => (
                                    <option key={w._id} value={w._id}>
                                        {w.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button onClick={handleAssign} disabled={assigning} className="w-full">
                            {assigning ? "Assigning..." : "Assign Admin & Worker"}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
