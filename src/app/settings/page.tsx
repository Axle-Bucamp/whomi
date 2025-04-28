'use client';

import { useState } from 'react';

import {
  exportStorage,
  importStorage,
} from '@/lib/storage/localStore';

export default function SettingsPage() {
  const [backupData, setBackupData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setMessage(null);
      const data = await exportStorage();
      setBackupData(data);
      setMessage({
        type: 'success',
        text: 'Data exported successfully. Copy the text below or download the file.'
      });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to export data. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setMessage(null);
      
      if (!importData.trim()) {
        setMessage({
          type: 'error',
          text: 'Please paste valid backup data to import.'
        });
        setIsImporting(false);
        return;
      }
      
      const success = await importStorage(importData);
      
      if (success) {
        setMessage({
          type: 'success',
          text: 'Data imported successfully. Refresh the page to see changes.'
        });
        setImportData('');
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to import data. Please check the format and try again.'
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to import data. Please check the format and try again.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whoim_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">Export Data</h2>
          <p className="text-gray-300 mb-4">
            Export all your personas, keys, and settings for backup or transfer to another device.
          </p>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center justify-center mb-4"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : 'Export Data'}
          </button>
          
          {backupData && (
            <>
              <div className="flex justify-end mb-2">
                <button
                  onClick={handleDownload}
                  className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                  Download JSON
                </button>
              </div>
              <textarea
                readOnly
                value={backupData}
                className="w-full h-48 p-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-xs"
              />
            </>
          )}
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">Import Data</h2>
          <p className="text-gray-300 mb-4">
            Import your personas, keys, and settings from a backup.
          </p>
          
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste your backup data here..."
            className="w-full h-48 p-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-xs mb-4"
          />
          
          <button
            onClick={handleImport}
            disabled={isImporting || !importData.trim()}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded flex items-center justify-center"
          >
            {isImporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </>
            ) : 'Import Data'}
          </button>
        </div>
      </div>
      
      {message && (
        <div className={`mt-6 p-4 rounded ${
          message.type === 'success' ? 'bg-green-900/50 border border-green-500 text-green-200' : 'bg-red-900/50 border border-red-500 text-red-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
