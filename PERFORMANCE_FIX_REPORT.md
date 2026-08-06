# 🔥 CRITICAL PERFORMANCE & RENDERING ISSUES

## Problems Found

### 1. **BLACK VIDEO RENDERING BUG** ⚫
**File:** `src/components/editor/PreviewCanvas.tsx` (Line 183)

```tsx
// ❌ WRONG - Checking readyState >= 2 means video is LOADING but not ready to render
if (vid && vid.readyState >= 2) {
```

**The Problem:**
- `readyState >= 2` means video has **current frame available** but NOT **fully ready**
- Videos loaded via blob URLs don't have enough data buffered
- Should wait for `readyState >= 3` (HAVE_FUTURE_DATA)

---

### 2. **MASSIVE LAG - Missing Video Preload** 🐢
**File:** `src/components/editor/PreviewCanvas.tsx` (Lines 52-87)

```tsx
// ❌ WRONG - Blob videos don't preload automatically
vid.preload = 'auto';  // This is ignored for blob URLs!
```

**The Problem:**
- Blob URLs don't support HTTP range requests
- `preload="auto"` doesn't work for blob URLs
- Videos only load when `play()` is called = 1-2 second delay + stuttering

---

### 3. **CPU SPIKE - Re-rendering Constantly** ⚡
**File:** `src/components/editor/PreviewCanvas.tsx` (Line 247)

```tsx
// ❌ WRONG - renderFrame recreated when isMuted changes
}, [project, isPlaying, isMuted]);
```

**The Problem:**
- `renderFrame` callback is recreated every time mute state changes
- This breaks the animation loop optimization
- Causes unnecessary canvas re-renders = lag

---

### 4. **AUDIO OUT OF SYNC** 🎵
**File:** `src/components/editor/PreviewCanvas.tsx` (Lines 197-198)

```tsx
// ❌ WRONG - Large sync threshold (0.35s)
} else if (Math.abs(vid.currentTime - targetTime) > 0.35) {
```

**The Problem:**
- 350ms tolerance = audio and video drift apart visibly
- Video plays while audio is behind

---

### 5. **IMAGE LOADING NOT VERIFIED** 🖼️
**File:** `src/components/editor/PreviewCanvas.tsx` (Line 214)

```tsx
// ❌ WRONG - Only checks if complete, not if valid
if (img && img.complete) {
```

**Should verify actual dimensions loaded**

---

## Summary

| Issue | Fix |
|-------|-----|
| Black Video | Change `readyState >= 2` to `readyState >= 3` |
| Laggy Playback | Add `vid.load()` after setting src for blob URLs |
| CPU Spike | Remove `isMuted` from renderFrame dependencies |
| Audio Drift | Reduce threshold from 0.35 to 0.15 seconds |
| Image Issues | Check `naturalWidth > 0` |
