/**
 * Utility functions for detecting asset types from URLs
 */

import { assetsApi } from '@/app/api/assets';
import MD5 from 'crypto-js/md5';
import { lib as CryptoLib } from 'crypto-js';

export type AssetType = 'image' | 'audio' | 'video' | 'document' | 'unknown';

/**
 * Map of file extensions to asset types
 */
const extensionToTypeMap: Record<string, AssetType> = {
  // Images
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  ico: 'image',
  tiff: 'image',
  tif: 'image',
  
  // Audio
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  flac: 'audio',
  aac: 'audio',
  m4a: 'audio',
  
  // Video
  mp4: 'video',
  webm: 'video',
  ogv: 'video',
  mov: 'video',
  avi: 'video',
  wmv: 'video',
  mkv: 'video',
  
  // Documents
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  xls: 'document',
  xlsx: 'document',
  ppt: 'document',
  pptx: 'document',
  txt: 'document',
  rtf: 'document',
  md: 'document',
  json: 'document',
  csv: 'document',
};

/**
 * Map of MIME types to asset types
 */
const mimeToTypeMap: Record<string, AssetType> = {
  // Images
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'image/bmp': 'image',
  'image/x-icon': 'image',
  'image/tiff': 'image',
  
  // Audio
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/flac': 'audio',
  'audio/aac': 'audio',
  'audio/mp4': 'audio',
  
  // Video
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/ogg': 'video',
  'video/quicktime': 'video',
  'video/x-msvideo': 'video',
  'video/x-ms-wmv': 'video',
  'video/x-matroska': 'video',
  
  // Documents
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'application/vnd.ms-powerpoint': 'document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
  'text/plain': 'document',
  'application/rtf': 'document',
  'text/markdown': 'document',
  'application/json': 'document',
  'text/csv': 'document',
};

/**
 * Generate MD5 hash from a URL string
 */
export function generateMd5FromUrl(url: string): string {
  return MD5(url).toString();
}

/**
 * Extract a filename from a URL
 * @param url The URL to extract filename from
 * @returns The extracted filename or a default name
 */
export function extractFilenameFromUrl(url: string): string {
  try {
    // Try to get the filename from the URL path
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    
    // If we have a filename with extension, return it
    if (lastSegment && lastSegment.includes('.')) {
      return decodeURIComponent(lastSegment);
    }
    
    // If no valid filename found, generate one based on hostname
    return `${urlObj.hostname}-asset`;
  } catch (error) {
    // If URL parsing fails, return a generic name
    return 'url-asset';
  }
}

/**
 * Create a File object from a URL string for verification
 * This is a workaround to use the existing verify API
 */
export function createFileFromUrlMetadata(url: string, assetType: AssetType): File {
  // Create a small text file containing the URL
  const urlData = new Blob([url], { type: 'text/plain' });
  
  // Generate a filename based on the URL
  let filename = url.split('/').pop() || 'external-url';
  
  // Add appropriate extension based on asset type if not present
  if (!filename.includes('.')) {
    switch (assetType) {
      case 'image': filename += '.jpg'; break;
      case 'audio': filename += '.mp3'; break;
      case 'video': filename += '.mp4'; break;
      case 'document': filename += '.pdf'; break;
      default: filename += '.txt';
    }
  }
  
  // Create a File object
  return new File([urlData], filename, { type: 'text/plain' });
}

/**
 * Detect asset type from content type
 */
export function detectAssetTypeFromContentType(contentType: string): AssetType | null {
  if (!contentType) return null;
  
  // Extract the main MIME type (e.g., 'image/jpeg; charset=utf-8' -> 'image/jpeg')
  const mainType = contentType.split(';')[0].trim().toLowerCase();
  
  return mimeToTypeMap[mainType] || null;
}

/**
 * Detect asset type from file extension in URL
 */
export function detectAssetTypeFromExtension(url: string): AssetType | null {
  try {
    // Parse URL and get pathname
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    
    // Extract extension
    const extension = pathname.split('.').pop()?.toLowerCase();
    
    if (!extension) return null;
    
    return extensionToTypeMap[extension] || null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

/**
 * Verify a URL asset with the backend
 * This will call the dedicated verify-url endpoint to get metadata about the URL
 */
export async function verifyUrlAsset(url: string): Promise<{
  md5: string;
  uuid: string;
  contentType: string;
  assetType: AssetType;
  isDuplicate: boolean;
  filename?: string;
  size?: number;
  duplicateInfo?: { filename: string; uploadDate: string; uuid: string };
}> {
  try {
    // Call the dedicated backend API for URL verification
    const verifyResponse = await assetsApi.verifyUrl(url);
    
    // Determine asset type from content type or URL extension
    const assetType = detectAssetTypeFromExtension(url) || 
                      detectAssetTypeFromContentType(verifyResponse.contentType) || 
                      'unknown';
    
    return {
      md5: verifyResponse.md5,
      uuid: verifyResponse.uuid,
      contentType: verifyResponse.contentType,
      assetType,
      isDuplicate: verifyResponse.isDuplicate,
      duplicateInfo: verifyResponse.duplicateInfo,
      filename: verifyResponse.filename,
      size: verifyResponse.size
    };
  } catch (error) {
    console.error('Error verifying URL asset:', error);
    
    // Return default values if verification fails
    const md5 = generateMd5FromUrl(url);
    const assetType = detectAssetTypeFromExtension(url) || 'unknown';
    
    // Generate a random UUID using crypto-js
    const randomUuid = CryptoLib.WordArray.random(16).toString();
    
    return {
      md5,
      uuid: randomUuid,
      contentType: 'application/octet-stream',
      assetType,
      isDuplicate: false,
      filename: extractFilenameFromUrl(url)
    };
  }
}

/**
 * Detect asset type from URL
 * First tries to detect from file extension, then falls back to content type detection
 */
export async function detectAssetTypeFromUrl(url: string): Promise<AssetType> {
  // First try to detect from extension
  const typeFromExtension = detectAssetTypeFromExtension(url);
  if (typeFromExtension) {
    console.log('Detected type from extension: ' + typeFromExtension);
    return typeFromExtension;
  }
  
  try {
    // If extension detection fails, try verification with backend
    const verification = await verifyUrlAsset(url);
    console.log('Detected type from verification: ' + verification.assetType + ', content type: ' + verification.contentType);
    return verification.assetType;
  } catch (error) {
    console.error('Error detecting asset type from URL:', error);
    return 'unknown';
  }
}
