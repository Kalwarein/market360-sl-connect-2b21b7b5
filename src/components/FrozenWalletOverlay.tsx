import { Snowflake } from 'lucide-react';

interface FrozenWalletOverlayProps {
  message?: string;
}

const FrozenWalletOverlay = ({ message = "Your wallet is frozen. Please contact support." }: FrozenWalletOverlayProps) => {
  return (
    <div className="absolute inset-0 z-50 overflow-hidden rounded-[inherit]">
      {/* Ice/Frost Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-cyan-50/70 to-blue-200/80 dark:from-blue-900/80 dark:via-cyan-900/70 dark:to-blue-800/80 backdrop-blur-sm" />
      
      {/* Frosted Glass Effect */}
      <div className="absolute inset-0 backdrop-blur-[2px]" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(200,230,255,0.3) 50%, rgba(255,255,255,0.4) 100%)'
      }} />
      
      {/* Ice Crystal Pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2393c5fd' fill-opacity='0.4'%3E%3Cpath d='M30 0l3.09 6.26L40 7.64l-5 4.87 1.18 6.88L30 16l-6.18 3.39L25 12.51l-5-4.87 6.91-1.38L30 0zm0 20l2.47 5.01 5.53 1.1-4 3.9.94 5.5L30 33l-4.94 2.71.94-5.5-4-3.9 5.53-1.1L30 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />
      
      {/* Animated Mist/Smoke */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-radial from-white/40 to-transparent rounded-full animate-pulse-slow blur-3xl" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-radial from-blue-200/40 to-transparent rounded-full animate-pulse-slow blur-3xl" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-radial from-cyan-100/30 to-transparent rounded-full animate-pulse-slow blur-2xl" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
      </div>
      
      {/* Ice Border Effect */}
      <div className="absolute inset-0 border-4 border-blue-300/50 dark:border-blue-400/40 rounded-[inherit]" style={{
        boxShadow: 'inset 0 0 30px rgba(147, 197, 253, 0.3), inset 0 0 60px rgba(147, 197, 253, 0.1)'
      }} />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4">
          {/* Snowflake with glow */}
          <div className="absolute inset-0 animate-ping opacity-20">
            <Snowflake className="h-16 w-16 text-blue-400" />
          </div>
          <Snowflake className="h-16 w-16 text-blue-500 dark:text-blue-400 drop-shadow-lg animate-pulse" style={{ animationDuration: '2s' }} />
        </div>
        
        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2 drop-shadow-sm">
          Wallet Frozen
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 max-w-xs drop-shadow-sm">
          {message}
        </p>
      </div>
    </div>
  );
};

export default FrozenWalletOverlay;