import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { XCircle } from 'lucide-react';

// Pages
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Messages from "./pages/Messages";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import BecomeSeller from "./pages/BecomeSeller";
import Wallet from "./pages/Wallet";
import NotFound from "./pages/NotFound";
import SellerDashboard from "./pages/SellerDashboard";
import AddProduct from "./pages/AddProduct";
import ProductDetails from "./pages/ProductDetails";
import StorePage from "./pages/StorePage";
import Chat from "./pages/Chat";
import MessagesPage from "./pages/MessagesPage";
import Stores from "./pages/Stores";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import Notifications from "./pages/Notifications";
import Search from "./pages/Search";
import Settings from "./pages/Settings";
import Orders from "./pages/Orders";
import AdminUsers from "./pages/AdminUsers";
import AdminStores from "./pages/AdminStores";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminWalletRequests from "./pages/AdminWalletRequests";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import StoreSettings from "./pages/StoreSettings";
import CategoryResults from "./pages/CategoryResults";
import AdminBroadcast from "./pages/AdminBroadcast";
import SecurityInfo from "./pages/SecurityInfo";
import ProductManagement from "./pages/ProductManagement";
import Perks from "./pages/Perks"; 

const queryClient = new QueryClient();

const App = () => {
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  // Function to trigger modal for blocked link
  const handleBlockedLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const url = e.currentTarget.href;
    if (url.includes("https://lovable.dev/projects/4b360025-8d48-456b-9a42-694a4c244c34")) {
      e.preventDefault();
      setErrorModalOpen(true);
    }
  };

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
                <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                <Route path="/categories" element={<ProtectedRoute><Stores /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/become-seller" element={<ProtectedRoute><BecomeSeller /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                <Route path="/seller-dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
                <Route path="/add-product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
                <Route path="/product/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
                <Route path="/store/:storeId" element={<ProtectedRoute><StorePage /></ProtectedRoute>} />
                <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
                <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/store-settings" element={<ProtectedRoute><StoreSettings /></ProtectedRoute>} />
                <Route path="/admin-auth" element={<AdminAuth />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/stores" element={<AdminStores />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/wallet-requests" element={<AdminWalletRequests />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
                <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
                <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
                <Route path="/security-info" element={<SecurityInfo />} />
                <Route path="/product-management/:id" element={<ProtectedRoute><ProductManagement /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>

        {/* Blocked Page Modal */}
        {errorModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-300 dark:border-gray-700 relative">
              <button
                onClick={() => setErrorModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                ✕
              </button>
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Page Blocked
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                This page cannot be viewed. It's just a watermark or restricted content. Click <span className="font-semibold">OK</span> to dismiss this message.
              </p>
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
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
