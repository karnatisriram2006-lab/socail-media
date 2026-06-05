import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuthStore } from "./store/authStore";
import { useNotificationStore } from "./store/notificationStore";
import { usePostStore } from "./store/postStore";
import { useProfileStore } from "./store/profileStore";
import { initSocket, disconnectSocket } from "./services/socket";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import RightSidebar from "./components/layout/RightSidebar";
import MobileNav from "./components/layout/MobileNav";
import ScrollToTop from "./components/ui/ScrollToTop";
import ErrorBoundary from "./components/common/ErrorBoundary";
import CreatePostModal from "./components/post/CreatePostModal";
import "./App.css";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const HomeFeed = lazy(() => import("./pages/HomeFeed"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));

function PageLoader() {
  return <div className="p-8">Loading…</div>;
}

function ProtectedRoute({ children }) {
  const { user, isInitialized } = useAuthStore();
  if (!isInitialized) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const isLandingPage = location.pathname === "/";

  const navigate = useNavigate();
  const { user, isInitialized, initialize } = useAuthStore();
  const { fetchNotifications } = useNotificationStore();
  const { fetchFeed } = usePostStore();
  const { fetchProfile } = useProfileStore();
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (user && isInitialized) {
      initSocket().catch(console.error);
      fetchNotifications();
      fetchFeed();
      fetchProfile(user.username);
      if (isAuthPage) {
        navigate("/app");
      }
    }
    if (!user && isInitialized) {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [user, isInitialized, isAuthPage, navigate]);

  const showLayout = user && isInitialized && !isAuthPage && !isLandingPage;

  return (
    <>
      {showLayout && <Sidebar onCreatePost={() => setShowCreatePost(true)} />}
      <div className="min-h-screen">
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <HomeFeed />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route
                path="/edit-profile"
                element={
                  <ProtectedRoute>
                    <EditProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </div>

      {showLayout && (
        <>
          <Navbar />
          <RightSidebar />
          <MobileNav />
          <ScrollToTop />
          {showCreatePost && (
            <CreatePostModal onClose={() => setShowCreatePost(false)} />
          )}
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}
