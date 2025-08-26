// lib/constants/connectionTypes.js
export const CONNECTION_TYPES = {
  AD: {
    label: 'Active Directory',
    icon: '🏢',
    description: 'Connect to Microsoft Active Directory domain services',
    fields: [
      { key: 'serverName', label: 'Server Name/IP', type: 'text', required: true, placeholder: 'dc01.company.com' },
      { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '389', defaultValue: 389 },
      { key: 'domain', label: 'Domain', type: 'text', required: true, placeholder: 'company.com' },
      { key: 'baseDN', label: 'Base DN', type: 'text', required: true, placeholder: 'DC=company,DC=com' },
      { key: 'username', label: 'Service Account Username', type: 'text', required: true, placeholder: 'serviceaccount@company.com' },
      { key: 'password', label: 'Service Account Password', type: 'password', required: true },
      { key: 'useSSL', label: 'Use SSL/TLS', type: 'checkbox', defaultValue: true },
      { key: 'timeout', label: 'Connection Timeout (seconds)', type: 'number', defaultValue: 30 }
    ]
  },
  LDAP: {
    label: 'LDAP Server',
    icon: '📁',
    description: 'Connect to generic LDAP directory services',
    fields: [
      { key: 'serverName', label: 'Server Name/IP', type: 'text', required: true, placeholder: 'ldap.company.com' },
      { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '389', defaultValue: 389 },
      { key: 'baseDN', label: 'Base DN', type: 'text', required: true, placeholder: 'dc=company,dc=com' },
      { key: 'bindDN', label: 'Bind DN', type: 'text', required: true, placeholder: 'cn=admin,dc=company,dc=com' },
      { key: 'password', label: 'Bind Password', type: 'password', required: true },
      { key: 'useSSL', label: 'Use SSL/TLS', type: 'checkbox', defaultValue: false },
      { key: 'timeout', label: 'Connection Timeout (seconds)', type: 'number', defaultValue: 30 }
    ]
  },
  DATABASE: {
    label: 'PostgreSQL Database',
    icon: '🗄️',
    description: 'Connect to PostgreSQL database for user synchronization',
    fields: [
      { key: 'serverName', label: 'Server Name/IP', type: 'text', required: true, placeholder: 'localhost' },
      { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '5432', defaultValue: 5432 },
      { key: 'database', label: 'Database Name', type: 'text', required: true, placeholder: 'identity_db' },
      { key: 'username', label: 'Username', type: 'text', required: true, placeholder: 'db_user' },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'useSSL', label: 'Use SSL', type: 'checkbox', defaultValue: true },
      { key: 'maxConnections', label: 'Max Connections', type: 'number', defaultValue: 10 }
    ]
  },
  PINGONE: {
    label: 'PingOne Identity Cloud',
    icon: '🔐',
    description: 'Connect to PingOne for cloud-based identity management',
    fields: [
      { 
        key: 'environmentId', 
        label: 'Environment ID', 
        type: 'text', 
        required: true, 
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        helpText: 'Your PingOne environment UUID'
      },
      { 
        key: 'region', 
        label: 'Region', 
        type: 'select', 
        required: true,
        options: [
          { value: 'NA', label: 'North America (auth.pingone.com)' },
          { value: 'EU', label: 'Europe (auth.pingone.eu)' }, 
          { value: 'APAC', label: 'Asia Pacific (auth.pingone.asia)' }
        ],
        helpText: 'Select your PingOne deployment region'
      },
      { 
        key: 'clientId', 
        label: 'Client ID', 
        type: 'text', 
        required: true, 
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        helpText: 'Application Client ID from PingOne console'
      },
      { 
        key: 'clientSecret', 
        label: 'Client Secret', 
        type: 'password', 
        required: true,
        helpText: 'Application Client Secret (will be encrypted)'
      },
      { 
        key: 'scopes', 
        label: 'OAuth Scopes', 
        type: 'text', 
        required: false, 
        placeholder: 'p1:read:user p1:create:user p1:update:user p1:read:population',
        defaultValue: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:population p1:read:group',
        helpText: 'Space-separated list of OAuth scopes'
      },
      { 
        key: 'populationId', 
        label: 'Population ID (Optional)', 
        type: 'text', 
        required: false, 
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        helpText: 'Specific population to sync users from (leave empty for all)'
      },
      { 
        key: 'syncEnabled', 
        label: 'Enable Automatic Sync', 
        type: 'checkbox', 
        defaultValue: false,
        helpText: 'Automatically sync users and groups on schedule'
      },
      { 
        key: 'syncInterval', 
        label: 'Sync Interval (minutes)', 
        type: 'number', 
        defaultValue: 60, 
        min: 5,
        max: 1440,
        helpText: 'How often to sync (minimum 5 minutes, maximum 24 hours)',
        dependsOn: 'syncEnabled'
      },
      {
        key: 'importUsers',
        label: 'Import Users',
        type: 'checkbox',
        defaultValue: true,
        helpText: 'Include users in sync operations'
      },
      {
        key: 'importGroups',
        label: 'Import Groups',
        type: 'checkbox',
        defaultValue: true,
        helpText: 'Include groups in sync operations'
      }
    ],
    supportedOperations: ['test', 'import', 'sync', 'realTimeStatus'],
    requiredScopes: [
      'p1:read:user',
      'p1:create:user',
      'p1:update:user',
      'p1:delete:user',
      'p1:read:population',
      'p1:read:group',
      'p1:create:group',
      'p1:update:group',
      'p1:delete:group'
    ]
  }
};

// Helper function to get connection type configuration
export function getConnectionTypeConfig(type) {
  return CONNECTION_TYPES[type] || null;
}

// Helper function to get all available connection types
export function getAvailableConnectionTypes() {
  return Object.keys(CONNECTION_TYPES);
}

// Helper function to validate connection type
export function isValidConnectionType(type) {
  return type in CONNECTION_TYPES;
}

// Helper function to get required fields for a connection type
export function getRequiredFields(type) {
  const config = CONNECTION_TYPES[type];
  if (!config) return [];
  
  return config.fields.filter(field => field.required).map(field => field.key);
}

// Helper function to build PingOne URLs based on region
export function getPingOneUrls(region, environmentId) {
  const regionMap = {
    'NA': { 
      auth: 'https://auth.pingone.com', 
      api: 'https://api.pingone.com' 
    },
    'EU': { 
      auth: 'https://auth.pingone.eu', 
      api: 'https://api.pingone.eu' 
    },
    'APAC': { 
      auth: 'https://auth.pingone.asia', 
      api: 'https://api.pingone.asia' 
    }
  };
  
  const urls = regionMap[region];
  if (!urls || !environmentId) return null;
  
  return {
    authorizationUrl: `${urls.auth}/${environmentId}/as/authorize`,
    tokenUrl: `${urls.api}/v1/environments/${environmentId}/as/token`,
    apiBaseUrl: `${urls.api}/v1/environments/${environmentId}`,
    userEndpoint: `${urls.api}/v1/environments/${environmentId}/users`,
    groupEndpoint: `${urls.api}/v1/environments/${environmentId}/groups`
  };
}