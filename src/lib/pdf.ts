import "server-only";

import PDFDocument from "pdfkit";

const ROW_HEIGHT = 20;

export async function tableToPdfBuffer(
  title: string,
  headers: string[],
  rows: unknown[][]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const bottom = doc.page.height - doc.page.margins.bottom;
    const colWidth = (right - left) / headers.length;

    doc.fontSize(14).font("Helvetica-Bold").text(title, left, doc.y);
    doc.moveDown(0.75);

    let y = doc.y;

    function drawRow(cells: string[], bold: boolean) {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8);
      cells.forEach((cell, i) => {
        doc.text(cell, left + i * colWidth, y, {
          width: colWidth - 6,
          ellipsis: true,
          lineBreak: false,
        });
      });
      y += ROW_HEIGHT;
    }

    drawRow(headers, true);
    doc
      .moveTo(left, y - 4)
      .lineTo(right, y - 4)
      .strokeColor("#c3c2b7")
      .lineWidth(0.5)
      .stroke();

    for (const row of rows) {
      if (y + ROW_HEIGHT > bottom) {
        doc.addPage();
        y = doc.page.margins.top;
        drawRow(headers, true);
      }
      drawRow(
        row.map((cell) => (cell == null ? "" : String(cell))),
        false
      );
    }

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
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const total = receipt.amount + receipt.lateFee;
    const money = (n: number) => `$${n.toLocaleString("es-CO")}`;

    doc.fontSize(18).font("Helvetica-Bold").text("Transportes AP", left, doc.y);
    doc.fontSize(11).font("Helvetica").fillColor("#52514e").text("Comprobante de pago");
    doc.moveDown(1.5);

    doc
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .strokeColor("#c3c2b7")
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(1);

    doc.fillColor("#1a1a1a").fontSize(11).font("Helvetica-Bold").text("Alumno: ", left, doc.y, { continued: true });
    doc.font("Helvetica").text(receipt.studentName);
    doc.font("Helvetica-Bold").text("Padre/madre: ", left, doc.y, { continued: true });
    doc.font("Helvetica").text(receipt.parentName);
    doc.font("Helvetica-Bold").text("Periodo: ", left, doc.y, { continued: true });
    doc.font("Helvetica").text(receipt.period);
    doc.font("Helvetica-Bold").text("Fecha de pago: ", left, doc.y, { continued: true });
    doc.font("Helvetica").text(receipt.paidAt ? new Date(receipt.paidAt).toLocaleString("es-CO") : "—");
    doc.moveDown(1.5);

    doc.font("Helvetica").text("Valor de la ruta:", left, doc.y, { continued: true });
    doc.text(money(receipt.amount), { align: "right" });
    if (receipt.lateFee > 0) {
      doc.text("Recargo por mora:", left, doc.y, { continued: true });
      doc.text(money(receipt.lateFee), { align: "right" });
    }
    doc.moveDown(0.5);
    doc
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .strokeColor("#c3c2b7")
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(13).text("Total pagado:", left, doc.y, { continued: true });
    doc.text(money(total), { align: "right" });

    doc.moveDown(3);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#898781")
      .text("Este comprobante es generado automáticamente por la plataforma de Transportes AP.", left, doc.y);

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
