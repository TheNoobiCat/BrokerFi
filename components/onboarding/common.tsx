import { FaExclamationTriangle } from "react-icons/fa";

export const shortenAddress = (addr: string | undefined | null) => {
  if (!addr) return "";
  try {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  } catch {
    return addr;
  }
};

export default {} as const;
