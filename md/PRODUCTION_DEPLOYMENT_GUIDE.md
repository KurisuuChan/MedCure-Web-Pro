# MedCure-Pro Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying MedCure-Pro pharmacy management system to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Deployment](#database-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Production Configuration](#production-configuration)
6. [Security Configuration](#security-configuration)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Maintenance](#maintenance)

## Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher (via Supabase)
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 10GB free space
- **SSL Certificate**: Required for HTTPS

### Required Accounts

- Supabase account for database hosting
- Vercel/Netlify account for frontend hosting
- Domain name for custom URL

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/medcure-pro.git
cd medcure-pro
```

### 2. Install Dependencies

```bash
npm install --production
```

### 3. Environment Variables

Create `.env.production` file:

```env
# Application
NODE_ENV=production
VITE_APP_NAME=MedCure-Pro
VITE_APP_VERSION=1.0.0

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
VITE_JWT_SECRET=your-jwt-secret-256-bit
VITE_ENCRYPTION_KEY=your-encryption-key-256-bit
VITE_API_BASE_URL=https://your-domain.com/api

# Performance
VITE_CDN_URL=https://your-cdn.com
VITE_ANALYTICS_ID=your-analytics-id

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

## Database Deployment

### 1. Supabase Setup

1. Create new Supabase project
2. Configure authentication providers
3. Set up row-level security (RLS)
4. Run database migrations

### 2. Database Migration

```bash
# Run the complete migration script
psql -h your-supabase-host -U postgres -d postgres -f database/COMPLETE_MEDCURE_MIGRATION.sql
```

### 3. Initial Data Setup

```sql
-- Create admin user
INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@medcure.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now()
);

-- Create admin profile
INSERT INTO user_profiles (user_id, first_name, last_name, role, phone)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@medcure.com'),
  'System',
  'Administrator',
  'admin',
  '+1234567890'
);
```

### 4. Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create security policies (refer to UPDATED_MEDCURE_SCHEMA.sql)
```

## Frontend Deployment

### 1. Build Application

```bash
# Production build
npm run build

# Validate build
npm run validate-build
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
# ... add all production environment variables
```

### 3. Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

### 4. Custom Domain Setup

1. Configure DNS records
2. Set up SSL certificate
3. Configure redirects and headers

## Production Configuration

### 1. Vite Configuration (`vite.config.js`)

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    sourcemap: false, // Disable for security
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@headlessui/react", "lucide-react"],
          query: ["@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
```

### 2. Package.json Scripts

```json
{
  "scripts": {
    "build": "vite build",
    "build:analyze": "vite build --mode analyze",
    "preview": "vite preview",
    "deploy": "npm run build && vercel --prod",
    "health-check": "node scripts/health-check.js"
  }
}
```

## Security Configuration

### 1. CSP Headers

```javascript
// netlify.toml or vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://your-domain.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://your-supabase.supabase.co; font-src 'self';"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 2. Authentication Security

- JWT token expiration: 1 hour
- Refresh token rotation enabled
- Multi-factor authentication ready
- Session timeout: 8 hours of inactivity

### 3. Database Security

- Row Level Security (RLS) enabled
- API keys rotated regularly
- Connection pooling configured
- Backup encryption enabled

## Performance Optimization

### 1. Code Splitting

- Route-based splitting implemented
- Component lazy loading
- Vendor chunk separation
- Dynamic imports for heavy features

### 2. Caching Strategy

```javascript
// Service Worker for caching (if implemented)
const CACHE_NAME = "medcure-pro-v1.0.0";
const urlsToCache = [
  "/",
  "/dashboard",
  "/inventory",
  "/pos",
  "/static/js/bundle.js",
  "/static/css/main.css",
];
```

### 3. CDN Configuration

- Static assets served via CDN
- Image optimization enabled
- Gzip compression enabled
- Browser caching headers set

### 4. Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze
```

## Monitoring & Logging

### 1. Error Monitoring

```javascript
// Error boundary setup
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: "production",
  tracesSampleRate: 0.1,
});
```

### 2. Performance Monitoring

```javascript
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 3. Application Monitoring

- Uptime monitoring setup
- API response time tracking
- Database performance monitoring
- User activity analytics

## Backup & Recovery

### 1. Database Backup

```bash
# Automated daily backups via Supabase
# Point-in-time recovery available for 7 days
# Export critical data weekly

# Manual backup
pg_dump -h your-supabase-host -U postgres -d postgres > backup.sql
```

### 2. Application Backup

- Source code in version control
- Environment variables documented
- Configuration files backed up
- SSL certificates secured

### 3. Recovery Procedures

1. Database restoration from backup
2. Application redeployment
3. Environment variable restoration
4. SSL certificate renewal

## Maintenance

### 1. Regular Updates

- Dependency updates monthly
- Security patches immediate
- Feature updates quarterly
- Database maintenance weekly

### 2. Health Checks

```javascript
// health-check.js
const healthCheck = async () => {
  try {
    // Check database connectivity
    const { data, error } = await supabase
      .from("health_check")
      .select("*")
      .limit(1);

    // Check API endpoints
    const response = await fetch("/api/health");

    // Check external services
    // ...

    console.log("Health check passed");
  } catch (error) {
    console.error("Health check failed:", error);
    process.exit(1);
  }
};

healthCheck();
```

### 3. Performance Optimization

- Regular performance audits
- Bundle size monitoring
- Database query optimization
- Cache invalidation strategies

## SSL Certificate

### 1. Let's Encrypt (Automatic)

Most platforms handle SSL automatically:

- Vercel: Automatic SSL
- Netlify: Automatic SSL
- Cloudflare: Free SSL with proxy

### 2. Custom SSL

If using custom SSL:

```bash
# Generate CSR
openssl req -new -newkey rsa:2048 -nodes -keyout domain.key -out domain.csr

# Install certificate
# Follow your hosting provider's instructions
```

## Environment-Specific Configurations

### Development

```env
NODE_ENV=development
VITE_LOG_LEVEL=debug
VITE_ENABLE_DEV_TOOLS=true
```

### Staging

```env
NODE_ENV=staging
VITE_LOG_LEVEL=info
VITE_ENABLE_DEV_TOOLS=false
```

### Production

```env
NODE_ENV=production
VITE_LOG_LEVEL=error
VITE_ENABLE_DEV_TOOLS=false
```

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Check Node.js version compatibility
   - Clear node_modules and reinstall
   - Verify environment variables

2. **Database Connection Issues**

   - Verify Supabase URL and keys
   - Check network connectivity
   - Validate RLS policies

3. **Performance Issues**

   - Analyze bundle size
   - Check network requests
   - Monitor memory usage

4. **Authentication Problems**
   - Verify JWT configuration
   - Check token expiration
   - Validate user permissions

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm start

# Check build output
npm run build -- --debug
```

## Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] Authentication works correctly
- [ ] Database connections established
- [ ] All features functional
- [ ] Performance metrics acceptable
- [ ] Security headers configured
- [ ] SSL certificate valid
- [ ] Monitoring alerts configured
- [ ] Backup systems operational
- [ ] Documentation updated

## Support & Maintenance

### Regular Tasks

- Weekly security updates
- Monthly dependency updates
- Quarterly performance reviews
- Annual security audits

### Emergency Procedures

1. Identify issue scope
2. Implement immediate fix
3. Communicate with stakeholders
4. Document incident
5. Review and improve processes

### Contact Information

- Technical Lead: [Contact Information]
- DevOps Team: [Contact Information]
- Emergency Hotline: [Contact Information]

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintained By**: MedCure-Pro Development Team
