import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const CitizenHome = lazy(() => import("./pages/CitizenHome"));
const CitizenProfile = lazy(() => import("./pages/CitizenProfile"));
const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const AdminHome = lazy(() => import("./pages/AdminHome"));
const AdminProfile = lazy(() => import("./pages/AdminProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const DeptAdminSignUp = lazy(() => import("./pages/DeptAdminSignUp"));
const MainAdminSignUp = lazy(() => import("./pages/MainAdminSignUp"));
const NotificationCenter = lazy(() => import("./pages/NotificationCenter"));
const WorkerHome = lazy(() => import("./pages/WorkerHome"));

const pageTransition = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -40 },
  transition: { duration: 0.32, ease: "easeInOut" as const },
};

const LoadingFallback = () => (
  <div className="flex flex-col h-screen items-center justify-center bg-background space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    <div className="text-muted-foreground animate-pulse text-sm">Loading Application Module...</div>
  </div>
);

function MotionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
      style={{ height: "100%" }} // optional, helps with layout
    >
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
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
          path="/citizen/notifications"
          element={
            <ProtectedRoute requiredRole="citizen">
              <MotionWrapper>
                <NotificationCenter />
              </MotionWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute requiredRole="admin">
              <MotionWrapper>
                <NotificationCenter />
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
          path="/worker"
          element={
            <ProtectedRoute requiredRole="worker">
              <MotionWrapper>
                <WorkerHome />
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
