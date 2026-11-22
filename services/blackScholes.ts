/**
 * Black-Scholes pricing library matching the on-chain BlackScholes.sol implementation.
 *
 * All prices returned are **per unit of underlying** (e.g., per 1 ETH),
 * which matches the contract's `limitPricePerOption` convention.
 *
 * Contract sizes (lot sizes) map every asset to how many units of underlying
 * make up one contract:
 *   ETH  → 0.1   (1 contract = 0.1 ETH)
 *   BTC  → 0.01  (1 contract = 0.01 BTC)
 *   SOL  → 1     (1 contract = 1 SOL)
 *   DOGE → 100   (1 contract = 100 DOGE)
 */

// ─── Constants matching BlackScholes.sol / Constants.sol ───────────────────

const BASE_VOL = 0.65;       // 65 %
const TERM_SLOPE = 0.15;     // 15 %
const SMILE_SLOPE = 0.15;    // 15 %
const MIN_IV = 0.15;         // 15 %
const MAX_IV = 3.0;          //300 %
export const RISK_FREE_RATE = 0.05; // 5 % annualized (USD)
const FEE_PER_CONTRACT = 0.40;     // $0.40 intended fee per contract

// ─── Contract sizes — dynamic from subgraph, with well-known fallbacks ─────

import { getContractSizeDynamic } from './contractSizeRegistry';

/**
 * Look up contract size for an asset.  Accepts a symbol ('LINK') or
 * a pythId ('0xabc…').  Optionally pass the pythId as second arg for
 * community-market resolution.
 */
export function getContractSize(assetOrPythId: string, pythId?: string): number {
  return getContractSizeDynamic(assetOrPythId, pythId);
}

export function getFeePerContract(): number {
  return FEE_PER_CONTRACT;
}

// ─── Normal CDF  (Abramowitz & Stegun — same constants as BlackScholes.sol) ─

function normalCDF(x: number): number {
  if (x > 8) return 1;
  if (x < -8) return 0;

  const GAMMA = 0.2316419;
  const a1 = 0.31938153;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;

  const absX = Math.abs(x);
  const t = 1 / (1 + GAMMA * absX);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  const pdf = Math.exp(-absX * absX / 2) / Math.sqrt(2 * Math.PI);
  const tail = poly * pdf;

  return x < 0 ? tail : 1 - tail;
}

function normalPDF(x: number): number {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
}

// ─── IV calculation (mirrors BlackScholes.sol.calculateIV) ─────────────────

export function calculateIV(
  spot: number,
  strike: number,
  tYears: number,
): number {
  if (tYears <= 0 || spot <= 0 || strike <= 0) return MIN_IV;

  // Term-structure bump
  const termBump = BASE_VOL + TERM_SLOPE * Math.sqrt(tYears);

  // Log-moneyness smile
  const moneyness = Math.abs(Math.log(strike / spot));
  const smile = moneyness * SMILE_SLOPE;

  const iv = termBump + smile;
  return Math.max(MIN_IV, Math.min(MAX_IV, iv));
}

// ─── Core BS pricing ───────────────────────────────────────────────────────

/** d1 and d2 — returns [d1, d2] */
function bsD(
  spot: number,
  strike: number,
  tYears: number,
  r: number,
  vol: number,
): [number, number] {
  const vtSqrt = vol * Math.sqrt(tYears);
  const d1 =
    (Math.log(spot / strike) + (r + (vol * vol) / 2) * tYears) / vtSqrt;
  const d2 = d1 - vtSqrt;
  return [d1, d2];
}

/** Call price per unit of underlying */
export function bsCallPrice(
  spot: number,
  strike: number,
  tYears: number,
  r: number,
  vol: number,
): number {
  if (tYears <= 0 || vol <= 0) return Math.max(0, spot - strike);
  if (spot <= 0 || strike <= 0) return 0;

  const [d1, d2] = bsD(spot, strike, tYears, r, vol);
  return spot * normalCDF(d1) - strike * Math.exp(-r * tYears) * normalCDF(d2);
}

/** Put price per unit of underlying */
export function bsPutPrice(
  spot: number,
  strike: number,
  tYears: number,
  r: number,
  vol: number,
): number {
  if (tYears <= 0 || vol <= 0) return Math.max(0, strike - spot);
  if (spot <= 0 || strike <= 0) return 0;

  const [d1, d2] = bsD(spot, strike, tYears, r, vol);
  return (
    strike * Math.exp(-r * tYears) * normalCDF(-d2) - spot * normalCDF(-d1)
  );
}

// ─── Greeks ────────────────────────────────────────────────────────────────

export function bsDelta(
  spot: number,
  strike: number,
  tYears: number,
  r: number,
  vol: number,
  isCall: boolean,
): number {
  if (tYears <= 0 || vol <= 0 || spot <= 0 || strike <= 0) {
    return isCall ? (spot > strike ? 1 : 0) : spot < strike ? -1 : 0;
  }
  const [d1] = bsD(spot, strike, tYears, r, vol);
  return isCall ? normalCDF(d1) : normalCDF(d1) - 1;
}

export function bsGamma(
  spot: number,
  strike: number,
  tYears: number,
  r: number,
  vol: number,
): number {
  if (tYears <= 0 || vol <= 0 || spot <= 0 || strike <= 0) return 0;
  const vtSqrt = vol * Math.sqrt(tYears);
  const [d1] = bsD(spot, strike, tYears, r, vol);
  return normalPDF(d1) / (spot * vtSqrt);
}

/** Theta per calendar day (divide annual by 365) */
export function bsTheta(
  spot: number,
  strike: number,
  tYears: number,
  r: number,
  vol: number,
  isCall: boolean,
): number {
  if (tYears <= 0 || vol <= 0 || spot <= 0 || strike <= 0) return 0;
  const [d1, d2] = bsD(spot, strike, tYears, r, vol);
  const common = -(spot * normalPDF(d1) * vol) / (2 * Math.sqrt(tYears));

  if (isCall) {
    return (common - r * strike * Math.exp(-r * tYears) * normalCDF(d2)) / 365;
  }
  return (common + r * strike * Math.exp(-r * tYears) * normalCDF(-d2)) / 365;
}

/** Vega — per 1 % move in vol */
export function bsVega(
  spot: number,
  strike: number,
  tYears: number,
  r: number,
  vol: number,
): number {
  if (tYears <= 0 || vol <= 0 || spot <= 0 || strike <= 0) return 0;
  const [d1] = bsD(spot, strike, tYears, r, vol);
  return (spot * normalPDF(d1) * Math.sqrt(tYears)) / 100;
}

/** Rho — per 1 % move in risk-free rate */
export function bsRho(
  spot: number,
  strike: number,
  tYears: number,
  r: number,
  vol: number,
  isCall: boolean,
): number {
  if (tYears <= 0 || vol <= 0 || spot <= 0 || strike <= 0) return 0;
  const [, d2] = bsD(spot, strike, tYears, r, vol);
  if (isCall) {
    return (tYears * strike * Math.exp(-r * tYears) * normalCDF(d2)) / 100;
  }
  return (-tYears * strike * Math.exp(-r * tYears) * normalCDF(-d2)) / 100;
}

// ─── Convenience: full option pricing for a strike ─────────────────────────

export interface OptionPricing {
  /** Price per unit of underlying (e.g. per 1 ETH) — used for contract submission */
  pricePerUnit: number;
  /** Price per contract (pricePerUnit × contractSize) — used for display */
  pricePerContract: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export function getOptionPricing(
  spot: number,
  strike: number,
  daysToExpiry: number,
  isCall: boolean,
  asset: string = "ETH",
  contractSizeOverride?: number,
): OptionPricing {
  const tYears = Math.max(daysToExpiry, 0) / 365;
  const iv = calculateIV(spot, strike, tYears);
  const r = RISK_FREE_RATE;
  const cs = contractSizeOverride ?? getContractSize(asset);

  const pricePerUnit = isCall
    ? bsCallPrice(spot, strike, tYears, r, iv)
    : bsPutPrice(spot, strike, tYears, r, iv);

  return {
    pricePerUnit: Math.max(0, pricePerUnit),
    pricePerContract: Math.max(0, pricePerUnit * cs),
    iv,
    delta: bsDelta(spot, strike, tYears, r, iv, isCall),
    gamma: bsGamma(spot, strike, tYears, r, iv),
    theta: bsTheta(spot, strike, tYears, r, iv, isCall),
    vega: bsVega(spot, strike, tYears, r, iv),
    rho: bsRho(spot, strike, tYears, r, iv, isCall),
  };
}

// ─── Margin estimation (mirrors MarginRequirement.sol) ─────────────────────

export function estimateMarginRequired(
  pricePerUnit: number,
  spot: number,
  strike: number,
  contractSize: number,
  quantity: number,
  isCall: boolean,
  isLong: boolean,
  putCashSecured: boolean,
): number {
  const premiumPerContract = pricePerUnit * contractSize;

  if (isLong) {
    // Buyer: lock the premium + fee
    return premiumPerContract * quantity;
  }

  if (!isCall && putCashSecured) {
    // Cash-secured put: lock strike value per contract
    return strike * contractSize * quantity;
  }

  if (spot <= 0) return premiumPerContract * quantity * 3;

  // Naked option seller margin (20% rule)
  const notional = spot * contractSize;
  const otm = isCall
    ? Math.max(strike - spot, 0) * contractSize
    : Math.max(spot - strike, 0) * contractSize;
  const regulatory = notional * 0.2 - otm;
  const floor = isCall
    ? spot * contractSize * 0.1
    : strike * contractSize * 0.1;

  return (premiumPerContract + Math.max(regulatory, floor)) * quantity;
}
