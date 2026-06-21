import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, CloudUpload, Clock, File as FileIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadDocument, getDocumentHistory, type DocumentHistoryDTO } from '../services/api';

const UploadPage: React.FC = () => {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('computer-science');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // History State
  const [documents, setDocuments] = useState<DocumentHistoryDTO[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // ✅ The Declarative Fetch Trigger
  const [refreshKey, setRefreshKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ All data synchronization is now safely contained purely within the Effect
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    setLoadingHistory(true);

    // Using standard Promise chains avoids the async/await synchronous linting traps
    getDocumentHistory(token, 0, 20)
        .then((res) => {
          if (isMounted) setDocuments(res.content);
        })
        .catch((err) => {
          console.error("Failed to fetch documents:", err);
        })
        .finally(() => {
          if (isMounted) setLoadingHistory(false);
        });

    // Cleanup function prevents state updates if the component unmounts mid-fetch
    return () => {
      isMounted = false;
    };
  }, [token, refreshKey]);

  const handleFile = useCallback((f: File | null | undefined) => {
    if (f?.type === 'application/pdf') {
      setFile(f);
    } else if (f) {
      alert('Only PDF files are supported');
    }
  }, []);

  const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer?.files?.[0]);
      },
      [handleFile]
  );

  const handleUpload = async () => {
    if (!file || !token) return;
    setUploading(true);
    try {
      await uploadDocument(token, file, category, `upload-${crypto.randomUUID()}`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // ✅ Update the trigger to command the useEffect to fetch fresh data
      setRefreshKey((prev) => prev + 1);

    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  let dropzoneClasses = 'relative cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all h-full flex flex-col items-center justify-center w-full ';
  if (dragOver) {
    dropzoneClasses += 'border-emerald-500 bg-emerald-500/5';
  } else if (file) {
    dropzoneClasses += 'border-emerald-500/40 bg-emerald-500/5';
  } else {
    dropzoneClasses += 'border-slate-700 hover:border-slate-600 bg-slate-900/50';
  }

  const renderTableContent = () => {
    if (loadingHistory) {
      return (
          <div className="p-8 text-center text-slate-500 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
      );
    }

    if (documents.length === 0) {
      return (
          <div className="p-8 text-center text-slate-500">
            No documents uploaded yet.
          </div>
      );
    }

    return (
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/50 text-slate-400">
          <tr>
            <th className="px-6 py-4 font-medium">File Name</th>
            <th className="px-6 py-4 font-medium">Size</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium">Uploaded</th>
          </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
          {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-800/60 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <FileIcon className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-200 truncate max-w-50">{doc.fileName}</span>
                </td>
                <td className="px-6 py-4 text-slate-400">{formatSize(doc.fileSize)}</td>
                <td className="px-6 py-4">
                  {doc.status === 'COMPLETED' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>}
                  {doc.status === 'PROCESSING' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Parsing</span>}
                  {doc.status === 'FAILED' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20" title={doc.errorMessage}><AlertCircle className="w-3.5 h-3.5" /> Failed</span>}
                </td>
                <td className="px-6 py-4 text-slate-400">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </td>
              </tr>
          ))}
          </tbody>
        </table>
    );
  };

  return (
      <div className="flex flex-col h-full bg-slate-900 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-8">

          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
                <CloudUpload className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Document Library</h2>
            </div>
            <p className="text-slate-400 ml-13">
              Upload PDFs to build your AI knowledge base. Documents are retained securely and isolated to your account.
            </p>
          </div>

          {/* Upload Container */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label htmlFor="category-select" className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                    id="category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                >
                  <option value="computer-science">Computer Science</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="physics">Physics</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                    type="button"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={dropzoneClasses}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                  {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-emerald-400" />
                        <p className="text-white font-medium text-sm">{file.name}</p>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null); }}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-slate-500" />
                        <p className="text-slate-300 font-medium text-sm">Drop PDF here or click to browse</p>
                      </div>
                  )}
                </button>
              </div>
            </div>

            <button
                onClick={() => void handleUpload()}
                disabled={!file || uploading}
                className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
              {uploading ? 'Processing & Vectorizing...' : 'Upload to Knowledge Base'}
            </button>
          </div>

          {/* Document History Table */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Recent Uploads
            </h3>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
              {renderTableContent()}
            </div>
          </div>

        </div>
      </div>
  );
};

export default UploadPage;