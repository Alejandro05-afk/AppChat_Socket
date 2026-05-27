---
name: expo-push-notifications
description: >
  Complete and fix Expo push notification implementation for React Native / Expo apps using Supabase.
  Use this skill whenever the user wants to implement, fix, or improve push notifications in an Expo
  app — including token registration, local fallback notifications, unread message badges, and
  Expo Push API integration. Triggers for phrases like "notifications not working", "implement push
  notifications", "unread message count", "badge on icon", or "notify users when new message arrives".
---

# Expo Push Notifications — Full Implementation Skill

This skill covers the complete end-to-end implementation of push notifications for a React Native
Expo chat app backed by Supabase. The reference project uses:

- **Expo SDK 54** with `expo-notifications ~0.32`
- **Supabase** for backend + Realtime subscriptions
- **Zustand** for auth state
- **TanStack Query** for data fetching/cache
- **expo-router** for navigation

---

## Architecture Overview

```
User sends message
       │
       ▼
SupabaseChatRepository.sendMessage()
       │
       ├─► Supabase Realtime → subscribeToRoom() → local notification (Expo Go fallback)
       │
       └─► sendPushNotification() → Expo Push API → FCM/APNs → recipient devices
```

There are **two notification paths** to support:

| Path | When | How |
|---|---|---|
| **Local notification** | App is open (foreground) | `Notifications.scheduleNotificationAsync` |
| **Remote push** | App is closed/background | Expo Push API (`exp.host/--/api/v2/push/send`) |

---

## Step 1 — Supabase Schema

Add `push_token` and `unread_count` columns to the `profiles` table. Run in Supabase SQL editor:

```sql
-- Add push_token to profiles (may already exist)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add unread_count map: { [roomId]: number }
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS unread_counts JSONB DEFAULT '{}'::jsonb;
```

Also needed: an RLS policy allowing users to update their own profile:

```sql
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

## Step 2 — Token Registration (`app/_layout.tsx`)

The existing `registerForPushNotificationsAsync` function is correct. Make sure the token is
saved to Supabase on login. The current code already does this in the `useEffect` watching `user`.

**Key fix**: in Expo Go on Android (SDK 53+), `getExpoPushTokenAsync` throws. The code already
guards this with `Constants.appOwnership === 'expo'`. Keep this guard.

```typescript
// Already correct in _layout.tsx — verify this guard exists:
if (Constants.appOwnership === 'expo') {
  console.log('Expo Go — remote push unavailable on Android SDK 53+');
  return null;
}
```

---

## Step 3 — Sending Push Notifications (`useChat.ts`)

The `sendPushNotification` helper inside `useChat` sends to Expo's push API. Current implementation
is correct. Make sure it is called **after** `sendMessageUseCase.execute()` succeeds:

```typescript
// In mutationFn, AFTER the message is saved:
const tokens = await chatRepo.getRecipientTokens(user!.id);
const title  = `@${user!.username} en #${roomName}`;
const body   = imageUrl ? '📷 Imagen compartida' : content;
await sendPushNotification(tokens, title, body);
```

**Pass `roomId` in the data payload** so the app can deep-link to the right room when tapped:

```typescript
const messages = tokens.map((token) => ({
  to: token,
  sound: 'default',
  title,
  body,
  data: { roomId },   // ← ADD THIS
}));
```

---

## Step 4 — Handle Notification Tap (Deep Link)

Add a notification response listener in `app/_layout.tsx` so tapping a notification navigates to
the correct chat room:

```typescript
// Inside AuthGuard component, add this useEffect:
useEffect(() => {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const roomId = response.notification.request.content.data?.roomId as string | undefined;
    if (roomId) {
      router.push(`/chat/${roomId}`);
    }
  });
  return () => sub.remove();
}, []);
```

---

## Step 5 — Unread Message Count / Badge

### 5a. Track unread counts in Zustand

Extend `authStore.ts` or create a new `chatStore.ts`:

```typescript
// src/shared/presentation/store/unreadStore.ts
import { create } from 'zustand';

interface UnreadState {
  counts: Record<string, number>; // { [roomId]: unreadCount }
  increment: (roomId: string) => void;
  clear: (roomId: string) => void;
  total: () => number;
}

export const useUnreadStore = create<UnreadState>((set, get) => ({
  counts: {},
  increment: (roomId) =>
    set((s) => ({ counts: { ...s.counts, [roomId]: (s.counts[roomId] ?? 0) + 1 } })),
  clear: (roomId) =>
    set((s) => { const c = { ...s.counts }; delete c[roomId]; return { counts: c }; }),
  total: () => Object.values(get().counts).reduce((a, b) => a + b, 0),
}));
```

### 5b. Increment on incoming realtime message

In `useChat.ts`, when a realtime message arrives from another user, increment the unread count:

```typescript
// Inside subscribeUseCase.execute callback:
if (user && newMsg.userId !== user.id) {
  useUnreadStore.getState().increment(roomId);
  // existing local notification code...
}
```

### 5c. Clear unread when user opens the room

In `app/(app)/chat/[roomId].tsx`, clear on mount and on focus:

```typescript
import { useUnreadStore } from '@shared/presentation/store/unreadStore';
import { useFocusEffect } from 'expo-router';

// Inside ChatScreen:
const clearUnread = useUnreadStore((s) => s.clear);
useFocusEffect(
  useCallback(() => {
    clearUnread(roomId);
  }, [roomId])
);
```

### 5d. Show badge on room list items

In `app/(app)/index.tsx`, read unread count per room:

```typescript
import { useUnreadStore } from '@shared/presentation/store/unreadStore';

// Inside RoomsScreen:
const unreadCounts = useUnreadStore((s) => s.counts);

// In renderRoom:
const unread = unreadCounts[item.id] ?? 0;
// Then in the JSX:
{unread > 0 && (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
  </View>
)}
```

Badge styles to add to the StyleSheet:

```typescript
badge: {
  backgroundColor: '#EF4444',
  borderRadius: 10,
  minWidth: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 5,
},
badgeText: {
  color: '#FFF',
  fontSize: 11,
  fontWeight: '700',
},
```

### 5e. App icon badge count (optional)

Set the device icon badge to the total unread count:

```typescript
// In useChat.ts, after incrementing unread:
const total = useUnreadStore.getState().total();
Notifications.setBadgeCountAsync(total).catch(() => {});
```

Clear on app foreground:

```typescript
// In app/_layout.tsx AuthGuard, add:
useEffect(() => {
  const sub = Notifications.addNotificationReceivedListener(() => {
    // handled inline; badge set by sender
  });
  AppState.addEventListener('change', (state) => {
    if (state === 'active') Notifications.setBadgeCountAsync(0);
  });
  return () => sub.remove();
}, []);
```

---

## Step 6 — Notification Permission UX

For a better UX, ask for permission at first use rather than on app launch. Replace the eager
`registerForPushNotificationsAsync` call in `_layout.tsx` with a lazy call triggered after login,
which already happens. No change needed — current code is correct.

---

## Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `No experienceId or projectId` | Missing EAS config | Set `extra.eas.projectId` in `app.json` or use EAS CLI |
| Push token is `null` in Expo Go Android | SDK 53+ restriction | Already guarded — use local notifications as fallback |
| Notification fires for own messages | Missing `userId !== user.id` check | Add check before `scheduleNotificationAsync` and `increment` |
| Tapping notification does nothing | No `addNotificationResponseReceivedListener` | Add listener in `_layout.tsx` (Step 4) |
| Badge not updating | `setBadgeCountAsync` not called | Add call after `increment` (Step 5e) |

---

## File Change Summary

| File | Changes |
|---|---|
| `app/_layout.tsx` | Add `addNotificationResponseReceivedListener` for deep link on tap |
| `src/features/chat/application/presentation/hooks/useChat.ts` | Add `data: { roomId }` to push payload; call `useUnreadStore.getState().increment()` |
| `app/(app)/chat/[roomId].tsx` | Call `clearUnread(roomId)` on `useFocusEffect` |
| `app/(app)/index.tsx` | Show unread badge per room card |
| `src/shared/presentation/store/unreadStore.ts` | **NEW** — Zustand store for unread counts |
| Supabase SQL | Add `unread_counts JSONB` to `profiles` (optional persistence) |

---

## Testing Checklist

- [ ] Send message from Device A → Device B receives local notification while app is open
- [ ] Send message from Device A → Device B receives push notification while app is closed
- [ ] Tap notification on Device B → navigates to correct chat room
- [ ] Unread badge appears on room list for rooms with new messages
- [ ] Unread badge clears when user opens the room
- [ ] App icon badge shows total unread count
- [ ] No duplicate notifications (realtime dedup guard in `subscribeToRoom`)