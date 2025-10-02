
"use client"
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ProfileDropdown } from './profile-dropdown';
import { useAuth } from '@/lib/auth-context';
import { User } from 'lucide-react';

export function AppHeader() {
    const pathname = usePathname();
    
    // Don't show header on landing, login, or signup pages
    if (pathname === '/landing' || pathname === '/login' || pathname === '/signup') {
        return null;
    }
    
    const [isClient, setIsClient] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);

    const { user: authUser, logout, isAdmin } = useAuth();

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
            // Check auth state (localStorage-based)
            const savedUser = localStorage.getItem('current_user');
            if (authUser) {
                setCurrentUser({ email: authUser.email, name: authUser.name });
                setIsLoggedIn(true);
            } else if (savedUser) {
                const user = JSON.parse(savedUser);
                setCurrentUser(user);
                setIsLoggedIn(true);
            } else {
                setCurrentUser(null);
                setIsLoggedIn(false);
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

    // Hide timer to avoid flicker when moving between button and dropdown
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = () => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
            hideTimer.current = null;
        }
        setShowProfile(true);
    };

    const handleMouseLeave = () => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setShowProfile(false), 180);
    };

    const handleSummaryClick = () => {
        if (hasData) {
            // Dispatch a custom event to trigger summary view
            window.dispatchEvent(new CustomEvent('showSummary'));
        }
    };

    const handleDashboardClick = () => {
        // Dispatch a custom event to trigger dashboard view
        window.dispatchEvent(new CustomEvent('showDashboard'));
    };

    const handleHomeClick = () => {
        // Dispatch a custom event to trigger home view
        window.dispatchEvent(new CustomEvent('showHome'));
    };

    const handleCallingTrackerClick = () => {
        // Dispatch a custom event to trigger calling tracker view
        window.dispatchEvent(new CustomEvent('showCallingTracker'));
    };

    return (
        <header className="border-b border-gray-800/50 bg-black/90 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/50">
            <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-white">
                            upGrad
                        </h1>
                    </div>
                </div>

                <div className='flex items-center gap-4'>
                    {isClient && isLoggedIn && currentUser && (
                        <>
                            {isAdmin && (
                                <Button
                                    id="calling-tracker-link"
                                    variant="link"
                                    onClick={handleCallingTrackerClick}
                                    className="text-foreground"
                                >
                                    Calling Tracker
                                </Button>
                            )}
                            <Button
                                id="home-link"
                                variant="link"
                                onClick={handleHomeClick}
                                className="text-foreground"
                            >
                                Home
                            </Button>
                            {!isAdmin && (
                                <Button
                                    id="dashboard-link"
                                    variant="link"
                                    onClick={handleDashboardClick}
                                    className="text-foreground"
                                >
                                    Dashboard
                                </Button>
                            )}
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
                            <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                                <button
                                    title={currentUser?.name || currentUser?.email || 'upGrad01'}
                                    className="inline-flex items-center gap-3 whitespace-nowrap text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-md h-10 px-2 bg-transparent border-0"
                                    onClick={() => setShowProfile(!showProfile)}
                                >
                                                                    <div className="h-8 w-8 flex items-center justify-center rounded-sm text-sm font-medium text-white transition-all"
                                                                                     style={{
                                                                                         background: 'linear-gradient(135deg,#ff8a65,#ffb74d)',
                                                                                         border: '1px solid rgba(255,255,255,0.08)',
                                                                                         boxShadow: '0 6px 18px rgba(255,140,50,0.12)',
                                                                                         backdropFilter: 'blur(4px)'
                                                                                     }}>
                                                                                    {(currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
                                                                            </div>
                                    <span className="hidden md:inline-block font-medium text-foreground truncate max-w-[10rem]">{currentUser?.name || currentUser?.email}</span>
                                </button>
                                {showProfile && (
                                    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                                      <ProfileDropdown 
                                          email={currentUser?.email || ''}
                                          name={currentUser?.name || ''}
                                          onLogout={() => {
                                              try {
                                                  logout();
                                              } catch (e) {
                                                  localStorage.removeItem('current_user');
                                                  setIsLoggedIn(false);
                                                  setCurrentUser(null);
                                              }
                                              setShowProfile(false);
                                          }}
                                      />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
