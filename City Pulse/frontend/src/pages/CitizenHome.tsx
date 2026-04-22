import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Search, Plus, MapPin, User, X, Calendar, Clock, ShieldCheck, Briefcase, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { VITE_BACKEND_URL } from "../config/config";
import Player from "lottie-react";
import emptyAnimation from "../assets/animations/empty.json";
import HeaderAfterAuth from "../components/HeaderAfterAuth";
import starloader from "../assets/animations/starloder.json";
import { motion } from "framer-motion";
import { useLoader } from "../contexts/LoaderContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import NotificationFeed from "../components/NotificationFeed";
import { Badge } from "../components/ui/badge";
import { getAuthorityLabel } from "../utils/authorityLabels";

interface Issues {
  _id: string;
  title: string;
  description: string;
  type: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  reportedBy: string;
  reportedAt: string;
  image: string;
  status: string;
  media?: string[];
  assignedDepartment?: { name: string };
  departmentAdminAssignedBy?: { fullName: string; email: string };
  workerAssignedToFix?: { fullName: string };
  resolutionVerificationTimestamp?: string;
  workerAssignmentTimestamp?: string;
  upvotes: string[];
  workflowStage?: string;
  createdAt?: string;
  deadlineTimestamp?: string;
  escalationLevel?: number;
}

const MIN_LOADER_DURATION = 500; // Minimum loader display time (ms)

const CitizenHome = () => {
  const [searchCity, setSearchCity] = useState("");
  const [reportedIssues, setReportedIssues] = useState<Issues[]>([]);
  const [loading, setLoading] = useState(true);
  const [citizen, setCitizen] = useState<any>(null);
  const { hideLoader } = useLoader();

  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [assignmentStats, setAssignmentStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issues | null>(null);

  const handleViewStats = async (issueId: string) => {
    setStatsModalOpen(true);
    setStatsLoading(true);
    setAssignmentStats(null);
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${issueId}/assignment-stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setAssignmentStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setStatsLoading(false);
    }
  };


  const handleVote = async (id: string) => {
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/api/v1/issues/${id}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (data.success) {
        setReportedIssues(prev => prev.map(iss => iss._id === id ? { ...iss, upvotes: [...(iss.upvotes || []), "me"] } : iss));
      }
    } catch (error) {
      console.error("Vote failed", error);
    }
  };

  useEffect(() => {
    const fetchIssues = async () => {
      const startTime = Date.now();

      try {
        const response = await fetch(`${VITE_BACKEND_URL}/api/v1/all-issues`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });

        const data = await response.json();
        if (Array.isArray(data.issues)) {
          setReportedIssues(data.issues);
        } else {
          setReportedIssues([]);
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(MIN_LOADER_DURATION - elapsed, 0);

        setTimeout(() => {
          setLoading(false);
          hideLoader();
        }, delay);
      }
    };

    fetchIssues();

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${VITE_BACKEND_URL}/api/v1/citizen/profile/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        });
        const data = await res.json();
        if (data.success) setCitizen(data.user);
      } catch (err) { console.error(err); }
    };
    fetchProfile();
  }, [hideLoader]);

  const filteredIssues = searchCity
    ? reportedIssues.filter((issue) =>
      issue.location?.address.toLowerCase().includes(searchCity.toLowerCase())
    )
    : reportedIssues;

  // Group and sort issues
  const unresolvedIssues = filteredIssues
    .filter((issue) => !["Resolved", "Closed"].includes(issue.status))
    .sort((a, b) => {
      const priority: Record<string, number> = {
        "AWAITING_DEPARTMENT_ADMIN_CONFIRMATION": 0,
        "IN_PROGRESS": 1,
        "WORKER_ACCEPTED": 2,
        "ASSIGNED_TO_WORKER": 3,
        "ROUTED_TO_DEPARTMENT": 4,
        "SUBMITTED": 5,
        "Pending": 6,
        "Reported": 7
      };
      return (priority[a.status] ?? 10) - (priority[b.status] ?? 10);
    });

  const resolvedIssues = filteredIssues.filter((issue) => ["Resolved", "Closed"].includes(issue.status));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Rejected":
        return "bg-red-200/70 text-red-900";
      case "Pending":
        return "bg-yellow-200/70 text-yellow-900";
      case "Resolved":
      case "Resolved (Unverified)":
      case "Closed":
        return "bg-green-200/70 text-green-900";
      case "In Progress":
      case "Worker Assigned":
        return "bg-blue-200/70 text-blue-900";
      default:
        return "bg-gray-200/70 text-gray-900";
    }
  };

  const renderStepper = (issue: Issues) => {
    const steps = [
      { label: "Reported", active: true },
      { label: "Assigned", active: !!issue.workerAssignedToFix },
      { label: "Dispatched", active: ["In Progress", "Resolved", "Resolved (Unverified)", "Closed", "Worker Assigned"].includes(issue.status) },
      { label: "Resolved", active: ["Resolved", "Resolved (Unverified)", "Closed"].includes(issue.status) }
    ];

    const activeCount = steps.filter(s => s.active).length;
    const progressPercent = (activeCount / steps.length) * 100;

    return (
      <div className="w-full mt-4 mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-slate-500">Progress</span>
          <span className="text-xs font-bold text-emerald-600">{progressPercent}%</span>
        </div>
        <div className="flex items-center justify-between w-full relative">
          <div className="absolute top-2 left-0 w-full h-1 bg-gray-200 z-0 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center relative z-10 w-1/4">
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${step.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <span className={`text-[10px] mt-1 font-medium ${step.active ? 'text-emerald-700' : 'text-gray-400'}`}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
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
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-[#0577b7] tracking-wide">
                Welcome, Citizen!
              </h1>
              <p className="text-gray-500 mt-2 text-base">
                Help improve your community by reporting issues
              </p>
              {citizen && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reputation Score:</span>
                  <div className={`px-3 py-1 rounded-full text-xs font-black shadow-sm ${citizen.trustScore >= 150 ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300" : citizen.trustScore < 50 ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300" : "bg-blue-100 text-blue-700 ring-1 ring-blue-300"}`}>
                    ★ {citizen.trustScore} {citizen.trustScore >= 150 ? "Power Citizen" : citizen.trustScore < 50 ? "Flagged Account" : "Trusted Citizen"}
                  </div>
                </div>
              )}
            </div>
            <Link to={`/citizen/profile`}>
              <Button
                variant="outline"
                className="flex items-center space-x-2 rounded-full shadow-sm hover:shadow-md transition-all text-slate-500"
              >
                <User className="h-4 w-4 text-purple-700" />
                <span>My Profile</span>
              </Button>
            </Link>
          </div>

          <Tabs defaultValue="issues" className="w-full">
            <TabsList className="grid w-full max-w-sm grid-cols-3 mb-8 bg-white/70 dark:bg-gray-500 dark:border-white/10 shadow border mx-auto md:mx-0">
              <TabsTrigger value="issues">Recent Issues</TabsTrigger>
              <TabsTrigger value="hotspots">Hotspots Map</TabsTrigger>
              <TabsTrigger value="alerts">Local Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="alerts">
              <NotificationFeed />
            </TabsContent>

            <TabsContent value="hotspots" className="h-[600px]">
              <Card className="h-full relative overflow-hidden">
                <div className="absolute top-4 left-4 z-10 bg-white p-3 rounded-lg shadow-md max-w-xs">
                  <h3 className="font-bold text-slate-800">Hotspot Scanner</h3>
                  <p className="text-xs text-slate-500">Showing density of reports in your 10km radius</p>
                </div>
                <iframe
                  title="Map"
                  className="w-full h-full border-0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=-122.5,37.7,-122.3,37.8&layer=mapnik`}
                />
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="space-y-10">
              <div>
                <h2 className="text-2xl font-semibold text-slate-600 mb-4">
                  Search Issues by Location
                </h2>
                <div className="relative max-w-md">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 z-20"
                    aria-hidden="true"
                  />
                  <Input
                    type="text"
                    placeholder="Enter city name..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="pl-10 bg-white/70 dark:bg-gray-500 dark:border-white/10 backdrop-blur-md border border-gray-200 rounded-full placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-sky-600">
                    Recent Issues
                    {searchCity && (
                      <span className="text-lg font-normal text-gray-400 ml-2">
                        in {searchCity}
                      </span>
                    )}
                  </h2>
                  <div className="text-sm text-gray-400">
                    {filteredIssues.length} issue
                    {filteredIssues.length !== 1 ? "s" : ""} found
                  </div>
                </div>

                <div className="space-y-12">
                  {/* UNRESOLVED SECTION */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-4 py-1">
                      <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Issues To Be Resolved</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
                        {unresolvedIssues.length} Active
                      </Badge>
                    </div>
                    {unresolvedIssues.length === 0 ? (
                      <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium italic">All reported issues have been addressed!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {unresolvedIssues.map((issue) => (
                          <Card
                            key={issue._id}
                            className={`rounded-2xl bg-white/70 dark:bg-gray-500 dark:border-white/10 backdrop-blur-md border border-gray-200 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all ${issue.status === "Rejected"
                              ? "opacity-30 grayscale"
                              : "opacity-100"
                              }`}
                          >
                            <div className="relative h-48 overflow-hidden rounded-t-2xl">
                              <img
                                src={issue.image || "/placeholder.jpg"}
                                alt={issue.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                              <div
                                className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                  issue.status
                                )}`}
                              >
                                {issue.status}
                              </div>
                            </div>
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                              <CardTitle className="text-lg text-gray-800">
                                {issue.title}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVote(issue._id)}
                                className="flex items-center gap-1 text-blue-600 hover:bg-blue-50"
                              >
                                <span className="text-sm font-bold">{issue.upvotes?.length || 0}</span>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                                {issue.description}
                              </p>
                              <div className="space-y-2 text-xs text-gray-500">
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span>{issue.location.address}</span>
                                  <span className="font-medium text-teal-600">
                                    • {issue.type}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <User className="h-3 w-3 text-gray-400" />
                                  <span>Reported by {issue.reportedBy}</span>
                                </div>

                                {/* Transparency Dashboard Info */}
                                <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col space-y-1.5">
                                  {renderStepper(issue)}

                                  {!issue.workerAssignedToFix && !issue.assignedDepartment && (
                                    <div className="flex justify-between items-center text-gray-700 bg-gray-50 px-2 py-1 rounded mt-2">
                                      <span className="font-semibold text-[11px] uppercase tracking-wider text-gray-500">Assignment Status</span>
                                      <span className="font-bold text-gray-500">Not Yet Assigned</span>
                                    </div>
                                  )}

                                  {issue.assignedDepartment && (
                                    <div className="flex justify-between items-center text-slate-700 bg-slate-50 px-2 py-2 rounded mt-2 border border-slate-100 shadow-sm">
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-[10px] uppercase tracking-widest text-slate-400">Responsible Official</span>
                                        <span className="text-xs font-black text-slate-800">
                                          {issue.departmentAdminAssignedBy?.fullName || "Department Admin"}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <Badge variant="outline" className="text-[9px] bg-white border-slate-200">
                                          {getAuthorityLabel(issue.assignedDepartment.name)}
                                        </Badge>
                                      </div>
                                    </div>
                                  )}

                                  {issue.workerAssignedToFix && (
                                    <div
                                      className="flex justify-between items-center text-blue-700 bg-blue-50 px-2 py-2 rounded mt-2 cursor-pointer hover:bg-blue-100 transition-colors border border-blue-100"
                                      onClick={() => handleViewStats(issue._id)}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-[10px] uppercase tracking-widest text-blue-400">Field Technician</span>
                                        <span className="text-xs font-bold text-blue-800">{issue.workerAssignedToFix.fullName}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[9px] text-blue-400 underline font-bold tracking-tight">VIEW ANALYTICS</span>
                                      </div>
                                    </div>
                                  )}
                                  {issue.deadlineTimestamp && (
                                    <div className="flex justify-between items-center text-rose-600 bg-rose-50 px-2 py-1 rounded">
                                      <span className="font-semibold text-[11px] uppercase tracking-wider text-rose-400">SLA Deadline</span>
                                      <span className="font-bold">{new Date(issue.deadlineTimestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                    </div>
                                  )}
                                  {(issue.escalationLevel ?? 0) > 0 && (
                                    <div className="flex justify-between items-center text-orange-700 bg-orange-50 px-2 py-1 rounded font-bold">
                                      <span className="text-[11px] uppercase tracking-wider text-orange-400">Escalation Status</span>
                                      <span>Level {issue.escalationLevel}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <hr className="border-gray-100" />

                  {/* RESOLVED SECTION */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 py-1">
                      <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Resolved Issues</h3>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">
                        {resolvedIssues.length} Completed
                      </Badge>
                    </div>
                    {resolvedIssues.length === 0 ? (
                      <div className="py-10 text-center bg-emerald-50/30 rounded-2xl border-2 border-dashed border-emerald-100">
                        <p className="text-emerald-400 font-medium italic">No issues have been fully resolved yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {resolvedIssues.map((issue) => (
                          <Card
                            key={issue._id}
                            onClick={() => setSelectedIssue(issue)}
                            className="rounded-2xl bg-white/80 dark:bg-gray-700/50 backdrop-blur-md border border-emerald-100 shadow-sm opacity-90 transition-all saturate-[0.8] hover:saturate-100 cursor-pointer overflow-hidden group"
                          >
                            <div className="relative h-48 overflow-hidden rounded-t-2xl">
                              <img
                                src={issue.image || "/placeholder.jpg"}
                                alt={issue.title}
                                className="w-full h-full object-cover"
                              />
                              <div
                                className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-lg flex items-center gap-1"
                              >
                                Resolved ✔
                              </div>
                            </div>
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                              <CardTitle className="text-lg text-slate-700">
                                {issue.title}
                              </CardTitle>
                              <div className="flex items-center gap-1 text-slate-400">
                                <span className="text-sm font-bold">{issue.upvotes?.length || 0}</span>
                                <Plus className="h-4 w-4 opacity-50" />
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-400 text-sm mb-3 line-clamp-1 italic">
                                "{issue.description}"
                              </p>
                              <div className="space-y-2 text-[11px] text-slate-500 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                                <div className="flex justify-between items-center text-emerald-700">
                                  <span className="font-semibold uppercase tracking-wider text-[10px]">Responsible Authority</span>
                                  <span className="font-bold">{getAuthorityLabel(issue.assignedDepartment?.name || "Municipal Authority")}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-700">
                                  <span className="font-semibold uppercase tracking-wider text-[10px]">Assigned By</span>
                                  <span className="font-bold">{issue.departmentAdminAssignedBy?.fullName || "Department Admin"}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-700">
                                  <span className="font-semibold uppercase tracking-wider text-[10px]">Technician</span>
                                  <span className="font-bold">{issue.workerAssignedToFix?.fullName || "Field Worker"}</span>
                                </div>
                                {issue.resolutionVerificationTimestamp && (
                                  <div className="flex justify-between items-center text-emerald-700 pt-1 border-t border-emerald-100 mt-1">
                                    <span className="font-semibold uppercase tracking-wider text-[10px]">Verified Date</span>
                                    <span className="font-bold">{new Date(issue.resolutionVerificationTimestamp).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {filteredIssues.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center justify-center text-center py-12"
                  >
                    <div className="max-w-xs mx-auto mb-4">
                      <Player
                        autoplay
                        loop
                        animationData={emptyAnimation}
                        style={{ height: "180px", width: "180px" }}
                      />
                    </div>
                    <p className="text-gray-400">
                      {searchCity ? (
                        <>
                          No issues found for{" "}
                          <span className="font-semibold">{searchCity}</span>
                        </>
                      ) : (
                        "No issues available at the moment."
                      )}
                    </p>
                  </motion.div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="fixed bottom-8 right-8 z-50">
            <Link to="/citizen/create-issue">
              <Button
                size="lg"
                className="civic-gradient text-white border-0 h-14 px-6 rounded-full 
                shadow-lg hover:shadow-2xl hover:scale-105 
                transition-transform duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                Report New Issue
              </Button>
            </Link>
          </div>
        </main>
      </div>

      {/* Stats Modal */}
      {statsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 relative">
            <button
              onClick={() => setStatsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Assignment Performance</h3>

            {statsLoading ? (
              <div className="py-8 flex justify-center">
                <span className="text-slate-400 text-sm font-semibold animate-pulse">Loading stats...</span>
              </div>
            ) : assignmentStats ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Admin Avg Response</p>
                  <p className="text-3xl font-black text-slate-800">
                    {assignmentStats.adminAvgResponseTimeHours > 0 ? `${assignmentStats.adminAvgResponseTimeHours} hrs` : 'N/A'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Average time taken for admin to assign after reporting</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
                  <p className="text-xs uppercase tracking-wider font-semibold text-blue-500 mb-1">Worker Avg Completion</p>
                  <p className="text-3xl font-black text-blue-800">
                    {assignmentStats.workerAvgCompletionTimeHours > 0 ? `${assignmentStats.workerAvgCompletionTimeHours} hrs` : 'N/A'}
                  </p>
                  <p className="text-[10px] text-blue-400 mt-1 max-w-[200px]">Worker's historical average resolution time</p>
                </div>
              </div>
            ) : (
              <div className="py-8 flex justify-center">
                <p className="text-rose-500 text-sm font-semibold">Failed to load statistics.</p>
              </div>
            )}

            <Button
              className="w-full mt-6 rounded-xl font-bold"
              onClick={() => setStatsModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Detailed Issue Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
          >
            <button
              onClick={() => setSelectedIssue(null)}
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-30"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>

            <div className="relative h-64 sm:h-80 w-full">
              <img
                src={selectedIssue.image || "/placeholder.jpg"}
                className="w-full h-full object-cover"
                alt="Resolved Issue"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <Badge className="bg-emerald-500 text-white border-0 mb-3 px-3 py-1 text-sm">Resolved ✔</Badge>
                <h2 className="text-3xl font-bold text-white tracking-tight">{selectedIssue.title}</h2>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Audit Timeline</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#0577b7] shrink-0 mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Reported</p>
                      <p className="text-sm font-bold text-slate-700">{new Date(selectedIssue.reportedAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(selectedIssue.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">Assigned</p>
                      <p className="text-sm font-bold text-blue-700">
                        {selectedIssue.workerAssignmentTimestamp ? new Date(selectedIssue.workerAssignmentTimestamp).toLocaleDateString() : "Auto-Assigned"}
                      </p>
                      {selectedIssue.workerAssignmentTimestamp && <p className="text-[10px] text-blue-400 font-medium">{new Date(selectedIssue.workerAssignmentTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">Resolved</p>
                      <p className="text-sm font-bold text-emerald-700">{selectedIssue.resolutionVerificationTimestamp ? new Date(selectedIssue.resolutionVerificationTimestamp).toLocaleDateString() : "Completed"}</p>
                      {selectedIssue.resolutionVerificationTimestamp && <p className="text-[10px] text-emerald-400 font-medium">{new Date(selectedIssue.resolutionVerificationTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Responsibility Data</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned By</p>
                        <p className="text-sm font-bold text-slate-700">{selectedIssue.departmentAdminAssignedBy?.fullName || "Municipal Admin"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Deployed Technician</p>
                        <p className="text-sm font-bold text-slate-700">{selectedIssue.workerAssignedToFix?.fullName || "Field Worker"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Context</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                        <p className="text-slate-700 font-medium leading-relaxed">{selectedIssue.location.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <Settings className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Authority</p>
                        <p className="text-slate-700 font-bold">{getAuthorityLabel(selectedIssue.assignedDepartment?.name || "Municipal Authority")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Issue Description</h3>
                <p className="text-slate-600 leading-relaxed text-sm italic">"{selectedIssue.description}"</p>
              </section>

              <div className="pt-4">
                <Button
                  onClick={() => setSelectedIssue(null)}
                  className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  Close Archive Record
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default CitizenHome;
