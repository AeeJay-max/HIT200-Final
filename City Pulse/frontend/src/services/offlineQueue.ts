import { openDB } from "idb";
import axios from "axios";
import { VITE_BACKEND_URL } from "../config/config";

const DB_NAME = "citypulse-offline-db";
const STORE_NAME = "offline-reports";

export const initOfflineDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
            }
        }
    });
};

export const saveReportOffline = async (payload: any, isFormData: boolean = false) => {
    try {
        const db = await initOfflineDB();
        await db.add(STORE_NAME, { payload, isFormData, timestamp: Date.now() });
        console.log("Report saved offline. Will sync when online.");
    } catch (err) {
        console.error("Failed to save report offline", err);
    }
};

export const syncOfflineReports = async (token: string) => {
    if (!navigator.onLine) return;

    try {
        const db = await initOfflineDB();
        const reports = await db.getAll(STORE_NAME);

        if (reports.length === 0) return;

        for (const report of reports) {
            try {
                // If it's formData, we need to reconstruct it if we stored it as objects
                // For simplicity, we assume payload is ready
                await axios.post(`${VITE_BACKEND_URL}/api/v1/citizen/issues`, report.payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        ...(report.isFormData ? { 'Content-Type': 'multipart/form-data' } : {})
                    }
                });
                await db.delete(STORE_NAME, report.id);
                console.log("Synced offline report ID:", report.id);
            } catch (error) {
                console.error("Failed to sync report", report.id, error);
            }
        }
    } catch (err) {
        console.error("Offline DB Sync Error", err);
    }
};

// Listen to online event to trigger sync automatically
window.addEventListener('online', () => {
    const token = localStorage.getItem("auth_token");
    if (token) {
        syncOfflineReports(token);
    }
});
