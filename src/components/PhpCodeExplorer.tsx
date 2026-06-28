/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileCode, Clipboard, Check, FolderOpen, ArrowRight, Server, Terminal } from 'lucide-react';
import { PHP_CODEBASE } from '../phpCodeTemplates';

export default function PhpCodeExplorer() {
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = PHP_CODEBASE[activeFileIdx];

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" /> PHP Native MVC Backend Explorer
          </h2>
          <p className="text-sm text-gray-500">Jelajahi dan salin kode template backend PHP Native MVC relasional MySQL yang siap di-deploy ke XAMPP</p>
        </div>
        <button 
          id="copy-code-btn"
          onClick={handleCopy}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start shadow"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" /> Berhasil Disalin!
            </>
          ) : (
            <>
              <Clipboard className="h-4 w-4" /> Salin Source Code
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Sidebar Directory File list */}
        <div className="md:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="h-4 w-4 text-gray-400" /> Struktur Berkas MVC
          </h3>
          
          <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
            {PHP_CODEBASE.map((file, idx) => (
              <button
                id={`explore-file-${idx}`}
                key={file.path}
                onClick={() => {
                  setActiveFileIdx(idx);
                  setCopied(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl transition flex items-center justify-between text-xs font-mono font-semibold ${
                  activeFileIdx === idx
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'hover:bg-slate-50 text-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className={`h-4 w-4 shrink-0 ${activeFileIdx === idx ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="truncate">{file.path}</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-gray-400 px-1.5 py-0.5 rounded-md shrink-0 uppercase scale-90">
                  {file.category}
                </span>
              </button>
            ))}
          </div>

          {/* Deployment Warning banner */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-[11px] text-gray-500 leading-relaxed">
            <Terminal className="h-4 w-4 text-gray-400 inline mr-1 mb-0.5" />
            <span className="font-bold text-gray-700">Panduan XAMPP:</span> Buat folder baru bernama <code className="bg-white px-1 py-0.5 border rounded-sm font-mono text-gray-700 font-bold">inventaris_kantor</code> di dalam <code className="font-mono bg-white border px-1 rounded-sm text-gray-700">htdocs/</code>, lalu paste-kan file-file di atas sesuai jalurnya. Jalankan Apache & MySQL via panel control XAMPP.
          </div>
        </div>

        {/* Code Viewer Panel */}
        <div className="md:col-span-8 flex flex-col border border-gray-150 rounded-2xl overflow-hidden shadow-xs bg-slate-950">
          
          {/* Viewer Tab Bar */}
          <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <FileCode className="h-3.5 w-3.5 text-blue-400" /> {activeFile?.path}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono">
              READ-ONLY MODE
            </span>
          </div>

          {/* Core Code Preformatted container */}
          <div className="p-4 overflow-auto max-h-[500px] text-xs font-mono text-slate-300 leading-relaxed selection:bg-blue-600 selection:text-white">
            <pre className="whitespace-pre-wrap">{activeFile?.content}</pre>
          </div>

        </div>

      </div>

    </div>
  );
}
