import { Home, Store, MessageCircle, ShoppingCart, User } from 'lucide-react';
import { NavLink } from './NavLink';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/categories', icon: Store, label: 'Markets' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-all"
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-2 rounded-xl transition-all",
                  isActive && "bg-primary/10"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5",
                    isActive && "text-primary"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;