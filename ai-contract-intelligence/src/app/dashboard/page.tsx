"use client";

import { useAuth } from "@/context/AuthContext";
import { CompanyFilter } from "@/components/dashboard/CompanyFilter";
import { TrafficLightWidget } from "@/components/dashboard/TrafficLightWidget";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
    const { user, userData, loading } = useAuth();
    const [selectedCompany, setSelectedCompany] = useState<string>('all');

    if (loading) return <div className="flex h-screen items-center justify-center">Loading Authority Protocol...</div>;

    if (!user) {
        return (
            <div className="h-screen flex flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-bold">AI Contract Intelligence</h1>
                <p>Please sign in to access the secure vault.</p>
                {/* Placeholder login button - in real app would trigger Auth flow */}
                <Button>Sign In with Corporate ID</Button>
            </div>
        );
    }

    // Mock data for dashboard
    const stats = {
        highRisk: 3,
        mediumRisk: 12,
        processed: 145
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Dashboard</h1>
                    <p className="text-slate-500">Welcome back, {userData?.fullName || user.email}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Settings</Button>
                    <Button>+ New Analysis</Button>
                </div>
            </header>

            <CompanyFilter selectedCompany={selectedCompany} onSelectCompany={setSelectedCompany} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <TrafficLightWidget riskLevel="HIGH" count={stats.highRisk} />
                <TrafficLightWidget riskLevel="MEDIUM" count={stats.mediumRisk} />
                <TrafficLightWidget riskLevel="LOW" count={stats.processed} />
                {/* Placeholder for "Processing" */}
                <div className="bg-blue-600 rounded-lg text-white p-6 shadow-lg flex flex-col justify-between">
                    <span className="uppercase text-xs font-bold opacity-70">System Status</span>
                    <div className="text-2xl font-bold">AI Active</div>
                    <div className="text-sm opacity-80">Connected to Claude 3.5 Sonnet</div>
                </div>
            </div>

            <section>
                <h2 className="text-xl font-semibold mb-4">Recent Contracts</h2>
                <div className="bg-white rounded-lg shadow border p-4">
                    <p className="text-gray-500 text-sm">Table of recent uploads filtered by {selectedCompany}...</p>
                    {/* List would go here */}
                    <div className="mt-4 space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded border-b last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-red-600 text-xs font-bold">PDF</div>
                                    <div>
                                        <div className="font-medium">Service Agreement v{i}.0 - Vendor X</div>
                                        <div className="text-xs text-gray-500">Uploaded 2h ago by Mario Rossi</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">Review Pending</span>
                                    <Link href="/editor/demo">
                                        <Button size="sm" variant="ghost">Analyze</Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
