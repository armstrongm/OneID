// components/ui/Table.jsx
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      {children}
    </thead>
  );
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-gray-200">{children}</tbody>;
}

export function TableRow({ children, className = '' }) {
  return <tr className={`hover:bg-gray-50 ${className}`}>{children}</tr>;
}

export function TableHead({ children, sortable, sortKey, sortConfig, onSort, className = '' }) {
  const handleSort = () => {
    if (sortable && onSort) {
      onSort(sortKey);
    }
  };

  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
        sortable ? 'cursor-pointer hover:bg-gray-100' : ''
      } ${className}`}
      onClick={handleSort}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <span className="flex flex-col">
            {sortConfig?.key === sortKey ? (
              sortConfig.direction === 'asc' ? (
                <ChevronUpIcon className="w-3 h-3" />
              ) : (
                <ChevronDownIcon className="w-3 h-3" />
              )
            ) : (
              <div className="flex flex-col">
                <ChevronUpIcon className="w-3 h-3 text-gray-300" />
                <ChevronDownIcon className="w-3 h-3 text-gray-300 -mt-1" />
              </div>
            )}
          </span>
        )}
      </div>
    </th>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  );
}