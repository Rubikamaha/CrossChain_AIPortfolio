import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NetworkModeProvider } from "@/contexts/NetworkModeContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import InsightsPage from "./pages/InsightsPage";
import AISwapPage from "./pages/AISwapPage";
import RebalancePage from "./pages/RebalancePage";
import ProDashboard from "./pages/ProDashboard";
import NotFound from "./pages/NotFound";

import { Web3Chatbot } from "./components/ChatBot/Web3Chatbot";
import { Navbar } from "./components/Navbar";
import { useWallet } from "./hooks/useWallet";
import { usePortfolioData } from "./hooks/usePortfolioData";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isConnected, account, connect, disconnect } = useWallet();
  const { mode } = usePortfolioData();

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
        <Route path="/pro" element={<ProDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <NetworkModeProvider>
      <ProfileProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Web3Chatbot />
          <AppContent />
        </TooltipProvider>
      </ProfileProvider>
    </NetworkModeProvider>
  </QueryClientProvider>
);

export default App;
