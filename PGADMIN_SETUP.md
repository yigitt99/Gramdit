# pgAdmin 4 Setup & Usage Guide

## 🚀 pgAdmin Başlatma

### 1. Tüm Servisleri Başlat

```bash
# Docker Compose ile tüm servisleri başlat
docker compose up -d

# Sadece pgAdmin'i başlatmak için:
docker compose up -d pgadmin
```

### 2. pgAdmin'e Erişim

Tarayıcınızda aşağıdaki adresi açın:

```
http://localhost:8080
```

## 🔐 Giriş Bilgileri

| Alan | Değer |
|------|-------|
| **Email** | admin@gramdit.com |
| **Password** | gramdit_admin_password_123 |

⚠️ **UYARI:** Bu kimlik bilgilerini `.env` dosyasında değiştirdiyseniz, değiştirilen değerleri kullanın!

## 📊 PostgreSQL Veritabanını pgAdmin'e Bağlama

### Adım 1: Giriş Yap
1. http://localhost:8080 adresine git
2. Email ve Password'u gir
3. "Login" butonuna tıkla

### Adım 2: Add New Server
1. Sol panelde **"Servers"** üzerine sağ tıkla
2. **"Register"** → **"Server"** seç

### Adım 3: General Tab
```
Name: Gramdit Database (veya istediğin ad)
```

### Adım 4: Connection Tab
Aşağıdaki bilgileri doldur:

```
Host name/address: postgres
Port: 5432
Maintenance database: gramdit
Username: gramdit_user
Password: gramdit_password
Save password?: ✓ (Checked)
```

### Adım 5: Kaydet
**"Save"** butonuna tıkla

## ✅ Bağlantı Doğrulama

Bağlantı kurulduktan sonra:

1. Sol panelde **"Servers"** → **"Gramdit Database"** → **"Databases"** → **"gramdit"** → **"Schemas"** → **"public"** → **"Tables"** → **"users"**

2. **"users"** tablosuna sağ tıkla ve **"View/Edit Data"** → **"All Rows"** seç

3. Users tablosunun kolonylarını ve verilerini görebilirsin!

## 🛠️ Kullanışlı İşlemler

### Tablo Yapısını Görüntüle
```
Servers → Gramdit Database → Databases → gramdit → Schemas → public → Tables → users
```
Sağ tıkla → "Properties" seç

### Sorgu Çalıştır
```
Tools → Query Tool
```
SQL sorguları yazıp çalıştır

### Yedek Al
```
Servers → Gramdit Database
```
Sağ tıkla → "Backup..."

### Verileri Dışa Aktar
```
Servers → Gramdit Database → Databases → gramdit → Schemas → public → Tables → users
```
Sağ tıkla → "Backup..." veya "Export"

## 🐳 Docker Komutları

```bash
# pgAdmin loglarını izle
docker compose logs -f pgadmin

# pgAdmin container'ını restart et
docker compose restart pgadmin

# pgAdmin'i durdur
docker compose stop pgadmin

# pgAdmin'i sil (veri silinmez)
docker compose rm pgadmin

# pgAdmin verileri dahil her şeyi sil
docker compose down -v --remove-orphans
```

## 🔒 Güvenlik Not

### Development
- Geçerli kredileri kullanabilirsin
- `.env` dosyası `.gitignore`'da olmalı

### Production
- Güçlü şifre kullanmalısın (min. 16 karakter, mix)
- HTTPS etkinleştir
- pgAdmin'i internete açma
- Docker network'ü güvenli hale getir
- SSL/TLS sertifikaları kullan

## 🔄 Ortam Değişkenleri Değiştirme

Giriş bilgilerini değiştirmek için:

1. `.env` dosyasını aç
2. Aşağıdaki değerleri değiştir:
   ```
   PGADMIN_DEFAULT_EMAIL=new_email@example.com
   PGADMIN_DEFAULT_PASSWORD=new_secure_password
   PGADMIN_PORT=8080  # İstersizn port değiştirebilirsin
   ```
3. Kapsayıcıyı rebuild et:
   ```bash
   docker compose down pgadmin
   docker compose up -d pgadmin
   ```

## 🚨 Sorun Giderme

### pgAdmin açılmıyor
```bash
# Logları kontrol et
docker compose logs pgadmin

# Container'ı yeniden başlat
docker compose restart pgadmin
```

### PostgreSQL bağlantısı başarısız
```bash
# PostgreSQL çalışıyor mu kontrol et
docker compose ps postgres

# PostgreSQL'e doğrudan bağlan
docker compose exec postgres psql -U gramdit_user -d gramdit
```

### Portu değiştirmek istiyorum
1. `.env` dosyasını aç
2. `PGADMIN_PORT=8080` satırını değiştir (örn: `PGADMIN_PORT=9000`)
3. Docker Compose'u restart et:
   ```bash
   docker compose down pgadmin
   docker compose up -d pgadmin
   ```
4. Yeni porta git: `http://localhost:9000`

---

**pgAdmin hazır! Artık veritabanını kolayca yönetebilirsin!** 🎉
