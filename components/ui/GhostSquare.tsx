import { FaExclamationTriangle } from "react-icons/fa";

interface GhostSquareProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'price';
}

export const GhostSquare = ({ className, size = 'md' }: GhostSquareProps) => {
  const sizeClasses = {
    xs: 'h-3 w-8',      // Very small text
    sm: 'h-4 w-12',     // Small text/numbers
    md: 'h-4 w-16',     // Default text
    lg: 'h-6 w-20',     // Button/label text
    xl: 'h-8 w-24',     // Large labels
    price: 'h-10 w-24', // Price displays
  };

  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded bg-white/10 animate-pulse ${sizeClasses[size]} ${className ?? ""}`}
    />
  );
};