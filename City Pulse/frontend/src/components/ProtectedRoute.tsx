import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "citizen" | "admin" | "worker";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roleStr = String(user.role).toUpperCase();
    let normalizedRole = roleStr;
    if (roleStr === "DEPARTMENT_WORKER" || roleStr === "DEPT_WORKER" || roleStr === "WORKER") normalizedRole = "worker";
    else if (roleStr === "DEPARTMENT_ADMIN" || roleStr === "MAIN_ADMIN" || roleStr === "DEPT_ADMIN" || roleStr === "ADMIN") normalizedRole = "admin";
    else if (roleStr === "CITIZEN") normalizedRole = "citizen";

    if (normalizedRole !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
