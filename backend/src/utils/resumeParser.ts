import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

/**
 * Extracts plain text from an uploaded resume file so it can be fed to the
 * AI matcher. Supports PDF and DOCX well. Legacy .doc (pre-2007 binary
 * format) has no great free parser in Node — we attempt it via mammoth,
 * which sometimes partially works, but callers should treat a short/empty
 * result as "couldn't parse" rather than "resume is empty."
 */
export async function extractResumeText(filePath: string, mimetype: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);

  if (mimetype === "application/pdf") {
    const result = await pdfParse(buffer);
    return result.text.trim();
  }

  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (mimetype === "application/msword") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    } catch {
      return ""; // caller treats empty text as "skip AI matching"
    }
  }

  return "";
}
