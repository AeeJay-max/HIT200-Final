import { useEffect, useState } from "react";
import { VITE_BACKEND_URL } from "../config/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Clock, AlertTriangle, ArrowRight } from "lucide-react";

export default function IssueResolutionSchedulePanel() {
    const [schedule, setSchedule] = useState<any[]>([]);

    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/public/schedule`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setSchedule(data.schedule);
            })
            .catch(() => console.error("Failed to load schedule"));
    }, []);

    if (!schedule.length) return null;

    return (
        <Card className="shadow-md border-sky-100">
            <CardHeader className="bg-sky-50 outline-none rounded-t-xl border-b border-sky-100">
                <CardTitle className="text-xl text-sky-800 flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Resolution Queue Priority
                </CardTitle>
                <CardDescription>
                    Public schedule showing the order in which civic issues are actively being resolved based on severity and SLA escalations.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col">
                    {schedule.map((item, index) => (
                        <div key={item._id} className="flex items-center gap-4 p-4 border-b hover:bg-slate-50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-700 truncate">{item.title}</h4>
                                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <AlertTriangle className={`w-3 h-3 ${item.severity === 'Critical' ? 'text-red-500' : 'text-orange-500'}`} />
                                        {item.severity}
                                    </span>
                                    <span>Escalation: Level {item.escalationLevel || 0}</span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <ArrowRight className="w-5 h-5 text-slate-300" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
