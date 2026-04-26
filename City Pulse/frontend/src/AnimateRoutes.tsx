import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Index from "./pages/Index";
import CitizenHome from "./pages/CitizenHome";
import CitizenProfile from "./pages/CitizenProfile";
import ReportIssue from "./pages/ReportIssue";
import AdminHome from "./pages/AdminHome";
import AdminProfile from "./pages/AdminProfile";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import DeptAdminSignUp from "./pages/DeptAdminSignUp";
import MainAdminSignUp from "./pages/MainAdminSignUp";
import VerifyWhatsApp from "./pages/VerifyWhatsApp";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import WorkerDashboard from "./pages/WorkerDashboard";
import AssignWorkerPage from "./pages/AssignWorkerPage";
import AssignIssuePage from "./pages/AssignIssuePage";
import TransparencyDashboard from "./pages/TransparencyDashboard";
import Notifications from "./pages/Notifications";
import HistoryPage from "./pages/HistoryPage";
import WorkerCompleteIssue from "./pages/WorkerCompleteIssue";
import AdminReviewIssue from "./pages/AdminReviewIssue";
import MainAdminEscalations from "./pages/MainAdminEscalations";
import MainAdminDashboard from "./pages/MainAdminDashboard"; // Dashboard Control Center

const pageTransition = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -40 },
  transition: { duration: 0.32, ease: "easeInOut" as const },
};

function MotionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
      style={{ height: "100%" }} // optional, helps with layout
    >
      {children}
    </motion.div>
  );
}

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <MotionWrapper>
              <Index />
            </MotionWrapper>
          }
        />
        <Route
          path="/signin"
          element={
            <MotionWrapper>
              <SignIn />
            </MotionWrapper>
          }
        />
        <Route
          path="/signup"
          element={
            <MotionWrapper>
              <SignUp />
            </MotionWrapper>
          }
        />
        <Route
          path="/verify-email"
          element={
            <MotionWrapper>
              <VerifyEmail />
            </MotionWrapper>
          }
        />
        <Route
          path="/verify-whatsapp"
          element={
            <MotionWrapper>
              <VerifyWhatsApp />
            </MotionWrapper>
          }
        />
        <Route
          path="/admin/dept-signup"
          element={
            <MotionWrapper>
              <DeptAdminSignUp />
            </MotionWrapper>
          }
        />
        <Route
          path="/admin/main-signup"
          element={
            <MotionWrapper>
              <MainAdminSignUp />
            </MotionWrapper>
          }
        />
        <Route
          path="/citizen"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MotionWrapper>
                <CitizenHome />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/create-issue"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MotionWrapper>
                <ReportIssue />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/profile"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MotionWrapper>
                <CitizenProfile />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <AdminHome />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <AdminProfile />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assign-worker/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <AssignWorkerPage />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assign-worker/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <AssignWorkerPage />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assign-issue/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <AssignIssuePage />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker"
          element={
            <ProtectedRoute requiredRole="worker">
              <MotionWrapper>
                <WorkerDashboard />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transparency"
          element={
            <MotionWrapper>
              <TransparencyDashboard />
            </MotionWrapper>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <MotionWrapper>
                <Notifications />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <MotionWrapper>
                <HistoryPage />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker-complete-issue/:issueId"
          element={
            <ProtectedRoute requiredRole="worker">
              <MotionWrapper>
                <WorkerCompleteIssue />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-review/:issueId"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <AdminReviewIssue />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/main-admin-escalations"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <MainAdminEscalations />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/main-admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <MainAdminDashboard />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <MotionWrapper>
              <NotFound />
            </MotionWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
