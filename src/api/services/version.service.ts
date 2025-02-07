interface VersionInfo {
  version: string;
  forceUpdate: boolean;
  message: string;
  platform: 'ios' | 'android';
  minVersion?: string;
}

export class VersionService {
  private versions: Map<string, VersionInfo>;

  constructor() {
    this.versions = new Map();
    
    // Initialize with default versions
    this.versions.set('ios', {
      version: '1.0.0',
      forceUpdate: false,
      message: 'New features available!',
      platform: 'ios',
      minVersion: '1.0.0'
    });

    this.versions.set('android', {
      version: '1.0.0',
      forceUpdate: false,
      message: 'New features available!',
      platform: 'android',
      minVersion: '1.0.0'
    });
  }

  async getLatestVersion(platform: 'ios' | 'android'): Promise<VersionInfo> {
    return this.versions.get(platform) || {
      version: '1.0.0',
      forceUpdate: false,
      message: 'Welcome to DoveText!',
      platform
    };
  }

  async updateVersion(platform: 'ios' | 'android', info: Partial<VersionInfo>) {
    const current = this.versions.get(platform);
    if (current) {
      this.versions.set(platform, { ...current, ...info });
    }
  }

  async setForceUpdate(platform: 'ios' | 'android', force: boolean, message?: string) {
    const current = this.versions.get(platform);
    if (current) {
      this.versions.set(platform, { 
        ...current, 
        forceUpdate: force,
        message: message || current.message
      });
    }
  }
}
