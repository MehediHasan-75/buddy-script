# Gap Analysis: follow.md vs Task.md

## Context
Deep review of whether follow.md sufficiently covers:
- "Things to Consider" (best practices, scale, security, UX)
- "Required functionalities" (all 6 feed features)

---

## Functional Coverage (Required Functionalities)

| # | Requirement | Plan Coverage | Gap? |
|---|------------|--------------|------|
| 1 | Create posts with text and image | ✅ PostComposer + Cloudinary | None |
| 2 | Newest first | ✅ cursor pagination DESC | None |
| 3 | Like/unlike state correctly | ✅ LikeButton + optimistic update | None |
| 4 | Comments, replies, like/unlike | ✅ Full component tree + API | Minor: no optimistic update for comments |
| 5 | Who has liked (post/comment/reply) | ✅ LikesModal + /likes routes | None |
| 6 | Private/public posts | ✅ visibility toggle + feed filter | None |

All 6 required functionalities are covered. Issues are in the "Things to Consider" section.

---

## Critical Bugs (Plan Won't Work As Written)

### BUG 1: Next.js Middleware Cannot Read localStorage
**Location in plan:** Authentication Flow step 4
> "Protected routes → middleware.ts (Next.js) checks token in localStorage → redirects to /login if absent"

**Problem:** Next.js middleware runs on the Edge runtime (server-side). It has ZERO access to browser APIs including `localStorage`. This code will either silently fail or throw an error, meaning ALL routes become accessible to unauthenticated users.

**Fix:** Store JWT in an HttpOnly cookie instead of localStorage.
- `POST /api/auth/login` → server sets `Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict`
- Middleware reads `cookies().get('token')` — works correctly
- Axios sends requests with `withCredentials: true` instead of Authorization header
- SSR feed fetch also works because cookies are forwarded automatically

### BUG 2: SSR Feed Fetch Has No Auth Access
**Location in plan:** `feed/page.tsx` described as "SSR initial posts fetch"
**Problem:** JWT is in localStorage → inaccessible server-side → SSR fetch returns 401 → broken.
**Fix:** Same as BUG 1 — cookie-based auth solves this automatically (cookies are sent with SSR requests).

### BUG 3: PORT Mismatch
**Location in plan:** Backend `.env` example shows `PORT=5000`
**Problem:** `backend/src/config/environment.ts` defaults to `8000`. Plan and code are inconsistent.
**Fix:** Update `.env` example in plan to use `PORT=8000`.

---

## Missing Required Features (Gap in Plan)

### GAP 1: No Logout
The plan never mentions logout anywhere — not in auth flow, not in Navbar component, not in API routes.

**Fix needed:**
- `POST /api/auth/logout` → clears the HttpOnly cookie
- `Navbar.tsx` profile dropdown "Logout" button → calls logout, clears token, redirects to `/login`

### GAP 2: No Reply Deletion
API routes table has `DELETE /api/comments/:commentId` but no `DELETE /api/replies/:replyId`.

**Fix needed:** Add route + controller method + `ReplyItem.tsx` delete button (author only).

---

## Scale Gaps (Millions of Posts and Reads)

### SCALE 1: Missing Database Indexes (Critical)
The schema section defines models but specifies NO indexes. Without indexes, queries on millions of documents do full collection scans → catastrophic performance.

**Required indexes:**
```ts
// Post — feed query: visibility + createdAt cursor + author filter
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ visibility: 1, createdAt: -1 });

// Comment — paginated by post
CommentSchema.index({ post: 1, createdAt: -1 });

// Reply — paginated by comment
ReplySchema.index({ comment: 1, createdAt: -1 });

// Like — compound unique + query indexes
LikeSchema.index({ user: 1, post: 1 }, { unique: true, sparse: true });
LikeSchema.index({ user: 1, comment: 1 }, { unique: true, sparse: true });
LikeSchema.index({ user: 1, reply: 1 }, { unique: true, sparse: true });
LikeSchema.index({ post: 1 });
LikeSchema.index({ comment: 1 });
LikeSchema.index({ reply: 1 });
```

### SCALE 2: No Denormalized Counts (Critical)
The plan queries the Like collection for counts on every feed render. At millions of posts × N likes each, `Like.countDocuments({ post: postId })` on every card is a disaster.

**Fix:** Add denormalized count fields to models, updated atomically:
```ts
// Post model additions
likesCount: { type: Number, default: 0 }
commentsCount: { type: Number, default: 0 }

// Comment model additions
likesCount: { type: Number, default: 0 }
repliesCount: { type: Number, default: 0 }

// Reply model additions
likesCount: { type: Number, default: 0 }
```
Toggle like → `Post.findByIdAndUpdate(id, { $inc: { likesCount: +1/-1 } })` — O(1), no COUNT query.

### SCALE 3: Redis Not Leveraged for Caching
The backend has Redis fully configured (rate limiting already uses it). The plan doesn't use Redis for any caching.

**Recommended additions:**
- Cache individual post like counts in Redis (TTL: 60s) for hot posts
- Cache current user's liked post IDs per feed page (TTL: 30s) to avoid per-post Like queries
- (Optional) Cache the first page of the public feed (TTL: 10s) for unauthenticated preview

---

## Security Gaps

### SEC 1: localStorage JWT → XSS Vulnerability
**Current plan:** `localStorage.getItem('token')` in axios interceptor.
**Risk:** Any XSS attack (e.g., via user-generated post content) can steal the token.
**Fix (same as BUG 1):** HttpOnly cookie eliminates this attack vector entirely.
**Impact:** Changing to cookies also eliminates the need for the axios Authorization header interceptor; replace with `withCredentials: true`.

### SEC 2: No Post Content Sanitization (XSS in Feed)
Post content is user-generated text. If rendered with `dangerouslySetInnerHTML` or without sanitization, a post containing `<script>` tags is an XSS vector.

**Fix:** Use `DOMPurify` on the frontend before rendering post/comment content. Or render as plain text only (no HTML).

### SEC 3: No Image Upload Validation
`ImageUpload.tsx` selects files and uploads to Cloudinary. No mention of:
- File type validation (accept only image/*)
- File size limit (e.g., 10MB max)

**Fix:** Add `accept="image/*"` to file input + client-side size check before upload.

### SEC 4: Rate Limiters Not Wired to Auth Routes
The backend has `strict` limiter (5 req/15min) and `register` limiter (5 req/hr) ready but unused.

**Fix:** Apply in route definitions:
```ts
router.post('/login', strictLimiter, loginController)
router.post('/register', registerLimiter, registerController)
```

---

## UX Gaps

### UX 1: No Toast / Notification System
No global feedback mechanism defined. Users get no confirmation that a post was created, an error occurred, etc.

**Fix:** Add a lightweight toast library (e.g., `react-hot-toast` or `sonner`) in root layout.
Trigger on: post created, error states, login failure (complement to inline form errors).

### UX 2: Comment/Reply Mutations Not Optimistic
The plan specifies optimistic updates for likes but not for comment creation or reply creation.

**Recommendation:** Add optimistic updates to `useComments.ts` for add/delete operations — improves perceived performance significantly.

---

## Minor Issues

| # | Issue | Fix |
|---|-------|-----|
| M1 | `cloudinary.ts` is an empty file | Implement Cloudinary SDK v2 config |
| M2 | JWT expiry conflict: env has 15m access + 7d refresh, plan uses single 7d JWT | Align: use single long-lived (7d) JWT in HttpOnly cookie, remove refresh token complexity |
| M3 | No `DELETE /api/replies/:replyId` route | Add to routes table + controller |
| M4 | Avatar upload not planned | Either skip (initials only) or add `POST /api/users/avatar` |
| M5 | Phase 7 says "Create PLAN.md" — deliverable docs should be `README.md` or `docs/architecture.md` per Task.md requirement | Rename accordingly |

---

## Proposed Changes to follow.md

### HIGH PRIORITY (Required for correctness)

1. **Auth storage strategy** → Switch to HttpOnly cookie (fixes BUG 1, BUG 2, SEC 1)
   - Auth flow section rewrite
   - Axios instance: add `withCredentials: true`, remove Authorization header interceptor
   - Add `POST /api/auth/logout` to API routes
   - Update `middleware.ts` to use `cookies()` instead of localStorage check
   - Add logout to Navbar component

2. **Add logout** to API routes table and Navbar component description

3. **Add reply deletion** to API routes table (`DELETE /api/replies/:replyId`)

4. **Fix PORT** in env example (`5000` → `8000`)

### HIGH PRIORITY (Required for scale)

5. **Database indexes** → Add explicit index strategy section to schema docs

6. **Denormalized counts** → Add `likesCount`, `commentsCount`, `repliesCount` fields to models

### MEDIUM PRIORITY (Security & UX)

7. **Wire rate limiters** to auth routes in route definitions

8. **Add DOMPurify** for post/comment content rendering

9. **Add image validation** (type + size) in `ImageUpload.tsx`

10. **Add toast system** (`react-hot-toast` or `sonner`) to layout

### LOW PRIORITY

11. **Redis caching strategy** for like counts and hot feed

12. **Optimistic updates** for comment/reply creation

---

## Verification Checklist (After Plan Updates Applied)

- [ ] `/login` unauthenticated: middleware reads cookie → redirects correctly
- [ ] SSR feed page: cookie forwarded → backend returns 200 with posts
- [ ] Like toggle: denormalized count increments atomically, no COUNT query
- [ ] 1M+ posts: feed query uses `{ visibility, createdAt }` index (verify with `explain()`)
- [ ] XSS attempt in post content: DOMPurify strips script tags
- [ ] File > 10MB: upload rejected client-side before hitting Cloudinary
- [ ] Logout: cookie cleared, `/feed` redirects to `/login`
- [ ] Auth routes: rate limiter blocks after threshold
