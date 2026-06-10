# Development Guide

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. Clone repository
2. Copy environment files
3. Install dependencies
4. Start services

```bash
# Clone
git clone <repository-url>
cd gramdit

# Environment setup
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Start with Docker
docker compose up -d
```

## Development Workflow

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Access at: http://localhost:5173

#### Hot Module Replacement
Vite provides instant HMR for React components. Changes appear immediately without full page reload.

#### Adding New Components

```typescript
// src/components/common/Button.tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
}

function Button({ label, onClick }: ButtonProps) {
  return (
    <button onClick={onClick} className="px-4 py-2 bg-blue-500 text-white rounded">
      {label}
    </button>
  );
}

export default Button;
```

#### Adding New Pages

```typescript
// src/pages/ExamplePage.tsx
function ExamplePage() {
  return (
    <div>
      <h1>Example Page</h1>
    </div>
  );
}

export default ExamplePage;

// Update App.tsx
<Route path="/example" element={<ExamplePage />} />
```

#### State Management with Zustand

```typescript
// src/store/exampleStore.ts
import { create } from 'zustand';

interface ExampleState {
  count: number;
  increment: () => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Usage in component
const { count, increment } = useExampleStore();
```

### Backend Development

```bash
cd backend
npm install
npm run start:dev
```

Access at: http://localhost:3000

#### Creating New Module

```bash
cd backend
npx nest generate module users
npx nest generate controller users
npx nest generate service users
```

#### Creating DTOs

```typescript
// src/modules/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

#### Creating Entities

```typescript
// src/modules/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

#### Creating Service

```typescript
// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }
}
```

### Database Migrations

#### Creating Migration

```bash
cd backend
npm run migration:generate -- src/database/migrations/CreateUsersTable
```

#### Running Migrations

```bash
npm run migration:run
```

#### Reverting Migration

```bash
npm run migration:revert
```

### Redis Usage

```typescript
// In any service
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SomeService {
  constructor(private redisService: RedisService) {}

  async getCachedData(key: string) {
    return this.redisService.get(key);
  }

  async setCachedData(key: string, value: string, ttl?: number) {
    await this.redisService.set(key, value, ttl);
  }
}
```

## Code Style Guide

### TypeScript

```typescript
// Use interfaces for object shapes
interface UserData {
  id: string;
  name: string;
}

// Use types for unions, intersections
type Status = 'active' | 'inactive';

// Use const for immutable values
const MAX_USERS = 100;

// Use arrow functions
const getUserName = (user: UserData): string => user.name;

// Async/await preferred over promises
async function fetchUser(id: string): Promise<UserData> {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
}
```

### React Components

```typescript
// Use function components
function MyComponent({ prop1, prop2 }: Props) {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  return <div>{/* JSX */}</div>;
}

// Export at bottom
export default MyComponent;
```

### Naming Conventions

- **Files**: kebab-case (user-profile.tsx)
- **Components**: PascalCase (UserProfile)
- **Functions**: camelCase (getUserData)
- **Constants**: UPPER_SNAKE_CASE (MAX_RETRY_COUNT)
- **Interfaces**: PascalCase with I prefix (IUserData) or without
- **Types**: PascalCase (UserStatus)

## Testing

### Frontend Tests (Future)

```bash
cd frontend
npm run test
```

### Backend Tests

```bash
cd backend
npm run test           # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # With coverage
```

## Debugging

### Frontend Debugging

1. Use React DevTools browser extension
2. Console logging: `console.log()`
3. Debugger statement: `debugger;`
4. VS Code debugging with launch.json

### Backend Debugging

```bash
# Start in debug mode
npm run start:debug
```

VS Code launch.json:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach NestJS",
  "port": 9229,
  "restart": true
}
```

### Database Debugging

```bash
# Access PostgreSQL
docker compose exec postgres psql -U gramdit -d gramdit_db

# Run SQL query
SELECT * FROM users;

# Check migrations
SELECT * FROM migrations;
```

### Redis Debugging

```bash
# Access Redis CLI
docker compose exec redis redis-cli

# Check keys
KEYS *

# Get value
GET key_name

# Check all databases
INFO keyspace
```

## Performance Tips

### Frontend

1. Use React.memo for expensive components
2. Lazy load routes with React.lazy()
3. Optimize images and assets
4. Use Vite's code splitting
5. Minimize bundle size

### Backend

1. Use database indexes
2. Implement caching with Redis
3. Use connection pooling
4. Optimize database queries
5. Use async operations

## Common Issues

### Port Already in Use

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9
```

### Docker Issues

```bash
# Rebuild containers
docker compose down -v
docker compose build --no-cache
docker compose up -d

# Clean Docker system
docker system prune -a
```

### Module Not Found

```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

## Best Practices

1. **Commit Often**: Small, focused commits
2. **Write Tests**: Test critical functionality
3. **Code Reviews**: Review before merging
4. **Documentation**: Update docs with code
5. **Error Handling**: Handle all error cases
6. **Logging**: Log important events
7. **Security**: Never commit secrets
8. **Performance**: Profile before optimizing

## Useful Commands

```bash
# Docker
docker compose up -d              # Start services
docker compose down               # Stop services
docker compose logs -f backend    # View logs
docker compose restart backend    # Restart service
docker compose ps                 # List services

# Git
git status                        # Check status
git add .                         # Stage changes
git commit -m "message"           # Commit
git push origin branch-name       # Push

# npm
npm install package-name          # Install package
npm uninstall package-name        # Remove package
npm update                        # Update packages
npm audit                         # Security audit
npm audit fix                     # Fix vulnerabilities
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [TypeORM Documentation](https://typeorm.io/)
