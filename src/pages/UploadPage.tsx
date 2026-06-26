import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  CloudUpload,
  Clock,
  File as FileIcon,
  Search,
  BrainCircuit,
  BookType,
} from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { documents, loading: loadingHistory, error: fetchError, fetchDocuments, upload, triggerSummary, fetchSummary, triggerQuiz } = useDocuments();

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('computer-science');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeSummary, setActiveSummary] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<number, 'summarising' | 'quizzing' | null>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    void fetchDocuments(debouncedSearch);
  }, [debouncedSearch, fetchDocuments]);

  const handleFile = useCallback((f: File | null | undefined) => {
    if (f?.type === 'application/pdf') {
      setFile(f);
    } else if (f) {
      alert('Only PDF files are supported');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer?.files?.[0]);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await upload(file, category);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSearchQuery('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const setActionState = (docId: number, state: 'summarising' | 'quizzing' | null) => {
    setActionStates(prev => ({ ...prev, [docId]: state }));
  };

  const handleGenerateSummary = async (docId: number) => {
    setActionState(docId, 'summarising');
    try {
      await triggerSummary(docId);
      alert('Summary generation started in the background.');
    } catch {
      alert('Failed to start summary generation.');
    } finally {
      setActionState(docId, null);
    }
  };

  const handleViewSummary = async (docId: number) => {
    try {
      const summaryData = await fetchSummary(docId);
      setActiveSummary(summaryData.executiveSummary);
    } catch {
      alert('Summary not ready yet — generate it first.');
    }
  };

  const handleGenerateQuiz = async (docId: number) => {
    setActionState(docId, 'quizzing');
    try {
      await triggerQuiz(docId);
      // Navigate straight into the quiz for this document
      navigate(`/quiz/${docId}`);
    } catch {
      alert('Failed to generate quiz.');
      setActionState(docId, null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  let dropzoneClasses = 'relative cursor-pointer border border-dashed rounded-xl p-6 text-center transition-all h-full flex flex-col items-center justify-center w-full ';
  if (dragOver) dropzoneClasses += 'border-[#5b4fff] bg-[#5b4fff]/10';
  else if (file) dropzoneClasses += 'border-[#5b4fff]/50 bg-[#5b4fff]/5';
  else dropzoneClasses += 'border-zinc-700 bg-[#1a1a1a]/40 hover:bg-[#1a1a1a]/80 hover:border-zinc-600';

  const renderTableContent = () => {
    if (loadingHistory) {
      return <div className="p-8 text-center text-zinc-500 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    }
    if (fetchError) {
      return (
          <div className="p-8 text-center text-red-400 flex flex-col items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{fetchError}</span>
            <button onClick={() => void fetchDocuments(debouncedSearch)} className="text-xs text-zinc-400 hover:text-white underline mt-1">Retry</button>
          </div>
      );
    }
    if (documents.length === 0) {
      return <div className="p-8 text-center text-zinc-500">{searchQuery ? 'No documents match your search.' : 'No documents uploaded yet.'}</div>;
    }

    return (
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-[#111111]/80 text-zinc-400 border-b border-zinc-800/50">
          <tr>
            <th className="px-6 py-4 font-medium">File name</th>
            <th className="px-6 py-4 font-medium">Size</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium text-center">Uploaded</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
          {documents.map((doc) => {
            const action = actionStates[doc.id] ?? null;
            return (
                <tr key={doc.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <FileIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="font-medium text-zinc-200 truncate max-w-50">{doc.fileName}</span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">{formatSize(doc.fileSize)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/50 text-emerald-400 text-xs font-medium border border-emerald-900/50">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                                        </span>
                    )}
                    {doc.status === 'PROCESSING' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/50 text-amber-400 text-xs font-medium border border-amber-900/50">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Parsing
                                        </span>
                    )}
                    {doc.status === 'FAILED' && (
                        <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/50 text-red-400 text-xs font-medium border border-red-900/50"
                            title={doc.errorMessage}
                        >
                                            <AlertCircle className="w-3.5 h-3.5" /> Failed
                                        </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 whitespace-nowrap text-center">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {doc.status === 'COMPLETED' && (
                        <div className="flex justify-end gap-2">
                          {/* Generate summary */}
                          <button
                              onClick={() => void handleGenerateSummary(doc.id)}
                              disabled={action !== null}
                              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors disabled:opacity-40"
                              title="Generate summary"
                          >
                            {action === 'summarising'
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <BookType className="w-4 h-4" />
                            }
                          </button>

                          {/* View summary */}
                          <button
                              onClick={() => void handleViewSummary(doc.id)}
                              disabled={action !== null}
                              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-emerald-400 transition-colors disabled:opacity-40"
                              title="View summary"
                          >
                            <Search className="w-4 h-4" />
                          </button>

                          {/* Generate quiz → navigates to /quiz/:id */}
                          <button
                              onClick={() => void handleGenerateQuiz(doc.id)}
                              disabled={action !== null}
                              className="p-2 bg-[#5b4fff]/20 hover:bg-[#5b4fff]/40 text-[#968fff] rounded-lg transition-colors border border-[#5b4fff]/30 disabled:opacity-40"
                              title="Generate and open quiz"
                          >
                            {action === 'quizzing'
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <BrainCircuit className="w-4 h-4" />
                            }
                          </button>
                        </div>
                    )}
                  </td>
                </tr>
            );
          })}
          </tbody>
        </table>
    );
  };

  return (
      <div className="flex flex-col h-full bg-[#0a0a0a] overflow-y-auto relative">
        <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-8">

          {/* Page header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-[#5b4fff]/20 to-[#968fff]/20 border border-[#5b4fff]/20">
                <CloudUpload className="w-5 h-5 text-[#968fff]" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Document Library</h2>
            </div>
            <p className="text-zinc-400 ml-13">Upload PDFs to build your AI knowledge base. Documents are retained securely and isolated to your account.</p>
          </div>

          {/* Upload panel */}
          <div className="bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label htmlFor="category-select" className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
                <select
                    id="category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-zinc-800/80 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#5b4fff]/50 transition-all"
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
                  <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-[#968fff]" />
                        <p className="text-white tracking-tight font-medium text-sm">{file.name}</p>
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
                        <Upload className="w-6 h-6 text-zinc-500" />
                        <p className="text-zinc-300 font-medium text-sm">Drop PDF here or click to browse</p>
                      </div>
                  )}
                </button>
              </div>
            </div>

            <button
                onClick={() => void handleUpload()}
                disabled={!file || uploading}
                className="w-full flex items-center justify-center gap-2 bg-[#5b4fff] hover:bg-[#5b4fff]/90 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[#968fff]/20 shadow-lg shadow-[#5b4fff]/10"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
              {uploading ? 'Processing & vectorising…' : 'Upload to knowledge base'}
            </button>
          </div>

          {/* Document table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-400" /> Recent uploads
              </h3>
              <div className="relative w-full sm:w-64">
                <label htmlFor="doc-search" className="sr-only">Search files</label>
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    id="doc-search"
                    type="text"
                    placeholder="Search files…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111111]/85 border border-zinc-800/60 text-sm text-zinc-100 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#5b4fff]/50 placeholder-zinc-600"
                />
              </div>
            </div>
            <div className="bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl rounded-2xl overflow-hidden">
              {renderTableContent()}
            </div>
          </div>
        </div>

        {/* Summary modal */}
        {activeSummary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative">
                <button
                    onClick={() => setActiveSummary(null)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-[#5b4fff]/20 to-[#968fff]/20 border border-[#5b4fff]/20">
                    <BookType className="w-4 h-4 text-[#968fff]" />
                  </div>
                  Executive summary
                </h3>
                <div className="text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap max-h-[60vh] overflow-y-auto pr-2">
                  {activeSummary}
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default UploadPage;