import { Link } from "react-router-dom";
import { Button } from "./ui/button.tsx";
import { LogIn, LogOut, Shield, LayoutDashboard, Bell } from "lucide-react";
import logo from '../assets/logo2.png';
import { useAuth } from "../contexts/AuthContext.tsx";
import { ThemeToggle } from "./ThemeToggle.tsx";
import { useQuery } from "@tanstack/react-query";
import { VITE_BACKEND_URL } from "../config/config";

type HeaderProps = {
  onFeaturesClick?: () => void;
  onHowItWorksClick?: () => void;
};

const Header: React.FC<HeaderProps> = () => {
  const { user, logout } = useAuth();

  const { data: notifications } = useQuery({
    queryKey: ["notifications_badge"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token || !user) return [];
      const endpoint = user.role === "admin" ? "admin/notifications" : "citizen/notifications";
      const res = await fetch(`${VITE_BACKEND_URL}/api/v1/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return data.notifications || [];
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  const handleLogout = () => {
    logout();
  };

  return (
    <header
      className="
        w-full
        fixed top-0 left-0 right-0
        z-50
        bg-white/30
        backdrop-blur-md
        border-b border-gray-200/50
        supports-[backdrop-filter]:bg-white/30
      "
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-17 h-17 rounded-lg">
              <img src={logo} alt="civicIssueLogo" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                CityPulse
              </h1>
              <p className="text-xs text-muted-foreground">
                Bridging the gap between citizens and service delivery.
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Welcome,{" "}
                  {user?.fullName ? user.fullName.split(" ")[0] : "Guest"}!
                </span>
                <Link to={user.role === "citizen" ? "/citizen" : "/admin"}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 text-slate-500"
                  >
                    <LayoutDashboard className="h-4 w-4 text-blue-700" />
                    <span className="hidden sm:block">Dashboard</span>
                  </Button>
                </Link>
                <Link to={user.role === "citizen" ? "/citizen/notifications" : "/admin/notifications"} className="relative hidden sm:flex">
                  <Button variant="outline" size="sm" className="relative flex items-center justify-center px-3">
                    <Bell className="h-4 w-4 text-blue-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 text-slate-500"
                >
                  <LogOut className="h-4 w-4 text-blue-700" />
                  <span className="hidden sm:block">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex items-center space-x-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="flex items-center space-x-2 civic-gradient border-0 text-white hover:opacity-90"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Sign Up</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
