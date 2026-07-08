# Change Request: Client-Side Image Cache & Versioning Strategy

## Overview

Introduce a client-side caching strategy for application images (User Avatar, Login Background, Splash Screen, and future configurable assets) to improve performance, reduce backend requests, and provide a better offline experience.

The backend remains the **source of truth**, while the frontend maintains a local cached copy of images.

---

# Goals

- Reduce unnecessary image downloads.
- Improve application startup time.
- Reduce bandwidth usage.
- Improve user experience on slow or unstable networks.
- Provide a scalable solution for future configurable images.

---

# Scope

## User Avatar

Current:

- Avatar is requested from the backend whenever needed.

New:

- Upload avatar to the Railway Bucket.
- Save the image key and metadata in the database.
- Cache the image locally on the device.
- Reuse the local image whenever it is still valid.

---

## Login Background

Apply the same caching mechanism.

Backend provides:

- imageUrl
- imageVersion
- updatedAt

Frontend:

- Downloads once.
- Stores locally.
- Uses the local image until a new version is detected.

---

## Splash Screen Images

The configurable Splash Screen feature should use the same architecture.

The frontend should:

- Download only new images.
- Keep previously downloaded images.
- Remove obsolete images when no longer referenced.

---

# Architecture

```
                 Railway Bucket
                        │
                        │
                Spring Boot Backend
                        │
      saves metadata + image version
                        │
                REST API Response
                        │
             React Native / Web App
                        │
        Compare local version vs backend
                        │
        ┌───────────────┴────────────────┐
        │                                │
Versions equal                  Version changed
        │                                │
Use local cache           Download new image
        │                                │
Display immediately      Update local cache
```

---

# Backend Changes

## Railway Bucket

Store:

```
users/{userId}/avatar.webp

login/background.webp

splash/{screenId}.webp
```

## Database

Store image metadata.

Example:

```
avatarKey
avatarVersion
avatarUpdatedAt
```

For configurable images:

```
imageKey
imageVersion
updatedAt
```

---

# API Response

Example:

```json
{
  "avatarUrl": "...",
  "avatarVersion": 5,
  "avatarUpdatedAt": "2026-07-07T10:30:00Z"
}
```

---

# Frontend Strategy

Do not use the local cache as the source of truth.

Instead:

1. Read cached metadata.
2. Request lightweight metadata from backend.
3. Compare versions.
4. If unchanged, use cached image.
5. If changed:
   - Download image.
   - Replace local file.
   - Update metadata.

---

# Storage Recommendation

## React Native (Expo)

Images:
- expo-file-system

Metadata:
- AsyncStorage

## Web

Images:
- Browser Cache / Cache API / IndexedDB

Metadata:
- localStorage or IndexedDB

---

# Cache Invalidation

Refresh cache when:

- Avatar updated.
- Login background changed.
- Splash image published.
- User logs out.
- User switches account.
- Image version changes.

---

# Benefits

- Faster UI rendering.
- Lower API traffic.
- Lower storage and bandwidth costs.
- Better offline support.
- Scalable architecture for future assets.

---

# Acceptance Criteria

- Images are uploaded to Railway Bucket.
- Backend returns image metadata and version.
- Frontend caches downloaded images locally.
- Frontend validates image version before downloading.
- Cached images are replaced only when a newer version exists.
- Cache is cleared or refreshed when the authenticated user changes.
- Architecture supports Avatar, Login Background, Splash Screen and future configurable assets.
