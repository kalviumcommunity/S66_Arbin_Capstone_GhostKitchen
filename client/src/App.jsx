import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./stores/authStore";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CustomerAuth from "./pages/CustomerAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import MyOrders from "./pages/MyOrders";
import NotFound from "./pages/NotFound";
import OrderSuccess from "./pages/OrderSuccess";
import OwnerLogin from "./pages/OwnerLogin";
import Register from "./pages/Register";
import OwnerLayout from "./components/owner/OwnerLayout";
import OwnerDashboard from "./pages/owner/Dashboard";
import OwnerFoods from "./pages/owner/Foods";
import OwnerOrders from "./pages/owner/Orders";
import OwnerInventory from "./pages/owner/Inventory";
import NotificationToast from "./components/NotificationToast";
import RealtimeBridge from "./components/RealtimeBridge";

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === "owner";

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <RealtimeBridge />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to={isOwner ? "/owner/dashboard" : "/menu"} replace /> : <Home />} />
          <Route
            path="/customer"
            element={isAuthenticated ? <Navigate to={isOwner ? "/owner/dashboard" : "/menu"} replace /> : <CustomerAuth />}
          />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={isAuthenticated ? <Navigate to={isOwner ? "/owner/dashboard" : "/menu"} replace /> : <Login />} />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to={isOwner ? "/owner/dashboard" : "/menu"} replace /> : <Register />}
          />
          <Route
            path="/owner/login"
            element={isAuthenticated ? <Navigate to={isOwner ? "/owner/dashboard" : "/menu"} replace /> : <OwnerLogin />}
          />

          <Route
            path="/owner"
            element={
              <ProtectedRoute role="owner">
                <OwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="foods" element={<OwnerFoods />} />
            <Route path="orders" element={<OwnerOrders />} />
            <Route path="inventory" element={<OwnerInventory />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <NotificationToast />
    </div>
  );
}
