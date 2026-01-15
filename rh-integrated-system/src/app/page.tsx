'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/finance');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white" dir="rtl">
      <div className="text-center">
        <p className="text-xl">جاري التحويل إلى صفحة المالية...</p>
      </div>
    </div>
  );
}
