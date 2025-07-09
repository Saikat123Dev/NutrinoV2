import React from 'react';
import PremiumGuard from '@/components/PremiumGuard';
import Home from '@/components/Home';

export default function Index() {
  return (
   <PremiumGuard>
      <Home />
      </PremiumGuard>
   
  );
}
