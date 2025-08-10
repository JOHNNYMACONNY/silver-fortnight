# Cloudinary Integration

This document provides information about the Cloudinary integration in the TradeYa application.

## Configuration

Cloudinary is used for image storage and management in the application. The configuration is stored in environment variables:

```env
VITE_CLOUDINARY_CLOUD_NAME="doqqhj2nt"
VITE_CLOUDINARY_UPLOAD_PRESET="TradeYa_Prof_Pic_Preset"
VITE_CLOUDINARY_API_KEY="411756985482938"
VITE_CLOUDINARY_API_SECRET="Yc3gsui6wCADha6zruVUFMx_1BM"
VITE_CLOUDINARY_ID="f1414a70ffee9854e4e5031231cbc1"
```

## Usage

The Cloudinary service is implemented in `src/services/cloudinary/cloudinaryService.ts`. It provides the following functions:

- `validateFile`: Validates a file before upload
- `uploadImage`: Uploads an image to Cloudinary
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

## Recent Changes

The following changes were made to fix issues with profile pictures not appearing:

1. Updated the Cloudinary service to use environment variables instead of hardcoded values
2. Added the API key, API secret, and Cloudinary ID to the Cloudinary upload requests
3. Added more detailed error handling and logging to help diagnose issues
4. Updated the environment variables to match the correct Cloudinary account
5. Enhanced the URL formatting to ensure proper cloud name and version numbers
6. Added support for converting relative paths to Cloudinary URLs
7. Added specific handling for profile pictures using the `TradeYa_Prof_Pic_Preset` upload preset
8. Updated the folder structure to ensure profile pictures are stored in the correct location
9. Modified the application to prioritize the `profilePicture` field in Firebase over `photoURL`
10. Added automatic migration of images from `photoURL` to `profilePicture` when profiles are updated
11. Created specialized components for handling specific user profile pictures
12. Improved fallback mechanisms for missing profile pictures

These changes should ensure that profile pictures are properly uploaded to and retrieved from Cloudinary.
