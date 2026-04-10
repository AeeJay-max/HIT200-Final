import React, { createContext, useContext, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { VITE_BACKEND_URL } from "../config/config";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const lastCheckedRef = useRef(Date.now());

    useEffect(() => {
        if (!user) return;

        const pollNotifications = async () => {
            try {
                const token = localStorage.getItem("auth_token");
                if (!token) return;

                const endpoint = user.role === "admin" ? "admin/notifications" : "citizen/notifications";
                const res = await fetch(`${VITE_BACKEND_URL}/api/v1/${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) return;

                const data = await res.json();
                const notifications = data.notifications || data.data || [];

                // Find any notifications that were created strictly after our last check
                const recentNotifications = notifications.filter((n: any) => {
                    const nTime = new Date(n.createdAt).getTime();
                    return nTime > lastCheckedRef.current;
                });

                if (recentNotifications.length > 0) {
                    recentNotifications.forEach((notif: any) => {
                        const isEmergency = notif.title?.toUpperCase().includes("EMERGENCY");

                        if (isEmergency) {
                            document.body.classList.add("disaster-mode");
                            // Remove after 5 minutes
                            setTimeout(() => document.body.classList.remove("disaster-mode"), 300000);
                        }

                        toast(() => (
                            <div className={`p-2 ${isEmergency ? 'text-red-50' : 'text-white'}`}>
                                <div className={`font-bold text-lg mb-1 ${isEmergency ? 'text-red-400 animate-pulse uppercase tracking-widest' : ''}`}>
                                    {isEmergency ? "🚨 " : (notif.type === "BROADCAST" ? "📢 " : "ℹ️ ")}
                                    {notif.title}
                                </div>
                                <div className="text-sm">{notif.message}</div>
                            </div>
                        ), {
                            duration: isEmergency ? 10000 : 5000,
                            style: {
                                borderRadius: '10px',
                                background: isEmergency ? '#7f1d1d' : '#333',
                                color: '#fff',
                                border: isEmergency ? '2px solid #ef4444' : 'none',
                                padding: '16px'
                            },
                        });
                    });
                    // Update last checked to slightly after the max created time
                    const maxTime = Math.max(...recentNotifications.map((n: any) => new Date(n.createdAt).getTime()));
                    lastCheckedRef.current = maxTime + 1;
                }

            } catch (err) {
                console.error("Notification poll error:", err);
            }
        };

        // Hybrid Approach: Web Push Primary + Polling fallback every 60s
        const intervalId = setInterval(() => {
            if (document.visibilityState === "hidden") return; // Part 35 (Reduce unneeded load)
            pollNotifications();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [user]);

    return (
        <NotificationContext.Provider value={null}>
            <Toaster position="top-right" reverseOrder={false} />
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = () => useContext(NotificationContext);
