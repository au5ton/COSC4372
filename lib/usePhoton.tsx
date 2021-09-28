import { useEffect, useRef, useState } from 'react'
import type * as Photon from '@silvia-odwyer/photon'

export function usePhoton(): typeof Photon | null {
  const photon = useRef<typeof Photon | null>(null);

  useEffect(() => {
    (async () => {
      if(photon.current === null) {
        photon.current = await import('@silvia-odwyer/photon')
      }
    })();
  }, [photon])

  return photon.current
}