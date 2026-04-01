import React, { useState } from 'react';
import { Bill } from '../types';
import InvoiceTemplate from './InvoiceTemplate';
// @ts-ignore
import html2pdf from "html2pdf.js";

interface InvoicePreviewModalProps {
  bill: Bill;
  onClose: () => void;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ bill, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("invoice-template");
      if (!element) {
        throw new Error("Cannot find invoice template element.");
      }

      const invId = `INV-${bill.id.substring(0, 6).toUpperCase()}`;

      const opt = {
        margin:       [0, 0, 0, 0] as [number, number, number, number],
        filename:     `Invoice-${invId}.pdf`,
        image:        { type: 'jpeg' as const, quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().from(element).set(opt).save();
      
      onClose(); // Auto close after generation
    } catch (e: any) {
      console.error("Failed to generate PDF invoice:", e);
      alert(`Could not generate PDF: ${e.message || 'Unknown error'}.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col backdrop-blur-sm overflow-hidden animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
      
      {/* Top Action Bar */}
      <div className="w-full bg-[#111] border-b border-[#333] px-6 py-4 flex items-center justify-between shrink-0 shadow-xl relative z-10">
        <div className="text-white">
          <h2 className="text-lg font-bold text-[#d4af37]">Interactive Invoice Preview</h2>
          <p className="text-xs text-gray-400 mt-1">
            Click anywhere on the text below to live-edit typos or adjust numbers manually before downloading.
          </p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-5 py-2 rounded font-bold text-gray-300 hover:text-white hover:bg-gray-800 transition-all border border-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black px-6 py-2 rounded font-bold shadow-lg transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="material-icons animate-spin text-sm">refresh</span>
            ) : (
              <span className="material-icons text-sm">picture_as_pdf</span>
            )}
            {isGenerating ? "Generating..." : "Generate PDF"}
          </button>
        </div>
      </div>

      {/* Scrollable Document Wrapper */}
      <div className="flex-1 overflow-y-auto w-full flex justify-center py-8">
        
        {/* A4 Paper Shadow Container wrapper so the click-to-edit bounds are distinct */}
        <div className="shadow-2xl shadow-black/50 transition-all hover:shadow-[#d4af37]/10" style={{ width: '794px', minHeight: '1123px', backgroundColor: 'white' }}>
          
          <InvoiceTemplate bill={bill} />

        </div>

      </div>
    </div>
  );
};

export default InvoicePreviewModal;
