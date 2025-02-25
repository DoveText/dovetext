# API Routes Documentation

## Authentication Pattern

We use a Higher-Order Function (HOF) pattern for API route authentication. This approach provides consistent authentication across all API routes while keeping the code DRY and maintainable.

### How It Works

1. The `withAuth` wrapper in `@/lib/api/withAuth.ts` handles:
   - Token verification using Firebase Admin
   - Session creation
   - Error handling
   - Public route bypassing

2. Each protected API route is wrapped with `withAuth`:

```typescript
import { withAuth, type NextRequestWithAuth } from '@/lib/api/withAuth';

export const GET = withAuth(async (request: NextRequestWithAuth) => {
  // Your route handler code
  // request.session! is guaranteed to be available
  const { uid, email } = request.session!;
  
  // ... rest of your logic
});
```

### Public Routes

The following routes bypass authentication:
- `/api/version/check`
- `/api/health`

Add more public routes in `withAuth.ts`.

### Type Safety

The `NextRequestWithAuth` type ensures type safety for the session:

```typescript
type NextRequestWithAuth = NextRequest & {
  session?: AuthenticatedSession;
};
```

### Error Handling

The wrapper handles common error cases:
- Missing/invalid token: Returns 401
- Token verification failure: Returns 401
- Firebase Admin errors: Returns 401

### Example Usage

```typescript
// Protected GET endpoint
export const GET = withAuth(async (request: NextRequestWithAuth) => {
  try {
    const result = await db.oneOrNone(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [request.session!.uid]
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Protected POST endpoint
export const POST = withAuth(async (request: NextRequestWithAuth) => {
  const body = await request.json();
  // request.session! contains verified user data
  // ... your logic here
});
```

### Benefits

1. **Centralized Auth Logic**: All authentication happens in one place
2. **Type Safety**: TypeScript ensures correct session usage
3. **DRY Code**: No duplicate auth checks
4. **Consistent Error Handling**: Standard error responses
5. **Easy to Extend**: Add more middleware wrappers as needed

### Adding New Protected Routes

1. Create your route file (e.g., `app/api/user/data/route.ts`)
2. Import `withAuth` and `NextRequestWithAuth`
3. Wrap your handler with `withAuth`
4. Use `request.session!` for authenticated user data

The wrapper ensures your route only executes if authentication succeeds.
