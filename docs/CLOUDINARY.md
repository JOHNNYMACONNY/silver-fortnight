# Cloudinary Integration

This document provides information about the Cloudinary integration in the TradeYa application.

## Configuration

Cloudinary is used for image storage and management in the application. The configuration is stored in environment variables:

```env
VITE_CLOUDINARY_CLOUD_NAME="doqqhj2nt"
VITE_CLOUDINARY_PROFILE_PRESET="TradeYa_Prof_Pic_Preset"
VITE_CLOUDINARY_BANNER_PRESET="TradeYa_Banner_Preset"
VITE_CLOUDINARY_PORTFOLIO_PRESET="TradeYa_Portfolio_Preset"
VITE_CLOUDINARY_UPLOAD_PRESET="tradeya_uploads"
```

## Usage

The Cloudinary service is implemented in `src/services/cloudinary/cloudinaryService.ts`. It provides the following functions:

- `validateFile`: Validates a file before upload
- `uploadProfileImage`: Uploads a profile picture with face-crop-friendly transformations
- `uploadBannerImage`: Uploads a banner image and returns base+transformed URLs
- `uploadImage`: Generic uploads with a provided folder/preset (fallback)
- `deleteImage`: Deletes an image from Cloudinary
- `transformImage`: Generates a Cloudinary URL with transformations

## Components

The application includes two components for image uploads:

- `ImageUploader`: For single image uploads
- `MultipleImageUploader`: For multiple image uploads

## Troubleshooting

If images are not appearing in the application, check the following:

1. Verify that the Cloudinary configuration is correct in the `.env.development` file
2. Check the browser console for any errors related to Cloudinary
3. Verify that the Cloudinary cloud name, upload preset, and API key are correct
4. Check the network tab in the browser developer tools to see if the Cloudinary API requests are successful

## Profile Pictures

Profile pictures are stored in Cloudinary using the `TradeYa_Prof_Pic_Preset` upload preset and referenced in Firebase using the `profilePicture` field. This preset is configured in the Cloudinary dashboard and has specific settings for profile pictures, such as:

- Automatic image optimization
- Proper folder structure (`tradeya/users/profiles/{userId}`)
- Tagging with 'profile' and 'user' tags for better organization
- Unique public IDs using the Cloudinary ID and timestamp

### Firebase Integration

Profile pictures are stored in the Firebase database in the `profilePicture` field of user documents. The application is configured to:

1. Prioritize the `profilePicture` field over the legacy `photoURL` field
2. Automatically migrate any images from `photoURL` to `profilePicture` when users update their profiles
3. Format Cloudinary URLs to ensure proper display with transformations (cropping, resizing, etc.)

### URL Format

A typical profile picture URL in the system follows this format:

```plaintext
https://res.cloudinary.com/doqqhj2nt/image/upload/c_fill,g_face,h_400,w_400,q_auto:best,f_auto/v1737789591/profile-pictures/USER_ID_UNIQUE_IDENTIFIER.jpg
```

Where:

- `c_fill,g_face,h_400,w_400,q_auto:best,f_auto` are Cloudinary transformations
- `v1737789591` is the version number
- `profile-pictures` is the folder
- `USER_ID_UNIQUE_IDENTIFIER.jpg` is the filename with user ID

## Banners

- Banners are stored as `{ publicId, version, uploadedAt }` (type `BannerData`).
- Rendering uses `getBannerImageUrl(BannerData)` which applies `fill`, `width=1200`, `height=300`, `quality=auto`, `format=auto`.
- The UI shows a default banner until a valid processed URL is available.

## Recent Changes

The following changes were made to fix issues with profile pictures not appearing:

1. Updated the Cloudinary service to use environment variables instead of hardcoded values
2. Enabled/required Unsigned upload presets for profile, banner, and portfolio.
3. Added detailed client-side error logging for Cloudinary responses.
4. Standardized env variables for all presets.
5. Improved URL generation with crop/gravity support.

These changes should ensure that profile pictures are properly uploaded to and retrieved from Cloudinary.
