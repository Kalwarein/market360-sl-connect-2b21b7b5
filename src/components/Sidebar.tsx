import { Menu, Home, HelpCircle, Mail, Shield, Info, FileText, Wallet, Handshake } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Separator } from './ui/separator';

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Automatically follow system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    // Set initial theme based on system preference
    handleThemeChange(mediaQuery);
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', handleThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Info, label: 'About Us', path: '/about' },
    { icon: Handshake, label: 'Collaborations', path: '/collaboration' },
    { icon: Wallet, label: 'How to Top Up', path: '/how-to-top-up' },
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

  return (
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

        <p className="text-xs text-muted-foreground text-center">
          Theme follows your device settings
        </p>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;