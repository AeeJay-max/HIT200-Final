import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { VITE_BACKEND_URL } from "../config/config";
import { toast } from "sonner";
import { Send } from "lucide-react";

export default function NotificationSender() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("Power Outage");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/admin/notifications`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({ title, message, type })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Notification sent successfully!");
                setTitle("");
                setMessage("");
            } else {
                toast.error(data.message || "Error sending");
            }
        } catch (error) {
            toast.error("Internal error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-xl mx-auto mt-6 shadow-lg bg-white/80 dark:bg-gray-500 dark:border-white/10">
            <CardHeader>
                <CardTitle>Send City-wide Alert</CardTitle>
                <CardDescription>Notify citizens about sudden outages, maintenance, or emergencies.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Notification Type</Label>
                        <RadioGroup value={type} onValueChange={setType} className="grid grid-cols-2 gap-4 mt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Power Outage" id="Power Outage" />
                                <Label htmlFor="Power Outage">Power Outage</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Water Supply" id="Water Supply" />
                                <Label htmlFor="Water Supply">Water Supply</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Road Maintenance" id="Road Maintenance" />
                                <Label htmlFor="Road Maintenance">Road Maint.</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Other" id="Other" />
                                <Label htmlFor="Other">Other Category</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Scheduled Power Outage in CBD" />
                    </div>
                    <div className="space-y-2">
                        <Label>Message content</Label>
                        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Details about this alert..." className="min-h-[100px]" />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        <Send className="w-4 h-4 mr-2" />
                        {loading ? "Sending..." : "Push Notification (Email/Web)"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
