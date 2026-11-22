"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Cookies from 'js-cookie'
import PerpsWarningModal from './onboarding/PerpsWarningModal'

export default function ClientPerpsModalLoader() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      // Show perps modal when NOT in options mode (i.e., in perpetual mode)
      // Options mode is when pathname starts with '/options'
      const isOptionsMode = pathname?.startsWith('/options')
      const isPerpsMode = !isOptionsMode
      
      console.log('[ClientPerpsModalLoader] pathname:', pathname, 'isPerpsMode:', isPerpsMode)
      
      if (isPerpsMode && pathname && pathname !== '/' && pathname !== '/home') {
        // Check if already dismissed this session or permanently
        const sessionDismissed = sessionStorage.getItem('perpsWarningDismissed')
        const cookieDismissed = Cookies.get('perpsWarningDismissed')
        console.log('[ClientPerpsModalLoader] dismissal flags:', { sessionDismissed, cookieDismissed })
        if (sessionDismissed !== 'true' && cookieDismissed !== 'true') {
          console.log('[ClientPerpsModalLoader] showing perps modal')
          setShow(true)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [pathname])

  if (!show) return null

  return <PerpsWarningModal onAcknowledge={() => setShow(false)} />
}
