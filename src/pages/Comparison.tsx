
import BatteryComparison from '@/components/BatteryComparison';

export default function Comparison() {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Battery Comparison</h1>
            <p className="text-slate-400">
              Compare battery performance and characteristics
            </p>
          </div>
        </div>

        <BatteryComparison />
      </div>
    </div>
  );
}
