import { useCallback, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { ArrowLeft, MapPin, Upload, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MapComponent from "../components/MapBox";
import { toast } from "sonner";
import { VITE_BACKEND_URL } from "../config/config";
import { queueIssueOffline } from "../utils/offlineSync";

const ReportIssue = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    issueDescription: "",
    issueLocation: "",
    issueType: "Other",
    location: {
      address: "",
      latitude: null as number | null,
      longitude: null as number | null,
    },
  });
  const [dangerMetrics, setDangerMetrics] = useState({
    diameterCm: 0,
    depthCm: 0,
    isOnMainRoad: false,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = useCallback(
    (lat: number, lng: number, address: string) => {
      setFormData((prev) => ({
        ...prev,
        location: {
          address,
          latitude: lat,
          longitude: lng,
        },
        issueLocation: address, // also update address string if you use it
      }));
    },
    []
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.issueDescription ||
      !formData.location.address
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("You must be logged in");
        return;
      }

      // Offline Sync (PART 10)
      if (!navigator.onLine) {
        toast.warning("Offline: Issue queued locally. Syncing when connection returns.", { duration: 5000 });
        await queueIssueOffline({ formData, dangerMetrics });
        setLoading(false);
        navigate("/citizen");
        return;
      }

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.issueDescription);
      data.append("issueType", formData.issueType);
      data.append("location", JSON.stringify(formData.location));

      if (formData.issueType === "Life-Threatening Potholes" || formData.issueType === "Illegal Dumping Sites") {
        // Add severity logic for dumping or potholes if any
      }

      const score = (dangerMetrics.diameterCm * 0.5) + (dangerMetrics.depthCm * 2) + (dangerMetrics.isOnMainRoad ? 20 : 0);
      data.append("dangerMetrics", JSON.stringify({ ...dangerMetrics, autoSeverityScore: score }));

      if (formData.issueType === "Life-Threatening Potholes" && score > 50) {
        data.append("severity", "Critical");
      }

      selectedFiles.forEach((file) => {
        data.append("files", file);
      });

      const response = await fetch(
        `${VITE_BACKEND_URL}/api/v1/citizen/create-issue`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        }
      );

      const result = await response.json();
      if (response.ok) {
        toast.success("Issue reported successfully!");
        navigate("/citizen");
      } else if (response.status === 409) {
        toast.error("Duplicate: Similar issue already reported nearby.");
      } else {
        toast.error(result.message || "Failed to report issue");
      }
    } catch (error) {
      console.error("Error reporting issue:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const issueTypes = [
    { value: "Streetlight Failures", label: "City Council - Streetlight Failure" },
    { value: "Burst Water Pipes", label: "City Council - Water Pipe Burst" },
    { value: "Sewer Failures", label: "City Council - Sewer Failure" },
    { value: "Water Supply Problems", label: "ZINWA - Water Supply Problems" },
    { value: "Electricity Supply Problems", label: "ZESA - Electricity Supply" },
    { value: "Illegal Dumping Sites", label: "EMA - Illegal Dumping" },
    { value: "Life-Threatening Potholes", label: "Potholes (Critical - TSCZ)" },
    { value: "Traffic Light Failures", label: "TSCZ - Traffic Light Failure" },
    { value: "Other", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b bg-white/10 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/citizen">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 text-slate-500"
                >
                  <ArrowLeft className="h-4 w-4 text-blue-600" />
                  <span>Back to Dashboard</span>
                </Button>
              </Link>
            </div>
            <div>
              <h1 className="text-xl font-bold text-cyan-600">
                Report New Issue
              </h1>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Section */}
          <Card className="h-fit shadow-lg bg-white/80 dark:bg-gray-500 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2  text-slate-600">
                <MapPin className="h-5 w-5 text-green-600" />
                <span>Select Issue Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden border">
                <MapComponent onLocationSelect={handleLocationSelect} />
              </div>
              {formData.location.latitude && formData.location.longitude && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Selected Location:</p>
                  <p className="text-xs text-muted-foreground">
                    Lat: {formData.location.latitude.toFixed(6)}, Lng:{" "}
                    {formData.location.longitude.toFixed(6)}
                  </p>
                  {formData.location.address && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.location.address}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Section */}
          <Card className="shadow-lg bg-white/80 dark:bg-gray-500 dark:border-white/10  text-slate-600">
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Issue Title *</Label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      placeholder="Enter your issue title"
                      required
                      className="shadow-sm"
                    />
                  </div>
                </div>

                {/* Issue Information */}

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Issue Information</h3>

                  <div className="space-y-2">
                    <Label>Issue Type *</Label>
                    <RadioGroup
                      value={formData.issueType}
                      onValueChange={(value) =>
                        handleInputChange("issueType", value)
                      }
                      className="grid grid-cols-2 gap-4"
                    >
                      {issueTypes.map((type) => (
                        <div
                          key={type.value}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem value={type.value} id={type.value} />
                          <Label htmlFor={type.value} className="text-sm">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {formData.issueType === "Life-Threatening Potholes" && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-4 border border-red-100">
                      <h4 className="font-semibold text-red-700 dark:text-red-400">Danger Assessment</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <Label>Diameter (cm)</Label>
                          <Input type="number" min="0" value={dangerMetrics.diameterCm} onChange={(e) => setDangerMetrics({ ...dangerMetrics, diameterCm: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Depth (cm)</Label>
                          <Input type="number" min="0" value={dangerMetrics.depthCm} onChange={(e) => setDangerMetrics({ ...dangerMetrics, depthCm: Number(e.target.value) })} />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="mainRoad" checked={dangerMetrics.isOnMainRoad} onChange={(e) => setDangerMetrics({ ...dangerMetrics, isOnMainRoad: e.target.checked })} className="rounded text-red-600 focus:ring-red-500 w-4 h-4" />
                        <Label htmlFor="mainRoad">Located on a high-speed main road or highway?</Label>
                      </div>
                      {((dangerMetrics.diameterCm * 0.5) + (dangerMetrics.depthCm * 2) + (dangerMetrics.isOnMainRoad ? 20 : 0)) > 0 && (
                        <div className="mt-2 p-2 bg-white rounded border border-red-200">
                          <p className={`text-sm font-bold ${((dangerMetrics.diameterCm * 0.5) + (dangerMetrics.depthCm * 2) + (dangerMetrics.isOnMainRoad ? 20 : 0)) > 50 ? 'text-red-600' : 'text-orange-500'}`}>
                            Severity Score: {((dangerMetrics.diameterCm * 0.5) + (dangerMetrics.depthCm * 2) + (dangerMetrics.isOnMainRoad ? 20 : 0))}
                            {((dangerMetrics.diameterCm * 0.5) + (dangerMetrics.depthCm * 2) + (dangerMetrics.isOnMainRoad ? 20 : 0)) > 50 ? " (Critical Emergency Flag)" : " (Standard Maintenance Queue)"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="issueLocation">
                      Issue Location Address
                    </Label>
                    <Input
                      id="issueLocation"
                      type="text"
                      value={formData.issueLocation}
                      onChange={(e) =>
                        handleInputChange("issueLocation", e.target.value)
                      }
                      placeholder="Enter or select location on map"
                      className="shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueDescription">
                      Issue Description *
                    </Label>
                    <Textarea
                      id="issueDescription"
                      value={formData.issueDescription}
                      onChange={(e) =>
                        handleInputChange("issueDescription", e.target.value)
                      }
                      placeholder="Describe the issue in detail..."
                      className="min-h-24 shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* File Upload */}

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Upload Media</h3>

                  <div className="space-y-2">
                    <Label htmlFor="file">Upload Image/Video</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="file"
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      <Upload className="h-5 w-5 text-blue-600" />
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-2 space-y-1">
                        <p className="font-semibold text-slate-700">Selected Files ({selectedFiles.length}):</p>
                        {selectedFiles.map((f, i) => (
                          <p key={i}>• {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}

                <Button
                  type="submit"
                  className="w-full civic-gradient border-0 text-white hover:opacity-70"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" /> Submit Issue
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReportIssue;
