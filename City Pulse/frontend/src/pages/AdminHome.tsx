import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  ArrowUp,
  ChevronsUpDown,
  Edit,
  Search,
  Trash2,
  User,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { VITE_BACKEND_URL } from "../config/config";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import { motion } from "framer-motion";
import Player from "lottie-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import AnalyticsPanel from "../components/AnalyticsPanel";
import NotificationSender from "../components/NotificationSender";
import IssueMapView from "../components/IssueMapView";
import starloader from "../assets/animations/starloder.json";
import { useLoader } from "../contexts/LoaderContext";
import { getAuthorityLabel } from "../utils/authorityLabels";

interface Issues {
  _id: string;
  title: string;
  description: string;
  type: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  reportedBy: string;
  reportedAt: string;
  image: string;
  status: string;
  upvotes: string[];
  assignedDepartment?: string;
}

import { useNavigate } from "react-router-dom";

const AdminHome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("auth_role");
    if (role === "MAIN_ADMIN") {
      navigate("/main-admin-dashboard", { replace: true });
    }
  }, [navigate]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<Issues[]>([]);
  const [workerForm, setWorkerForm] = useState({ fullName: "", email: "", password: "", phonenumber: "" });
  const [health, setHealth] = useState<any>(null);
  const { hideLoader } = useLoader();

  // Assignment Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssignIssue, setSelectedAssignIssue] = useState<Issues | null>(null);
  const [assignablePersonnel, setAssignablePersonnel] = useState<{ departmentAdmins: any[], workers: any[] } | null>(null);
  const [loadingPersonnel, setLoadingPersonnel] = useState(false);

  // 24 hours deadline
  const ASSIGNMENT_DEADLINE_MS = 24 * 60 * 60 * 1000;

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch(`${VITE_BACKEND_URL}/api/v1/all-issues`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });
        const data = await response.json();
        if (Array.isArray(data.issues)) {
          setIssues(data.issues);
        } else {
          setIssues([]);
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
        setIssues([]);
      } finally {
        setLoading(false);
        hideLoader();
      }
    };

    fetchIssues();

    const fetchHealth = async () => {
      try {
        const res = await fetch(`${VITE_BACKEND_URL}/api/v1/health`);
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        } else {
          setHealth(null);
        }
      } catch (err) {
        setHealth(null);
      }
    };
    fetchHealth();
  }, [hideLoader]);

  const handleOpenAssignModal = async (issue: Issues) => {
    setSelectedAssignIssue(issue);
    setIsAssignModalOpen(true);
    setLoadingPersonnel(true);
    try {
      const response = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/assignable-personnel/${issue.assignedDepartment}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
      });
      const data = await response.json();
      if (data.success) {
        setAssignablePersonnel(data.data);
      }
    } catch (e) { console.error("Error fetching personnel:", e) }
    setLoadingPersonnel(false);
  };

  const handleAssignSubmit = async (assigneeId: string, role: string) => {
    try {
      const response = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${selectedAssignIssue?._id}/override-assignee`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: JSON.stringify({ assigneeId, role })
      });
      if (response.ok) {
        alert("Assignment successful!");
        setIsAssignModalOpen(false);
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.message || "Assignment failed");
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${VITE_BACKEND_URL}/api/v1/worker/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(workerForm),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Worker created successfully!");
        setWorkerForm({ fullName: "", email: "", password: "", phonenumber: "" });
      } else {
        alert(data.message || "Failed to create worker");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    }
  };

  const handleStatusUpdate = async (issueId: string, status: string) => {
    try {
      const response = await fetch(
        `${VITE_BACKEND_URL}/api/v1/admin/issue/${issueId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setIssues((prev) =>
          prev.map((i) => (i._id === issueId ? { ...i, status } : i))
        );
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error updating issue status:", error);
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      const response = await fetch(
        `${VITE_BACKEND_URL}/api/v1/issue/admin/${issueId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setIssues((prev) => prev.filter((i) => i._id !== issueId));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error deleting issue:", error);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    const searchMatch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch =
      statusFilters.length === 0 || statusFilters.includes(issue.status);
    return searchMatch && statusMatch;
  });

  const unresolvedIssues = filteredIssues
    .filter((i) => i.status !== "Resolved")
    .sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0));

  const resolvedIssues = filteredIssues
    .filter((i) => i.status === "Resolved")
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION":
        return "bg-purple-100 text-purple-800 border-purple-200 animate-pulse";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white">
        <Player
          autoplay
          loop
          animationData={starloader}
          style={{ height: "200px", width: "200px" }}
        />
        <p className="text-muted-foreground mt-4 animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-background"
    >
      <div className="min-h-screen bg-transparent">
        <HeaderAfterAuth />

        <div className="pt-20 container mx-auto px-4 py-8 space-y-8">
          {/* Welcome Section with Profile Link */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0577b7] ">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage and resolve community issues • <span className="font-semibold text-blue-600">Authority: {getAuthorityLabel(localStorage.getItem("admin_department") || "Fetching...")}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              {localStorage.getItem("admin_role") === "MAIN_ADMIN" && (
                <Button
                  variant="destructive"
                  className="flex items-center space-x-2 shadow-lg animate-pulse"
                  onClick={async () => {
                    if (window.confirm("ARE YOU SURE? This sends a system-wide EMERGENCY broadcast to ALL citizens!")) {
                      await fetch(`${VITE_BACKEND_URL}/api/v1/notifications/disaster-broadcast`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
                      });
                      alert("Disaster broadcast initiated.");
                    }
                  }}
                >
                  🚀 Disaster Mode
                </Button>
              )}
              <Link to="/admin/profile">
                <Button
                  variant="outline"
                  className="flex items-center space-x-2 shadow-sm text-slate-500 "
                >
                  <User className="h-4 w-4 text-purple-700" />
                  <span>My Profile</span>
                </Button>
              </Link>
              {localStorage.getItem("admin_role") === "MAIN_ADMIN" ? (
                <Link to="/main-admin-escalations">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg">
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Escalation Queue
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => setStatusFilters(["AWAITING_DEPARTMENT_ADMIN_CONFIRMATION"])}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verification Queue
                </Button>
              )}
            </div>
          </div>

          {/* PART 15: Health Bar */}
          {health && (
            <div className="bg-slate-900 text-white p-2 px-4 rounded-full flex items-center justify-between text-[10px] font-bold tracking-widest uppercase opacity-80">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> System {health.status}</span>
                <span>Uptime: {Math.floor(health.uptime / 3600)}h</span>
                <span>DB: {health.dbStatus}</span>
              </div>
              <div className="flex gap-2">
                {health.engines?.map((e: string) => <span key={e} className="bg-slate-700 px-2 py-0.5 rounded">⚙️ {e} Engine</span>)}
              </div>
            </div>
          )}

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
            <div className="p-6 rounded-lg border shadow-lg bg-card  hover:scale-[1.02] transition-transform hover:shadow-xl transition-shadow duration-300  ">
              <div className="text-2xl font-bold text-foreground  ">
                {issues.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Issues</p>
            </div>
            <div className="p-6 rounded-lg border shadow-lg bg-card hover:scale-[1.02] transition-transform hover:shadow-xl transition-shadow duration-300 ">
              <div className="text-2xl font-bold text-green-600">
                {issues.filter((issue) => issue.status === "Resolved").length}
              </div>
              <p className="text-sm text-muted-foreground">Resolved Issues</p>
            </div>
            <div className="p-6 rounded-lg border shadow-lg bg-card hover:scale-[1.02] transition-transform hover:shadow-xl transition-shadow duration-300 ">
              <div className="text-2xl font-bold text-blue-600">
                {
                  issues.filter((issue) => issue.status === "In Progress")
                    .length
                }
              </div>
              <p className="text-sm text-muted-foreground">
                Issues In Progress
              </p>
            </div>
            <div className="p-6 rounded-lg border shadow-lg bg-card hover:scale-[1.02] transition-transform hover:shadow-xl transition-shadow duration-300 ">
              <div className="text-2xl font-bold text-yellow-600">
                {issues.filter((issue) => issue.status === "Pending").length}
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>

          <Tabs defaultValue="issues" className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-5 mx-auto mb-8 bg-white/70 dark:bg-gray-500 dark:border-white/10 shadow border">
              <TabsTrigger value="issues">Manage Issues</TabsTrigger>
              <TabsTrigger value="map">Interactive Map</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="notifications">Send Alert</TabsTrigger>
              <TabsTrigger value="workers">Add Worker</TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="mt-0">
              <IssueMapView issues={issues} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AnalyticsPanel />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationSender />
            </TabsContent>

            <TabsContent value="workers" className="mt-0">
              <Card className="max-w-xl mx-auto shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl text-sky-700">Register Field Worker</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateWorker} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Full Name</label>
                      <Input value={workerForm.fullName} onChange={e => setWorkerForm({ ...workerForm, fullName: e.target.value })} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email Address</label>
                      <Input type="email" value={workerForm.email} onChange={e => setWorkerForm({ ...workerForm, email: e.target.value })} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Temporary Password</label>
                      <Input type="password" value={workerForm.password} onChange={e => setWorkerForm({ ...workerForm, password: e.target.value })} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input value={workerForm.phonenumber} onChange={e => setWorkerForm({ ...workerForm, phonenumber: e.target.value })} required />
                    </div>
                    <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">Create Worker Account</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="mt-0 space-y-8">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 ">
                <div className="relative w-full md:w-80 shadow-sm rounded">
                  <Search className="absolute  left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 shadow-sm text-slate-600"
                      >
                        Status <ChevronsUpDown className="h-4 w-4 text-gray-500 " />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuCheckboxItem
                        checked={statusFilters.includes("Rejected")}
                        onCheckedChange={(checked) =>
                          setStatusFilters((prev) =>
                            checked
                              ? [...prev, "Rejected"]
                              : prev.filter((s) => s !== "Rejected")
                          )
                        }
                      >
                        Rejected
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={statusFilters.includes("In Progress")}
                        onCheckedChange={(checked) =>
                          setStatusFilters((prev) =>
                            checked
                              ? [...prev, "In Progress"]
                              : prev.filter((s) => s !== "In Progress")
                          )
                        }
                      >
                        In Progress
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={statusFilters.includes("Resolved")}
                        onCheckedChange={(checked) =>
                          setStatusFilters((prev) =>
                            checked
                              ? [...prev, "Resolved"]
                              : prev.filter((s) => s !== "Resolved")
                          )
                        }
                      >
                        Resolved
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={statusFilters.includes("Pending")}
                        onCheckedChange={(checked) =>
                          setStatusFilters((prev) =>
                            checked
                              ? [...prev, "Pending"]
                              : prev.filter((s) => s !== "Pending")
                          )
                        }
                      >
                        Pending
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={statusFilters.includes("AWAITING_DEPARTMENT_ADMIN_CONFIRMATION")}
                        onCheckedChange={(checked) =>
                          setStatusFilters((prev) =>
                            checked
                              ? [...prev, "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION"]
                              : prev.filter((s) => s !== "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION")
                          )
                        }
                      >
                        Awaiting Verification
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Issues Queue Sections */}
              <div className="space-y-12">
                {/* UNRESOLVED SECTION */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-l-4 border-[#0577b7] pl-4 py-1">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Issues Queue</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
                      {unresolvedIssues.length} Pending Actions
                    </Badge>
                  </div>

                  <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="font-bold text-slate-700">Issue Details</TableHead>
                          <TableHead className="font-bold text-slate-700">Location</TableHead>
                          <TableHead className="font-bold text-slate-700">Community Support</TableHead>
                          <TableHead className="font-bold text-slate-700">Status</TableHead>
                          <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unresolvedIssues.map((issue) => (
                          <TableRow key={issue._id} className="hover:bg-slate-50/30 transition-colors">
                            <TableCell className="font-semibold text-slate-800">{issue.title}</TableCell>
                            <TableCell className="text-slate-500 text-xs">{issue.location.address}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-50 w-fit px-2 py-1 rounded-md">
                                <ArrowUp className="h-3 w-3" />
                                <span>{issue.upvotes?.length || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(issue.status)} font-bold text-[10px] uppercase tracking-wide`}>
                                {issue.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                                      <Edit className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <button onClick={() => handleStatusUpdate(issue._id, "In Progress")} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Set In Progress</button>
                                    <button onClick={() => handleStatusUpdate(issue._id, "Rejected")} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Reject Issue</button>
                                    <button onClick={() => handleStatusUpdate(issue._id, "Pending")} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Move to Pending</button>
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                {/* For assign logic */}
                                {(() => {
                                  let isMainAdmin = false;
                                  try {
                                    isMainAdmin = localStorage.getItem("admin_role") === "MAIN_ADMIN";
                                  } catch (err) { }
                                  const isPastDue = Date.now() - new Date(issue.reportedAt).getTime() > ASSIGNMENT_DEADLINE_MS;

                                  if (isMainAdmin) {
                                    if (!isPastDue) {
                                      return (
                                        <Button disabled title="Within Department Grace Period (24h)" variant="outline" size="sm" className="opacity-50 cursor-not-allowed font-bold h-8 text-[11px] grayscale">
                                          Assign
                                        </Button>
                                      );
                                    }
                                    return (
                                      <Button onClick={() => handleOpenAssignModal(issue)} variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 font-bold h-8 text-[11px]">
                                        Assign MAIN
                                      </Button>
                                    );
                                  }

                                  return (
                                    <Link to={`/admin/assign-worker/${issue._id}`}>
                                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 font-bold h-8 text-[11px]">
                                        Assign
                                      </Button>
                                    </Link>
                                  );
                                })()}

                                {issue.status === "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION" && (
                                  <Link to={`/admin-review/${issue._id}`}>
                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-8 text-[11px]">
                                      Verify
                                    </Button>
                                  </Link>
                                )}

                                <Button variant="ghost" size="icon" onClick={() => handleDeleteIssue(issue._id)} className="hover:bg-rose-50">
                                  <Trash2 className="h-4 w-4 text-slate-300 hover:text-rose-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* RESOLVED SECTION */}
                <div className="space-y-4 opacity-80">
                  <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Resolved Archive</h3>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">
                      {resolvedIssues.length} Completed Records
                    </Badge>
                  </div>

                  <div className="rounded-xl border bg-slate-50/50 shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader className="bg-emerald-50/30">
                        <TableRow>
                          <TableHead className="font-bold text-emerald-800">Issue Record</TableHead>
                          <TableHead className="font-bold text-emerald-800">Location</TableHead>
                          <TableHead className="font-bold text-emerald-800">Status</TableHead>
                          <TableHead className="text-right font-bold text-emerald-800">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resolvedIssues.map((issue) => (
                          <TableRow key={issue._id} className="bg-white/50 border-b border-white/20">
                            <TableCell className="font-semibold text-slate-500 italic">{issue.title}</TableCell>
                            <TableCell className="text-slate-400 text-xs">{issue.location.address}</TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-500 text-white border-0 font-bold text-[10px] uppercase tracking-wide">
                                Resolved ✔
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2 grayscale border-l pl-4 ml-4">
                                <Button title="Issue already resolved" variant="ghost" size="icon" disabled className="cursor-not-allowed">
                                  <Edit className="h-4 w-4 opacity-40" />
                                </Button>

                                <Button disabled title="Issue already resolved" variant="outline" size="sm" className="opacity-40 cursor-not-allowed h-8 text-[11px]">
                                  Assign
                                </Button>

                                <Button title="Resolved records cannot be deleted" variant="ghost" size="icon" disabled className="cursor-not-allowed">
                                  <Trash2 className="h-4 w-4 opacity-40" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Assignment Modal UI */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl bg-white shadow-xl max-h-[80vh] flex flex-col">
            <CardHeader className="border-b bg-slate-50 flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-slate-800">Assign: {selectedAssignIssue?.title}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsAssignModalOpen(false)}>Close</Button>
            </CardHeader>
            <CardContent className="overflow-y-auto p-4 space-y-6">
              {loadingPersonnel ? (
                <p className="text-center text-slate-500 animate-pulse py-8">Fetching available personnel...</p>
              ) : (
                <>
                  {/* Department Admins */}
                  <div>
                    <h3 className="font-bold text-slate-700 border-b pb-2 mb-3">Department Admins</h3>
                    {assignablePersonnel?.departmentAdmins?.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No department admins found for this department yet</p>
                    ) : (
                      <div className="space-y-2">
                        {assignablePersonnel?.departmentAdmins?.map(admin => (
                          <div key={admin._id} className="flex items-center justify-between p-2 rounded border bg-slate-50">
                            <div>
                              <p className="font-semibold text-sm">{admin.fullName}</p>
                              <p className="text-xs text-slate-500">{admin.email}</p>
                            </div>
                            <Button size="sm" onClick={() => handleAssignSubmit(admin._id, "DEPARTMENT_ADMIN")} className="bg-sky-600 hover:bg-sky-700 h-7 text-xs">Assign</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Department Workers */}
                  <div>
                    <h3 className="font-bold text-slate-700 border-b pb-2 mb-3">Department Workers</h3>
                    {assignablePersonnel?.workers?.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No workers found for this department yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {assignablePersonnel?.workers?.map(worker => (
                          <div key={worker._id} className="flex items-center justify-between p-2 rounded border bg-slate-50">
                            <div>
                              <p className="font-semibold text-sm">{worker.fullName}</p>
                              <p className="text-xs text-slate-500">{worker.phonenumber || worker.email}</p>
                            </div>
                            <Button size="sm" onClick={() => handleAssignSubmit(worker._id, "WORKER")} className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs">Assign</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </motion.div>
  );
};

export default AdminHome;
