import React, { useState } from "react";
import LocationPicker from "./LocationPicker";

interface RadiusSelectorProps {
    onSearch: (payload: any) => void;
}

const RadiusSelector: React.FC<RadiusSelectorProps> = ({ onSearch }) => {
    const [center, setCenter] = useState<{ latitude: number, longitude: number, address?: string } | null>(null);
    const [radius, setRadius] = useState(10);
    const [dateRange, setDateRange] = useState("all");

    const handleSearch = () => {
        if (!center) return;
        const today = new Date();
        let startDate, endDate = today;
        if (dateRange === "weekly") startDate = new Date(today.getTime() - 7 * 24 * 3600 * 1000);
        if (dateRange === "monthly") startDate = new Date(today.getTime() - 30 * 24 * 3600 * 1000);
        if (dateRange === "yearly") startDate = new Date(today.getTime() - 365 * 24 * 3600 * 1000);

        onSearch({
            centerLatitude: center.latitude,
            centerLongitude: center.longitude,
            radiusKm: radius,
            startDate,
            endDate
        });
    };

    return (
        <div className="bg-white p-6 shadow-md rounded-lg mb-8">
            <h3 className="text-xl font-bold mb-4">Intelligence Zone (Radius Analytics)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold mb-2">Select Center Location</label>
                    <LocationPicker location={center} onChange={(loc) => setCenter(loc)} />
                    {center?.address && <p className="text-xs text-gray-500 mt-2">{center.address}</p>}
                </div>
                <div className="flex flex-col justify-center space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Radius Distance (km)</label>
                        <input type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="border p-2 w-full rounded" min="1" max="50" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Time Filter</label>
                        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="border p-2 w-full rounded">
                            <option value="all">All Time</option>
                            <option value="weekly">Past Week</option>
                            <option value="monthly">Past Month</option>
                            <option value="yearly">Past Year</option>
                        </select>
                    </div>
                    <button onClick={handleSearch} disabled={!center} className="bg-blue-600 text-white font-bold py-2 rounded shadow hover:bg-blue-700 disabled:bg-gray-400">
                        Analyze Zone
                    </button>
                </div>
            </div>
        </div>
    );
};
export default RadiusSelector;
