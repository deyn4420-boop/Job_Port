import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

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
      return "";
    }
  }

  return "";
}
