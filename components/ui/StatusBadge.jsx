import { useEffect, useState } from 'react';

export function StatusBadge({ status, type = 'status' }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
      Loading...
    </span>;
  }

  const getStatusStyles = () => {
    if (type === 'enabled') {
      return status 
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-red-100 text-red-800 border-red-200';
    }
    
    if (type === 'locked') {
      return status 
        ? 'bg-red-100 text-red-800 border-red-200'
        : 'bg-green-100 text-green-800 border-green-200';
    }

    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = () => {
    if (type === 'enabled') {
      return status ? 'Enabled' : 'Disabled';
    }
    
    if (type === 'locked') {
      return status ? 'Locked' : 'Unlocked';
    }

    return status?.toString() || 'Unknown';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {getStatusText()}
    </span>
  );
}