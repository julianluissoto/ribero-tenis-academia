'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AppTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (value: string) => {
    router.push(value);
  };

  // Determine active tab based on path
  let activeTab = '/';
  if (pathname.startsWith('/tournaments')) {
    activeTab = '/tournaments';
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background px-4 py-3">
         <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
                <TabsTrigger value="/">Gestión de Clases</TabsTrigger>
                <TabsTrigger value="/tournaments">Torneos</TabsTrigger>
            </TabsList>
         </Tabs>
       </header>
       {children}
    </div>
  );
}
