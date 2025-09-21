
"use client"
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function AppHeader() {
    const [isClient, setIsClient] = useState(false);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const checkData = () => {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                setHasData(parsedState.uploadState === 'success' && parsedState.learnerData?.length > 0);
            } else {
                setHasData(false);
            }
        };

        checkData(); // Initial check

        const interval = setInterval(checkData, 1000); // Check every second

        // Also listen for custom event
        window.addEventListener('storageUpdated', checkData);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storageUpdated', checkData);
        };
    }, []);

    const handleSummaryClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const summaryLink = document.getElementById('summary-link-handler');
        if (summaryLink) {
            summaryLink.click();
        }
    }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-foreground">
              Calling Tracker
            </h1>
            <p className="text-xs text-muted-foreground">
              Submission & Remarks Management
            </p>
          </div>
        </div>

        <div className='flex items-center gap-4'>
            {isClient && (
                 <Button
                    id="summary-link"
                    variant="link"
                    onClick={handleSummaryClick}
                    className={cn(
                        "text-foreground transition-opacity",
                        { "opacity-50 pointer-events-none": !hasData }
                    )}
                    disabled={!hasData}
                 >
                    Summary
                 </Button>
            )}
        </div>
      </div>
    </header>
  );
}
