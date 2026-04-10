import React from "react";
import { useQuery } from "@tanstack/react-query";
import { VITE_BACKEND_URL } from "../config/config";
import { format } from "date-fns";

interface Props {
    issueId: string;
}

const IssueTrackingTimeline: React.FC<Props> = ({ issueId }) => {
    const { data: tracking, isLoading } = useQuery({
        queryKey: ["issue_tracking", issueId],
        queryFn: async () => {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/tracking`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return await res.json();
        }
    });

    if (isLoading) return <div className="p-4 text-center">Loading timeline...</div>;
    if (!tracking) return null;

    const steps = ["Reported", "Assigned", "In Progress", "Verified", "Resolved"];
    const currentStepIndex = steps.indexOf(tracking.statusTimeline);

    return (
        <div className="bg-white p-6 rounded-lg shadow mt-4">
            <h3 className="text-xl font-bold mb-6">Issue Tracker</h3>

            {tracking.isOverdue && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded font-semibold border border-red-200">
                    OVERDUE WARNING: This issue has missed its smart timeline deadline.
                </div>
            )}

            {/* Progress Bar */}
            <div className="relative pt-1 mb-8">
                <div className="flex mb-2 items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                            {tracking.progressPercentage}%
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-blue-600">
                            {tracking.statusTimeline}
                        </span>
                    </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                    <div style={{ width: `${tracking.progressPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                    <p><span className="font-semibold text-gray-900">Current Status:</span> {tracking.statusTimeline}</p>
                    <p><span className="font-semibold text-gray-900">Assigned Department:</span> {tracking.assignedDepartment?.name || "Not Assigned"}</p>
                </div>
                <div>
                    <p><span className="font-semibold text-gray-900">Department Admin:</span> {tracking.assignedDeptAdmin?.fullName || "Awaiting Assignment"}</p>
                    <p><span className="font-semibold text-gray-900">Field Worker:</span> {tracking.assignedWorker?.fullName || "Awaiting Assignment"} {tracking.assignedWorker?.phonenumber ? `(${tracking.assignedWorker.phonenumber})` : ""}</p>
                    {tracking.expectedCompletionDate && (
                        <p><span className="font-semibold text-gray-900">Expected Resolution:</span> {format(new Date(tracking.expectedCompletionDate), "PP")}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default IssueTrackingTimeline;
