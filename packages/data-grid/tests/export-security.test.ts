import { describe, expect, it } from 'vitest';
import { exportToCsv } from '../src/ExportEngine';

function csvCellValue(csv: string, row: number, col: number): string {
  const line = csv.split('\n')[row];
  if (!line) return '';
  // Simple CSV field split (handles quoted fields)
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields[col] ?? '';
}

describe('CSV export security', () => {
  const columns = [{ key: 'data', title: 'Data' }];

  it('escapes =SUM(A:A) formula injection', () => {
    const csv = exportToCsv([{ data: '=SUM(A:A)' }], columns);
    const cell = csvCellValue(csv, 1, 0);
    expect(cell).toContain("'=");
    expect(cell).not.toBe('=SUM(A:A)');
  });

  it('escapes +cmd| formula injection', () => {
    const csv = exportToCsv([{ data: '+cmd|' }], columns);
    const cell = csvCellValue(csv, 1, 0);
    expect(cell.startsWith("'") || cell.startsWith("\"'")).toBe(true);
  });

  it('escapes -cmd| formula injection', () => {
    const csv = exportToCsv([{ data: '-cmd|' }], columns);
    const cell = csvCellValue(csv, 1, 0);
    expect(cell.startsWith("'") || cell.startsWith("\"'")).toBe(true);
  });

  it('does not modify normal values', () => {
    const csv = exportToCsv([{ data: 'Hello World' }], columns);
    const cell = csvCellValue(csv, 1, 0);
    expect(cell).toBe('Hello World');
  });

  it('properly quotes values with commas', () => {
    const csv = exportToCsv([{ data: 'one, two' }], columns);
    const cell = csvCellValue(csv, 1, 0);
    expect(cell).toBe('"one, two"');
  });
});
