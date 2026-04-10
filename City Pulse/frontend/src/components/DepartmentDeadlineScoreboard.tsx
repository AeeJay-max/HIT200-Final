import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { VITE_BACKEND_URL } from '../config/config';

export default function DepartmentDeadlineScoreboard() {
    const [stats, setStats] = useState<any[]>([]);

    useEffect(() => {
        fetch(`${VITE_BACKEND_URL}/api/v1/analytics/response-times/departments`)
            .then(r => r.json())
            .then(d => setStats(d.departments || []));
    }, []);

    return (
        <Card className="shadow-sm border border-gray-100">
            <CardHeader className="bg-sky-50 rounded-t-lg border-b">
                <CardTitle className="text-sky-800">Deadline Compliance Scoreboard</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3">Department</th>
                                <th className="px-4 py-3 text-right">On Time %</th>
                                <th className="px-4 py-3 text-right">Late %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((s: any) => (
                                <tr key={s._id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-bold">{s.departmentInfo?.name || s._id}</td>
                                    <td className="px-4 py-3 text-right text-green-600 font-bold">
                                        {(100 - (s.overduePercentage || 0)).toFixed(1)}%
                                    </td>
                                    <td className="px-4 py-3 text-right text-red-600 font-bold">
                                        {s.overduePercentage?.toFixed(1) || 0}%
                                    </td>
                                </tr>
                            ))}
                            {stats.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-3 text-center text-gray-500">No data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
