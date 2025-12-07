import { Menu, Home, HelpCircle, Mail, Shield, Info, FileText, Wallet, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Separator } from './ui/separator';

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

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

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Info, label: 'About Us', path: '/about' },
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
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;