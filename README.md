# 🚀 Gramdit - Modern Multi-Platform Ecosystem

Gramdit, NestJS (Backend), React/Vite (Frontend), PostgreSQL ve Redis altyapısı ile Dockerize edilmiş olarak çalışan, yüksek performanslı bir sosyal ağ platformudur.

## 🛠️ Teknolojik Altyapı
* **Backend:** NestJS, TypeScript, TypeORM
* **Frontend:** React, Vite, TypeScript, Tailwind CSS
* **Veri Tabanı & Cache:** PostgreSQL, Redis
* **Konteynerizasyon:** Docker, Docker Compose

## 🏃 Hızlı Başlangıç (Local Setup)

Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları sırasıyla takip etmeniz yeterlidir.

### 1. Depoyu Klonlayın
git clone https://github.com/yigitt99/Gramdit.git
cd Gramdit

### 2. Çevre Değişkenlerini Ayarlayın
Ana dizinde bir .env dosyası oluşturun ve .env.example içerisindeki şablonu kendi şifrelerinizle doldurun:
DB_USER=gramdit
DB_PASSWORD=gramdit_password
DB_NAME=gramdit_db
DB_EXTERNAL_PORT=5433

### 3. Projeyi Ayağa Kaldırın (Docker)
docker compose up -d --build

## 🌐 Erişim Portları
* **Frontend:** http://localhost:5173
* **Backend API:** http://localhost:3000/api/v1
* **Health Check:** http://localhost:3000/api/v1/health
