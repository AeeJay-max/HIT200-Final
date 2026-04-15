import React, { createContext, useContext, useEffect, useState } from "react";
const io = (window as any).io || function () { return { on: () => { }, emit: () => { }, disconnect: () => { } }; };
import { VITE_BACKEND_URL } from "../config/config";
import { useAuth } from "./AuthContext";

export interface Notification {
    _id: string;
    title: string;
    message: string;
    priority: string;
    isRead: boolean;
    linkTo?: string; // Target Route
    targetRoute?: string;
    targetId?: string;
    type: string;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    socket: any;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    markAsRead: () => { },
    socket: null,
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [socket, setSocket] = useState<any>(null);
    const authToken = localStorage.getItem("auth_token");
    const { user } = useAuth();

    useEffect(() => {
        if (!authToken || !user) return;

        // fetch on login / refresh
        const fetchNotifications = async () => {
            try {
                const res = await fetch(`${VITE_BACKEND_URL}/api/v1/notifications/me`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                const data = await res.json();
                if (data.success) {
                    // Normalize the format expected by the frontend based on the backend return
                    const allNotifs = [
                        ...(data.unread || []),
                        ...(data.read || []),
                        ...(data.priority || [])
                    ];

                    // Deduplicate if identical IDs exist across arrays
                    const uniqueNotifs = Array.from(new Map(allNotifs.map(item => [item._id, item])).values()) as Notification[];
                    setNotifications(uniqueNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchNotifications();

        const newSocket = io(VITE_BACKEND_URL, {
            auth: { token: authToken },
            transports: ["polling", "websocket"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on("connect", () => {
            // Room logic
            if (user.role === "citizen") {
                newSocket.emit("join_room", `citizen:${user.id}`);
            } else if (user.role === "admin" || user.role === "MAIN_ADMIN" || user.role === "DEPARTMENT_ADMIN") {
                newSocket.emit("join_room", "admin");
                if (user.department) {
                    const deptName = typeof user.department === "object" ? (user.department as any).name : user.department;
                    newSocket.emit("join_room", `department:${deptName}`);
                }
            } else if (user.role === "worker" || user.role === "DEPARTMENT_WORKER") {
                newSocket.emit("join_room", `worker:${user.id}`);
                if (user.department) {
                    const deptName = typeof user.department === "object" ? (user.department as any).name : user.department;
                    newSocket.emit("join_room", `department:${deptName}`);
                }
            }
        });

        newSocket.on("new_notification", (notif: Notification) => {
            setNotifications((prev) => [notif, ...prev]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [authToken, user]);

    const markAsRead = async (id: string) => {
        try {
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            await fetch(`${VITE_BACKEND_URL}/api/v1/notifications/${id}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${authToken}` },
            });
        } catch (e) {
            console.error(e);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, socket }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
