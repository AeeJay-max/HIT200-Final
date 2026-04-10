import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VITE_BACKEND_URL } from "../config/config";
import { format } from "date-fns";

export interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

const Notifications: React.FC = () => {
    const [filterType, setFilterType] = useState("all");
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");
    const role = userStr ? JSON.parse(userStr).role : "citizen";

    const { data: notifications, isLoading } = useQuery<Notification[]>({
        queryKey: ["notifications"],
        queryFn: async () => {
            const endpoint = role === "admin" ? "admin/notifications" : "citizen/notifications";
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            return data.notifications || [];
        },
        refetchInterval: 30000 // Background polling every 30s
    });

    if (isLoading) return <div className="p-8 mt-20 text-center">Loading notifications...</div>;

    const filtered = (notifications || []).filter(n => filterType === "all" || n.type === filterType);

    return (
        <div className="container mx-auto p-4 mt-20 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Notification Center</h1>
            <div className="mb-6 flex space-x-2">
                <select onChange={(e) => setFilterType(e.target.value)} className="border p-2 rounded w-48">
                    <option value="all">All Notifications</option>
                    <option value="broadcast">Broadcast Announcements</option>
                    <option value="issue_update">Issue Status Updates</option>
                    <option value="timeline_warning">Timeline Warnings</option>
                </select>
            </div>
            <div className="space-y-4">
                {filtered.map(n => (
                    <div key={n._id} className={`p-4 border rounded-lg shadow-sm ${n.type === 'timeline_warning' ? 'border-red-500 bg-red-50' : 'bg-white'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{n.title}</h3>
                            <span className="text-xs text-gray-500">{format(new Date(n.createdAt), "PPpp")}</span>
                        </div>
                        <p className="text-gray-700">{n.message}</p>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-gray-500">No notifications found.</p>}
            </div>
        </div>
    );
};
export default Notifications;
