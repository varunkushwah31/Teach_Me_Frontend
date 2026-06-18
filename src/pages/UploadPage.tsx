import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, CloudUpload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadDocument } from '../services/api';

interface UploadResult {
  id: string;
  fileName: string;
  status: 'success' | 'error';
  message: string;
}

const UploadPage: React.FC = () => {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('computer-science');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
    } else if (f) {
      setResults((prev) => [
        { id: crypto.randomUUID(), fileName: f.name, status: 'error', message: 'Only PDF files are supported' },
        ...prev,
      ]);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files[0] ?? null);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file || !token) return;
    setUploading(true);
    try {
      const msg = await uploadDocument(token, file, category);
      setResults((prev) => [
        { id: crypto.randomUUID(), fileName: file.name, status: 'success', message: msg || 'Document processed successfully' },
        ...prev,
      ]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      setResults((prev) => [
        {
          id: crypto.randomUUID(),
          fileName: file.name,
          status: 'error',
          message: err instanceof Error ? err.message : 'Upload failed',
        },
        ...prev,
      ]);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
              <CloudUpload className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Upload Documents</h2>
          </div>
          <p className="text-slate-400 ml-13">
            Upload PDF documents to build your knowledge base. The AI will process and index them for RAG queries.
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700/60 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
          >
            <option value="computer-science">Computer Science</option>
            <option value="mathematics">Mathematics</option>
            <option value="physics">Physics</option>
            <option value="general">General</option>
          </select>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
            dragOver
              ? 'border-emerald-500 bg-emerald-500/5'
              : file
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <FileText className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-slate-500 text-sm">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Upload className="w-7 h-7 text-slate-500" />
              </div>
              <div>
                <p className="text-slate-300 font-medium">Drop your PDF here or click to browse</p>
                <p className="text-slate-600 text-sm mt-1">Maximum file size: 50 MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing document...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload &amp; Process
            </>
          )}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Upload History</h3>
            {results.map((r) => (
              <div
                key={r.id}
                className={`flex items-start gap-3 rounded-xl p-4 border ${
                  r.status === 'success'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                {r.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className={`font-medium text-sm ${r.status === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                    {r.fileName}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
