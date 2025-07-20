# Cloudinary Image Upload Module

This module provides optimized image upload functionality with admin-only access control.

## Features

- **Admin-only access**: Only users with ADMIN role can upload images
- **Image optimization**: Automatic format selection, quality optimization, and progressive loading
- **Multiple formats**: Generates WebP, AVIF, and optimized URLs
- **Size validation**: 5MB file size limit
- **Format validation**: Supports JPEG, PNG, WebP, and GIF
- **Bulk upload**: Support for uploading multiple images (max 10 per request)
- **Organized storage**: Automatic folder organization by category

## Environment Variables

Add these to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME='your_cloud_name'
CLOUDINARY_API_KEY='your_api_key'
CLOUDINARY_API_SECRET='your_api_secret'
```

## API Endpoints

### Upload Single Image

```
POST /upload/image
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data

Body:
- file: Image file
- folder: (optional) Custom folder name
- category: (optional) product|user|category|general
- width: (optional) Resize width (100-2000px)
- height: (optional) Resize height (100-2000px)
- transformation: (optional) Custom Cloudinary transformation
```

### Upload Multiple Images

```
POST /upload/images/bulk
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data

Body:
- files: Array of image files (max 10)
- folder: (optional) Custom folder name
- category: (optional) product|user|category|general
- width: (optional) Resize width (100-2000px)
- height: (optional) Resize height (100-2000px)
- transformation: (optional) Custom Cloudinary transformation
```

### Delete Image

```
DELETE /upload/image/:publicId
Authorization: Bearer <admin_jwt_token>
```

## Response Format

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "publicId": "paradise-moms/product/sample_image",
    "originalUrl": "https://res.cloudinary.com/...",
    "optimizedUrls": {
      "original": "https://res.cloudinary.com/.../f_auto,q_auto",
      "thumbnail": "https://res.cloudinary.com/.../w_150,h_150,c_fill",
      "medium": "https://res.cloudinary.com/.../w_500,h_500,c_limit",
      "large": "https://res.cloudinary.com/.../w_1200,h_1200,c_limit",
      "webp": "https://res.cloudinary.com/.../f_webp",
      "avif": "https://res.cloudinary.com/.../f_avif"
    },
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "jpg",
      "bytes": 245760,
      "folder": "paradise-moms/product"
    }
  }
}
```

## Usage Examples

### Frontend Upload (React/Next.js)

```javascript
const uploadImage = async (file, category = 'general') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const response = await fetch('/api/upload/image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData,
  });

  return response.json();
};
```

### cURL Example

```bash
curl -X POST \
  http://localhost:3001/upload/image \
  -H 'Authorization: Bearer YOUR_ADMIN_JWT_TOKEN' \
  -F 'file=@/path/to/image.jpg' \
  -F 'category=product' \
  -F 'width=800' \
  -F 'height=600'
```

## Image Categories

- `product`: Product images
- `user`: User profile images
- `category`: Category images
- `general`: General purpose images

## Optimization Features

1. **Auto-format**: Automatically selects the best format (WebP, AVIF, etc.)
2. **Auto-quality**: Balances file size and visual quality
3. **Progressive JPEG**: Enables progressive loading
4. **Multiple sizes**: Generates thumbnail, medium, and large variants
5. **Modern formats**: Provides WebP and AVIF versions for better compression

## Security

- JWT authentication required
- Admin role verification
- File type validation
- File size limits
- Secure URL generation

## Error Handling

The module handles various error scenarios:

- Invalid file types
- File size exceeded
- Missing authentication
- Insufficient permissions
- Cloudinary API errors
