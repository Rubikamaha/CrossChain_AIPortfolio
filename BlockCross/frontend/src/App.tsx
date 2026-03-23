import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NetworkModeProvider } from "@/contexts/NetworkModeContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import InsightsPage from "./pages/AIInsightsPage";
import AISwapPage from "./pages/AISwapPage";
import RebalancePage from "./pages/RebalancePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

import { PortfolioProvider, usePortfolioContext } from "@/contexts/PortfolioContext";
import { Web3Chatbot } from "./components/ChatBot/Web3Chatbot";
import { Navbar } from "./components/Navbar";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isConnected, account, connect, disconnect, mode } = usePortfolioContext();

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Navbar
        isConnected={isConnected}
        account={account}
        onConnect={connect}
        onDisconnect={disconnect}
        mode={mode}
      />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/transactions" element={<AISwapPage />} />
        <Route path="/rebalance" element={<RebalancePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NetworkModeProvider>
      <ProfileProvider>
        <PortfolioProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Web3Chatbot />
            <AppContent />
          </TooltipProvider>
        </PortfolioProvider>
      </ProfileProvider>
    </NetworkModeProvider>
  </QueryClientProvider>
);

export default App;
