import express from 'express';
import { VersionService } from '../services/version.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/rateLimiter.middleware';
import { ApiError } from '../middleware/error.middleware';

const router = express.Router();
const versionService = new VersionService();

router.get('/check', apiLimiter, async (req, res, next) => {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const platform = userAgent.includes('iPhone') || userAgent.includes('iPad') 
      ? 'ios' 
      : 'android';

    const versionInfo = await versionService.getLatestVersion(platform);
    if (!versionInfo) {
      throw new ApiError(404, 'Version information not found');
    }
    
    res.json({
      latest_version: versionInfo.version,
      force_update: versionInfo.forceUpdate,
      message: versionInfo.message,
      store_urls: {
        ios: process.env.IOS_STORE_URL || 'https://apps.apple.com/app/dovetext/id123456789',
        android: process.env.ANDROID_STORE_URL || 'https://play.google.com/store/apps/details?id=com.dovetext.app'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Protected route for updating version info
router.post('/update', authenticateToken, async (req, res, next) => {
  try {
    const { platform, version, forceUpdate, message } = req.body;
    
    if (!['ios', 'android'].includes(platform)) {
      throw new ApiError(400, 'Invalid platform');
    }

    await versionService.updateVersion(platform, {
      version,
      forceUpdate,
      message,
      platform
    });

    res.json({ message: 'Version updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
