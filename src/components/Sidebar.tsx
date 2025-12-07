import { Menu, Home, HelpCircle, Mail, Shield, Info, FileText, Moon, Sun, Skull, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Separator } from './ui/separator';
import { useUserRoles } from '@/hooks/useUserRoles';

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [hoverCount, setHoverCount] = useState(0);
  const navigate = useNavigate();
  const { isAdmin } = useUserRoles();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const warningMessages = [
    "⚠️ You were warned...",
    "🔥 Last chance to turn back!",
    "💀 Proceed at your own risk!",
    "⛔ Authorized personnel only!",
    "🚨 DANGER ZONE AHEAD!"
  ];

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Info, label: 'About Us', path: '/about' },
    { icon: Shield, label: 'Security Info', path: '/security-info' },
    { icon: HelpCircle, label: 'Support', path: '/support' },
    { icon: Mail, label: 'Contact', path: '/contact' },
    { icon: FileText, label: 'Terms & Conditions', path: '/terms' },
    { icon: Shield, label: 'Privacy Policy', path: '/privacy' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleAdminHover = () => {
    setHoverCount(prev => (prev + 1) % warningMessages.length);
  };

  return (
    <>
      <style>{`
        @keyframes danger-pulse {
          0%, 100% {
            box-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000, 0 0 15px #ff0000;
          }
          50% {
            box-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000, 0 0 40px #ff0000;
          }
        }

        @keyframes red-shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes skull-shake {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(-10deg); }
          20% { transform: rotate(10deg); }
          30% { transform: rotate(-10deg); }
          40% { transform: rotate(10deg); }
          50% { transform: rotate(0deg); }
        }

        @keyframes border-glow {
          0%, 100% {
            border-color: #ff0000;
          }
          50% {
            border-color: #ff6600;
          }
        }

        @keyframes text-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
          75% { opacity: 1; }
          90% { opacity: 0.9; }
        }

        @keyframes lightning {
          0%, 100% { opacity: 0; }
          10% { opacity: 1; }
          15% { opacity: 0; }
          20% { opacity: 1; }
          25% { opacity: 0; }
        }

        .admin-danger-btn {
          position: relative;
          background: linear-gradient(135deg, #1a0000 0%, #330000 50%, #1a0000 100%);
          border: 2px solid #ff0000;
          animation: danger-pulse 2s ease-in-out infinite, border-glow 1.5s ease-in-out infinite;
          overflow: hidden;
        }

        .admin-danger-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 0, 0, 0.3) 25%,
            rgba(255, 100, 0, 0.5) 50%,
            rgba(255, 0, 0, 0.3) 75%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: red-shimmer 2s linear infinite;
          pointer-events: none;
        }

        .admin-danger-btn::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,0,0,0.1) 0%, transparent 60%);
          animation: lightning 3s ease-in-out infinite;
          pointer-events: none;
        }

        .admin-danger-btn:hover {
          transform: scale(1.02);
          animation: danger-pulse 0.5s ease-in-out infinite, border-glow 0.5s ease-in-out infinite;
        }

        .admin-danger-btn:hover .skull-icon {
          animation: skull-shake 0.5s ease-in-out infinite;
        }

        .danger-text {
          animation: text-flicker 2s ease-in-out infinite;
          text-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000;
        }

        .warning-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: linear-gradient(135deg, #ff0000, #ff6600);
          color: white;
          font-size: 8px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          animation: danger-pulse 1s ease-in-out infinite;
          z-index: 10;
        }

        .caution-stripes {
          background: repeating-linear-gradient(
            45deg,
            #000,
            #000 10px,
            #ff0000 10px,
            #ff0000 20px
          );
          height: 4px;
          margin-top: 8px;
          border-radius: 2px;
        }
      `}</style>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 bg-card border-r border-border">
          <SheetHeader className="border-b border-border pb-4 mb-6">
            <SheetTitle className="text-2xl font-bold text-primary">
              Market360
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start text-left hover:bg-primary/10 hover:text-primary transition-smooth rounded-xl border border-border/50 hover:border-primary/30 bg-background/50"
                onClick={() => handleNavigation(item.path)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </Button>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 rounded-xl transition-smooth"
              onClick={toggleDarkMode}
            >
              {darkMode ? (
                <>
                  <Sun className="h-5 w-5 mr-3" />
                  <span className="font-medium">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 mr-3" />
                  <span className="font-medium">Dark Mode</span>
                </>
              )}
            </Button>
          </div>

          {/* LEGENDARY ADMIN DANGER ZONE */}
          {isAdmin && (
            <>
              <Separator className="my-6" />
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider">
                  <Zap className="h-3 w-3" />
                  <span>Restricted Access</span>
                  <Zap className="h-3 w-3" />
                </div>
                
                <div className="relative">
                  <button
                    className="admin-danger-btn w-full py-4 px-4 rounded-xl flex items-center justify-between group"
                    onClick={() => { navigate('/admin'); setOpen(false); }}
                    onMouseEnter={handleAdminHover}
                  >
                    <div className="flex items-center gap-3 z-10">
                      <div className="relative">
                        <Skull className="skull-icon h-6 w-6 text-red-500" />
                      </div>
                      <div className="text-left">
                        <span className="danger-text text-red-100 font-bold block">
                          ADMIN ZONE
                        </span>
                        <span className="text-red-400 text-[10px] uppercase tracking-wider">
                          Authorized Only
                        </span>
                      </div>
                    </div>
                    <div className="z-10 flex items-center gap-1">
                      <span className="text-red-500 text-lg">→</span>
                    </div>
                    <span className="warning-badge">⚠️</span>
                  </button>
                  
                  <div className="caution-stripes" />
                  
                  <p className="text-center text-[10px] text-red-400 mt-2 font-medium">
                    {warningMessages[hoverCount]}
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;