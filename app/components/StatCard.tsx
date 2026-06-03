export function StatCard({
  label,
  value,
  icon,
  bg,
  sub,
}: {
  label: string;
  value: string | number;
  icon: string;
  bg: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          <p className="text-slate-400 text-xs mt-1">{sub}</p>
        </div>
        <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
