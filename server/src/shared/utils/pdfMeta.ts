import type { PDFDocument } from "pdf-lib";

export async function copyPdfMetadata(source: PDFDocument, target: PDFDocument): Promise<void> {
  const title = source.getTitle();
  const author = source.getAuthor();
  const subject = source.getSubject();
  const keywords = source.getKeywords();
  const creator = source.getCreator();
  const producer = source.getProducer();
  const creationDate = source.getCreationDate();
  const modificationDate = source.getModificationDate();

  if (title) target.setTitle(title);
  if (author) target.setAuthor(author);
  if (subject) target.setSubject(subject);
  if (keywords) target.setKeywords(keywords.split(/,\s*/));
  if (creator) target.setCreator(creator);
  if (producer) target.setProducer(producer);
  if (creationDate) target.setCreationDate(creationDate);
  if (modificationDate) target.setModificationDate(modificationDate);
}
