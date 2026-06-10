# Gramdit Architecture

## Overview

Gramdit follows a modern monorepo architecture with clear separation of concerns between frontend, backend, and infrastructure layers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Browser                          │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP/HTTPS
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Vite    │  │  Router  │  │ Zustand  │  │  Axios   │  │
│  └───────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────┬───────────────────────────────────────────┘
                  │ REST API
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (NestJS)                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              API Layer (Controllers)                   │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │           Business Logic (Services)                     │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│  ┌──────────────────────▼─────────────────────────────────┐ │
│  │         Data Access Layer (Repositories)                │ │
│  └───────────┬──────────────────────────────┬──────────────┘ │
└──────────────┼──────────────────────────────┼────────────────┘
               │                              │
               ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │   PostgreSQL     │          │      Redis       │
    │   (Database)     │          │     (Cache)      │
    └──────────────────┘          └──────────────────┘
```

## Technology Stack

### Frontend Layer
- **React 18**: Component-based UI library
- **TypeScript**: Static type checking
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Zustand**: Lightweight state management
- **Axios**: HTTP client with interceptors
- **TailwindCSS**: Utility-first styling

### Backend Layer
- **NestJS**: Enterprise Node.js framework
- **TypeScript**: Type-safe server code
- **TypeORM**: Database ORM
- **Class Validator**: Request validation
- **Redis Client**: Cache operations

### Data Layer
- **PostgreSQL 16**: Primary relational database
- **Redis 7**: In-memory cache and session store

### Infrastructure Layer
- **Docker**: Container platform
- **Docker Compose**: Multi-container orchestration

## Design Patterns

### Frontend Patterns

1. **Component Architecture**
   - Atomic design methodology
   - Reusable UI components
   - Container/Presentational pattern

2. **State Management**
   - Zustand for global state
   - React hooks for local state
   - Immutable state updates

3. **API Communication**
   - Centralized Axios instance
   - Request/response interceptors
   - Error handling middleware

### Backend Patterns

1. **Layered Architecture**
   - Controllers: Handle HTTP requests
   - Services: Business logic
   - Repositories: Data access

2. **Dependency Injection**
   - NestJS IoC container
   - Constructor injection
   - Modular design

3. **Middleware Pipeline**
   - Request validation
   - Exception filtering
   - Logging interceptors

## Data Flow

### Request Flow

1. User interaction in browser
2. React component triggers action
3. Zustand store update (if needed)
4. Axios sends HTTP request
5. Request interceptor adds headers
6. NestJS receives request
7. Validation pipe checks DTO
8. Controller routes to service
9. Service executes business logic
10. Repository queries database/cache
11. Response formatted by interceptor
12. Frontend receives response
13. UI updates with new data

### Error Flow

1. Error occurs in any layer
2. Exception thrown
3. Global exception filter catches error
4. Error formatted to standard structure
5. HTTP status code determined
6. Error logged
7. Response sent to client
8. Frontend interceptor handles error
9. User-friendly message displayed

## Module Organization

### Frontend Modules

```
src/
├── api/          - API client configuration
├── components/   - UI components
├── hooks/        - Custom React hooks
├── pages/        - Route pages
├── store/        - Global state
├── types/        - TypeScript definitions
└── utils/        - Helper functions
```

### Backend Modules

```
src/
├── common/       - Shared utilities
├── config/       - Configuration
├── database/     - Database connection
├── redis/        - Redis connection
├── modules/      - Feature modules
└── shared/       - Shared services
```

## Security Considerations

### Frontend Security
- Environment variable validation
- XSS prevention with React
- HTTPS in production
- Secure token storage

### Backend Security
- Input validation with DTOs
- SQL injection prevention (TypeORM)
- CORS configuration
- Rate limiting (future)
- Authentication/Authorization (future)

### Infrastructure Security
- Container isolation
- Network segmentation
- Secret management
- Database access control

## Scalability Strategy

### Horizontal Scaling
- Stateless backend services
- Load balancer ready
- Session storage in Redis
- Database connection pooling

### Vertical Scaling
- Optimized database queries
- Redis caching layer
- Efficient algorithms
- Resource monitoring

### Performance Optimization
- Frontend code splitting
- API response caching
- Database indexing (future)
- CDN for static assets (future)

## Monitoring & Logging

### Application Logging
- Structured logging format
- Request/response logging
- Error stack traces
- Performance metrics

### Infrastructure Monitoring
- Container health checks
- Database connection status
- Redis availability
- Resource utilization

## Deployment Architecture

### Development Environment
```
Docker Compose
├── Frontend (Hot reload)
├── Backend (Watch mode)
├── PostgreSQL
└── Redis
```

### Production Environment (Future)
```
Load Balancer
├── Frontend Instances (N)
├── Backend Instances (N)
├── PostgreSQL (Primary + Replicas)
└── Redis (Cluster)
```

## Future Considerations

1. **Microservices**: Break backend into smaller services
2. **Message Queue**: Add RabbitMQ/Redis Pub-Sub
3. **API Gateway**: Centralized routing and auth
4. **Service Mesh**: Inter-service communication
5. **Observability**: Distributed tracing, metrics
6. **CI/CD**: Automated testing and deployment
