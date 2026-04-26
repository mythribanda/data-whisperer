import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedFile {
  rows: Record<string, unknown>[];
  headers: string[];
  fileName: string;
  fileSize: number;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        delimiter: "",
        complete: (res) => {
          const headers = res.meta.fields ?? [];
          resolve({ rows: res.data, headers, fileName: file.name, fileSize: file.size });
        },
        error: reject,
      });
    });
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const headers = json.length ? Object.keys(json[0]) : [];
  return { rows: json, headers, fileName: file.name, fileSize: file.size };
}
