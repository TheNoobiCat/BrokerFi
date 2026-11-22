"use client";

interface MetricCardProps {
  label: string;
  value: string;
}

export default function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="broker-card-compact">
      <div className="text-white/50 text-xs mb-1">{label}</div>
      <div className="text-white font-semibold font-mono text-lg">{value}</div>
    </div>
  );
}