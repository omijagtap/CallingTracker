"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context-supabase';
import { Button } from '../ui/button';
import { UserBadges } from './user-badges';
import { BadgeModal } from './badge-modal';
import { ProfileDropdown } from './profile-dropdown';

export function AppHeader() {
    const { user: authUser, logout, isAdmin } = useAuth();
    const [isClient, setIsClient] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
    const [showBadgeModal, setShowBadgeModal] = useState(false);

    // Enhanced online status tracking with browser activity detection
    useEffect(() => {
        if (authUser) {
            let isUserActive = true;
            let lastActivity = Date.now();
            let onlineInterval: NodeJS.Timeout;
            let activityCheckInterval: NodeJS.Timeout;

            // Update user's online status
            const updateOnlineStatus = async (forceOnline = false) => {
                const isCurrentlyActive = forceOnline || (Date.now() - lastActivity < 60000);
                
                try {
                    await fetch('/api/users/online', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            userId: authUser.id, 
                            isOnline: isCurrentlyActive && !document.hidden,
                            lastSeen: new Date().toISOString(),
                            isActive: isCurrentlyActive
                        })
                    });
                } catch (error) {
                    console.log('Online status update failed:', error);
                }
            };

            // Set offline status
            const setOfflineStatus = async () => {
                try {
                    await fetch('/api/users/online', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            userId: authUser.id, 
                            isOnline: false,
                            lastSeen: new Date().toISOString(),
                            isActive: false
                        })
                    });
                } catch (error) {
                    console.log('Offline status update failed:', error);
                }
            };

            // Track user activity
            const trackActivity = () => {
                lastActivity = Date.now();
                isUserActive = true;
            };

            // Activity event listeners
            const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
            activityEvents.forEach(event => {
                document.addEventListener(event, trackActivity, true);
            });

            // Set online status immediately
            updateOnlineStatus(true);

            // Update online status every 30 seconds
            onlineInterval = setInterval(() => {
                updateOnlineStatus();
            }, 30000);

            // Check for inactivity every 10 seconds
            activityCheckInterval = setInterval(() => {
                const timeSinceActivity = Date.now() - lastActivity;
                if (timeSinceActivity > 300000) {
                    isUserActive = false;
                }
            }, 10000);

            // Handle page visibility changes
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    setOfflineStatus();
                } else {
                    lastActivity = Date.now();
                    updateOnlineStatus(true);
                }
            };

            // Handle page unload
            const handleBeforeUnload = () => {
                fetch('/api/users/online', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: authUser.id,
                        isOnline: false,
                        lastSeen: new Date().toISOString(),
                        isActive: false
                    }),
                    keepalive: true
                }).catch(() => {});
            };

            // Handle window focus/blur
            const handleFocus = () => {
                lastActivity = Date.now();
                updateOnlineStatus(true);
            };

            const handleBlur = () => {
                setOfflineStatus();
            };

            // Add event listeners
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('beforeunload', handleBeforeUnload);
            window.addEventListener('focus', handleFocus);
            window.addEventListener('blur', handleBlur);

            // Cleanup function
            return () => {
                clearInterval(onlineInterval);
                clearInterval(activityCheckInterval);
                
                activityEvents.forEach(event => {
                    document.removeEventListener(event, trackActivity, true);
                });
                
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('beforeunload', handleBeforeUnload);
                window.removeEventListener('focus', handleFocus);
                window.removeEventListener('blur', handleBlur);
                
                setOfflineStatus();
            };
        }
    }, [authUser]);

    useEffect(() => {
        setIsClient(true);

        const checkData = () => {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                try {
                    const parsedState = JSON.parse(savedState);
                    setHasData(parsedState.uploadState === 'success' && parsedState.learnerData?.length > 0);
                } catch {
                    setHasData(false);
                }
            } else {
                setHasData(false);
            }
            
            if (authUser) {
                setCurrentUser({ 
                    email: authUser.email || '', 
                    name: authUser.name || authUser.email || 'User' 
                });
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
                setCurrentUser(null);
            }
        };

        checkData();
        const interval = setInterval(checkData, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [authUser]);

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
            window.dispatchEvent(new CustomEvent('showSummary'));
        }
    };

    const handleDashboardClick = () => {
        window.dispatchEvent(new CustomEvent('showDashboard'));
    };

    const handleHomeClick = () => {
        window.dispatchEvent(new CustomEvent('showHome'));
    };

    const handleCallingTrackerClick = () => {
        window.dispatchEvent(new CustomEvent('showCallingTracker'));
    };

    const handleRankingsClick = () => {
        window.dispatchEvent(new CustomEvent('showRankings'));
    };

    const handleProfileClick = () => {
        window.dispatchEvent(new CustomEvent('showProfile'));
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
                                id="summary-link"
                                variant="link"
                                onClick={handleSummaryClick}
                                className="text-foreground"
                            >
                                Summary
                            </Button>
                            
                            <Button
                                id="rankings-link"
                                variant="link"
                                onClick={handleRankingsClick}
                                className="text-foreground"
                            >
                                🏆 Rankings
                            </Button>
                            
                            {!isAdmin && (
                                <UserBadges 
                                    userId={currentUser?.email} 
                                    displayMode="icon" 
                                    onClick={() => setShowBadgeModal(true)}
                                />
                            )}
                            
                            <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                                <button
                                    title={currentUser?.name || currentUser?.email || 'upGrad01'}
                                    className="inline-flex items-center gap-3 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 rounded-full h-12 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-sm"
                                    onClick={() => setShowProfile(!showProfile)}
                                >
                                    <div className="h-9 w-9 flex items-center justify-center rounded-full text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
                                         style={{
                                             background: 'linear-gradient(135deg, #f59e0b, #f97316, #ef4444)',
                                             border: '2px solid rgba(255,255,255,0.15)',
                                             boxShadow: '0 8px 25px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                                             backdropFilter: 'blur(8px)'
                                         }}>
                                        {(currentUser?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden md:inline-block font-medium text-white/90 truncate max-w-[10rem]">{currentUser?.name || currentUser?.email}</span>
                                </button>
                                {showProfile && (
                                    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                                      <ProfileDropdown 
                                          email={currentUser?.email || ''}
                                          name={currentUser?.name || ''}
                                          onProfile={() => {
                                              handleProfileClick();
                                              setShowProfile(false);
                                          }}
                                          onLogout={async () => {
                                              try {
                                                  if (authUser) {
                                                      try {
                                                          await fetch('/api/users/online', {
                                                              method: 'POST',
                                                              headers: { 'Content-Type': 'application/json' },
                                                              body: JSON.stringify({
                                                                  userId: authUser.id,
                                                                  isOnline: false,
                                                                  lastSeen: new Date().toISOString(),
                                                                  isActive: false
                                                              })
                                                          });
                                                          console.log('User marked offline on logout');
                                                      } catch (offlineError) {
                                                          console.log('Failed to mark user offline on logout:', offlineError);
                                                      }
                                                  }
                                                  logout();
                                              } catch (e) {
                                                  setIsLoggedIn(false);
                                                  setCurrentUser(null);
                                              }
                                          }}
                                      />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <BadgeModal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                userId={currentUser?.email}
            />
        </header>
    );
}
