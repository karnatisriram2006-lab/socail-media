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
import { initSocket, disconnectSocket, getSocket } from "./services/socket";
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
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));

function PageLoader() {
  return <div className="p-8 text-center text-gray-500">Loading…</div>;
}

function ProtectedRoute({ children }) {
  const { user, isInitialized } = useAuthStore();
  if (!isInitialized) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DashboardLayout({ children, onCreatePost, showCreatePost, onCloseCreatePost }) {
  return (
    <div className="app-bg min-h-screen">
      <Navbar />
      <Sidebar />
      <main
        className="lg:pl-[280px] xl:pr-[300px] pt-[70px] min-h-screen"
      >
        {children}
      </main>
      <RightSidebar />
      <MobileNav onCreatePostClick={onCreatePost} />
      <ScrollToTop />
      {showCreatePost && <CreatePostModal onClose={onCloseCreatePost} />}
    </div>
  );
}

function SocketBridge() {
  // Wire socket events to zustand stores for real-time updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNewPost = (post) => {
      try {
        usePostStore.setState((state) => ({
          posts: [post, ...state.posts],
        }))
      } catch (e) { console.error(e) }
    }
    const handleNewLike = ({ postId, likesCount }) => {
      try {
        usePostStore.setState((state) => ({
          posts: state.posts.map((p) =>
            p._id === postId ? { ...p, likesCount } : p
          ),
        }))
      } catch (e) { console.error(e) }
    }
    const handleNewComment = ({ postId, comment }) => {
      try {
        usePostStore.setState((state) => ({
          posts: state.posts.map((p) =>
            p._id === postId
              ? { ...p, commentsCount: (p.commentsCount || 0) + 1, comments: [...(p.comments || []), comment] }
              : p
          ),
        }))
      } catch (e) { console.error(e) }
    }
    const handleNewFollow = () => {
      try {
        useNotificationStore.getState().fetchNotifications()
      } catch (e) { console.error(e) }
    }
    const handleNewNotification = (n) => {
      try {
        useNotificationStore.setState((state) => ({
          notifications: [n, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }))
      } catch (e) { console.error(e) }
    }
    const handleUserStatus = ({ userId, isOnline }) => {
      // Could update an online status map; not displayed in current UI
      console.log('userStatus', userId, isOnline)
    }

    socket.on('newPost', handleNewPost)
    socket.on('newLike', handleNewLike)
    socket.on('newComment', handleNewComment)
    socket.on('newFollow', handleNewFollow)
    socket.on('newNotification', handleNewNotification)
    socket.on('userStatusChange', handleUserStatus)

    return () => {
      socket.off('newPost', handleNewPost)
      socket.off('newLike', handleNewLike)
      socket.off('newComment', handleNewComment)
      socket.off('newFollow', handleNewFollow)
      socket.off('newNotification', handleNewNotification)
      socket.off('userStatusChange', handleUserStatus)
    }
  }, [])

  return null
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  const navigate = useNavigate();
  const { user, isInitialized, initialize, logout } = useAuthStore();
  const { fetchNotifications } = useNotificationStore();
  const { fetchFeed } = usePostStore();
  const { fetchProfile } = useProfileStore();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const initializeRef = React.useRef(false);

  // Initialize auth only once on app load
  useEffect(() => {
    if (!initializeRef.current) {
      initializeRef.current = true;
      initialize();
    }
  }, [initialize]);

  // Handle post-login logic and navigation
  useEffect(() => {
    if (!isInitialized) return;

    const sessionError = sessionStorage.getItem("authError");
    if (sessionError && user) {
      sessionStorage.removeItem("authError");
      logout();
      return;
    }

    if (user) {
      initSocket().catch(console.error);
      fetchNotifications();
      fetchFeed();
      fetchProfile(user.username);

      if (isAuthPage) {
        navigate("/app", { replace: true });
      }
    } else {
      disconnectSocket();
      if (!["/", "/login", "/register"].includes(location.pathname)) {
        navigate("/login", { replace: true });
      }
    }

    return () => disconnectSocket();
  }, [
    user,
    isInitialized,
    isAuthPage,
    navigate,
    location.pathname,
    fetchNotifications,
    fetchFeed,
    fetchProfile,
    logout,
  ]);

  return (
    <>
      {user && <SocketBridge />}
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
                  <DashboardLayout
                    onCreatePost={() => setShowCreatePost(true)}
                    showCreatePost={showCreatePost}
                    onCloseCreatePost={() => setShowCreatePost(false)}
                  >
                    <HomeFeed />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <DashboardLayout
                    onCreatePost={() => setShowCreatePost(true)}
                    showCreatePost={showCreatePost}
                    onCloseCreatePost={() => setShowCreatePost(false)}
                  >
                    <ExplorePage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <DashboardLayout
                    onCreatePost={() => setShowCreatePost(true)}
                    showCreatePost={showCreatePost}
                    onCloseCreatePost={() => setShowCreatePost(false)}
                  >
                    <SearchPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <DashboardLayout
                    onCreatePost={() => setShowCreatePost(true)}
                    showCreatePost={showCreatePost}
                    onCloseCreatePost={() => setShowCreatePost(false)}
                  >
                    <NotificationsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:username"
              element={
                <ProtectedRoute>
                  <DashboardLayout
                    onCreatePost={() => setShowCreatePost(true)}
                    showCreatePost={showCreatePost}
                    onCloseCreatePost={() => setShowCreatePost(false)}
                  >
                    <ProfilePage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout
                    onCreatePost={() => setShowCreatePost(true)}
                    showCreatePost={showCreatePost}
                    onCloseCreatePost={() => setShowCreatePost(false)}
                  >
                    <EditProfilePage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
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
