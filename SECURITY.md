# 🔒 Security Guidelines - Gramdit

## Overview

This document outlines security best practices and guidelines for the Gramdit project. Please follow these guidelines when developing, deploying, or maintaining this application.

## ⚠️ Environment Variables & Secrets

### Never Commit Sensitive Information

**ABSOLUTELY DO NOT commit the following files to version control:**
```
.env
.env.local
.env.*.local
backend/.env
frontend/.env
*.key
*.pem
*.secret
```

### Required Environment Files

1. **Create from templates**: Copy `.env.example` files to `.env` and populate with actual values
2. **Use placeholders in templates**: `.env.example` files contain placeholder values ONLY
3. **Secure storage**: Store actual credentials in:
   - `.env` files (local development only)
   - Environment variables (Docker, CI/CD)
   - Secret management systems (production)

### Environment Variables Setup

#### Root Level
```bash
cp .env.example .env
# Edit .env with your actual values
```

#### Backend
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your actual values
```

#### Frontend
```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your actual values
```

## 🔐 Sensitive Information Categories

### Database Credentials
- `DB_USERNAME` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password (NEVER use simple passwords like "password123")
- `DB_HOST` - Database host (use IP or domain, never hardcode localhost in production)
- `DB_PORT` - Database port

### Redis Configuration
- `REDIS_HOST` - Redis server hostname
- `REDIS_PORT` - Redis port
- `REDIS_PASSWORD` - Redis authentication password

### Admin Credentials
- `PGADMIN_DEFAULT_EMAIL` - pgAdmin login email
- `PGADMIN_DEFAULT_PASSWORD` - pgAdmin login password

### Future: JWT & Authentication
- `JWT_SECRET` - JWT signing secret (min 32 characters)
- `JWT_EXPIRATION` - Token expiration time

### Future: Email/SMTP
- `SMTP_HOST` - SMTP server address
- `SMTP_PORT` - SMTP port
- `SMTP_USER` - SMTP authentication username
- `SMTP_PASSWORD` - SMTP authentication password

### Future: OAuth & Third-Party Services
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `STRIPE_API_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

## ✅ .gitignore Rules

The project `.gitignore` includes:
- ✅ All `.env*` files
- ✅ All `.key`, `.pem`, `.secret` files
- ✅ AWS credentials (`.aws/config`, `.aws/credentials`)
- ✅ SSL/TLS certificates
- ✅ Node modules and build outputs
- ✅ Log files
- ✅ Database files

**Verify files are excluded:**
```bash
# Check what would be committed
git status

# Verify .env files are ignored
git check-ignore -v .env
git check-ignore -v backend/.env
git check-ignore -v frontend/.env
```

## 🚀 Production Deployment

### Before Going to Production

1. **Use Strong Passwords**
   - Minimum 32 characters
   - Mix of uppercase, lowercase, numbers, special characters
   - Use a password generator (e.g., `openssl rand -base64 32`)

2. **Secure Database**
   - Don't expose database to public internet
   - Use SSL/TLS connections
   - Implement database-level firewall rules
   - Use read-only replicas for backups

3. **Redis Security**
   - Set strong password protection
   - Don't expose to public internet
   - Use SSL/TLS or tunnel connections

4. **Environment Variables**
   - Use managed secret systems:
     - AWS Secrets Manager
     - HashiCorp Vault
     - GitHub Secrets (for CI/CD)
     - GitLab CI/CD Variables
   - Never commit `.env` files
   - Rotate secrets regularly

5. **API Security**
   - Use HTTPS/TLS (SSL certificates)
   - Implement rate limiting
   - Validate all user inputs
   - Use CORS properly
   - Implement authentication/authorization

6. **Logging & Monitoring**
   - Log security events
   - Monitor for unusual activity
   - Implement alerting
   - Don't log sensitive data (passwords, tokens)

## 🔄 Docker Deployment

### docker-compose.yml

All sensitive values are now externalized to `.env`:

```bash
# Ensure .env is NOT in version control
git check-ignore .env

# Load environment variables from .env
docker compose up -d

# All services use environment variables
# Example: ${DB_PASSWORD} instead of hardcoded password
```

## 📋 Security Checklist

Before committing to GitHub:

- [ ] `.env` files are in `.gitignore`
- [ ] No hardcoded passwords in source code
- [ ] No hardcoded API keys in source code
- [ ] No hardcoded database credentials in source code
- [ ] `.env.example` contains only placeholder values
- [ ] All sensitive values in docker-compose.yml use `${VARIABLE}` syntax
- [ ] No private keys or certificates in repository
- [ ] No AWS/cloud credentials in repository
- [ ] `.gitignore` is up to date

## 🔍 Scanning for Secrets

Before pushing to GitHub, scan for secrets:

```bash
# Using git-secrets (if installed)
git secrets --scan

# Using truffleHog (Python)
pip install truffleHog
truffle_hog file .

# Using detect-secrets (Python)
pip install detect-secrets
detect-secrets scan

# Manual check - look for these patterns:
grep -r "password\s*=" --include="*.ts" --include="*.js" --include="*.tsx" src/
grep -r "secret\s*=" --include="*.ts" --include="*.js" --include="*.tsx" src/
grep -r "api_key\s*=" --include="*.ts" --include="*.js" --include="*.tsx" src/
```

## 🔄 Secret Rotation

Regularly rotate sensitive credentials:

1. **Passwords**: Every 90 days
2. **API Keys**: Every 180 days
3. **Tokens**: Based on expiration policy
4. **Database Passwords**: After team member changes

## 📞 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Send details to: security@gramdit.com (or appropriate security contact)
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Checklist](https://snyk.io/blog/10-react-security-best-practices/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)

---

**Last Updated**: June 2026  
**Version**: 1.0  
**Status**: Active
