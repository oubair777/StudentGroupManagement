import React from 'react';

export default function ProgressBar({
  percentage = 0,
  label = 'Progress',
  size = 'md',
  showLabel = true,
  badgeText = null,
  color = 'brand',
}) {
  const clampedPercent = Math.min(100, Math.max(0, percentage));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorStyles = {
    brand: 'bg-gradient-to-r from-brand-500 to-indigo-600',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-500',
    rose: 'bg-gradient-to-r from-rose-500 to-pink-500',
  };

  // Auto pick color based on percentage if default
  let barGradient = colorStyles[color] || colorStyles.brand;
  if (color === 'brand') {
    if (clampedPercent === 100) barGradient = colorStyles.emerald;
    else if (clampedPercent >= 50) barGradient = colorStyles.brand;
    else barGradient = colorStyles.amber;
  }

  return (
    <div className="w-full space-y-1.5">
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
            <span>{label}</span>
            {badgeText && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {badgeText}
              </span>
            )}
          </span>
          <span className="font-bold text-slate-900">{clampedPercent}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`${heightClasses[size]} ${barGradient} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}
