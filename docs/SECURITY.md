# 🔐 Security Guidelines

This document outlines security best practices and guidelines for the Monev project.

## 🛡️ Security Features Implemented

### Authentication & Authorization
- ✅ NextAuth v5 for secure authentication
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Session-based authentication
- ✅ CSRF protection (built-in with NextAuth)
- ✅ Email verification for new accounts
- ✅ Password reset with secure tokens
- ✅ Admin role-based access control

### Data Protection
- ✅ Environment variables for secrets
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation with Zod schemas
- ✅ XSS prevention (React auto-escaping)
- ✅ User data isolation (userId checks)
- ✅ Secure password reset tokens (expires in 1 hour)

### API Security
- ✅ API key validation for webhooks
- ✅ Rate limiting for AI endpoints
- ✅ Request authentication checks
- ✅ CORS configuration
- ✅ Security headers (X-Frame-Options, etc.)

### Error Handling
- ✅ Sentry integration for error tracking
- ✅ Sensitive data filtering in error logs
- ✅ Production error boundary
- ✅ Graceful error messages (no stack traces to users)

### Database Security
- ✅ Automated backups
- ✅ User data isolation
- ✅ Prepared statements (Drizzle ORM)
- ✅ Table name whitelisting
- ✅ No raw SQL with user input

---

## 🚨 Security Checklist

### Before Deployment

- [ ] Change all default passwords
- [ ] Generate strong AUTH_SECRET (32+ characters)
- [ ] Set up Sentry for error monitoring
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS (required for production)
- [ ] Set up database backups (automated)
- [ ] Review and update .env.example
- [ ] Remove all console.log with sensitive data
- [ ] Test authentication flows
- [ ] Test authorization (admin vs user)
- [ ] Audit npm dependencies (`npm audit`)
- [ ] Enable security headers
- [ ] Set up rate limiting for all endpoints
- [ ] Configure CSP (Content Security Policy)
- [ ] Test file upload validation
- [ ] Review API endpoint permissions

### Regular Maintenance

- [ ] Update dependencies monthly
- [ ] Review Sentry errors weekly
- [ ] Rotate API keys quarterly
- [ ] Audit user permissions monthly
- [ ] Review database backups weekly
- [ ] Check for security advisories
- [ ] Monitor failed login attempts
- [ ] Review admin activity logs

---

## 🔑 Environment Variables Security

### Required for Production

```bash
# CRITICAL: Generate a strong secret
AUTH_SECRET=$(openssl rand -base64 32)

# CRITICAL: Use production URLs
AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# CRITICAL: Set up error monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Never Commit

❌ **NEVER commit these to git:**
- `.env.local`
- `.env.production`
- Any file containing API keys
- Database files (`*.db`)
- Backup files

✅ **Always use:**
- Environment variables
- Secret management services (AWS Secrets Manager, etc.)
- `.env.example` for documentation only

---

## 🛠️ Security Best Practices

### 1. Input Validation

```typescript
// ✅ GOOD: Validate all user input
import { z } from "zod";

const schema = z.object({
    email: z.string().email(),
    amount: z.number().positive(),
});

const validated = schema.parse(userInput);
```

```typescript
// ❌ BAD: Trust user input
const amount = req.body.amount; // No validation!
```

### 2. SQL Injection Prevention

```typescript
// ✅ GOOD: Use Drizzle ORM with parameterized queries
db.select()
    .from(users)
    .where(eq(users.email, email));

// ✅ GOOD: Use inArray for IN clauses
db.select()
    .from(users)
    .where(inArray(users.id, userIds));
```

```typescript
// ❌ BAD: String concatenation
db.run(`SELECT * FROM users WHERE email = '${email}'`);

// ❌ BAD: Template literals with user input
sql`SELECT * FROM users WHERE id IN (${ids.join(',')})`;
```

### 3. Authentication Checks

```typescript
// ✅ GOOD: Always check authentication
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = parseInt(session.user.id);
    // ... rest of code
}
```

```typescript
// ❌ BAD: No authentication check
export async function GET(req: Request) {
    const userId = req.headers.get("user-id"); // Trusting client!
    // ... rest of code
}
```

### 4. Authorization Checks

```typescript
// ✅ GOOD: Verify ownership
const transaction = await db.select()
    .from(transactions)
    .where(and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, userId) // Ownership check
    ))
    .get();

if (!transaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

```typescript
// ❌ BAD: No ownership verification
const transaction = await db.select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get();
// User can access any transaction!
```

### 5. Sensitive Data Handling

```typescript
// ✅ GOOD: Filter sensitive data
const user = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    // Don't include password hash!
}).from(users).where(eq(users.id, userId)).get();
```

```typescript
// ❌ BAD: Expose everything
const user = await db.select().from(users).where(eq(users.id, userId)).get();
// Returns password hash, tokens, etc.
```

---

## 🚫 Common Vulnerabilities to Avoid

### 1. SQL Injection
**Risk:** Attacker can execute arbitrary SQL  
**Prevention:** Use parameterized queries, never concatenate user input

### 2. XSS (Cross-Site Scripting)
**Risk:** Attacker can inject malicious scripts  
**Prevention:** React auto-escapes, use `dangerouslySetInnerHTML` carefully

### 3. CSRF (Cross-Site Request Forgery)
**Risk:** Attacker can perform actions as authenticated user  
**Prevention:** NextAuth provides CSRF protection, use SameSite cookies

### 4. Authentication Bypass
**Risk:** Unauthorized access to protected resources  
**Prevention:** Always check `auth()` in API routes and server actions

### 5. Insecure Direct Object References (IDOR)
**Risk:** Access to other users' data  
**Prevention:** Always verify userId matches session

### 6. Sensitive Data Exposure
**Risk:** Leaking passwords, tokens, API keys  
**Prevention:** Filter responses, use .env for secrets, sanitize logs

### 7. Broken Access Control
**Risk:** Users accessing admin features  
**Prevention:** Check `isAdmin` flag, separate admin routes

### 8. Security Misconfiguration
**Risk:** Default passwords, exposed error messages  
**Prevention:** Change defaults, use production error handling

---

## 📞 Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email: security@monevapp.com (if available)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work on a fix.

---

## 🔄 Security Updates

### Recent Security Improvements

**May 8, 2026:**
- ✅ Fixed SQL injection vulnerabilities
- ✅ Added Sentry error monitoring
- ✅ Implemented database backup strategy
- ✅ Added environment variable validation
- ✅ Enhanced table name whitelisting
- ✅ Improved input validation

### Planned Security Enhancements

- [ ] Implement Content Security Policy (CSP)
- [ ] Add rate limiting to all API endpoints
- [ ] Set up automated security scanning
- [ ] Implement 2FA (Two-Factor Authentication)
- [ ] Add audit logging for sensitive operations
- [ ] Implement API key rotation
- [ ] Add brute force protection
- [ ] Set up automated dependency updates

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Drizzle ORM Security](https://orm.drizzle.team/docs/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Last Updated:** May 8, 2026  
**Version:** 1.0
