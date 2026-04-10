import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VITE_BACKEND_URL } from "../config/config";
import { toast } from "sonner";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";

const MaintenanceQueue: React.FC = () => {
    const token = localStorage.getItem("auth_token");
    const queryClient = useQueryClient();

    const { data: issues, isLoading } = useQuery({
        queryKey: ["maintenance-queue"],
        queryFn: async () => {
            // Fetching from all issues and filtering on the client for simplicity since the backend route wasn't specifically provided
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/all-issues`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            const list = data.issues || data.data || [];
            return list.filter((i: any) => i.status === "maintenance_queue");
        }
    });

    const reclassifyMutation = useMutation({
        mutationFn: async ({ issueId, status }: { issueId: string, status: string }) => {
            const res = await fetch(`${VITE_BACKEND_URL}/api/v1/admin/issue/${issueId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("Failed to update status");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Issue reclassified successfully");
            queryClient.invalidateQueries({ queryKey: ["maintenance-queue"] });
        },
        onError: () => {
            toast.error("Error reclassifying issue");
        }
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <HeaderAfterAuth />
            <div className="container mx-auto p-4 pt-24 max-w-5xl">
                <h1 className="text-3xl font-bold mb-2">Long-Term Maintenance Queue</h1>
                <p className="text-gray-600 mb-8">Review non-dangerous logistical issues (such as minor potholes) parked for future seasonal maintenance.</p>

                {isLoading ? (
                    <div className="text-center p-8">Loading Maintenance Queue...</div>
                ) : issues && issues.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {issues.map((issue: any) => (
                            <Card key={issue._id} className="shadow-sm border border-gray-200">
                                <CardHeader className="bg-orange-50 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg text-orange-900">{issue.title}</CardTitle>
                                            <CardDescription className="line-clamp-1">{issue.location?.address}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <p className="text-sm text-gray-700 mb-4 h-10 line-clamp-2">{issue.description}</p>

                                    {/* Pothole Specs if it's a pothole */}
                                    {issue.potholeDetails && (
                                        <div className="mb-4 text-xs bg-gray-100 p-2 rounded">
                                            <p><strong>Diameter:</strong> {issue.potholeDetails.diameter} cm</p>
                                            <p><strong>Depth:</strong> {issue.potholeDetails.depth} cm</p>
                                            <p><strong>Highway:</strong> {issue.potholeDetails.isOnHighway ? 'Yes' : 'No'}</p>
                                        </div>
                                    )}

                                    <div className="flex space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-blue-600 border-blue-200"
                                            onClick={() => reclassifyMutation.mutate({ issueId: issue._id, status: "reported" })}
                                        >
                                            Promote to Active Queue
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-12 text-center rounded shadow border text-gray-500 text-xl font-medium">
                        No issues currently inside the maintenance queue.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaintenanceQueue;
