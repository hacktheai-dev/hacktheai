'use client';

import { useEffect, useRef } from 'react';
import jazzicon from '@metamask/jazzicon';

interface WalletIconProps {
  address: string;
  size?: number;
}

export default function WalletIcon({ address, size = 20 }: WalletIconProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Convert address to number for consistent icon generation
      const seed = parseInt(address.slice(2, 10), 16);
      const icon = jazzicon(size, seed);
      
      ref.current.innerHTML = '';
      ref.current.appendChild(icon);
    }
  }, [address, size]);

  return <div ref={ref} className="inline-block rounded-full" />;
}