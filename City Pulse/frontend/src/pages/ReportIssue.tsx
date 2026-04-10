import { useCallback, useState, useEffect } from "react";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [potholeData, setPotholeData] = useState({
    diameter: 0,
    depth: 0,
    isOnHighway: false
  });

  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    const detectLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setMapCenter({ lat, lng });

            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
              const data = await res.json();
              const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

              localStorage.setItem("lastKnownLocation", JSON.stringify({ lat, lng, address }));

              setFormData(prev => ({
                ...prev,
                location: { address, latitude: lat, longitude: lng },
                issueLocation: address
              }));
            } catch (err) {
              console.error("Reverse geocoding failed", err);
            }
          },
          () => useFallbackInfo(),
          { enableHighAccuracy: true }
        );
      } else {
        useFallbackInfo();
      }
    };

    const useFallbackInfo = () => {
      const lastKnown = localStorage.getItem("lastKnownLocation");
      if (lastKnown) {
        const parsed = JSON.parse(lastKnown);
        setMapCenter({ lat: parsed.lat, lng: parsed.lng });
        setFormData(prev => ({
          ...prev,
          location: { address: parsed.address, latitude: parsed.lat, longitude: parsed.lng },
          issueLocation: parsed.address
        }));
        toast.info("Using last known offline location as GPS is unavailable.");
      } else {
        setMapCenter({ lat: -17.824858, lng: 31.053028 });
        toast.error("Could not detect location. Please select it manually on the map.");
      }
    };

    detectLocation();
  }, []);

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
        issueLocation: address,
      }));
      localStorage.setItem("lastKnownLocation", JSON.stringify({ lat, lng, address }));
    },
    []
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateRefId, setDuplicateRefId] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, forceSubmit = false) => {
    if (e) e.preventDefault();

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

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.issueDescription);
      data.append("issueType", formData.issueType);
      data.append("location", JSON.stringify(formData.location));
      if (forceSubmit) data.append("force", "true");

      if (formData.issueType === "Potholes") {
        data.append("potholeDetails", JSON.stringify(potholeData));
      }

      if (selectedFile) {
        data.append("files", selectedFile);
      }

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
      if (response.status === 409 && result.duplicateReferenceIssueId) {
        setDuplicateRefId(result.duplicateReferenceIssueId);
        setShowDuplicateModal(true);
        return;
      }

      if (response.ok) {
        toast.success("Issue reported successfully!");
        setShowDuplicateModal(false);
        navigate("/citizen");
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
    { value: "Potholes", label: "Potholes" },
    { value: "Burst Water Pipes", label: "Burst Water Pipes" },
    { value: "Sewer Issues", label: "Sewer Issues" },
    { value: "Streetlights", label: "Streetlights" },
    { value: "Traffic Lights", label: "Traffic Lights" },
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
              <div className="h-96 rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center">
                {mapCenter ? (
                  <MapComponent
                    onLocationSelect={handleLocationSelect}
                    initialLat={mapCenter.lat}
                    initialLng={mapCenter.lng}
                  />
                ) : (
                  <span className="text-gray-400">Detecting location...</span>
                )}
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

                  {formData.issueType === "Potholes" && (
                    <div className="space-y-4 bg-orange-50 border border-orange-200 p-4 rounded-xl">
                      <h4 className="font-semibold text-orange-800">Pothole Danger Assessment</h4>
                      <p className="text-xs text-orange-700">Please provide dimensions to help us triage the danger level (non-dangerous potholes are parked for long-term maintenance).</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Diameter (approx cm)</Label>
                          <Input
                            type="number"
                            value={potholeData.diameter}
                            onChange={e => setPotholeData({ ...potholeData, diameter: Number(e.target.value) })}
                            min={0}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Depth (approx cm)</Label>
                          <Input
                            type="number"
                            value={potholeData.depth}
                            onChange={e => setPotholeData({ ...potholeData, depth: Number(e.target.value) })}
                            min={0}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 flex items-center space-x-2 mt-4">
                        <input
                          type="checkbox"
                          id="isOnHighway"
                          checked={potholeData.isOnHighway}
                          onChange={e => setPotholeData({ ...potholeData, isOnHighway: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Label htmlFor="isOnHighway" className="mt-[6px]">Is this on a major highway or arterial road?</Label>
                      </div>
                    </div>
                  )}

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
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      <Upload className="h-5 w-5 text-blue-600" />
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} (
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
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

      {/* Duplicate Warning Modal Overlay */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-red-200">
            <h3 className="text-xl font-bold text-red-600 mb-2">Similar Issue Found!</h3>
            <p className="text-gray-700 mb-6 text-sm">
              We detected a very similar issue ({duplicateRefId}) already reported within 150 meters.
              Consolidating reports speeds up our community resolution time!
              <br /><br />
              Would you like to continue submitting anyway as a separate report?
            </p>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-end">
              <Button variant="outline" className="text-gray-600 border-gray-300 bg-gray-50" onClick={() => setShowDuplicateModal(false)}>
                Cancel Reporting
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md" onClick={(e) => handleSubmit(e as React.FormEvent, true)}>
                Submit Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportIssue;
