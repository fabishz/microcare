import PDFDocument from 'pdfkit';
import { JournalEntry } from '../types/index.js';

export interface ExportResult {
  filename: string;
  contentType: string;
  data: Buffer;
}

function formatDate(date: Date): string {
  return new Date(date).toISOString().split('T')[0];
}

export async function exportAsJson(entries: JournalEntry[]): Promise<ExportResult> {
  const data = Buffer.from(JSON.stringify(entries, null, 2), 'utf8');
  return {
    filename: `microcare-entries-${formatDate(new Date())}.json`,
    contentType: 'application/json',
    data,
  };
}

export async function exportAsTxt(entries: JournalEntry[]): Promise<ExportResult> {
  const text = entries
    .map((entry) => {
      return [
        `Date: ${new Date(entry.createdAt).toLocaleString()}`,
        `Title: ${entry.title}`,
        entry.mood ? `Mood: ${entry.mood}` : undefined,
        entry.tags && entry.tags.length > 0 ? `Tags: ${entry.tags.join(', ')}` : undefined,
        '',
        entry.content,
        '',
        '---',
        '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return {
    filename: `microcare-entries-${formatDate(new Date())}.txt`,
    contentType: 'text/plain',
    data: Buffer.from(text, 'utf8'),
  };
}

export async function exportAsPdf(entries: JournalEntry[]): Promise<ExportResult> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(20).text('MicroCare Journal Export', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('gray').text(`Generated: ${new Date().toLocaleString()}`, {
    align: 'center',
  });
  doc.moveDown(1.5);

  entries.forEach((entry, index) => {
    doc.fillColor('black').fontSize(14).text(entry.title || 'Untitled Entry');
    doc.moveDown(0.25);
    doc.fontSize(10).fillColor('gray').text(
      `${new Date(entry.createdAt).toLocaleString()}${entry.mood ? ` • Mood: ${entry.mood}` : ''}`
    );
    if (entry.tags && entry.tags.length > 0) {
      doc.fontSize(10).text(`Tags: ${entry.tags.join(', ')}`);
    }
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('black').text(entry.content, {
      align: 'left',
    });

    if (index < entries.length - 1) {
      doc.moveDown(1);
      doc.moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor('#e5e7eb')
        .stroke();
      doc.moveDown(1);
    }
  });

  doc.end();

  const data = await new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));
  });

  return {
    filename: `microcare-entries-${formatDate(new Date())}.pdf`,
    contentType: 'application/pdf',
    data,
  };
}
