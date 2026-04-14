import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ArrowLeft, AlertTriangle, ShieldAlert, UserPlus, RefreshCw } from "lucide-react";
import { VITE_BACKEND_URL } from "../config/config";
import { toast } from "sonner";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { Badge } from "../components/ui/badge";
import { getAuthorityLabel } from "../utils/authorityLabels";

const MainAdminEscalations = () => {
    const [issues, setIssues] = useState<any[]>([]);
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAdmin, setSelectedAdmin] = useState<Record<string, string>>({}); // issueId -> adminId

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("auth_token");
            const [issuesRes, adminsRes] = await Promise.all([
                fetch(`${VITE_BACKEND_URL}/api/v1/all-issues`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${VITE_BACKEND_URL}/api/v1/admins`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const issuesData = await issuesRes.json();
            const adminsData = await adminsRes.json();

            if (issuesData.issues) {
                // Filter for issues that are in "Escalated" status or logically overdue
                const escalated = issuesData.issues.filter((i: any) => i.status === "Escalated" || i.escalationLevel > 0);
                setIssues(escalated);
            }
            if (adminsData.success) {
                setAdmins(adminsData.admins.filter((a: any) => a.role === "DEPARTMENT_ADMIN"));
            }
        } catch (error) {
            console.error("Error fetching escalation data:", error);
            toast.error("Failed to load escalation records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssign = async (issueId: string) => {
        const adminId = selectedAdmin[issueId];
        if (!adminId) {
            toast.error("Please select a Department Admin first");
            return;
        }

        const admin = admins.find(a => a._id === adminId);

        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/admin/issue/${issueId}/escalation-assign`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({
                    adminId: adminId,
                    departmentId: admin.department // Assuming the backend can resolve this or we pass it
                })
            });

            if (response.ok) {
                toast.success("Issue reassigned successfully!");
                fetchData();
            } else {
                toast.error("Assignment failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="min-h-screen bg-background text-slate-600">
            <HeaderAfterAuth />
            <main className="container mx-auto px-4 py-24">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Link to="/admin">
                            <Button variant="ghost" size="sm" className="text-slate-500">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Dashboard
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold flex items-center gap-2 text-red-600">
                            <ShieldAlert className="h-8 w-8" />
                            Escalated Issues Control
                        </h1>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Queue
                    </Button>
                </div>

                <Card className="shadow-2xl border-red-100">
                    <CardHeader className="bg-red-50/50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Overdue Assignments & Critical Failures
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {issues.length === 0 ? (
                            <div className="p-20 text-center space-y-4">
                                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                </div>
                                <p className="text-slate-500 font-medium">No issues currently in the escalation queue.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Issue Details</TableHead>
                                        <TableHead>Responsible Authority</TableHead>
                                        <TableHead>Escalation Level</TableHead>
                                        <TableHead className="w-[300px]">Assign New Admin</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {issues.map((issue) => (
                                        <TableRow key={issue._id} className="hover:bg-red-50/30 transition-colors">
                                            <TableCell>
                                                <div className="font-bold text-slate-800">{issue.title}</div>
                                                <div className="text-xs text-muted-foreground">{issue.location?.address}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                                                    {getAuthorityLabel(issue.assignedDepartment?.name || "Unassigned")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="destructive" className="animate-pulse">
                                                    Level {issue.escalationLevel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <select
                                                    className="w-full p-2 border rounded-md bg-white text-sm"
                                                    value={selectedAdmin[issue._id] || ""}
                                                    onChange={(e) => setSelectedAdmin({ ...selectedAdmin, [issue._id]: e.target.value })}
                                                >
                                                    <option value="">Select Dept Admin</option>
                                                    {admins.map(admin => (
                                                        <option key={admin._id} value={admin._id}>
                                                            {admin.fullName} ({getAuthorityLabel(admin.department)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    className="bg-red-600 hover:bg-red-700"
                                                    onClick={() => handleAssign(issue._id)}
                                                >
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Take Control
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

// Placeholder CheckCircle2 since it might not be imported from lucide-react if I missed it
const CheckCircle2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
);

export default MainAdminEscalations;
