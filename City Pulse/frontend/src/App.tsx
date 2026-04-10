import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LoaderProvider } from "./contexts/LoaderContext";
import { LoaderOverlay } from "./LoaderOverlay";
import { Toaster as Sonner } from "sonner";
import AnimatedRoutes from "./AnimateRoutes";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { NotificationProvider } from "./contexts/NotificationProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      gcTime: 300000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <LoaderProvider>
          <NotificationProvider>
            <LoaderOverlay />
            <Sonner />
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </NotificationProvider>
        </LoaderProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
