# Profile Picture Handling in TradeYa

## Overview

Profile pictures are stored in Cloudinary and referenced in Firebase. We store the Cloudinary publicId (and may include version); rendering utilities generate transformed URLs on the fly.

## Storage Architecture

### Cloudinary Storage
- Cloud Name: `doqqhj2nt`
- Upload Preset: `TradeYa_Prof_Pic_Preset` (Unsigned)
- Folder: `users/profiles`
- Typical transformations (at render): `c_fill,g_face,h_400,w_400,q_auto:best,f_auto`

### Firebase References
- Primary field: `profilePicture` (Cloudinary publicId or a full Cloudinary URL)
- Legacy field: `photoURL` (maintained for compatibility)

## Implementation Details

### Upload Process
1. User selects an image.
2. Client uses `uploadProfileImage` (Cloudinary unsigned upload with `TradeYa_Prof_Pic_Preset`).
3. Response returns `publicId` and `version`.
4. We persist `profilePicture` as the `publicId` in `users/{id}`.

Note: Preset must be Unsigned (whitelisted) in Cloudinary.

### Retrieval
- `getProfileImageUrl(profilePicture, size)` formats a Cloudinary URL from publicId or returns external URLs as-is.
- `ProfileImage` prioritizes `profilePicture` over `photoURL` and applies face-crop and sizing.
- `getUserProfile()` now returns a sanitized record (display name + profile picture fields) even when a profile is marked private, ensuring avatars can always render while still hiding sensitive fields unless `includePrivateFields` is explicitly requested.

## Best Practices
- Prefer storing `publicId`; it’s more flexible than storing a fixed URL.
- Keep presets Unsigned or implement server-side signing before switching to Signed.
- Validate file type/size before upload.

## Troubleshooting
- 400 "Upload preset must be whitelisted": enable Unsigned on the preset.
- 404/"preset not found": ensure the preset name exists exactly in your Cloudinary account.
- Image doesn’t appear: verify Firestore has `profilePicture` and that it’s a valid publicId; check network tab and console logs.

## Recent Changes
- Switched avatar upload to `uploadProfileImage` (profile preset).
- Added fallback to generic preset when profile preset fails (optional).
- Improved URL formatting to include crop/gravity.
