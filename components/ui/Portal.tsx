'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: React.ReactNode
}

export default function Portal({ children }: PortalProps) {
  if (typeof window === 'undefined') return null

  return createPortal(children, document.body)
}