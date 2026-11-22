import type { Metadata } from "next";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader'
import { headers } from "next/headers";
import RegionBlocker from "../components/RegionBlocker";
import { blockedCountryCodes } from "@/services/blockedCountries";
import { Providers } from "./providers";
import ClientPerpsModalLoader from "@/components/ClientPerpsModalLoader";
import LayoutWrapper from "@/components/LayoutWrapper";
import AgentSidebar from "@/components/AgentSidebar";
import ShimmerEffect from "@/components/ShimmerEffect";
import GlobalLoadingOverlay from "@/components/GlobalLoadingOverlay";
import ToastContainer from "@/components/ui/ToastContainer";
import WelcomePortal from "@/components/onboarding/WelcomePortal";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

async function checkGeo() {
  const headersList = await headers();

  // Prefer Vercel geolocation headers when available (present on Vercel deployments)
  // Header examples: X-Vercel-IP-Country, X-Vercel-IP-City, X-Vercel-IP-Country-Region
  const vercelCountry = headersList.get("x-vercel-ip-country") || headersList.get("x-vercel-ip-country-region");
  if (vercelCountry) {
    return vercelCountry;
  }

  // Fallback: try common forwarded IP headers and return null for local/dev
  // We no longer use the GeoLite2 DB for performance — rely on platform headers.
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip");

  // Treat localhost / missing IP as unknown
  if (!ip || ip === "::1" || ip === "127.0.0.1") {
    return null;
  }

  // Without a GeoIP DB, we can't resolve country here — return null so the
  // app doesn't block in environments without Vercel headers.
  return null;
}

export const metadata: Metadata = {
  metadataBase: new URL('https://testnet.brokerfi.trade'),
  title: {
    default: "BrokerFi - Archived Testnet Reference",
    template: "%s | BrokerFi Archive"
  },
  description:
    "Archived, unaudited testnet reference implementation of BrokerFi, an experimental Arbitrum Sepolia interface for perpetual futures and options. Not maintained and not production-ready.",
  keywords: [
    "archived software",
    "Arbitrum Sepolia",
    "testnet",
    "perpetual futures",
    "crypto options",
    "on-chain derivatives",
    "Next.js",
    "open-source reference"
  ],
  authors: [{ name: "BrokerFi contributors" }],
  creator: "BrokerFi contributors",
  publisher: "BrokerFi",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://testnet.brokerfi.trade",
    siteName: "BrokerFi (Archived Testnet)",
    title: "BrokerFi - Archived Testnet Reference",
    description:
      "Archived, unaudited Arbitrum Sepolia derivatives testnet. Not maintained and not production-ready.",
  },
  twitter: {
    card: "summary",
    title: "BrokerFi - Archived Testnet Reference",
    description:
      "Archived, unaudited Arbitrum Sepolia derivatives testnet. Not production-ready.",
  },
  category: "finance",
  applicationName: "BrokerFi Archive",
  referrer: "origin-when-cross-origin",
  other: {
    robots: "noindex, nofollow, noarchive",
  }
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const countryCode = await checkGeo();
  // const isBlocked = !!(countryCode && blockedCountryCodes.includes(countryCode));
  const isBlocked = false; // Disable geo-blocking for now in testnet
  
  // Get cookies for Wagmi initial state
  const headersList = await headers();
  const cookies = headersList.get('cookie');
  
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <NextTopLoader />
        {isBlocked ? (
          <RegionBlocker />
        ) : (
          <Providers cookies={cookies}>
            <ClientPerpsModalLoader />
            <AgentSidebar />
            
            {/* Magical Shimmer Effect - covers entire viewport when sidebar opens */}
            <ShimmerEffect />
            
            <GlobalLoadingOverlay />

            <ToastContainer />

            <WelcomePortal />

            <LayoutWrapper testnet={process.env.NEXT_PUBLIC_TESTNET === 'true'}>
              {children}
            </LayoutWrapper>
          </Providers>
        )}

        {/* Tally Form Widget */}
        <Script
          id="tally-config"
          strategy="afterInteractive"
        >
          {`
            window.TallyConfig = {
              "formId": "dWWJVN",
              "popup": {
                "width": 400,
                "emoji": {
                  "text": "👋",
                  "animation": "wave"
                },
                "open": {
                  "trigger": "time",
                  "ms": 120000
                }
              }
            };
          `}
        </Script>
        <Script
          src="https://tally.so/widgets/embed.js"
          strategy="afterInteractive"
        />
        <Analytics />
      </body>
    </html>
  );
}
