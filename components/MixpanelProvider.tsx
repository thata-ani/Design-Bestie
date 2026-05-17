'use client';
import { useEffect } from 'react';
import mixpanel from '@/lib/mixpanel';
import { usePathname } from 'next/navigation';

export default function MixpanelProvider() {
  const pathname = usePathname();
  useEffect(() => {
    mixpanel.track('Page View', { page: pathname });
  }, [pathname]);
  return null;
}
