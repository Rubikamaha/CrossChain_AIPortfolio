import { useSettings, RiskProfile, NetworkModePreference, CurrencyPreference } from '@/hooks/useSettings';
import { Settings, Shield, PieChart, Zap, Globe, DollarSign, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();

  const handleRiskChange = (profile: RiskProfile) => {
    updateSettings({ riskProfile: profile });
    toast.success(`Risk profile updated to ${profile}`);
  };

  const handleAllocationChange = (coin: 'ETH' | 'USDC', value: string) => {
    const numValue = parseInt(value) || 0;
    const nextAlloc = { ...settings.targetAllocation, [coin]: numValue };
    updateSettings({ targetAllocation: nextAlloc });
  };

  const totalAllocation = settings.targetAllocation.ETH + settings.targetAllocation.USDC;
  const isAllocationValid = totalAllocation === 100;

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-2">Configure your portfolio preferences & AI rules</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => { resetSettings(); toast.info("Settings reset to defaults"); }}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Risk Profile */}
          <div className="glass-card p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Risk Profile
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['Conservative', 'Balanced', 'Aggressive'] as RiskProfile[]).map((profile) => (
                <button
                  key={profile}
                  onClick={() => handleRiskChange(profile)}
                  className={`py-3 px-4 rounded-xl font-bold border-2 transition-all ${
                    settings.riskProfile === profile 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:border-border/80 text-muted-foreground'
                  }`}
                >
                  {profile}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs mt-4 italic">
              * Changing your risk profile automatically updates your target allocation.
            </p>
          </div>

          {/* Target Allocation */}
          <div className="glass-card p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-400" />
              Target Allocation
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-muted-foreground">ETH %</span>
                    <span className="text-sm font-mono text-primary font-bold">{settings.targetAllocation.ETH}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={settings.targetAllocation.ETH}
                    onChange={(e) => handleAllocationChange('ETH', e.target.value)}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-muted-foreground">USDC %</span>
                    <span className="text-sm font-mono text-success font-bold">{settings.targetAllocation.USDC}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={settings.targetAllocation.USDC}
                    onChange={(e) => handleAllocationChange('USDC', e.target.value)}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-success"
                  />
                </div>
              </div>
              
              {!isAllocationValid && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-amber-500 text-xs flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Total allocation is {totalAllocation}%. It should be exactly 100%.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slippage */}
            <div className="glass-card p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Slippage Control
              </h3>
              <select 
                value={settings.slippage}
                onChange={(e) => updateSettings({ slippage: parseFloat(e.target.value) })}
                className="w-full bg-input border border-input p-3 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              >
                <option value={0.5}>0.5% (Safe)</option>
                <option value={1}>1.0% (Standard)</option>
                <option value={2}>2.0% (Aggressive)</option>
              </select>
            </div>

            {/* Network Mode */}
            <div className="glass-card p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-400" />
                Network Mode
              </h3>
              <div className="flex gap-2">
                {(['auto', 'mainnet', 'testnet'] as NetworkModePreference[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateSettings({ networkMode: mode })}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                      settings.networkMode === mode 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border text-muted-foreground'
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Currency */}
          <div className="glass-card p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Display Currency
            </h3>
            <div className="flex gap-4">
              {(['USD', 'INR'] as CurrencyPreference[]).map((curr) => (
                <label key={curr} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="currency" 
                    checked={settings.currency === curr}
                    onChange={() => updateSettings({ currency: curr })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className={`font-bold transition-colors ${settings.currency === curr ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/80'}`}>
                    {curr}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
