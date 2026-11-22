// Layout components
export { default as Header } from './layout/Header'
export { default as Sidebar } from './layout/Sidebar'
// Some code expects `NewSidebar`; re-export existing Sidebar as NewSidebar
export { default as NewSidebar } from './layout/Sidebar'

// Trading components  
export { default as Dashboard } from './trading/Dashboard'
export { default as TradingChart } from './trading/TradingChart'

// Onboarding components
export { default as Onboarder } from './onboarding/Onboarder'
export { default as OnboardingBanner } from './onboarding/OnboardingBanner'
export { default as OptionsWarningModal } from './onboarding/OptionsWarningModal'
export { default as PerpsWarningModal } from './onboarding/PerpsWarningModal'

// UI components
export { VirtualizedList } from './VirtualizedList'

// Legacy exports (still in root components folder)
export { default as ClientPerpsModalLoader } from './ClientPerpsModalLoader'
export { default as RegionBlocker } from './RegionBlocker'
export { default as SessionConnected } from './SessionConnected'