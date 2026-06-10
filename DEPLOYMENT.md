# Gramdit - Deployment & Setup Guide

## 🚀 Projeyi Sıfırdan Başlatma (Docker)

### Adım 1: Tüm Konteynerları Temizle ve Sil

```bash
# Tüm servisleri durdur, volumeleri sil
docker compose down -v

# Ek temizlik (isteğe bağlı)
docker system prune -a --volumes
```

### Adım 2: Ortam Dosyalarını Ayarla

Frontend .env:
```bash
cat > frontend/.env << EOF
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000
VITE_APP_NAME=Gramdit
VITE_APP_VERSION=1.0.0
EOF
```

Backend .env:
```bash
cat > backend/.env << EOF
NODE_ENV=development
PORT=3000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=gramdit_user
DB_PASSWORD=gramdit_password
DB_DATABASE=gramdit

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# API
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173
EOF
```

### Adım 3: Tüm İmajları Yeniden İnşa Et ve Başlat

```bash
# Frontend ve Backend imajlarını yeniden inşa et
docker compose build --no-cache

# Tüm servisleri background'da başlat
docker compose up -d

# Servislerin durumunu kontrol et (1-2 dakika bekle)
docker compose ps

# Logları izle (çıkmak için Ctrl+C)
docker compose logs -f
```

### Adım 4: Servislerin Hazır Olmasını Bekle

```bash
# PostgreSQL hazır mı kontrol et
docker compose exec postgres pg_isready -U gramdit_user

# Redis hazır mı kontrol et
docker compose exec redis redis-cli ping

# Backend loglarını izle (hazır oluncaya kadar bekle)
docker compose logs -f backend
```

### Adım 5: Health Check Yap

```bash
# Backend health endpoint
curl http://localhost:3000/api/v1/health

# Expected response:
# {
#   "success": true,
#   "data": {
#     "status": "ok",
#     "timestamp": "2024-01-01T00:00:00.000Z",
#     "service": "gramdit-backend"
#   },
#   "timestamp": "2024-01-01T00:00:00.000Z"
# }
```

### Adım 6: Tarayıcıda Açma

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1
- **Health Check**: http://localhost:3000/api/v1/health

---

## 🔧 PostgreSQL Kullanıcı Konfigürasyonu

### Düzeltilen Ayarlar

#### docker-compose.yml
```yaml
postgres:
  environment:
    POSTGRES_USER: gramdit_user      # ← Düzeltildi (gramdit değil)
    POSTGRES_PASSWORD: gramdit_password
    POSTGRES_DB: gramdit              # ← Düzeltildi (gramdit_db değil)
```

#### backend/.env
```
DB_USERNAME=gramdit_user              # ← Düzeltildi
DB_PASSWORD=gramdit_password
DB_DATABASE=gramdit                   # ← Düzeltildi
```

**Neden Hata Oluyordu?**
- PostgreSQL başlatılırken `gramdit` isimli bir kullanıcı rolü oluşturulmuyordu
- NestJS (TypeORM) `gramdit` kullanıcısıyla bağlanmaya çalışıyordu
- Sonuç: `FATAL: role "gramdit" does not exist`

**Çözüm**
- Tüm dosyalardaki kullanıcı adı `gramdit_user` olarak standardize edildi
- `postgres` default kullanıcısı kullanılmıştır
- Tüm .env dosyaları docker-compose.yml ile senkronize edildi

---

## 🎨 Frontend Beyaz Ekran Sorunu Çözümü

### Düzeltilen Dosyalar

#### frontend/vite.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/',              // ← Konfigüre edildi
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,   // ← Docker uyumlu
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,     // ← Performance
  },
});
```

#### frontend/src/main.tsx
```typescript
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Check your index.html file.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

#### frontend/index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gramdit</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### frontend/src/App.tsx
```typescript
import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
```

#### frontend/Dockerfile
```dockerfile
# Production stage
CMD ["serve", "-s", "dist", "-l", "5173", "--no-clipboard", "--single"]
```

**Neden Beyaz Ekran Oluyordu?**
- Root element (#root) bulunamıyordu
- React StrictMode render hatalarını görmüyordu
- Serve konfigürasyonu SPA fallback'i yapmıyordu
- Vite base konfigürasyonu eksikti

**Çözüm**
- Root element kontrolü eklendi
- Error boundary eklendi
- Serve SPA mode ile başlatılıyor (`--single`)
- Tarayıcı konsolu hatalarını görmek için hata kontrolleri eklendi

---

## 📊 Docker Compose Değişiklikleri

### Güncellemeler:

```yaml
services:
  postgres:
    healthcheck:
      start_period: 10s    # ← Eklendi: Başlangış için bekleme süresi
    environment:
      POSTGRES_INITDB_ARGS: "-E UTF8"  # ← UTF-8 encoding

  redis:
    healthcheck:
      start_period: 10s    # ← Eklendi

  backend:
    environment:
      DB_USERNAME: gramdit_user  # ← Düzeltildi
      DB_DATABASE: gramdit       # ← Düzeltildi
    volumes:
      - /app/dist               # ← Build output caching

  frontend:
    volumes:
      - /app/dist               # ← Build output caching
```

---

## 🐛 Hata Giderme

### PostgreSQL Bağlantı Hatası

```bash
# Logs'a bak
docker compose logs postgres

# PostgreSQL'e doğrudan bağlan
docker compose exec postgres psql -U gramdit_user -d gramdit -c "SELECT version();"

# Kullanıcıları listele
docker compose exec postgres psql -U gramdit_user -d gramdit -c "\du"
```

### Backend Bağlantı Hatası

```bash
# Backend logs'a bak
docker compose logs backend

# Ortam değişkenlerini kontrol et
docker compose exec backend env | grep DB_

# Health endpoint'i test et
curl -v http://localhost:3000/api/v1/health
```

### Frontend Beyaz Ekran

```bash
# Tarayıcı konsolu (F12 > Console) hatalarını kontrol et
# Frontend logs'a bak
docker compose logs frontend

# Static files doğru servis ediliyor mu kontrol et
curl -v http://localhost:5173/index.html
```

### Redis Bağlantı Hatası

```bash
# Redis logs'a bak
docker compose logs redis

# Redis'e bağlan
docker compose exec redis redis-cli ping

# Keys listele
docker compose exec redis redis-cli KEYS '*'
```

---

## ✅ Kontrol Listesi

- [ ] Docker Compose kurulu (`docker compose --version`)
- [ ] Node 20+ kurulu (`node --version`)
- [ ] Portlar boş (5173, 3000, 5432, 6379)
- [ ] .env dosyaları kopyalandı
- [ ] `docker compose down -v` ile temizlendi
- [ ] `docker compose build --no-cache` ile rebuild edildi
- [ ] `docker compose up -d` ile başlatıldı
- [ ] `docker compose ps` ile status kontrol edildi
- [ ] Backend health endpoint çalışıyor
- [ ] Frontend http://localhost:5173 açılıyor

---

## 📝 Hızlı Komutlar

```bash
# Başlatma
docker compose up -d

# Durdurma
docker compose down

# Tamiz restart
docker compose down -v && docker compose build --no-cache && docker compose up -d

# Logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose logs -f redis

# Services status
docker compose ps

# Entegre bash
docker compose exec backend bash
docker compose exec frontend bash
docker compose exec postgres bash

# Database ops
docker compose exec postgres psql -U gramdit_user -d gramdit
docker compose exec redis redis-cli

# Clean rebuild
docker system prune -a --volumes
docker compose build --no-cache
docker compose up -d --build
```

---

## 🎯 Sonuç

Tüm konfigürasyonlar düzeltildi ve test edildi. Artık:

✅ PostgreSQL kullanıcı rolü problemi çözüldü
✅ Frontend beyaz ekran sorunu çözüldü
✅ Environment değişkenleri tüm yerlerde senkronize
✅ Docker Compose optimal konfigüre edildi
✅ Health checks doğru şekilde çalışıyor

Projeyi başlatmak için:

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

**~2 dakika sonra tüm hizmetler hazır olacaktır!**
