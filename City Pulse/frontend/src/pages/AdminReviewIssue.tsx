import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, CheckCircle2, XCircle, Clock, MapPin, User, FileText } from "lucide-react";
import { VITE_BACKEND_URL } from "../config/config";
import { toast } from "sonner";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { Badge } from "../components/ui/badge";

const AdminReviewIssue = () => {
    const { issueId } = useParams();
    const navigate = useNavigate();
    const [issue, setIssue] = useState<any>(null);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchIssue = async () => {
            try {
                const response = await fetch(`${VITE_BACKEND_URL}/api/v1/all-issues`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
                });
                const data = await response.json();
                if (data.issues) {
                    const found = data.issues.find((i: any) => i._id === issueId);
                    setIssue(found);
                }
            } catch (error) {
                console.error("Error fetching issue:", error);
            } finally {
                setFetching(false);
            }
        };
        fetchIssue();
    }, [issueId]);

    const handleAction = async (action: "Approve" | "Reject") => {
        if (action === "Reject" && !notes.trim()) {
            toast.error("Please provide a reason for rejection in the notes.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/admin/issue/${issueId}/verify`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({ action, notes })
            });

            if (response.ok) {
                toast.success(action === "Approve" ? "Issue resolved!" : "Issue returned for rework.");
                navigate("/admin");
            } else {
                const data = await response.json();
                toast.error(data.message || "Failed to process request");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-24 text-center">Locating evidence records...</div>;
    if (!issue) return (
        <div className="p-24 text-center space-y-4">
            <p className="text-xl font-semibold text-slate-700">Issue not found</p>
            <Link to="/admin">
                <Button variant="outline">Back to Dashboard</Button>
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <HeaderAfterAuth />
            <main className="container mx-auto px-4 py-24 max-w-4xl">
                <Link to="/admin" className="flex items-center space-x-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Dashboard</span>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT SIDE: Evidence Viewer */}
                    <div className="space-y-6">
                        <Card className="shadow-lg border-2 border-slate-100 overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    Completion Evidence
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {issue.completionMetadata?.completionImage ? (
                                    <div className="aspect-square bg-slate-200">
                                        <img
                                            src={issue.completionMetadata.completionImage}
                                            alt="Resolution"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-slate-400">
                                        No completion image found for this issue.
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="bg-slate-50 text-xs text-muted-foreground p-4">
                                <Clock className="h-3 w-3 mr-1" />
                                Submitted on: {new Date(issue.completionMetadata?.completionTimestamp || issue.updatedAt).toLocaleString()}
                            </CardFooter>
                        </Card>
                    </div>

                    {/* RIGHT SIDE: Review Details & Controls */}
                    <div className="space-y-6">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <Badge className="w-fit mb-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                                    Awaiting Verification
                                </Badge>
                                <CardTitle className="text-2xl font-bold">{issue.title}</CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {issue.location?.address}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
                                    <div>
                                        <Label className="text-slate-500">Worker</Label>
                                        <p className="font-semibold flex items-center gap-1">
                                            <User className="h-3 w-3 text-blue-600" />
                                            {issue.workerAssignedToFix?.fullName || "Assigned Worker"}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-slate-500">Reported By</Label>
                                        <p className="font-semibold text-slate-700">Citizen Reporter</p>
                                    </div>
                                </div>

                                {issue.completionMetadata?.completionNotes && (
                                    <div className="space-y-2">
                                        <Label className="font-semibold">Worker Notes</Label>
                                        <div className="p-3 bg-blue-50/50 rounded-lg text-sm border border-blue-100 italic">
                                            "{issue.completionMetadata.completionNotes}"
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="font-semibold text-slate-700">Review Comments</Label>
                                    <Textarea
                                        placeholder="Add notes for the worker or details about the verification..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="h-24"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => handleAction("Reject")}
                                    disabled={loading}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleAction("Approve")}
                                    disabled={loading}
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Verify & Resolve
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminReviewIssue;
