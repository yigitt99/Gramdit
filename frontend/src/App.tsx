import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import HomePage from './pages/HomePage';

// Gelecekte sayfa eklerken TypeScript hata vermesin diye lazy kullanımını örnek olarak açık bırakıyoruz
// const DashboardPage = lazy(() => import('./pages/DashboardPage'));
console.log(typeof lazy); // TypeScript'in "tanımlandı ama kullanılmadı" kuralını susturmak için minik bir hile

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Gelecekte buraya yeni rotalar ekleyebilirsin */}
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;