# Supabase Expert Skill

## Overview
A comprehensive skill for mastering all aspects of Supabase, including database management, authentication, storage, real-time features, and edge functions.

## Core Components

### 1. Database Management (PostgreSQL)
- Advanced PostgreSQL features and optimizations
- Schema design and migrations
- Row Level Security (RLS) policies
- Performance tuning and indexing strategies

### 2. Authentication & Authorization
- Custom authentication flows
- OAuth integrations
- JWT token management
- User management and roles

### 3. Storage System
- File upload/download strategies
- Access control and security
- Image transformation and optimization
- CDN integration

### 4. Real-time Features
- Subscriptions and broadcasting
- Presence channels
- Real-time query synchronization
- Optimistic UI updates

### 5. Edge Functions
- Serverless function deployment
- Integration with database and auth
- Third-party API connections
- Performance optimization

### 6. Client Libraries
- Supabase.js advanced usage
- Error handling and retry mechanisms
- Offline-first strategies
- Type-safe client implementations

## Advanced Practices for Each Component

### Database Management
- Implement complex RLS policies for fine-grained access control
- Use stored procedures and triggers for complex business logic
- Optimize queries with proper indexing strategies
- Monitor and tune database performance using pg_stat_statements
- Implement partitioning for large tables
- Use JSON/JSONB fields effectively for flexible schemas
- Master backup and restore procedures

### Authentication & Authorization
- Implement custom email templates and providers
- Create secure password reset and verification flows
- Use service roles for administrative operations
- Implement multi-factor authentication
- Manage user metadata and profiles effectively
- Securely handle session management and token refresh
- Implement role-based access control (RBAC)

### Storage System
- Implement secure file upload validation and sanitization
- Use signed URLs for temporary access to private files
- Optimize image delivery with transformations and caching
- Implement chunked uploads for large files
- Set up automated virus scanning for uploaded files
- Manage storage quotas and usage analytics
- Implement cross-region replication strategies

### Real-time Features
- Optimize channel subscriptions to minimize resource usage
- Implement presence features for collaborative applications
- Handle connection failures and reconnections gracefully
- Use real-time features for live dashboards and notifications
- Implement rate limiting for real-time operations
- Secure real-time channels with proper authentication
- Optimize payload sizes for efficient real-time communication

### Edge Functions
- Implement robust error handling and logging
- Optimize cold start times and performance
- Secure functions with proper authentication and validation
- Implement caching strategies for improved performance
- Connect to external APIs securely
- Monitor function performance and usage
- Implement proper testing strategies for serverless functions

### Client Libraries
- Implement smart caching strategies
- Handle offline scenarios and sync when online
- Optimize network requests and manage connection states
- Implement proper error boundaries and user feedback
- Use type-safe approaches with TypeScript
- Optimize bundle sizes and loading performance
- Implement retry mechanisms for failed operations

## Implementation Examples

### Advanced Database Query with RLS
```sql
-- Example of a complex RLS policy
CREATE POLICY "Allow users to view their own profile data"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM relationships
      WHERE relationships.requester_id = auth.uid()
      AND relationships.accepted = true
      AND relationships.target_id = profiles.id
    )
  );
```

### Authentication with Custom Provider
```javascript
// Example of custom authentication provider
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourdomain.com/welcome',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  }
});
```

### Storage with Transformations
```javascript
// Example of image transformation
const { data, error } = await supabase.storage
  .from('avatars')
  .download('public/avatar.png', {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover'
    }
  });
```

### Real-time Subscription
```javascript
// Example of real-time subscription with filters
const mySubscription = supabase
  .channel('schema-db-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'posts',
      filter: 'author_id=eq.123'
    },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();
```

### Edge Function with External API
```typescript
// Example of an edge function connecting to external API
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  // Call external API
  const response = await fetch('https://api.external-service.com/data');
  const externalData = await response.json();

  // Store in Supabase
  const { data, error } = await supabase
    .from('external_data')
    .insert([{ ...externalData }]);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## Expert Checklist
- [ ] Master PostgreSQL administration and optimization
- [ ] Implement comprehensive RLS policies for all tables
- [ ] Set up custom authentication providers
- [ ] Configure secure storage with proper access controls
- [ ] Implement real-time features with proper error handling
- [ ] Deploy and optimize edge functions
- [ ] Create type-safe client implementations
- [ ] Set up monitoring and alerting for all services
- [ ] Implement backup and disaster recovery procedures
- [ ] Document all custom configurations and workflows