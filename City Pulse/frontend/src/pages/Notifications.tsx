import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Bell, CheckCircle, Info, AlertTriangle, Clock } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";

const Notifications = () => {
    const { notifications, markAsRead } = useNotifications();
    const [filter, setFilter] = useState("All");
    const [activeTab, setActiveTab] = useState("Active");

    const filtered = notifications.filter((n: any) => {
        const matchesTab = activeTab === "Active" ? !n.isRead : n.isRead;
        const matchesType = filter === "All" || n.type === filter;
        return matchesTab && matchesType;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case "Warning": return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case "Assignment": return <Clock className="h-5 w-5 text-blue-500" />;
            case "Status Update": return <CheckCircle className="h-5 w-5 text-green-500" />;
            default: return <Info className="h-5 w-5 text-slate-500" />;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Bell className="h-8 w-8 text-blue-600" /> Notification Center
                </h1>
                <div className="flex gap-2">
                    <select
                        className="p-2 border rounded-md text-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="All">All Notifications</option>
                        <option value="Broadcast">Broadcasts</option>
                        <option value="Assignment">Assignments</option>
                        <option value="Status Update">Updates</option>
                        <option value="Warning">Warnings</option>
                    </select>
                </div>
            </div>

            <div className="flex border-b mb-4">
                <button
                    className={`px-4 py-2 font-medium ${activeTab === "Active" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("Active")}
                >
                    Active
                </button>
                <button
                    className={`px-4 py-2 font-medium ${activeTab === "History" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("History")}
                >
                    History
                </button>
            </div>

            <div className="space-y-4">
                {filtered.length === 0 && <p className="text-center text-slate-500 py-10">No notifications found.</p>}
                {filtered.map((n: any) => (
                    <Card key={n._id} className={`${n.isRead ? 'opacity-70 bg-slate-50' : 'border-l-4 border-l-blue-600 shadow-md'}`}>
                        <CardContent className="p-4 flex gap-4 items-start">
                            <div className="mt-1">{getIcon(n.type)}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className={`font-bold ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</p>
                                    <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                                <div className="flex justify-between items-center mt-3">
                                    <Badge variant={n.priority === "Critical" ? "destructive" : "secondary"}>
                                        {n.priority}
                                    </Badge>
                                    {!n.isRead && (
                                        <Button variant="ghost" size="sm" onClick={() => markAsRead(n._id)}>
                                            Mark as read
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Notifications;
