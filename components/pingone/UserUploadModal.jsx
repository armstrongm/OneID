// components/pingone/UserUploadModal.jsx - Complete CSV User Upload Modal
import { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Download,
  Eye,
  ArrowRight,
  User,
  Mail,
  Info
} from 'lucide-react';

const PINGONE_USER_FIELDS = {
  // Required fields
  'username': { label: 'Username', required: true, type: 'string', description: 'Unique username for the user' },
  'email': { label: 'Email', required: true, type: 'email', description: 'Primary email address' },
  
  // Name fields
  'given': { label: 'First Name', required: false, type: 'string', description: 'Given/first name' },
  'family': { label: 'Last Name', required: false, type: 'string', description: 'Family/last name' },
  'middle': { label: 'Middle Name', required: false, type: 'string', description: 'Middle name' },
  'formatted': { label: 'Full Name', required: false, type: 'string', description: 'Full formatted name' },
  
  // Profile fields
  'nickname': { label: 'Nickname', required: false, type: 'string', description: 'Preferred nickname' },
  'title': { label: 'Title', required: false, type: 'string', description: 'Job title' },
  'type': { label: 'User Type', required: false, type: 'string', description: 'Type of user account' },
  'locale': { label: 'Locale', required: false, type: 'string', description: 'User locale (e.g., en-US)' },
  'timezone': { label: 'Timezone', required: false, type: 'string', description: 'User timezone' },
  
  // Contact fields
  'mobilePhone': { label: 'Mobile Phone', required: false, type: 'string', description: 'Mobile phone number' },
  'primaryPhone': { label: 'Primary Phone', required: false, type: 'string', description: 'Primary phone number' },
  
  // Address fields
  'streetAddress': { label: 'Street Address', required: false, type: 'string', description: 'Street address' },
  'locality': { label: 'City', required: false, type: 'string', description: 'City or locality' },
  'region': { label: 'State/Region', required: false, type: 'string', description: 'State or region' },
  'postalCode': { label: 'Postal Code', required: false, type: 'string', description: 'Postal or zip code' },
  'countryCode': { label: 'Country', required: false, type: 'string', description: 'Country code (e.g., US)' }
};

export default function UserUploadModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Preview, 4: Processing
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setError(null);
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setError('CSV file must contain at least a header row and one data row');
          return;
        }

        // Parse CSV (simple implementation - consider using Papa Parse for production)
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        setCsvHeaders(headers);
        setCsvData(data);
        setStep(2); // Move to mapping step
      } catch (error) {
        setError('Failed to parse CSV file');
      }
    };

    reader.readAsText(file);
  };

  const handleMapping = (csvField, pingOneField) => {
    setFieldMappings(prev => ({
      ...prev,
      [csvField]: pingOneField
    }));
  };

  const generatePreview = () => {
    // Create preview data with mapped fields
    const preview = csvData.slice(0, 5).map(row => {
      const mappedRow = {};
      Object.entries(fieldMappings).forEach(([csvField, pingOneField]) => {
        if (pingOneField && row[csvField]) {
          mappedRow[pingOneField] = row[csvField];
        }
      });
      return mappedRow;
    });

    setPreviewData(preview);
    setStep(3);
  };

  const processUpload = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Map all CSV data to PingOne format
      const mappedData = csvData.map(row => {
        const mappedRow = {};
        Object.entries(fieldMappings).forEach(([csvField, pingOneField]) => {
          if (pingOneField && row[csvField]) {
            mappedRow[pingOneField] = row[csvField];
          }
        });
        return mappedRow;
      });

      const response = await fetch('/api/pingone/users/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          users: mappedData,
          mappings: fieldMappings
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const results = await response.json();
      setUploadResults(results);
      setStep(4);

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['username', 'email', 'given', 'family', 'title', 'mobilePhone'];
    const sampleData = [
      'john.doe,john.doe@company.com,John,Doe,Software Engineer,+1-555-0123',
      'jane.smith,jane.smith@company.com,Jane,Smith,Product Manager,+1-555-0124'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pingone-users-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const resetModal = () => {
    setStep(1);
    setCsvFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMappings({});
    setPreviewData([]);
    setUploadResults(null);
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const validateMappings = () => {
    const mappedFields = Object.values(fieldMappings).filter(Boolean);
    const hasUsername = mappedFields.includes('username');
    const hasEmail = mappedFields.includes('email');
    return hasUsername && hasEmail;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Upload className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Import Users to PingOne
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between max-w-2xl">
            {[
              { step: 1, label: 'Upload CSV', icon: Upload },
              { step: 2, label: 'Map Fields', icon: ArrowRight },
              { step: 3, label: 'Preview', icon: Eye },
              { step: 4, label: 'Complete', icon: CheckCircle }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= item.step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <span className={`text-sm font-medium ${
                    step >= item.step ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                </div>
                {index < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step > item.step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Upload CSV */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Upload CSV File
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Select a CSV file containing user data to import into PingOne. The file should include at least username and email columns.
                </p>
              </div>

              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">
                  <span className="text-blue-600 hover:text-blue-800 font-medium">Click to upload</span>
                  <span className="text-gray-500"> or drag and drop</span>
                </p>
                <p className="text-sm text-gray-500">CSV files only (Max 10MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </button>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Info className="w-4 h-4 mr-1" />
                  Need help? Download the template first
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Requirements</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• File must be in CSV format</li>
                  <li>• First row should contain column headers</li>
                  <li>• Must include 'username' and 'email' columns</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Maximum 1000 users per import</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Field Mapping */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Map CSV Fields to PingOne Attributes
                </h3>
                <p className="text-gray-600 mb-4">
                  Map your CSV columns to PingOne user attributes. Required fields are marked with *.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      <strong>Username</strong> and <strong>Email</strong> are required fields for creating users in PingOne.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {csvHeaders.map(csvField => (
                  <div key={csvField} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CSV Column: <span className="font-mono bg-white px-2 py-1 rounded border text-blue-600">{csvField}</span>
                      </label>
                      <p className="text-xs text-gray-500 truncate">
                        Sample: {csvData[0]?.[csvField] || 'No data'}
                      </p>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Maps to PingOne Field
                      </label>
                      <select
                        value={fieldMappings[csvField] || ''}
                        onChange={(e) => handleMapping(csvField, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">-- Skip this field --</option>
                        {Object.entries(PINGONE_USER_FIELDS).map(([key, field]) => (
                          <option key={key} value={key}>
                            {field.label} {field.required && '*'}
                          </option>
                        ))}
                      </select>
                      {fieldMappings[csvField] && (
                        <p className="text-xs text-gray-500 mt-1">
                          {PINGONE_USER_FIELDS[fieldMappings[csvField]]?.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mapping Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Mapping Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Fields Mapped:</span>
                    <span className="ml-2 font-medium">{Object.values(fieldMappings).filter(Boolean).length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Users to Import:</span>
                    <span className="ml-2 font-medium">{csvData.length}</span>
                  </div>
                </div>
                
                {!validateMappings() && (
                  <div className="mt-2 text-sm text-red-600">
                    ⚠️ Please map both username and email fields to continue
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Preview User Data
                </h3>
                <p className="text-gray-600">
                  Review the first 5 users that will be created. Check the data is correct before proceeding.
                </p>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(previewData[0] || {}).map(field => (
                        <th key={field} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {PINGONE_USER_FIELDS[field]?.label || field}
                          {PINGONE_USER_FIELDS[field]?.required && <span className="text-red-500 ml-1">*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(user).map((value, valueIndex) => (
                          <td key={valueIndex} className="px-4 py-3 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={value}>
                              {value || <span className="text-gray-400">-</span>}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Import Summary</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {csvData.length} users will be imported to PingOne. This action cannot be undone.
                      Users with existing usernames or emails will be skipped.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Import Complete
                </h3>
                <p className="text-gray-600">
                  Your user import has been processed. See the results below.
                </p>
              </div>

              {uploadResults && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {uploadResults.successful || 0}
                      </div>
                      <div className="text-sm text-green-700 font-medium">Successful</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {uploadResults.failed || 0}
                      </div>
                      <div className="text-sm text-red-700 font-medium">Failed</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {uploadResults.total || 0}
                      </div>
                      <div className="text-sm text-blue-700 font-medium">Total</div>
                    </div>
                  </div>

                  {uploadResults.createdUsers && uploadResults.createdUsers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Successfully Created Users:</h4>
                      <div className="bg-green-50 border border-green-200 rounded-md p-4 max-h-40 overflow-y-auto">
                        <div className="space-y-1">
                          {uploadResults.createdUsers.map((user, index) => (
                            <div key={index} className="text-sm text-green-700 flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              <span className="font-medium">{user.username}</span>
                              <span className="text-green-600 mx-2">•</span>
                              <span>{user.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadResults.errors && uploadResults.errors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Errors:</h4>
                      <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-40 overflow-y-auto">
                        <div className="space-y-2">
                          {uploadResults.errors.map((error, index) => (
                            <div key={index} className="text-sm text-red-700">
                              <span className="font-medium">Row {error.row}:</span>
                              {error.username && <span className="text-red-600"> ({error.username})</span>}
                              <br />
                              <span className="text-red-600">{error.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div>
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {step === 4 ? 'Close' : 'Cancel'}
            </button>

            {step === 2 && (
              <button
                onClick={generatePreview}
                disabled={!validateMappings()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue to Preview
              </button>
            )}

            {step === 3 && (
              <button
                onClick={processUpload}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing Users...
                  </div>
                ) : (
                  `Import ${csvData.length} Users`
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}