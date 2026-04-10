import { useEffect, useState } from "react";
import { VITE_BACKEND_URL } from "../config/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { toast } from "sonner";
import { Bell, Zap, Droplet, Hammer, Info } from "lucide-react";

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
}

export default function NotificationFeed() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/citizen/notifications`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.success) setNotifications(json.notifications);
            })
            .catch(() => toast.error("Failed to load notifications"))
            .finally(() => setLoading(false));
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case "Power Outage": return <Zap className="w-5 h-5 text-yellow-500" />;
            case "Water Supply": return <Droplet className="w-5 h-5 text-blue-500" />;
            case "Road Maintenance": return <Hammer className="w-5 h-5 text-orange-500" />;
            default: return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case "Power Outage": return "border-l-yellow-500";
            case "Water Supply": return "border-l-blue-500";
            case "Road Maintenance": return "border-l-orange-500";
            default: return "border-l-gray-500";
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading alerts...</div>;

    return (
        <div className="space-y-4">
            {notifications.length === 0 ? (
                <Card className="bg-white/70 dark:bg-gray-500 dark:border-white/10 backdrop-blur-md">
                    <CardContent className="p-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        No new alerts from the municipality.
                    </CardContent>
                </Card>
            ) : (
                notifications.map(n => (
                    <Card key={n._id} className={`bg-white/70 dark:bg-gray-500 dark:border-white/10 backdrop-blur-md shadow-sm border-l-4 ${getColor(n.type)} hover:shadow-md transition-shadow`}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                {getIcon(n.type)}
                                <CardTitle className="text-lg text-slate-700">{n.title}</CardTitle>
                            </div>
                            <CardDescription className="text-xs">{new Date(n.createdAt).toLocaleString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap">{n.message}</p>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
