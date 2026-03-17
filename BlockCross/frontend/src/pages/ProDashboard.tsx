import { RealisticDeFiManager } from '@/components/RealisticDeFiManager';
import { Footer } from '@/components/Footer';

const ProDashboard = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold font-heading mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Pro AI Dashboard
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Real-time blockchain integration with AI insights and automated rebalancing.
            </p>
        </div>
        
        <RealisticDeFiManager />
      </div>
      <Footer />
    </div>
  );
};

export default ProDashboard;
