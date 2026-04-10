import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import { LoaderProvider } from "./contexts/LoaderContext"; // ADD THIS
import { LoaderOverlay } from "./LoaderOverlay";            // ADD THIS if your overlay is in a separate file
import { Toaster as Sonner, Toaster } from "sonner";
import AnimatedRoutes from "./AnimateRoutes";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LoaderProvider> {/* <-- NEW CONTEXT PROVIDER */}
        <LoaderOverlay /> {/* <-- Global overlay gets rendered here */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </LoaderProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
