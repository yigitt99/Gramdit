import { Routes, Route } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CommunityPage from './pages/CommunityPage';
import PostDetailPage from './pages/PostDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import BookmarksPage from './pages/BookmarksPage';
import ProtectedRoute from './components/ProtectedRoute';
import { WebGLShader } from './components/ui/web-gl-shader';
import useStore from './store';
import AuthService from './services/auth.service';

function App() {
  const token = useStore((state) => state.token);
  const setState = useStore((state) => state.setState);
  const resetState = useStore((state) => state.resetState);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const user = await AuthService.getMe();
        setState({ user, isAuthenticated: true });
      } catch (error) {
        console.error('Failed to restore session:', error);
        resetState();
      }
    };

    fetchUser();
  }, [token, setState, resetState]);

  return (
    <>
      {/* WebGL shader — global background for all pages */}
      <WebGLShader />

      <div className="min-h-screen bg-transparent relative z-0">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  style={{ animationDelay: `${i * 0.15}s` }}
                  className="w-1.5 h-1.5 rounded-full bg-[#f97316]/60 animate-bounce"
                />
              ))}
            </div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />

            <Route path="/communities/:slug" element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            } />

            <Route path="/posts/:id" element={
              <ProtectedRoute>
                <PostDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/:username" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />

            <Route path="/bookmarks" element={
              <ProtectedRoute>
                <BookmarksPage />
              </ProtectedRoute>
            } />

            <Route path="/communities" element={
              <ProtectedRoute>
                <div className="flex items-center justify-center min-h-screen text-white text-xl">
                  Communities Page (Placeholder)
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

export default App;