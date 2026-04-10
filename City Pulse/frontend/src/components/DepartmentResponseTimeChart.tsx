import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { VITE_BACKEND_URL } from '../config/config';

export default function DepartmentResponseTimeChart() {
    const [stats, setStats] = useState<any[]>([]);

    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/analytics/response-times/departments`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        })
            .then(r => r.json())
            .then(d => setStats(d.departments || []));
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Department Response Times</CardTitle>
            </CardHeader>
            <CardContent>
                {stats.length === 0 ? <p>No data</p> : (
                    stats.map(s => (
                        <div key={s._id} className="p-2 border-b flex justify-between">
                            <span>{s.departmentInfo?.name || s._id}</span>
                            <div>
                                <p>Avg Response: {s.avgResponseTimeHours?.toFixed(1)} hr</p>
                                <p>Deadline Compliance: {(100 - (s.overduePercentage || 0))?.toFixed(1)}%</p>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
