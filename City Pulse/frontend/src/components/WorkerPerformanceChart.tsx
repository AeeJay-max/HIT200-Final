import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { VITE_BACKEND_URL } from '../config/config';

export default function WorkerPerformanceChart() {
    const [stats, setStats] = useState<any[]>([]);

    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/analytics/response-times/workers`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        })
            .then(r => r.json())
            .then(d => setStats(d.stats || []));
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Worker Productivity Metrics</CardTitle>
            </CardHeader>
            <CardContent>
                {stats.length === 0 ? <p>No data</p> : (
                    stats.map(s => (
                        <div key={s._id} className="p-2 border-b">
                            <p>Issues Completed: {s.totalResolved}</p>
                            <p>On-Time %: {100 - (s.overdueCount / s.totalResolved * 100)}%</p>
                            <p>Avg Response Time: {s.avgResolutionTimeHours} hr</p>
                            <p>Verification Approval Rate: {s.verificationSuccessRate}%</p>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
