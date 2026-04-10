import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { VITE_BACKEND_URL } from '../config/config';

export default function IssueDetailsPanel({ issue, onClose }: { issue: any, onClose: () => void }) {
    const [workers, setWorkers] = useState([]);
    const [selectedWorker, setSelectedWorker] = useState<string | null>(null);

    useEffect(() => {
        const fetchWorkers = async () => {
            try {
                const res = await fetch(`${VITE_BACKEND_URL}/api/v1/workers/department`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
                });
                const data = await res.json();
                setWorkers(data.workers || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchWorkers();
    }, []);

    const handleAssignWorker = async () => {
        if (!selectedWorker) return toast.error("Select a worker first");
        try {
            await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issue._id}/assign-worker`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
                body: JSON.stringify({
                    workerId: selectedWorker,
                    departmentId: issue.assignedDepartment?._id || issue.assignedDepartment
                })
            });
            toast.success("Worker assigned successfully!");
            onClose();
        } catch (err) {
            toast.error("Failed to assign worker.");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{issue.title}</CardTitle>
                <CardDescription>Status: {issue.status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p><strong>Description:</strong> {issue.description}</p>
                <p><strong>Location:</strong> {issue.location?.address}</p>
                <div>
                    <label className="text-sm font-semibold">Assign Worker</label>
                    <div className="flex gap-2 mt-1">
                        <select className="p-2 border rounded text-slate-700 font-semibold" value={selectedWorker || ""} onChange={(e) => setSelectedWorker(e.target.value)}>
                            <option value="" disabled>Select Worker</option>
                            {workers.map((w: any) => (
                                <option key={w._id} value={w._id}>{w.fullName}</option>
                            ))}
                        </select>
                        <Button onClick={handleAssignWorker}>Assign Worker</Button>
                    </div>
                </div>
                <Button variant="outline" onClick={onClose}>Close</Button>
            </CardContent>
        </Card>
    );
}
