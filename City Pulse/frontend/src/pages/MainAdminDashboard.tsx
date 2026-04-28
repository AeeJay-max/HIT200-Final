import { useState, useEffect } from "react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { SystemOverviewPanel, SystemHealthBadge, DepartmentPerformancePanel } from "../components/dashboard/OverviewPanels";
import { EscalationPanel, OverdueIssuesPanel } from "../components/dashboard/ActionableQueues";
import { ActivityFeedPanel } from "../components/dashboard/ActivityFeed";
import { VerificationWorkflowPanel, RecentlyResolvedPanel, AnalyticsSummaryPanel, DashboardMapPanel } from "../components/dashboard/ExtendedPanels";
import { WorkflowQueues } from "../components/dashboard/WorkflowQueues";
import { PersonnelControlPanel } from "../components/dashboard/PersonnelControlPanel";
import { IssueActionDrawer } from "../components/dashboard/IssueActionDrawer";
import NotificationSender from "../components/NotificationSender";

import { Button } from "../components/ui/button";
import { LayoutDashboard, CheckSquare, ShieldAlert, BadgeCheck, Building2, Users, PieChart, Map, Activity, BellRing, Filter, Menu, X as CloseIcon, GripVertical } from "lucide-react";

const STANDARD_DEPARTMENTS = [
    "Roads Department",
    "Water Department",
    "Sanitation Department",
    "Electrical Department",
    "City Council",
    "ZINWA",
    "ZESA",
    "EMA",
    "TSCZ"
];

// Apply global fetch interceptor to automatically append URL search parameters bounds to Admin Dashboard fetching logic.
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    let [resource, config] = args;
    if (typeof resource === "string" && resource.includes("/api/v1/dashboard/main-admin") && window.location.search) {
        const separator = resource.includes("?") ? "&" : "?";
        resource += separator + window.location.search.substring(1);
    }
    return originalFetch(resource, config);
};

export default function MainAdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
    const [isActivityOpen, setIsActivityOpen] = useState(false); // Mobile/Md activity toggle
    const [drawerMode, setDrawerMode] = useState<"control" | "assign">("control");

    // Layout persistence
    const savedLayout = localStorage.getItem("mainAdminLayoutConfig");
    const initialLayout = savedLayout ? JSON.parse(savedLayout) : [20, 60, 20];

    const [screenSize, setScreenSize] = useState('lg');

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setScreenSize('sm');
            else if (window.innerWidth < 1280) setScreenSize('md');
            else setScreenSize('lg');
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const NAV_ITEMS = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'issues', label: 'Issue Control', icon: CheckSquare },
        { id: 'escalations', label: 'Escalations', icon: ShieldAlert },
        { id: 'verification', label: 'Verification', icon: BadgeCheck },
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'personnel', label: 'Personnel', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: PieChart },
        { id: 'map', label: 'Map View', icon: Map },
        { id: 'health', label: 'System Health', icon: Activity },
        { id: 'alerts', label: 'Alerts', icon: BellRing }
    ];

    const searchParams = new window.URLSearchParams(window.location.search);
    const [globalFilters, setGlobalFilters] = useState<any>({
        department: searchParams.get("department") || "",
        status: searchParams.get("status") || "",
        daterange: searchParams.get("daterange") || ""
    });

    const handleApplyFilters = () => {
        const params = new window.URLSearchParams();
        if (globalFilters.department) params.set("department", globalFilters.department);
        if (globalFilters.status) params.set("status", globalFilters.status);
        if (globalFilters.daterange) params.set("daterange", globalFilters.daterange);
        window.location.search = params.toString();
    };

    const handleOpenDrawer = (issue: any, mode: "control" | "assign" = "control") => {
        setSelectedIssueId(issue._id);
        setDrawerMode(mode);
    };

    const handleActionSuccess = () => { };

    const renderMainContent = () => (
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6 border-r h-full">
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <SystemOverviewPanel />
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <EscalationPanel onIssueClick={handleOpenDrawer} />
                        <OverdueIssuesPanel onIssueClick={handleOpenDrawer} />
                    </div>
                </div>
            )}
            {activeTab === 'issues' && <WorkflowQueues onAssignClick={(issue) => handleOpenDrawer(issue, "assign")} />}
            {activeTab === 'escalations' && <EscalationPanel onIssueClick={handleOpenDrawer} />}
            {activeTab === 'verification' && <VerificationWorkflowPanel onIssueClick={handleOpenDrawer} />}
            {activeTab === 'departments' && <DepartmentPerformancePanel />}
            {activeTab === 'personnel' && <PersonnelControlPanel />}
            {activeTab === 'analytics' && <AnalyticsSummaryPanel />}
            {activeTab === 'map' && <DashboardMapPanel />}
            {activeTab === 'health' && (
                <div className="p-8"><SystemHealthBadge /></div>
            )}
            {activeTab === 'alerts' && (
                <div className="space-y-6">
                    <NotificationSender />
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <OverdueIssuesPanel onIssueClick={(issue) => handleOpenDrawer(issue, "assign")} />
                        <RecentlyResolvedPanel onIssueClick={handleOpenDrawer} />
                    </div>
                </div>
            )}
        </main>
    );

    const Sidebar = () => (
        <aside className="h-full bg-slate-900 text-slate-300 flex flex-col shrink-0 overflow-y-auto w-full">
            <div className="p-4 pt-6 uppercase text-[10px] font-black tracking-widest text-slate-500 hidden xl:block">Navigation</div>
            <nav className="flex-1 space-y-1 px-2 pb-4 pt-4 xl:pt-0">
                {NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (screenSize === 'sm') setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-sky-600 text-white shadow' : 'hover:bg-slate-800 hover:text-white'}`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className={screenSize === 'md' ? 'hidden' : 'block'}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );

    const ActivityPane = () => (
        <aside className="h-full bg-white shrink-0 flex flex-col border-l z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] w-full">
            <div className="px-4 py-3 border-b bg-slate-50 shrink-0 flex items-center justify-between">
                <span className="font-black text-sm text-slate-800 uppercase tracking-tight">Live Activity Feed</span>
                <Activity className="w-4 h-4 text-sky-600 animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                <ActivityFeedPanel />
            </div>
        </aside>
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 relative">
            {/* HEADER */}
            <div className="shrink-0">
                <HeaderAfterAuth />
            </div>

            {/* System Status Top Bar */}
            <div className="bg-white border-b px-4 py-2 flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-2 xl:gap-6">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 xl:hidden hover:bg-slate-100 rounded">
                        <Menu className="w-5 h-5 text-slate-600" />
                    </button>
                    <h1 className="font-black text-slate-800 text-sm md:text-lg uppercase tracking-tight truncate max-w-[150px] md:max-w-none">Control Center</h1>
                    <div className="hidden md:block"><SystemHealthBadge /></div>
                </div>
                <div className="flex gap-1 md:gap-2 items-center">
                    <div className="hidden lg:flex items-center gap-2 border-r pr-4">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select className="text-xs border p-1 rounded bg-slate-50" onChange={e => setGlobalFilters((p: any) => ({ ...p, department: e.target.value }))}>
                            <option value="">All Departments</option>
                            {STANDARD_DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                        </select>
                        <select className="text-xs border p-1 rounded bg-slate-50" onChange={e => setGlobalFilters((p: any) => ({ ...p, status: e.target.value }))}>
                            <option value="">All Statuses</option>
                            <option>SUBMITTED</option>
                            <option>IN_PROGRESS</option>
                            <option>Resolved</option>
                        </select>
                        <Button size="sm" className="bg-slate-800 hover:bg-slate-900 h-7 text-[10px]" onClick={handleApplyFilters}>Apply</Button>
                    </div>
                    <Button size="sm" variant="destructive" className="h-7 text-[10px]" onClick={() => setActiveTab("alerts")}><BellRing className="w-3 h-3 mr-1" /><span className="hidden md:inline">Alerts</span></Button>
                    <button onClick={() => setIsActivityOpen(!isActivityOpen)} className="p-2 xl:hidden hover:bg-slate-100 rounded">
                        <Activity className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Sidebar Overlay */}
                {screenSize === 'sm' && isSidebarOpen && (
                    <div className="absolute inset-0 bg-black/50 z-[40] transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />
                )}

                {/* Responsive Layout Engine */}
                {screenSize === 'lg' ? (
                    <PanelGroup orientation="horizontal" onLayoutChanged={(layout: any) => localStorage.setItem("mainAdminLayoutConfig", JSON.stringify(layout))}>
                        <Panel defaultSize={initialLayout[0]} minSize={15}>
                            <Sidebar />
                        </Panel>
                        <PanelResizeHandle className="w-1.5 hover:bg-sky-400 bg-slate-200 transition-colors flex items-center justify-center">
                            <GripVertical className="w-3 h-3 text-slate-400" />
                        </PanelResizeHandle>
                        <Panel defaultSize={initialLayout[1]}>
                            {renderMainContent()}
                        </Panel>
                        <PanelResizeHandle className="w-1.5 hover:bg-sky-400 bg-slate-200 transition-colors flex items-center justify-center">
                            <GripVertical className="w-3 h-3 text-slate-400" />
                        </PanelResizeHandle>
                        <Panel defaultSize={initialLayout[2]} minSize={15}>
                            <ActivityPane />
                        </Panel>
                    </PanelGroup>
                ) : (
                    <div className="flex flex-1 overflow-hidden relative">
                        {/* MD Left Sidebar (Collapsed) */}
                        <div className={`${screenSize === 'sm' ? (isSidebarOpen ? 'w-64 fixed inset-y-0 left-0 transition-transform z-[50]' : 'hidden') : 'w-16'} bg-slate-900 shrink-0 border-r h-full`}>
                            <Sidebar />
                        </div>
                        {/* MD Center */}
                        {renderMainContent()}
                        {/* MD Right Activity Feed (Drawer) */}
                        {isActivityOpen && (
                            <div className="fixed inset-y-0 right-0 w-80 bg-white z-[50] shadow-2xl transition-transform transform translate-x-0">
                                <div className="flex h-full flex-col">
                                    <div className="p-2 border-b flex justify-end">
                                        <button onClick={() => setIsActivityOpen(false)} className="p-1 hover:bg-slate-100 rounded"><CloseIcon className="w-5 h-5" /></button>
                                    </div>
                                    <div className="flex-1 overflow-hidden"><ActivityPane /></div>
                                </div>
                            </div>
                        )}
                        {(isActivityOpen || (isSidebarOpen && screenSize === 'sm')) && (
                            <div className="fixed inset-0 bg-black/20 z-[45]" onClick={() => { setIsActivityOpen(false); setIsSidebarOpen(false); }} />
                        )}
                    </div>
                )}
            </div>

            {/* BOTTOM PANEL (Resizable Horizontal Array) 
            <div className="h-[30vh] min-h-[200px] border-t-2 border-slate-200 bg-white shrink-0 relative z-20 flex flex-col">
                <PanelGroup orientation="horizontal" onLayoutChanged={(layout: any) => localStorage.setItem("mainAdminBottomLayoutConfig", JSON.stringify(layout))}>
                    <Panel defaultSize={initialBottomLayout[0]} minSize={10} className="p-4 overflow-y-auto bg-slate-50/50 border-r">
                        <AnalyticsSummaryPanel />
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-sky-400 transition-colors flex items-center justify-center">
                        <GripVertical className="w-3 h-3 text-slate-400" />
                    </PanelResizeHandle>
                    <Panel defaultSize={initialBottomLayout[1]} minSize={20} className="relative">
                        <DashboardMapPanel />
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-slate-200 hover:bg-sky-400 transition-colors flex items-center justify-center">
                        <GripVertical className="w-3 h-3 text-slate-400" />
                    </PanelResizeHandle>
                    <Panel defaultSize={initialBottomLayout[2]} minSize={10} className="p-4 overflow-y-auto bg-slate-50/50 border-l">
                        <DepartmentPerformancePanel />
                    </Panel>
                </PanelGroup>
            </div>*/}

            <IssueActionDrawer
                issueId={selectedIssueId}
                initialMode={drawerMode}
                onClose={() => setSelectedIssueId(null)}
                onActionSuccess={handleActionSuccess}
            />
        </div >
    );
}
