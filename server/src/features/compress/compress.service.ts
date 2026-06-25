import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import sharp from "sharp";
import { verifyFileContent } from "../../middleware/upload.js";
import { PdfProcessingError } from "../../shared/errors/AppError.js";
import { COMPRESSION_QUALITY, type CompressResult, type CompressionLevel } from "./compress.types.js";

const PDF_ONLY = new Set(["application/pdf"]);

async function reencodeJpeg(contents: Uint8Array, quality: number): Promise<Buffer> {
  return sharp(Buffer.from(contents)).jpeg({ quality }).toBuffer();
}

export async function compressPdf(
  buffer: Buffer,
  originalName: string,
  level: CompressionLevel
): Promise<CompressResult> {
  await verifyFileContent(buffer, PDF_ONLY, "PDF");

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(buffer, {
      ignoreEncryption: true,
    });
  } catch (error) {
    console.error("PDF load error:", error);

    throw new PdfProcessingError(
      error instanceof Error
        ? error.message
        : `"${originalName}" couldn't be read.`
    );
  }

  const quality = COMPRESSION_QUALITY[level];
  const context = doc.context;
  let imagesRecompressed = 0;

  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;

    const subtype = obj.dict.get(PDFName.of("Subtype"));
    if (!subtype || subtype.toString() !== "/Image") continue;

    const filter = obj.dict.get(PDFName.of("Filter"));
    if (!filter || filter.toString() !== "/DCTDecode") continue;

    // DCTDecode means the raw stream bytes ARE the JPEG — re-encode at the
    // target quality level and replace the object in the PDF context.
    let reencoded: Buffer;
    try {
      reencoded = await reencodeJpeg(obj.contents, quality);
    } catch {
      // If sharp can't decode this particular JPEG (malformed, CMYK, etc.),
      // skip it rather than aborting the whole job.
      continue;
    }

    const width = obj.dict.get(PDFName.of("Width"));
    const height = obj.dict.get(PDFName.of("Height"));
    const colorSpace = obj.dict.get(PDFName.of("ColorSpace"));
    const bitsPerComponent = obj.dict.get(PDFName.of("BitsPerComponent"));

    const newStream = context.stream(reencoded, {
      Type: "XObject",
      Subtype: "Image",
      Filter: "DCTDecode",
      ...(width !== undefined && { Width: width }),
      ...(height !== undefined && { Height: height }),
      ...(colorSpace !== undefined && { ColorSpace: colorSpace }),
      ...(bitsPerComponent !== undefined && { BitsPerComponent: bitsPerComponent }),
      Length: reencoded.length,
    });

    context.assign(ref, newStream);
    imagesRecompressed++;
  }

  // useObjectStreams packs multiple small PDF objects into compressed
  // object streams — typically a 10–20% size reduction on its own, even
  // when there are no JPEG images to recompress.
  const compressedBytes = await doc.save({ useObjectStreams: true });
  const compressedBuffer = Buffer.from(compressedBytes);

  return {
    buffer: compressedBuffer,
    originalSize: buffer.length,
    compressedSize: compressedBuffer.length,
    imagesRecompressed,
  };
}
