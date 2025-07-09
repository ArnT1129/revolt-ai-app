
import AdvancedAnalytics from '@/components/AdvancedAnalytics';

export default function Analytics() {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-slate-400">
              Advanced battery performance analytics and insights
            </p>
          </div>
        </div>

        <AdvancedAnalytics />
      </div>
    </div>
  );
}
