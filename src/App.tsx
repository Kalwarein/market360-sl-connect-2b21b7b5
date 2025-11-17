import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { XCircle } from 'lucide-react';

// Pages
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Perks from "./pages/Perks";
import NotFound from "./pages/NotFound";
// ...other page imports

const queryClient = new QueryClient();

const App = () => {
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Intercept clicks on the blocked URL
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (!target.href) return;

      if (target.href.includes("https://lovable.dev/projects/4b360025-8d48-456b-9a42-694a4c244c34")) {
        e.preventDefault();
        setErrorMessage(
          "⚠ This page cannot be viewed. It's just a watermark page. Click OK to close."
        );
        setErrorModalOpen(true);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/perks" element={<ProtectedRoute><Perks /></ProtectedRoute>} />
                {/* ...all other routes */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>

        {/* Professional Error Modal */}
        {errorModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-300 dark:border-gray-700 relative animate-slideUp">
              {/* Close Button */}
              <button
                onClick={() => setErrorModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                ✕
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>

              {/* Header */}
              <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Page Blocked
              </h2>

              {/* Description */}
              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                This page cannot be viewed. It's just a watermark or restricted content. 
                Click <span className="font-semibold">OK</span> to dismiss this message.
              </p>

              {/* OK Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setErrorModalOpen(false)}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-lg transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Animations (Tailwind style) */}
        <style>
          {`
            @keyframes fadeIn {
              from {opacity: 0;}
              to {opacity: 1;}
            }
            .animate-fadeIn {
              animation: fadeIn 0.25s ease-in-out;
            }
            @keyframes slideUp {
              from {transform: translateY(20px); opacity: 0;}
              to {transform: translateY(0); opacity: 1;}
            }
            .animate-slideUp {
              animation: slideUp 0.3s ease-out;
            }
          `}
        </style>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
