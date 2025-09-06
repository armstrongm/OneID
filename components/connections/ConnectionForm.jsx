// components/connections/ConnectionForm.jsx - FIXED VERSION WITH IMPORT INTEGRATION
import { useState, useEffect } from 'react';
import { Eye, EyeOff, TestTube, Save, X, AlertCircle, CheckCircle, Info, Upload } from 'lucide-react';
import { CONNECTION_TYPES, getPingOneUrls } from '../../lib/constants/connectionTypes';
import ImportPreviewModal from '../import/ImportPreviewModal';

export default function ConnectionForm({ 
  connection = null, 
  connectionType = 'AD', 
  onSubmit, 
  onCancel, 
  onTest,
  loading = false,
  testResult = null 
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [testing, setTesting] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);

  const connectionConfig = CONNECTION_TYPES[connectionType];

  useEffect(() => {
    // Initialize form data with default values
    const initialData = { type: connectionType };
    
    if (connectionConfig && connectionConfig.fields) {
      connectionConfig.fields.forEach(field => {
        if (connection && connection[field.key] !== undefined) {
          initialData[field.key] = connection[field.key];
        } else if (connection && connection.connection_config && connection.connection_config[field.key] !== undefined) {
          // Handle config stored in connection_config JSON field
          initialData[field.key] = connection.connection_config[field.key];
        } else if (field.defaultValue !== undefined) {
          initialData[field.key] = field.defaultValue;
        } else {
          initialData[field.key] = field.type === 'checkbox' ? false : '';
        }
      });
    }

    if (connection) {
      initialData.id = connection.id;
      initialData.name = connection.name || '';
      initialData.description = connection.description || '';
    }

    setFormData(initialData);
  }, [connection, connectionType, connectionConfig]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate PingOne URLs when region or environmentId changes
      if (connectionType === 'PINGONE' && (field === 'region' || field === 'environmentId')) {
        const { region, environmentId } = updated;
        if (region && environmentId) {
          const urls = getPingOneUrls(region, environmentId);
          if (urls) {
            updated.authorizationUrl = urls.authorizationUrl;
            updated.tokenUrl = urls.tokenUrl;
            updated.apiBaseUrl = urls.apiBaseUrl;
          }
        }
      }
      
      return updated;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Connection name is required';
    }

    if (connectionConfig && connectionConfig.fields) {
      connectionConfig.fields.forEach(field => {
        if (field.required && !formData[field.key]) {
          newErrors[field.key] = `${field.label} is required`;
        }
        
        // Custom validation for PingOne
        if (connectionType === 'PINGONE') {
          if (field.key === 'environmentId' && formData[field.key]) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(formData[field.key])) {
              newErrors[field.key] = 'Environment ID must be a valid UUID';
            }
          }
          
          if (field.key === 'syncInterval' && formData.syncEnabled) {
            const interval = parseInt(formData[field.key]);
            if (isNaN(interval) || interval < 5 || interval > 1440) {
              newErrors[field.key] = 'Sync interval must be between 5 and 1440 minutes';
            }
          }

          // Validate user import URL if user import is enabled
          if (field.key === 'userImportUrl' && formData.enableUserImport && formData[field.key]) {
            try {
              new URL(formData[field.key]);
            } catch {
              newErrors[field.key] = 'Please enter a valid URL';
            }
          }
        }
      });
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleTest = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setTesting(true);
    try {
      if (onTest) {
        await onTest(formData);
      }
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setTesting(false);
    }
  };

  const togglePasswordVisibility = (fieldKey) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const handleImportComplete = (result) => {
    console.log('Import completed:', result);
    setShowImportPreview(false);
    // Optionally show success message or redirect
  };

  const renderField = (field) => {
    const value = formData[field.key];
    const error = errors[field.key];
    const showPassword = showPasswords[field.key];
    
    // Skip field if it depends on another field that's not enabled
    if (field.dependsOn && !formData[field.dependsOn]) {
      return null;
    }

    return (
      <div key={field.key} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {/* Field Input */}
        <div className="relative">
          {field.type === 'select' ? (
            <select
              value={value || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === 'checkbox' ? (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleChange(field.key, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{field.label}</span>
            </label>
          ) : (
            <input
              type={field.type === 'password' && !showPassword ? 'password' : 
                   field.type === 'password' ? 'text' : 
                   field.type}
              value={value || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                field.type === 'password' ? 'pr-10' : ''
              } ${error ? 'border-red-300' : 'border-gray-300'}`}
              required={field.required}
              readOnly={field.key === 'authorizationUrl' || field.key === 'tokenUrl' || field.key === 'apiBaseUrl'}
            />
          )}
          
          {/* Password toggle only for password fields */}
          {field.type === 'password' && (
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.key)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        
        {/* Help Text */}
        {field.helpText && (
          <p className="text-xs text-gray-500 flex items-start space-x-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{field.helpText}</span>
          </p>
        )}
        
        {/* Field Error */}
        {error && (
          <p className="text-xs text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  };

  // If connectionConfig is not found, show error
  if (!connectionConfig) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-medium text-red-800">
            Configuration Error
          </h3>
        </div>
        <p className="text-sm text-red-700 mt-1">
          Connection type "{connectionType}" is not supported or configuration is missing.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Connection Header */}
        <div className="flex items-center space-x-3 pb-4 border-b">
          <span className="text-2xl">{connectionConfig.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {connection ? 'Edit' : 'Create'} {connectionConfig.label} Connection
            </h3>
            <p className="text-sm text-gray-600">
              {connectionConfig.description}
            </p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Connection Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="My Connection"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.name && (
              <p className="text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Configuration Fields */}
        {connectionConfig.fields && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Connection Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectionConfig.fields.map(renderField)}
            </div>
          </div>
        )}

        {/* Test Result Display */}
        {testResult && (
          <div className={`p-4 rounded-md border ${
            testResult.success 
              ? 'bg-green-50 border-green-200 text-green-800'
              : testResult.testing
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {testResult.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : testResult.testing ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="font-medium">
                {testResult.testing ? 'Testing...' : testResult.message}
              </span>
            </div>
            
            {testResult.details && (
              <div className="mt-2 text-sm">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-4 h-4 inline mr-2" />
            Cancel
          </button>

          <div className="flex items-center space-x-3">
            {/* Import Now Button - Only show for existing PingOne connections with import enabled */}
            {connection && connectionType === 'PINGONE' && formData.enableUserImport && formData.userImportUrl && (
              <button
                type="button"
                onClick={() => setShowImportPreview(true)}
                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Import Now
              </button>
            )}

            {onTest && (
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || loading}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <TestTube className="w-4 h-4 inline mr-2" />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4 inline mr-2" />
              {loading ? 'Saving...' : connection ? 'Update Connection' : 'Create Connection'}
            </button>
          </div>
        </div>
      </form>

      {/* Import Preview Modal */}
      <ImportPreviewModal
        connectionId={connection?.id}
        isOpen={showImportPreview}
        onClose={() => setShowImportPreview(false)}
        onImport={handleImportComplete}
      />
    </>
  );
}