export default function Logo({ scale = 1 }: { scale?: number }) {
  return (
    <div
      className="inline-block border border-white/10 shrink-0"
      style={{ padding: `${8 * scale}px`, borderRadius: `${12 * scale}px` }}
    >
      <img
        className="brightness-0 invert"
        src="/logo/BrokerfiLogo.svg"
        alt="Brokerfi Logo"
        style={{ width: `${20 * scale}px`, height: `${20 * scale}px` }}
      />
    </div>
  );
}
