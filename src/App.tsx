import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";

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
import NotificationDetail from "./pages/NotificationDetail";
import Search from "./pages/Search";
import Settings from "./pages/Settings";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import SellerOrderDetail from "./pages/SellerOrderDetail";
import AdminUsers from "./pages/AdminUsers";
import AdminStores from "./pages/AdminStores";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminWalletRequests from "./pages/AdminWalletRequests";
import AdminWalletRequestDetail from "./pages/AdminWalletRequestDetail";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import StoreSettings from "./pages/StoreSettings";
import CategoryResults from "./pages/CategoryResults";
import AdminBroadcast from "./pages/AdminBroadcast";
import SecurityInfo from "./pages/SecurityInfo";
import ProductManagement from "./pages/ProductManagement";
import Perks from "./pages/Perks";
import ProfileViewer from "./pages/ProfileViewer";
import OrderArrival from "./pages/OrderArrival";

const queryClient = new QueryClient();

const App = () => (
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
              <Route path="/perks" element={<ProtectedRoute><Perks /></ProtectedRoute>} /> {/* Added Perks route */}
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute><Stores /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/profile-viewer/:userId" element={<ProtectedRoute><ProfileViewer /></ProtectedRoute>} />
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
          <Route path="/notification/:notificationId" element={<ProtectedRoute><NotificationDetail /></ProtectedRoute>} />
          <Route path="/order-arrival/:orderId" element={<ProtectedRoute><OrderArrival /></ProtectedRoute>} />
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
              <Route path="/admin-wallet-requests/:requestId" element={<ProtectedRoute><AdminWalletRequestDetail /></ProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order-detail/:orderId" element={<OrderDetail />} />
          <Route path="/seller/order/:orderId" element={<ProtectedRoute><SellerOrderDetail /></ProtectedRoute>} />
              <Route path="/admin-broadcast" element={<AdminBroadcast />} />
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
