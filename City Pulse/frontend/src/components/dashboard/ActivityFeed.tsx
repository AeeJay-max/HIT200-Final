import { useEffect, useState } from "react";
import { VITE_BACKEND_URL } from "../../config/config";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Activity } from "lucide-react";

export const ActivityFeedPanel = () => {
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        const fetchStream = () => {
            fetch(`${VITE_BACKEND_URL}/api/v1/dashboard/main-admin/activity-stream`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
            }).then(r => r.json()).then(d => { if (d && d.success) setEvents(d.data || []); }).catch(console.error);
        };
        fetchStream();
        const interval = setInterval(fetchStream, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="shadow-lg h-96 flex flex-col">
            <CardHeader className="bg-slate-50 border-b p-4 py-3 shrink-0">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800"><Activity className="w-5 h-5 text-blue-500" /> Live System Activity Stream</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
                <div className="flex flex-col">
                    {events.map((evt, i) => (
                        <div key={evt._id || i} className="p-3 border-b hover:bg-slate-50 flex flex-col gap-1">
                            <p className="text-xs text-slate-500 font-bold uppercase">{new Date(evt.changedAt || evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {evt.status}</p>
                            <p className="text-sm font-medium">{evt.issueID?.title || 'Unknown Issue'} <span className="text-slate-400 font-normal">in {evt.issueID?.location?.address || 'City'}</span></p>
                            <p className="text-xs text-slate-600 bg-slate-100 p-1.5 rounded inline-block w-fit mt-1 border">Executed by: {evt.handledBy?.fullName || "SYSTEM_HOOK_AUTO"} ({evt.handledBy?.role || "SYSTEM_BOT"})</p>
                            {evt.notes && <p className="text-xs italic text-slate-500">"{evt.notes}"</p>}
                        </div>
                    ))}
                    {events.length === 0 && <p className="text-center p-4 text-slate-500 text-sm">Waiting for live data...</p>}
                </div>
            </CardContent>
        </Card>
    );
};
