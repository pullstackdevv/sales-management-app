/**
 * Helper function to generate asset URLs
 * This ensures proper asset paths in both development and production environments
 */
export const asset = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // In production, assets are typically served from the public directory
  // In development, we can use the current origin
  const baseUrl = window.location.origin;
  
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Helper function specifically for public assets
 * This mimics Laravel's asset() helper function
 */
export const publicAsset = (path) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return asset(cleanPath);
};

/**
 * Helper function for images in the assets directory
 */
export const imageAsset = (imagePath) => {
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return asset(`assets/images/${cleanPath}`);
};