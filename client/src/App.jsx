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
import MyReviews from "./pages/MyReviews";
import NotFound from "./pages/NotFound";
import OrderSuccess from "./pages/OrderSuccess";
import OrderTracking from "./pages/OrderTracking";
import OwnerLogin from "./pages/OwnerLogin";
import Register from "./pages/Register";
import OwnerLayout from "./components/owner/OwnerLayout";
import OwnerDashboard from "./pages/owner/Dashboard";
import OwnerFoods from "./pages/owner/Foods";
import OwnerOrders from "./pages/owner/Orders";
import OwnerInventory from "./pages/owner/Inventory";
import OwnerReviews from "./pages/owner/Reviews";
import NotificationToast from "./components/NotificationToast";
import RealtimeBridge from "./components/RealtimeBridge";
import ThemeToggle from "./components/ThemeToggle";
import { useThemeStore } from "./stores/themeStore";

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const isOwner = user?.role === "owner";

  useEffect(() => {
    document.documentElement.classList.remove("theme-light", "theme-dark", "theme-night", "dark");
    document.documentElement.classList.add(`theme-${theme}`);
    if (theme !== "light") document.documentElement.classList.add("dark");
  }, [theme]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl justify-end px-4 pt-3"><ThemeToggle /></div>
      <RealtimeBridge />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
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
          <Route path="/order-tracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reviews"
            element={
              <ProtectedRoute>
                <MyReviews />
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
            <Route path="reviews" element={<OwnerReviews />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <NotificationToast />
    </div>
  );
}
