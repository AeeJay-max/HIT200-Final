import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Upload, Send, Image as ImageIcon } from "lucide-react";
import { VITE_BACKEND_URL } from "../config/config";
import { toast } from "sonner";
import HeaderAfterAuth from "../components/HeaderAfterAuth";

const WorkerCompleteIssue = () => {
    const { issueId } = useParams();
    const navigate = useNavigate();
    const [issue, setIssue] = useState<any>(null);
    const [completionNotes, setCompletionNotes] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchIssue = async () => {
            try {
                const response = await fetch(`${VITE_BACKEND_URL}/api/v1/worker/issues`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
                });
                const data = await response.json();
                if (data.success) {
                    const found = data.issues.find((i: any) => i._id === issueId);
                    setIssue(found);
                }
            } catch (error) {
                console.error("Error fetching issue:", error);
            }
        };
        fetchIssue();
    }, [issueId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error("Completion image is required");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("completionImage", selectedFile);
            formData.append("completionNotes", completionNotes);

            const response = await fetch(`${VITE_BACKEND_URL}/api/v1/worker/issues/${issueId}/complete`, {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
                body: formData
            });

            if (response.ok) {
                toast.success("Resolution submitted for verification!");
                navigate("/worker");
            } else {
                const data = await response.json();
                toast.error(data.message || "Failed to submit resolution");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!issue) return <div className="p-8 text-center text-slate-500">Loading issue details...</div>;

    return (
        <div className="min-h-screen bg-background">
            <HeaderAfterAuth />
            <main className="container mx-auto px-4 py-24 max-w-2xl">
                <Link to="/worker" className="flex items-center space-x-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Dashboard</span>
                </Link>

                <Card className="shadow-xl border-t-4 border-t-blue-600">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <ImageIcon className="h-6 w-6 text-blue-600" />
                            Submit Resolution Evidence
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-muted rounded-lg text-sm">
                            <p className="font-bold text-slate-700">Issue: {issue.title}</p>
                            <p className="text-muted-foreground">{issue.location?.address}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="completionImage" className="text-lg font-semibold">
                                    Completion Photo *
                                </Label>
                                <p className="text-xs text-muted-foreground">Upload a clear image of the resolved issue.</p>
                                <div className="mt-2 flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 transition-colors bg-slate-50 group">
                                    {previewUrl ? (
                                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="absolute bottom-2 right-2"
                                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                            >
                                                Change Image
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-12 w-12 text-slate-400 group-hover:text-blue-500 mb-4" />
                                            <Input
                                                id="completionImage"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <Label htmlFor="completionImage" className="cursor-pointer">
                                                <Button type="button" variant="outline" className="pointer-events-none">
                                                    Choose Image
                                                </Button>
                                            </Label>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-lg font-semibold">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Provide any additional details about the work done..."
                                    value={completionNotes}
                                    onChange={(e) => setCompletionNotes(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-[0.98]"
                                disabled={loading || !selectedFile}
                            >
                                {loading ? "Uploading..." : (
                                    <>
                                        <Send className="h-5 w-5 mr-2" />
                                        Submit for Verification
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default WorkerCompleteIssue;
