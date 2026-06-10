# Gramdit

Gramdit is a modern social media platform combining features from Instagram and Reddit. This repository contains the base infrastructure for the platform.

## 🏗️ Architecture

This project follows a monorepo architecture with the following structure:

```
gramdit/
├── frontend/          # React + Vite + TypeScript
├── backend/           # NestJS + TypeScript
├── infrastructure/    # Infrastructure configurations
├── docs/             # Documentation
├── docker-compose.yml # Docker orchestration
└── README.md         # This file
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **TailwindCSS** - Utility-first CSS framework

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type safety
- **TypeORM** - ORM for database operations
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **Class Validator** - DTO validation

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PostgreSQL 16** - Database
- **Redis 7** - Cache

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for local development without Docker)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gramdit
   ```

2. **Set up environment variables**
   ```bash
   # Frontend
   cp frontend/.env.example frontend/.env
   
   # Backend
   cp backend/.env.example backend/.env
   ```

3. **Start all services with Docker**
   ```bash
   docker compose up -d
   ```

   This will start:
   - Frontend on http://localhost:5173
   - Backend API on http://localhost:3000
   - PostgreSQL on localhost:5432
   - Redis on localhost:6379

4. **Check service status**
   ```bash
   docker compose ps
   ```

5. **View logs**
   ```bash
   # All services
   docker compose logs -f
   
   # Specific service
   docker compose logs -f backend
   docker compose logs -f frontend
   ```

### Local Development (Without Docker)

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:5173

#### Backend

```bash
cd backend
npm install
npm run start:dev
```

Backend API will be available at http://localhost:3000

**Note:** You still need PostgreSQL and Redis running. You can start them with:
```bash
docker compose up -d postgres redis
```

## 📁 Project Structure

### Frontend Structure

```
frontend/
├── src/
│   ├── api/              # API client configuration
│   ├── assets/           # Static assets
│   ├── components/       # React components
│   │   ├── common/       # Reusable components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # UI components
│   ├── hooks/            # Custom React hooks
│   ├── layouts/          # Page layouts
│   ├── pages/            # Page components
│   ├── routes/           # Route definitions
│   ├── services/         # Business logic services
│   ├── store/            # Zustand store
│   ├── styles/           # Global styles
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── public/               # Public static files
└── index.html           # HTML entry point
```

### Backend Structure

```
backend/
├── src/
│   ├── common/           # Shared utilities
│   │   ├── decorators/   # Custom decorators
│   │   ├── dto/          # Data transfer objects
│   │   ├── exceptions/   # Custom exceptions
│   │   ├── filters/      # Exception filters
│   │   ├── guards/       # Route guards
│   │   ├── interceptors/ # Request/response interceptors
│   │   ├── middleware/   # Custom middleware
│   │   └── pipes/        # Validation pipes
│   ├── config/           # Configuration
│   ├── database/         # Database module
│   │   └── migrations/   # Database migrations
│   ├── redis/            # Redis module
│   ├── modules/          # Feature modules
│   ├── shared/           # Shared modules
│   └── main.ts          # Application entry point
└── test/                # Test files
```

## 🔧 Available Scripts

### Frontend Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
```

### Backend Scripts

```bash
npm run start        # Start production server
npm run start:dev    # Start development server with watch mode
npm run start:debug  # Start in debug mode
npm run build        # Build for production
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Run tests with coverage
```

### Docker Scripts

```bash
docker compose up -d              # Start all services in detached mode
docker compose down               # Stop all services
docker compose down -v            # Stop and remove volumes
docker compose restart <service>  # Restart specific service
docker compose logs -f <service>  # Follow logs for specific service
docker compose ps                 # List running services
docker compose build              # Rebuild images
docker compose pull               # Pull latest images
```

## 🌐 Environment Variables

### ⚠️ Security Notice

**NEVER commit actual credentials or secrets to version control!** Always use:
- `.env` files for local development (ignored by git)
- `.env.example` files as templates with placeholder values
- Environment variables or secret management systems in production

### Frontend Configuration (.env)

Create a `frontend/.env` file based on `frontend/.env.example`:

```bash
cp frontend/.env.example frontend/.env
```

Then edit with your actual values. Never commit this file.

**Example (after setup):**
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000
VITE_APP_NAME=Gramdit
VITE_APP_VERSION=1.0.0
```

### Backend Configuration (.env)

Create a `backend/.env` file based on `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Then edit with your actual database credentials and secrets. **Never commit this file.**

**Required Fields (replace with your own values):**
```env
NODE_ENV=development
PORT=3000

# Database - Use STRONG passwords in production!
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_secure_password
DB_DATABASE=your_db_name

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# API
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173
```

### Template Files

- `frontend/.env.example` - Contains placeholder values for frontend configuration
- `backend/.env.example` - Contains placeholder values for backend configuration

**Always update `.env.example` when adding new environment variables, but use placeholder values!**

## 🔍 Health Checks

### Backend Health Check
```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "service": "gramdit-backend"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### PostgreSQL Health Check
```bash
# Check if PostgreSQL is running (use your actual username)
docker compose exec postgres pg_isready -U your_db_username
```

### Redis Health Check
```bash
docker compose exec redis redis-cli ping
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
```

### Backend Tests
```bash
cd backend
npm run test
npm run test:e2e      # End-to-end tests
npm run test:cov      # With coverage
```

## 🗄️ Database

### Migrations

```bash
# Generate a new migration
cd backend
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Access PostgreSQL

⚠️ **Never share database credentials!** Use your own credentials from `.env`:

```bash
# Replace 'your_db_username' and 'your_db_name' with your actual values
docker compose exec postgres psql -U your_db_username -d your_db_name
```

Then you can run SQL commands:
```sql
SELECT version();
\dt  -- List tables
\du  -- List users/roles
```

### Access Redis

```bash
docker compose exec redis redis-cli

# Common commands:
PING              # Test connection
KEYS *            # List all keys
GET key_name      # Get a value
SET key value     # Set a value
DEL key_name      # Delete a key
FLUSHDB           # Clear all keys (USE WITH CAUTION)
```

## 🐛 Troubleshooting

### Port Already in Use
If you get a "port already in use" error, check which process is using the port:

**Windows:**
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

**Linux/Mac:**
```bash
lsof -i :3000
lsof -i :5173
```

### Docker Build Issues
```bash
# Clean Docker cache and rebuild
docker compose down -v
docker system prune -a
docker compose build --no-cache
docker compose up -d
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker compose ps redis

# View Redis logs
docker compose logs redis

# Restart Redis
docker compose restart redis
```

## 📝 Code Quality

### Linting
```bash
# Frontend
cd frontend
npm run lint
npm run lint:fix

# Backend
cd backend
npm run lint
```

### Formatting
```bash
# Frontend
cd frontend
npm run format

# Backend
cd backend
npm run format
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## 🔒 Security & Secrets Management

### Environment Variables Best Practices

**DO:**
- ✅ Store secrets in `.env` files (ignored by git)
- ✅ Use `.env.example` with placeholder values for documentation
- ✅ Use strong passwords in production (min. 16 characters, mixed case, numbers, symbols)
- ✅ Rotate secrets regularly
- ✅ Use environment-specific configurations
- ✅ Run `git status` before committing to verify no `.env` files are staged

**DON'T:**
- ❌ Never commit `.env` files
- ❌ Never hardcode secrets in source code
- ❌ Never share credentials in documentation or logs
- ❌ Never use default/weak passwords in production
- ❌ Never store secrets in Docker Compose files directly

### Files to NEVER Commit

```
.env
.env.local
.env.*.local
*.env

# Database files
*.sqlite
*.db

# Logs (may contain sensitive data)
logs/
*.log

# OS/IDE files with potential secrets
.vscode/
.idea/

# Node modules
node_modules/

# Docker data
postgres_data/
redis_data/
```

### Checking Before Push

Always verify your `.gitignore` is working:

```bash
# List files that will be committed
git ls-files

# Should NOT include:
# - .env files
# - database credentials
# - API keys
# - JWT secrets

# If you accidentally committed secrets:
git rm --cached .env
git commit --amend -m "Remove .env file"
```

### Production Deployment

For production deployments:
- Use a secret management system (AWS Secrets Manager, HashiCorp Vault, etc.)
- Never use Docker Compose for production
- Use environment variables provided by your platform
- Implement secret rotation policies
- Enable audit logging for secret access

### Sensitive Information

Treat as secrets:
- Database usernames and passwords
- API keys and tokens
- JWT secrets
- OAuth credentials
- SMTP credentials
- AWS/Cloud provider credentials
- Session secrets
- Encryption keys
- Webhook URLs with authentication
- Third-party service tokens

## 📄 License

MIT

## 🔗 Links

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Documentation](https://docs.docker.com/)

---

**Note:** This is the base infrastructure. No business logic or social media features are implemented yet. This foundation will be used to build authentication, communities, posts, comments, and voting systems in future iterations.
