"use client";

import type { BonReception, BonSortie, Inventory, StockMovement } from "./types";

// ==================== PDF EXPORT ====================

async function getPdf() {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  return { jsPDF, autoTable };
}

function formatDate(date: Date | undefined): string {
  if (!date || !(date instanceof Date)) return "-";
  return date.toLocaleDateString("fr-FR");
}

function formatDateTime(date: Date | undefined): string {
  if (!date || !(date instanceof Date)) return "-";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Bon de Réception PDF ---
export async function exportReceptionPDF(reception: BonReception): Promise<void> {
  const { jsPDF, autoTable } = await getPdf();
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("BON DE RÉCEPTION", 105, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`N° : ${reception.number}`, 14, 35);
  doc.text(`Date : ${formatDate(reception.date)}`, 14, 42);
  doc.text(`Fournisseur : ${reception.supplier}`, 14, 49);
  doc.text(`Opérateur : ${reception.operator}`, 14, 56);

  const statusLabel =
    reception.status === "valide" ? "Validé" : reception.status === "annule" ? "Annulé" : "Brouillon";
  doc.text(`Statut : ${statusLabel}`, 14, 63);

  if (reception.notes) {
    doc.text(`Notes : ${reception.notes}`, 14, 70);
  }

  // Table
  autoTable(doc, {
    startY: reception.notes ? 78 : 72,
    head: [["Code", "Produit", "Qté commandée", "Qté reçue", "Unité"]],
    body: reception.items.map((item) => [
      item.productCode,
      item.productName,
      item.quantityOrdered,
      item.quantityReceived,
      item.unit,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`${reception.number}.pdf`);
}

// --- Bon de Sortie PDF ---
export async function exportSortiePDF(sortie: BonSortie): Promise<void> {
  const { jsPDF, autoTable } = await getPdf();
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("BON DE SORTIE", 105, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`N° : ${sortie.number}`, 14, 35);
  doc.text(`Date : ${formatDate(sortie.date)}`, 14, 42);
  doc.text(`Destination : ${sortie.destination}`, 14, 49);
  doc.text(`Demandé par : ${sortie.requestedBy}`, 14, 56);
  doc.text(`Opérateur : ${sortie.operator}`, 14, 63);

  const statusLabel =
    sortie.status === "valide" ? "Validé" : sortie.status === "annule" ? "Annulé" : "Brouillon";
  doc.text(`Statut : ${statusLabel}`, 14, 70);

  if (sortie.notes) {
    doc.text(`Notes : ${sortie.notes}`, 14, 77);
  }

  autoTable(doc, {
    startY: sortie.notes ? 85 : 78,
    head: [["Code", "Produit", "Qté demandée", "Qté livrée", "Unité"]],
    body: sortie.items.map((item) => [
      item.productCode,
      item.productName,
      item.quantityRequested,
      item.quantityDelivered,
      item.unit,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [234, 88, 12] },
  });

  doc.save(`${sortie.number}.pdf`);
}

// --- Inventaire PDF ---
export async function exportInventairePDF(inventory: Inventory): Promise<void> {
  const { jsPDF, autoTable } = await getPdf();
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RAPPORT D'INVENTAIRE", 105, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nom : ${inventory.name}`, 14, 35);
  doc.text(`Type : ${inventory.type === "annuel" ? "Annuel" : "Intermédiaire"}`, 14, 42);
  doc.text(`Date début : ${formatDate(inventory.startDate)}`, 14, 49);
  if (inventory.endDate) {
    doc.text(`Date fin : ${formatDate(inventory.endDate)}`, 14, 56);
  }
  doc.text(`Responsable : ${inventory.operator}`, 14, inventory.endDate ? 63 : 56);

  const statusLabel =
    inventory.status === "valide" ? "Validé" : inventory.status === "en_cours" ? "En cours" : "Terminé";
  doc.text(`Statut : ${statusLabel}`, 14, inventory.endDate ? 70 : 63);

  const startY = inventory.endDate ? 78 : 71;

  // Summary
  const excedents = inventory.items.filter((i) => i.difference > 0).length;
  const manquants = inventory.items.filter((i) => i.difference < 0).length;
  doc.setFontSize(10);
  doc.text(
    `Total produits: ${inventory.items.length}  |  Excédents: ${excedents}  |  Manquants: ${manquants}`,
    14,
    startY
  );

  autoTable(doc, {
    startY: startY + 6,
    head: [["Code", "Produit", "Stock théorique", "Stock physique", "Écart", "Unité"]],
    body: inventory.items.map((item) => [
      item.productCode,
      item.productName,
      item.theoreticalStock,
      item.physicalStock,
      item.difference > 0 ? `+${item.difference}` : item.difference,
      item.unit,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [22, 163, 74] },
    bodyStyles: { fontSize: 9 },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === "body") {
        const val = Number(data.cell.raw);
        if (val > 0) data.cell.styles.textColor = [22, 163, 74];
        else if (val < 0) data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  doc.save(`inventaire-${inventory.name.replace(/\s+/g, "-")}.pdf`);
}

// --- Mouvements PDF ---
export async function exportMouvementsPDF(movements: StockMovement[], title = "Mouvements de Stock"): Promise<void> {
  const { jsPDF, autoTable } = await getPdf();
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Généré le : ${new Date().toLocaleDateString("fr-FR")}`, 14, 30);
  doc.text(`Total : ${movements.length} mouvement(s)`, 14, 36);

  autoTable(doc, {
    startY: 42,
    head: [["Date", "Type", "Produit", "Code", "Quantité", "Motif", "Opérateur"]],
    body: movements.map((m) => [
      formatDateTime(m.date),
      m.type === "entree" ? "Entrée" : "Sortie",
      m.productName,
      m.productCode,
      m.type === "entree" ? `+${m.quantity}` : `-${m.quantity}`,
      m.reason,
      m.operator,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [100, 116, 139] },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === "body") {
        const val = String(data.cell.raw);
        if (val.startsWith("+")) data.cell.styles.textColor = [22, 163, 74];
        else if (val.startsWith("-")) data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  doc.save(`mouvements-stock.pdf`);
}

// ==================== EXCEL EXPORT ====================

async function getXlsx() {
  const XLSX = await import("xlsx");
  return XLSX;
}

export async function exportReceptionExcel(reception: BonReception): Promise<void> {
  const XLSX = await getXlsx();

  const infoRows = [
    ["BON DE RÉCEPTION"],
    [],
    ["N°", reception.number],
    ["Date", formatDate(reception.date)],
    ["Fournisseur", reception.supplier],
    ["Opérateur", reception.operator],
    ["Statut", reception.status === "valide" ? "Validé" : reception.status === "annule" ? "Annulé" : "Brouillon"],
    reception.notes ? ["Notes", reception.notes] : [],
    [],
    ["Code", "Produit", "Qté commandée", "Qté reçue", "Unité"],
    ...reception.items.map((item) => [
      item.productCode,
      item.productName,
      item.quantityOrdered,
      item.quantityReceived,
      item.unit,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(infoRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bon de Réception");
  XLSX.writeFile(wb, `${reception.number}.xlsx`);
}

export async function exportSortieExcel(sortie: BonSortie): Promise<void> {
  const XLSX = await getXlsx();

  const rows = [
    ["BON DE SORTIE"],
    [],
    ["N°", sortie.number],
    ["Date", formatDate(sortie.date)],
    ["Destination", sortie.destination],
    ["Demandé par", sortie.requestedBy],
    ["Opérateur", sortie.operator],
    ["Statut", sortie.status === "valide" ? "Validé" : sortie.status === "annule" ? "Annulé" : "Brouillon"],
    sortie.notes ? ["Notes", sortie.notes] : [],
    [],
    ["Code", "Produit", "Qté demandée", "Qté livrée", "Unité"],
    ...sortie.items.map((item) => [
      item.productCode,
      item.productName,
      item.quantityRequested,
      item.quantityDelivered,
      item.unit,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bon de Sortie");
  XLSX.writeFile(wb, `${sortie.number}.xlsx`);
}

export async function exportInventaireExcel(inventory: Inventory): Promise<void> {
  const XLSX = await getXlsx();

  const rows = [
    ["RAPPORT D'INVENTAIRE"],
    [],
    ["Nom", inventory.name],
    ["Type", inventory.type === "annuel" ? "Annuel" : "Intermédiaire"],
    ["Date début", formatDate(inventory.startDate)],
    inventory.endDate ? ["Date fin", formatDate(inventory.endDate)] : [],
    ["Responsable", inventory.operator],
    ["Statut", inventory.status === "valide" ? "Validé" : inventory.status === "en_cours" ? "En cours" : "Terminé"],
    [],
    ["Code", "Produit", "Stock théorique", "Stock physique", "Écart", "Unité"],
    ...inventory.items.map((item) => [
      item.productCode,
      item.productName,
      item.theoreticalStock,
      item.physicalStock,
      item.difference,
      item.unit,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventaire");
  XLSX.writeFile(wb, `inventaire-${inventory.name.replace(/\s+/g, "-")}.xlsx`);
}

export async function exportMouvementsExcel(movements: StockMovement[]): Promise<void> {
  const XLSX = await getXlsx();

  const rows = [
    ["MOUVEMENTS DE STOCK"],
    [`Généré le : ${new Date().toLocaleDateString("fr-FR")}`],
    [],
    ["Date", "Type", "Produit", "Code", "Quantité", "Motif", "Référence", "Opérateur"],
    ...movements.map((m) => [
      formatDateTime(m.date),
      m.type === "entree" ? "Entrée" : "Sortie",
      m.productName,
      m.productCode,
      m.type === "entree" ? m.quantity : -m.quantity,
      m.reason,
      m.reference || "",
      m.operator,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mouvements");
  XLSX.writeFile(wb, `mouvements-stock.xlsx`);
}

// ==================== WORD EXPORT ====================

async function getDocx() {
  const docx = await import("docx");
  return docx;
}

function makeDocxTable(
  docx: Awaited<ReturnType<typeof getDocx>>,
  headers: string[],
  rows: (string | number)[][]
) {
  const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle } = docx;

  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })],
            }),
          ],
          shading: { fill: "2563EB" },
        })
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: String(cell) })],
                }),
              ],
            })
        ),
      })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

function infoLine(docx: Awaited<ReturnType<typeof getDocx>>, label: string, value: string) {
  const { Paragraph, TextRun } = docx;
  return new Paragraph({
    children: [
      new TextRun({ text: `${label} : `, bold: true }),
      new TextRun({ text: value }),
    ],
    spacing: { after: 80 },
  });
}

export async function exportReceptionWord(reception: BonReception): Promise<void> {
  const docx = await getDocx();
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

  const statusLabel =
    reception.status === "valide" ? "Validé" : reception.status === "annule" ? "Annulé" : "Brouillon";

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "BON DE RÉCEPTION",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          infoLine(docx, "N°", reception.number),
          infoLine(docx, "Date", formatDate(reception.date)),
          infoLine(docx, "Fournisseur", reception.supplier),
          infoLine(docx, "Opérateur", reception.operator),
          infoLine(docx, "Statut", statusLabel),
          ...(reception.notes ? [infoLine(docx, "Notes", reception.notes)] : []),
          new Paragraph({ text: "", spacing: { after: 200 } }),
          new Paragraph({
            children: [new TextRun({ text: "Détail des produits", bold: true, size: 24 })],
            spacing: { after: 150 },
          }),
          makeDocxTable(
            docx,
            ["Code", "Produit", "Qté commandée", "Qté reçue", "Unité"],
            reception.items.map((item) => [
              item.productCode,
              item.productName,
              item.quantityOrdered,
              item.quantityReceived,
              item.unit,
            ])
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${reception.number}.docx`);
}

export async function exportSortieWord(sortie: BonSortie): Promise<void> {
  const docx = await getDocx();
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

  const statusLabel =
    sortie.status === "valide" ? "Validé" : sortie.status === "annule" ? "Annulé" : "Brouillon";

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "BON DE SORTIE",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          infoLine(docx, "N°", sortie.number),
          infoLine(docx, "Date", formatDate(sortie.date)),
          infoLine(docx, "Destination", sortie.destination),
          infoLine(docx, "Demandé par", sortie.requestedBy),
          infoLine(docx, "Opérateur", sortie.operator),
          infoLine(docx, "Statut", statusLabel),
          ...(sortie.notes ? [infoLine(docx, "Notes", sortie.notes)] : []),
          new Paragraph({ text: "", spacing: { after: 200 } }),
          new Paragraph({
            children: [new TextRun({ text: "Détail des produits", bold: true, size: 24 })],
            spacing: { after: 150 },
          }),
          makeDocxTable(
            docx,
            ["Code", "Produit", "Qté demandée", "Qté livrée", "Unité"],
            sortie.items.map((item) => [
              item.productCode,
              item.productName,
              item.quantityRequested,
              item.quantityDelivered,
              item.unit,
            ])
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${sortie.number}.docx`);
}

export async function exportInventaireWord(inventory: Inventory): Promise<void> {
  const docx = await getDocx();
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

  const statusLabel =
    inventory.status === "valide" ? "Validé" : inventory.status === "en_cours" ? "En cours" : "Terminé";

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "RAPPORT D'INVENTAIRE",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          infoLine(docx, "Nom", inventory.name),
          infoLine(docx, "Type", inventory.type === "annuel" ? "Annuel" : "Intermédiaire"),
          infoLine(docx, "Date début", formatDate(inventory.startDate)),
          ...(inventory.endDate ? [infoLine(docx, "Date fin", formatDate(inventory.endDate))] : []),
          infoLine(docx, "Responsable", inventory.operator),
          infoLine(docx, "Statut", statusLabel),
          new Paragraph({ text: "", spacing: { after: 200 } }),
          new Paragraph({
            children: [new TextRun({ text: "Comptage des produits", bold: true, size: 24 })],
            spacing: { after: 150 },
          }),
          makeDocxTable(
            docx,
            ["Code", "Produit", "Stock théorique", "Stock physique", "Écart", "Unité"],
            inventory.items.map((item) => [
              item.productCode,
              item.productName,
              item.theoreticalStock,
              item.physicalStock,
              item.difference > 0 ? `+${item.difference}` : item.difference,
              item.unit,
            ])
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `inventaire-${inventory.name.replace(/\s+/g, "-")}.docx`);
}

export async function exportMouvementsWord(movements: StockMovement[]): Promise<void> {
  const docx = await getDocx();
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "MOUVEMENTS DE STOCK",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Généré le : ${new Date().toLocaleDateString("fr-FR")}` }),
            ],
            spacing: { after: 200 },
          }),
          makeDocxTable(
            docx,
            ["Date", "Type", "Produit", "Code", "Quantité", "Motif", "Opérateur"],
            movements.map((m) => [
              formatDateTime(m.date),
              m.type === "entree" ? "Entrée" : "Sortie",
              m.productName,
              m.productCode,
              m.type === "entree" ? `+${m.quantity}` : `-${m.quantity}`,
              m.reason,
              m.operator,
            ])
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `mouvements-stock.docx`);
}

// ==================== HELPERS ====================

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
