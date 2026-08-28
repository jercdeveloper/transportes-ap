import "server-only";

import fs from "fs";
import PDFDocument from "pdfkit";
import { HELVETICA_AFM, HELVETICA_BOLD_AFM } from "./pdfkit-fonts";

// pdfkit carga sus fuentes estándar con fs.readFileSync(__dirname +
// "/data/<Fuente>.afm") en tiempo de ejecución en vez de un require()
// estático, así que el tracer de archivos de Vercel no detecta esa
// dependencia — el build queda "listo" pero cualquier PDF responde 500
// ("ENOENT ... pdfkit/js/data/Helvetica.afm") apenas alguien lo genera.
// outputFileTracingIncludes tampoco lo resolvió de forma confiable. Como
// solo usamos Helvetica y Helvetica-Bold, se intercepta esa lectura puntual
// y se devuelve el contenido ya incrustado (pdfkit-fonts.ts) — así el PDF
// nunca depende de que esos archivos existan en el sistema de archivos.
const originalReadFileSync = fs.readFileSync;
let fontPatchApplied = false;
function ensurePdfkitFontPatch() {
  if (fontPatchApplied) return;
  fontPatchApplied = true;

  fs.readFileSync = new Proxy(originalReadFileSync, {
    apply(target, thisArg, args: [fs.PathOrFileDescriptor, ...unknown[]]) {
      const filePath = args[0];
      if (typeof filePath === "string") {
        if (filePath.endsWith("/data/Helvetica.afm")) return HELVETICA_AFM;
        if (filePath.endsWith("/data/Helvetica-Bold.afm")) return HELVETICA_BOLD_AFM;
      }
      return Reflect.apply(target, thisArg, args);
    },
  });
}

// Paleta de marca (coincide con el índigo usado en la app).
const BRAND = "#4338ca";
const BRAND_LIGHT = "#eef0fb";
const INK = "#1f2937";
const INK_MUTED = "#6b7280";
const BORDER = "#e2e4f0";
const STRIPE = "#f7f7fc";
const SUCCESS = "#059669";
const SUCCESS_LIGHT = "#e8f7f1";

const HEADER_BAND_HEIGHT = 52;
const ROW_HEIGHT = 22;

function formatGeneratedAt() {
  return new Date().toLocaleString("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

// Franja superior con la marca — igual en todas las páginas del documento.
function drawBrandBand(
  doc: PDFKit.PDFDocument,
  pageWidth: number,
  title: string
) {
  doc.rect(0, 0, pageWidth, HEADER_BAND_HEIGHT).fill(BRAND);
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Transportes AP", doc.page.margins.left, 16, { lineBreak: false });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#d9d6fb")
    .text(title, doc.page.margins.left, 34, { lineBreak: false });
}

// Numeración y nota de pie — se agrega al final, una vez pdfkit conoce el
// total real de páginas (bufferPages + bufferedPageRange).
//
// El pie se dibuja dentro del margen inferior a propósito (para que quede
// pegado al borde de la página). pdfkit calcula el límite de "desborde" de
// cualquier .text() como page.height - margins.bottom, así que escribir ahí
// dispara su paginado automático y agrega una página en blanco de más. El
// arreglo estándar es poner el margen inferior en 0 mientras se dibuja el
// pie, y restaurarlo después.
function drawFooters(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  const generatedAt = formatGeneratedAt();

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const originalBottomMargin = doc.page.margins.bottom;
    const y = doc.page.height - originalBottomMargin + 12;

    doc.moveTo(left, y - 8).lineTo(right, y - 8).strokeColor(BORDER).lineWidth(0.5).stroke();

    doc.page.margins.bottom = 0;
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(INK_MUTED)
      .text(`Generado el ${generatedAt}`, left, y, { lineBreak: false })
      .text(`Página ${i - range.start + 1} de ${range.count}`, left, y, {
        width: right - left,
        align: "right",
        lineBreak: false,
      });
    doc.page.margins.bottom = originalBottomMargin;
  }
}

export async function tableToPdfBuffer(
  title: string,
  headers: string[],
  rows: unknown[][]
): Promise<Buffer> {
  ensurePdfkitFontPatch();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      layout: "landscape",
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const bottom = doc.page.height - doc.page.margins.bottom;
    const colWidth = (right - left) / headers.length;

    function drawHeaderRow(y: number) {
      doc.rect(left, y, right - left, ROW_HEIGHT).fill(BRAND_LIGHT);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND);
      headers.forEach((cell, i) => {
        doc.text(cell, left + i * colWidth + 6, y + 6, {
          width: colWidth - 10,
          ellipsis: true,
          lineBreak: false,
        });
      });
      return y + ROW_HEIGHT;
    }

    function drawDataRow(cells: string[], y: number, striped: boolean) {
      if (striped) doc.rect(left, y, right - left, ROW_HEIGHT).fill(STRIPE);
      doc.font("Helvetica").fontSize(8.5).fillColor(INK);
      cells.forEach((cell, i) => {
        doc.text(cell, left + i * colWidth + 6, y + 6, {
          width: colWidth - 10,
          ellipsis: true,
          lineBreak: false,
        });
      });
      doc
        .moveTo(left, y + ROW_HEIGHT)
        .lineTo(right, y + ROW_HEIGHT)
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();
      return y + ROW_HEIGHT;
    }

    function startPage() {
      drawBrandBand(doc, doc.page.width, title);
      return drawHeaderRow(HEADER_BAND_HEIGHT + 14);
    }

    let y = startPage();

    rows.forEach((row, idx) => {
      if (y + ROW_HEIGHT > bottom) {
        doc.addPage();
        y = startPage();
      }
      y = drawDataRow(
        row.map((cell) => (cell == null ? "" : String(cell))),
        y,
        idx % 2 === 1
      );
    });

    if (rows.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(INK_MUTED)
        .text("No hay datos para este periodo.", left, y + 10);
    }

    drawFooters(doc);
    doc.end();
  });
}

export async function receiptToPdfBuffer(receipt: {
  studentName: string;
  parentName: string;
  period: string;
  amount: number;
  lateFee: number;
  paidAt: string | null;
}): Promise<Buffer> {
  ensurePdfkitFontPatch();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;
    const total = receipt.amount + receipt.lateFee;
    const money = (n: number) => `$${n.toLocaleString("es-CO")}`;

    drawBrandBand(doc, doc.page.width, "Comprobante de pago");

    // Insignia "PAGADO".
    const badgeWidth = 70;
    doc
      .roundedRect(right - badgeWidth, HEADER_BAND_HEIGHT + 16, badgeWidth, 20, 10)
      .fill(SUCCESS_LIGHT);
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(SUCCESS)
      .text("PAGADO", right - badgeWidth, HEADER_BAND_HEIGHT + 22, {
        width: badgeWidth,
        align: "center",
        lineBreak: false,
      });

    let y = HEADER_BAND_HEIGHT + 55;

    function field(label: string, value: string) {
      doc.font("Helvetica").fontSize(8.5).fillColor(INK_MUTED).text(label, left, y, {
        lineBreak: false,
      });
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(INK)
        .text(value, left, y + 12, { lineBreak: false });
      y += 38;
    }

    field("Alumno", receipt.studentName);
    field("Padre / madre", receipt.parentName);
    field("Periodo", receipt.period);
    field(
      "Fecha de pago",
      receipt.paidAt ? new Date(receipt.paidAt).toLocaleString("es-CO") : "—"
    );

    y += 8;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(BORDER).lineWidth(0.5).stroke();
    y += 16;

    doc.font("Helvetica").fontSize(10).fillColor(INK);
    doc.text("Valor de la ruta", left, y, { lineBreak: false });
    doc.text(money(receipt.amount), left, y, { width: contentWidth, align: "right", lineBreak: false });
    y += 18;

    if (receipt.lateFee > 0) {
      doc.text("Recargo por mora", left, y, { lineBreak: false });
      doc.text(money(receipt.lateFee), left, y, {
        width: contentWidth,
        align: "right",
        lineBreak: false,
      });
      y += 18;
    }

    y += 6;
    doc.roundedRect(left, y, contentWidth, 40, 6).fill(BRAND_LIGHT);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(BRAND)
      .text("Total pagado", left + 14, y + 13, { lineBreak: false });
    doc
      .fontSize(15)
      .text(money(total), left, y + 10, {
        width: contentWidth - 14,
        align: "right",
        lineBreak: false,
      });

    y += 65;
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(INK_MUTED)
      .text(
        "Este comprobante es generado automáticamente por la plataforma de Transportes AP.",
        left,
        y,
        { width: contentWidth }
      );

    drawFooters(doc);
    doc.end();
  });
}

export function pdfResponse(filename: string, buffer: Buffer) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
