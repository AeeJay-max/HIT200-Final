
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { VITE_BACKEND_URL } from "../config/config";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Info, AlertTriangle, MessageSquare, Wrench, ChevronsRight } from "lucide-react";

export default function NotificationCenter() {
    const token = localStorage.getItem("auth_token");
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const observerTarget = useRef(null);

    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ["notifications_my", page],
        queryFn: async () => {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/citizen/notifications?page=${page}&limit=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            return data.notifications || data.data || [];
        },
        refetchInterval: 60000
    });

    const [allNotifications, setAllNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (notificationsData) {
            setAllNotifications(prev => {
                const newItems = notificationsData.filter((notif: any) => !prev.some(p => p._id === notif._id));
                return [...prev, ...newItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            });
        }
    }, [notificationsData]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setPage(prev => prev + 1);
            }
        }, { threshold: 1.0 });

        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, []);

    const notifications = allNotifications;

    const markAsRead = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/notifications/read/${id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to mark as read");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications_my"] });
            queryClient.invalidateQueries({ queryKey: ["notifications_badge"] });
        }
    });

    const getCategoryIcon = (type: string) => {
        switch (type?.toUpperCase()) {
            case "SYSTEM": return <Info className="text-blue-500 w-5 h-5" />;
            case "ASSIGNMENT": return <Wrench className="text-purple-500 w-5 h-5" />;
            case "STATUS_UPDATE": return <Check className="text-green-500 w-5 h-5" />;
            case "BROADCAST": return <MessageSquare className="text-orange-500 w-5 h-5" />;
            case "ESCALATION": return <AlertTriangle className="text-red-500 w-5 h-5" />;
            default: return <Bell className="text-gray-500 w-5 h-5" />;
        }
    };

    const getCategoryColor = (type: string) => {
        switch (type?.toUpperCase()) {
            case "SYSTEM": return "bg-blue-100 text-blue-800 border-blue-200";
            case "ASSIGNMENT": return "bg-purple-100 text-purple-800 border-purple-200";
            case "STATUS_UPDATE": return "bg-green-100 text-green-800 border-green-200";
            case "BROADCAST": return "bg-orange-100 text-orange-800 border-orange-200";
            case "ESCALATION": return "bg-red-100 text-red-800 border-red-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            <HeaderAfterAuth />
            <div className="container mx-auto max-w-4xl px-4 pt-24">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Bell className="w-8 h-8 text-blue-600" /> Notification Center
                    </h1>
                </div>

                {isLoading ? (
                    <div className="text-center py-20 text-gray-500">Loading your notifications...</div>
                ) : notifications?.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center text-gray-500 border border-gray-100 dark:border-gray-700">
                        No recent notifications found.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications?.map((notif: any) => (
                            <div
                                key={notif._id}
                                className={`relative border rounded-xl p-5 shadow-sm transition-all hover:shadow-md cursor-pointer ${notif.isRead
                                    ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                    }`}
                                onClick={() => {
                                    toast(notif.title, { description: notif.message });
                                    if (!notif.isRead) markAsRead.mutate(notif._id);
                                }}
                            >
                                {!notif.isRead && (
                                    <div className="absolute top-5 right-5 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                                )}
                                <div className="flex gap-4 items-start">
                                    <div className="p-3 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                                        {getCategoryIcon(notif.type || notif.category)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm border ${getCategoryColor(notif.type || notif.category)}`}>
                                                {notif.type || notif.category || "General"}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {formatDistanceToNow(new Date(notif.createdAt || Date.now()), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <h3 className={`text-lg font-semibold ${notif.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}>
                                            {notif.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                            {notif.message}
                                        </p>
                                    </div>
                                    <div className="hidden sm:flex self-center">
                                        {!notif.isRead && (
                                            <button
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead.mutate(notif._id);
                                                }}
                                            >
                                                <ChevronsRight className="w-4 h-4" /> Mark Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={observerTarget} className="h-10 w-full flex items-center justify-center">
                            <span className="text-gray-400 text-xs animate-pulse">Loading older notifications...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
