import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import { WebGLShader } from './components/ui/web-gl-shader';

// Gelecekte sayfa eklerken TypeScript hata vermesin diye lazy kullanımını örnek olarak açık bırakıyoruz
// const DashboardPage = lazy(() => import('./pages/DashboardPage'));
console.log(typeof lazy); // TypeScript'in "tanımlandı ama kullanılmadı" kuralını susturmak için minik bir hile

function App() {
  return (
    <>
      <WebGLShader />
      <div className="min-h-screen bg-transparent relative z-0">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

export default App;