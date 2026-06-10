# Gramdit - Hızlı Başlangıç Rehberi

## 🚀 Tek Komutla Başlat

```bash
# Proje dizinine git
cd gramdit

# Tüm konteynerları temizle
docker compose down -v

# Rebuild ve başlat
docker compose build --no-cache
docker compose up -d

# ~2 dakika bekle, sonra:
docker compose ps
```

## ✅ Başarılı Başlatma Kontrol Listesi

```bash
# 1. Tüm hizmetler running olmalı
docker compose ps
# Çıktı: 4 hizmet running (postgres, redis, backend, frontend)

# 2. Backend health check
curl http://localhost:3000/api/v1/health
# Çıktı: {"success":true, "data":{"status":"ok", ...}}

# 3. PostgreSQL bağlantısını kontrol et
docker compose exec postgres psql -U gramdit_user -d gramdit -c "SELECT 1;"
# Çıktı: 1

# 4. Redis bağlantısını kontrol et
docker compose exec redis redis-cli ping
# Çıktı: PONG
```

## 🌐 Tarayıcıda Açma

- **Frontend**: http://localhost:5173 (Gramdit hoş geldin sayfası görülmeli)
- **Backend API**: http://localhost:3000/api/v1
- **Health Endpoint**: http://localhost:3000/api/v1/health

## 📋 Yapılandırma Değerleri

### PostgreSQL
```
User: gramdit_user
Password: gramdit_password
Database: gramdit
Host: postgres (Docker içinde)
Port: 5432
```

### Redis
```
Host: redis (Docker içinde)
Port: 6379
Database: 0
```

### Backend
```
Port: 3000
API Prefix: /api/v1
Environment: development
```

### Frontend
```
Port: 5173
API URL: http://localhost:3000/api/v1
```

## 🔧 Sıkça Kullanılan Komutlar

```bash
# Logları izle
docker compose logs -f

# Sadece backend logları
docker compose logs -f backend

# Sadece frontend logları
docker compose logs -f frontend

# Konteynerler arasında bağlantı test et
docker compose exec backend ping redis
docker compose exec backend ping postgres

# Terminal aç
docker compose exec backend bash
docker compose exec frontend bash

# Restart
docker compose restart

# Durdur
docker compose stop

# Başlat
docker compose start
```

## 🆘 Hata Giderme

### Beyaz Ekran (Frontend)
```bash
# Logs'a bak
docker compose logs frontend

# Cache temizle
docker compose down -v
docker compose build --no-cache frontend
docker compose up -d
```

### Backend Bağlantı Hatası
```bash
# Logs'a bak
docker compose logs backend

# PostgreSQL çalışıyor mu?
docker compose exec postgres pg_isready -U gramdit_user

# Redis çalışıyor mu?
docker compose exec redis redis-cli ping
```

### "Port Already in Use"
```bash
# Hangi işlem kullanıyor kontrol et
lsof -i :3000          # macOS/Linux
netstat -ano | find :3000  # Windows

# Portu kullanmayan farklı portla başlat
# (docker-compose.yml içinde portları değiştir)
```

## 📚 Dosya Düzenlemeleri

### Düzeltilen Dosyalar

| Dosya | Düzeltme |
|-------|----------|
| `docker-compose.yml` | DB user: `gramdit_user`, DB name: `gramdit` |
| `backend/.env` | DB kullanıcı senkronize edildi |
| `backend/.env.example` | DB kullanıcı senkronize edildi |
| `backend/package.json` | `dotenv` paketi eklendi |
| `frontend/vite.config.ts` | `base: '/'` ve host ayarları eklendi |
| `frontend/src/main.tsx` | Root element kontrolü eklendi |
| `frontend/src/App.tsx` | Suspense wrapper eklendi |
| `frontend/index.html` | Meta tagları düzeltildi |
| `frontend/Dockerfile` | SPA mode başlatma (`--single` flag) |
| `backend/src/main.ts` | Geliştişmiş logging ve error handling |
| `backend/src/database/data-source.ts` | Path çözümlemeleri iyileştirildi |

### Önemli Değişiklikler

**PostgreSQL Kullanıcı:**
```
Eski: gramdit → Yeni: gramdit_user
```

**Database Adı:**
```
Eski: gramdit_db → Yeni: gramdit
```

**Frontend Vite Config:**
```typescript
base: '/'
server.host: '0.0.0.0'
```

**Frontend Dockerfile:**
```dockerfile
serve -s dist -l 5173 --single
```

## 🎯 Sonraki Adımlar

1. ✅ Projeyi başlatın
2. ✅ Health endpoint'ini test edin
3. ✅ Frontend'i açın
4. 📝 Feature geliştirmeye başlayın

## 📞 Yardım

### Logs incelemek
```bash
# Tüm servisler
docker compose logs

# Belirli bir servis
docker compose logs [service_name]

# Son 50 satır
docker compose logs --tail 50

# Real-time
docker compose logs -f
```

### Direktleri kontrol etmek
```bash
# Komut listesi
docker compose --help

# Build olmadan başlat
docker compose up -d --no-build

# Force rebuild
docker compose up -d --build

# Pull ve build
docker compose pull
docker compose build --no-cache
```

---

**✨ Artık projeyi başlatmaya hazırsınız!**

```bash
docker compose down -v && docker compose build --no-cache && docker compose up -d
```

**~2 dakika sonra her şey hazır olacak! 🎉**
