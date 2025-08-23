// pages/api/settings/pingone/index.js - PingOne Configuration API
import crypto from 'crypto';

// Mock storage - replace with database
let pingOneSettings = {
  clientId: '',
  clientSecret: '',
  authorizationUrl: '',
  tokenUrl: '',
  environmentId: '',
  region: 'NA',
  encryptedSecret: '',
  lastUpdated: null
};

// Encryption key - use environment variable in production
const ENCRYPTION_KEY = process.env.PINGONE_ENCRYPTION_KEY || 'your-32-character-secret-key-here!';

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return handleGetSettings(req, res);
      case 'POST':
        return handleSaveSettings(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('PingOne Settings API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetSettings(req, res) {
  try {
    // Return settings without the actual client secret
    const settings = {
      ...pingOneSettings,
      clientSecret: pingOneSettings.encryptedSecret ? '••••••••••••••••' : '',
      encryptedSecret: undefined
    };

    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error getting PingOne settings:', error);
    return res.status(500).json({ error: 'Failed to retrieve settings' });
  }
}

async function handleSaveSettings(req, res) {
  try {
    const {
      clientId,
      clientSecret,
      authorizationUrl,
      tokenUrl,
      environmentId,
      region
    } = req.body;

    // Validation
    if (!clientId || !clientSecret || !environmentId) {
      return res.status(400).json({
        error: 'Missing required fields: clientId, clientSecret, environmentId'
      });
    }

    // Validate URLs
    try {
      new URL(authorizationUrl);
      new URL(tokenUrl);
    } catch (urlError) {
      return res.status(400).json({
        error: 'Invalid URL format for authorizationUrl or tokenUrl'
      });
    }

    // Encrypt client secret
    const encryptedSecret = encrypt(clientSecret);

    // Update settings
    pingOneSettings = {
      clientId,
      clientSecret: '', // Don't store plain text
      authorizationUrl,
      tokenUrl,
      environmentId,
      region,
      encryptedSecret,
      lastUpdated: new Date().toISOString()
    };

    console.log('PingOne settings updated successfully');

    return res.status(200).json({
      message: 'Settings saved successfully',
      lastUpdated: pingOneSettings.lastUpdated
    });
  } catch (error) {
    console.error('Error saving PingOne settings:', error);
    return res.status(500).json({ error: 'Failed to save settings' });
  }
}

// Export utility functions for other modules
export function getPingOneSettings() {
  if (pingOneSettings.encryptedSecret) {
    return {
      ...pingOneSettings,
      clientSecret: decrypt(pingOneSettings.encryptedSecret)
    };
  }
  return pingOneSettings;
}

export function hasPingOneConfig() {
  return !!(pingOneSettings.clientId && 
           pingOneSettings.encryptedSecret && 
           pingOneSettings.environmentId);
}