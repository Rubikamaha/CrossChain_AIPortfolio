import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NetworkModeProvider } from "@/contexts/NetworkModeContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import AIInsightsPage from "./pages/AIInsightsPage";
import AISwapPage from "./pages/AISwapPage";
import AIRebalancePage from "./pages/AIRebalancePage";
import NotFound from "./pages/NotFound";

import { Web3Chatbot } from "./components/ChatBot/Web3Chatbot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NetworkModeProvider>
      <ProfileProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Web3Chatbot />
          <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/insights" element={<AIInsightsPage />} />
              <Route path="/transactions" element={<AISwapPage />} />
              <Route path="/rebalance" element={<AIRebalancePage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProfileProvider>
    </NetworkModeProvider>
  </QueryClientProvider>
);

export default App;
