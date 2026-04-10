import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { VITE_BACKEND_URL } from '../config/config';

export default function AdminPriorityQueueViewer() {
    const [issues, setIssues] = useState([]);

    useEffect(() => {
        const fetchQueue = async () => {
            try {
                const response = await fetch(`${VITE_BACKEND_URL}/api/v1/all-issues`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
                });
                const dataObj = await response.json();
                let data = dataObj.issues || [];

                // Sorting logic based on priority queue rules
                data.sort((a: any, b: any) => {
                    // Rule 1: Critical issues first
                    if (a.severity === 'Critical' && b.severity !== 'Critical') return -1;
                    if (b.severity === 'Critical' && a.severity !== 'Critical') return 1;

                    // Rule 2: Overdue second
                    const aOverdue = a.timeline?.isOverdue;
                    const bOverdue = b.timeline?.isOverdue;
                    if (aOverdue && !bOverdue) return -1;
                    if (bOverdue && !aOverdue) return 1;

                    // Rule 3: Escalated third
                    const aEscalated = a.escalationLevel > 0;
                    const bEscalated = b.escalationLevel > 0;
                    if (aEscalated && !bEscalated) return -1;
                    if (bEscalated && !aEscalated) return 1;

                    // Rule 4: Oldest unresolved fourth
                    return new Date(a.createdAt || a.timeline?.reportedAt).getTime() - new Date(b.createdAt || b.timeline?.reportedAt).getTime();
                });

                setIssues(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchQueue();
    }, []);

    return (
        <Card className="mt-4 shadow-sm border border-gray-100">
            <CardHeader className="bg-sky-50 rounded-t-lg border-b">
                <CardTitle className="text-sky-800">Priority Queue Visualizer</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3">Issue</th>
                                <th className="px-4 py-3">Severity</th>
                                <th className="px-4 py-3">Overdue</th>
                                <th className="px-4 py-3">Escalation</th>
                                <th className="px-4 py-3">Reported</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issues.map((issue: any) => (
                                <tr key={issue._id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{issue.title}</td>
                                    <td className="px-4 py-3 text-red-600 font-bold">{issue.severity}</td>
                                    <td className="px-4 py-3">{issue.timeline?.isOverdue ? '⚠️ Overdue' : 'No'}</td>
                                    <td className="px-4 py-3">{issue.escalationLevel > 0 ? `Lvl ${issue.escalationLevel}` : 'Normal'}</td>
                                    <td className="px-4 py-3">{new Date(issue.timeline?.reportedAt || issue.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {issues.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-3 text-center text-gray-500">No issues in priority queue</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
