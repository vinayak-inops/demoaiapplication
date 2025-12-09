
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { PdfConfig } from "../types";

export const generatePdfReport = (config: PdfConfig) => {
  const doc = new jsPDF({
    orientation: config.orientation || 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  // --- Header ---
  // Organization Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138); // Blue-900
  doc.text("CLMS", margin, 20);

  // Report Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(33, 37, 41); // Slate-800
  doc.text(config.title, margin, 32);

  // Meta info (Right aligned)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  
  const dateStr = `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
  doc.text(dateStr, pageWidth - margin, 20, { align: "right" });

  if (config.period) {
    doc.text(`Period: ${config.period}`, pageWidth - margin, 25, { align: "right" });
  }

  // Description / Context
  let startY = 40;
  if (config.description) {
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const splitText = doc.splitTextToSize(config.description, pageWidth - (margin * 2));
    doc.text(splitText, margin, startY);
    startY += (splitText.length * 5) + 5;
  }

  // --- Summary Box (Optional) ---
  if (config.summary) {
    const summaryKeys = Object.keys(config.summary);
    if (summaryKeys.length > 0) {
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.roundedRect(margin, startY, pageWidth - (margin * 2), 20, 2, 2, "FD");
      
      let xOffset = margin + 5;
      doc.setFontSize(9);
      
      summaryKeys.forEach((key) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(`${key}:`, xOffset, startY + 8);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(String(config.summary![key]), xOffset, startY + 15);
        
        // Dynamic spacing based on text length, minimum 45
        const textWidth = doc.getTextWidth(String(config.summary![key]));
        xOffset += Math.max(45, textWidth + 10);
      });
      startY += 28;
    }
  }

  // --- Data Table ---
  
  // Heuristic: Identify numeric columns for Right Alignment based on Header Names
  const columnStyles: Record<number, any> = {};
  config.headers.forEach((header, index) => {
    const h = header.toLowerCase();
    if (
      h.includes('amount') || 
      h.includes('wage') || 
      h.includes('pf') || 
      h.includes('share') || 
      h.includes('total') || 
      h.includes('days') || 
      h.includes('hours') || 
      h.includes('rate') ||
      h.includes('price') ||
      h.includes('value') ||
      h.includes('ot')
    ) {
      columnStyles[index] = { halign: 'right' };
    }
  });

  // Using 'any' cast to avoid TS module augmentation issues with jspdf-autotable
  (doc as any).autoTable({
    startY: startY,
    head: [config.headers],
    body: config.rows,
    theme: 'grid',
    headStyles: { 
      fillColor: [30, 58, 138], // Blue-900
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left' // Headers default left, overrides in columnStyles if needed
    },
    columnStyles: columnStyles,
    styles: { 
      fontSize: 8, 
      cellPadding: 3,
      textColor: [51, 65, 85], // Slate-700
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    },
    // Highlight 'MISMATCH' or 'FAILED' in red
    didParseCell: function(data: any) {
      const text = data.cell.raw ? String(data.cell.raw).toUpperCase() : '';
      if (text === 'MISMATCH' || text === 'FAILED' || text === 'NON-COMPLIANT' || text === 'HIGH RISK') {
        data.cell.styles.textColor = [220, 38, 38]; // Red-600
        data.cell.styles.fontStyle = 'bold';
      }
      if (text === 'MATCH' || text === 'VERIFIED' || text === 'COMPLIANT' || text === 'ACTIVE') {
        data.cell.styles.textColor = [22, 163, 74]; // Green-600
        data.cell.styles.fontStyle = 'bold';
      }
      
      // Auto-align numeric body cells if not already handled by header heuristic
      if (data.section === 'body') {
        const raw = String(data.cell.raw);
        // Regex to check if looks like currency or number (e.g. 1,000.00, ₹500, 45%)
        // Matches: Optional symbol, digits/commas/dots, optional percent
        const isNumeric = /^[₹$€£]?\s*[\d,.]+%?$/.test(raw);
        if (isNumeric) {
           data.cell.styles.halign = 'right';
        }
      }
    }
  });

  // --- Footer ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    
    const footerText = "Generated by CLMS AI • Confidential Report";
    doc.text(footerText, margin, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  // Save File
  doc.save(`${config.filename}.pdf`);
};
