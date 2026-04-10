import { useEffect, useState } from "react";
import { VITE_BACKEND_URL } from "../config/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { ZapOff, Droplet } from "lucide-react";

export default function ServiceOutageScheduleViewer() {
    const [outages, setOutages] = useState<any[]>([]);

    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/public/outages`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setOutages(data.outages);
            })
            .catch(() => console.error("Failed to load outages"));
    }, []);

    if (!outages.length) return null;

    return (
        <Card className="shadow-md border-orange-100 bg-orange-50/20">
            <CardHeader className="bg-orange-100/50 outline-none rounded-t-xl border-b border-orange-100">
                <CardTitle className="text-xl text-orange-800 flex items-center gap-2">
                    <ZapOff className="h-5 w-5" /> Planned Infrastructure Outages
                </CardTitle>
                <CardDescription>
                    Live status on major power grids and water supply lines currently under maintenance.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid gap-4 lg:grid-cols-2">
                {outages.map((item) => (
                    <div key={item._id} className="bg-white border p-4 rounded-xl shadow-sm flex gap-3">
                        <div className="pt-1">
                            {item.issueType === 'Water Supply' ? <Droplet className="text-blue-500 h-6 w-6" /> : <ZapOff className="text-yellow-600 h-6 w-6 bg-yellow-50 rounded-lg" />}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">{item.title}</h4>
                            <p className="text-xs text-slate-600 mt-1"><span className="font-bold">Location:</span> {item.location?.address || 'Municipal Wide'}</p>
                            <p className="text-xs text-orange-600 font-bold mt-2">Expected Resolution: Unscheduled</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
