import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadExcel(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows.map((r) => r.map((v) => v ?? ""))]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function downloadPDF(
  filename: string,
  title: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Exported: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    14,
    26,
  );
  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((v) => String(v ?? ""))),
    startY: 32,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 253, 250] },
  });
  doc.save(`${filename}.pdf`);
}
