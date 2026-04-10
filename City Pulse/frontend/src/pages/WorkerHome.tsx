import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { VITE_BACKEND_URL } from "../config/config";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function WorkerHome() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/all-issues`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            });
            const data = await response.json();
            if (data.issues) {
                // Filter issues explicitly assigned to this worker
                const myTasks = data.issues.filter(
                    (issue: any) => issue.assignedWorker === user?.id || issue.assignedWorker?._id === user?.id
                );
                setTasks(myTasks);
            }
        } catch (error) {
            console.error("Error fetching tasks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchTasks();
    }, [user]);

    const updateStatus = async (issueId: string, status: string) => {
        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/admin/issue/${issueId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                toast.success(`Task marked as ${status}`);
                fetchTasks();
            } else {
                toast.error("Failed to update status");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error");
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            <HeaderAfterAuth />
            <div className="container mx-auto px-4 pt-24 max-w-5xl">
                <h1 className="text-3xl font-bold mb-2">Field Operator Dashboard</h1>
                <p className="text-gray-600 mb-8">Welcome, {user?.fullName}. Here are your assigned field tasks.</p>

                {tasks.length === 0 ? (
                    <div className="p-10 bg-white border rounded-xl shadow-sm text-center text-gray-500">
                        No tasks mapped or assigned to you currently axis. Take a break!
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {tasks.map(task => (
                            <Card key={task._id} className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-purple-500">
                                <CardHeader className="flex flex-row justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl mb-1">{task.title}</CardTitle>
                                        <p className="text-sm text-gray-500">{task.location?.address}</p>
                                    </div>
                                    <Badge variant={task.status === "Resolved" ? "default" : "secondary"}>
                                        {task.status}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-6">{task.description}</p>
                                    <div className="flex gap-4 items-center bg-gray-100 p-3 rounded-lg">
                                        <span className="text-sm font-semibold text-gray-700">Set active Status:</span>
                                        <select
                                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            value={task.status}
                                            onChange={(e) => updateStatus(task._id, e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Assigned">Assigned</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
