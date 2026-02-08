"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
  state: string;
  totalCo2: number;
  totalWeight: number;
  diversionRate: number;
  totalScans: number;
  wasteComposition: { name: string; value: number }[];
  regionData: { region: string; scans: number; diverted: number; co2: number; rate: string }[];
  monthlyTrend: { month: string; co2: number; diverted: number; landfill: number }[];
}

export function generatePdfReport(data: ReportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 20;

  // ── Header ──
  doc.setFillColor(22, 163, 74); // green-600
  doc.rect(0, 0, pageWidth, 44, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("GreenLens AI", margin, 18);
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text("Community Impact Report", margin, 27);
  doc.setFontSize(10);
  doc.text(
    `${data.state} — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    margin,
    36
  );
  y = 54;

  // ── Executive Summary ──
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", margin, y);
  y += 10;

  const summaryCards = [
    { label: "Total CO₂ Offset", value: `${data.totalCo2.toLocaleString()} kg`, color: [22, 163, 74] as [number, number, number] },
    { label: "Waste Diverted", value: `${data.totalWeight.toLocaleString()} lbs`, color: [59, 130, 246] as [number, number, number] },
    { label: "Diversion Rate", value: `${data.diversionRate}%`, color: [139, 92, 246] as [number, number, number] },
    { label: "Total Scans", value: data.totalScans.toLocaleString(), color: [245, 158, 11] as [number, number, number] },
  ];

  const cardW = (pageWidth - margin * 2 - 12) / 4;
  summaryCards.forEach((card, i) => {
    const x = margin + i * (cardW + 4);
    doc.setFillColor(...card.color);
    doc.roundedRect(x, y, cardW, 24, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + cardW / 2, y + 11, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, x + cardW / 2, y + 19, { align: "center" });
  });
  y += 34;

  // ── Waste Composition ──
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Waste Composition Breakdown", margin, y);
  y += 8;

  const fillColors: Record<string, [number, number, number]> = {
    Recyclable: [34, 197, 94],
    Organic: [59, 130, 246],
    "Non-Recyclable": [239, 68, 68],
    "No Data": [209, 213, 219],
  };

  data.wasteComposition.forEach((item) => {
    const barWidth = Math.max(2, (item.value / 100) * (pageWidth - margin * 2 - 60));
    const color = fillColors[item.name] || [156, 163, 175];

    doc.setFillColor(...color);
    doc.roundedRect(margin + 50, y - 4, barWidth, 7, 2, 2, "F");
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(item.name, margin, y + 1);
    doc.setFont("helvetica", "bold");
    doc.text(`${item.value}%`, margin + 50 + barWidth + 4, y + 1);
    y += 12;
  });
  y += 6;

  // ── City Performance Table ──
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("City Performance", margin, y);
  y += 4;

  if (data.regionData.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["City", "Scans", "Diverted (lbs)", "CO₂ (kg)", "Share"]],
      body: data.regionData.map((r) => [r.region, r.scans.toString(), r.diverted.toLocaleString(), r.co2.toLocaleString(), r.rate]),
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [55, 65, 81] },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { cellPadding: 3 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(156, 163, 175);
    doc.text("No city data available.", margin, y);
    y += 10;
  }

  // ── Monthly Trend Table ──
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Monthly Trend", margin, y);
  y += 4;

  if (data.monthlyTrend.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Month", "CO₂ Saved (kg)", "Diverted (lbs)", "To Landfill (lbs)"]],
      body: data.monthlyTrend.map((m) => [m.month, m.co2.toString(), m.diverted.toString(), m.landfill.toString()]),
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [55, 65, 81] },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { cellPadding: 3 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Environmental Impact Summary (PDF-only) ──
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(240, 253, 244); // green-50
  doc.roundedRect(margin, y, pageWidth - margin * 2, 36, 3, 3, "F");
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 36, 3, 3, "S");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text("Environmental Impact Summary", margin + 6, y + 8);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81);
  doc.text(
    `This report summarizes GreenLens AI community recycling efforts in ${data.state}.`,
    margin + 6,
    y + 16
  );
  doc.text(
    `Total CO₂ Offset: ${data.totalCo2.toLocaleString()} kg  |  Waste Diverted: ${data.totalWeight.toLocaleString()} lbs  |  Diversion Rate: ${data.diversionRate}%  |  Total Scans: ${data.totalScans.toLocaleString()}`,
    margin + 6,
    y + 23
  );
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `Generated for ${data.state} — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    margin + 6,
    y + 31
  );
  y += 44;

  // ── Footer ──
  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(248, 250, 249);
  doc.rect(0, 272, pageWidth, 25, "F");
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, 272, pageWidth - margin, 272);
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `GreenLens AI — Community Impact Report — Generated ${new Date().toLocaleString()}`,
    pageWidth / 2,
    280,
    { align: "center" }
  );
  doc.text(
    "This report is auto-generated from real-time scan data. Diversion rates calculated using EPA WARM Model v16.",
    pageWidth / 2,
    286,
    { align: "center" }
  );

  // Save
  const filename = `GreenLens_Impact_Report_${data.state.replaceAll(" ", "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
