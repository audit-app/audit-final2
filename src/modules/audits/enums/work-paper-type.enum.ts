/**
 * Tipo de papel de trabajo/evidencia
 */
export enum WorkPaperType {
  /**
   * Imagen (JPG, PNG, etc.)
   */
  IMAGE = 'IMAGE',

  /**
   * Documento (PDF, DOCX, TXT)
   */
  DOCUMENT = 'DOCUMENT',

  /**
   * Hoja de cálculo (XLSX, CSV)
   */
  SPREADSHEET = 'SPREADSHEET',

  /**
   * Video (MP4, AVI, etc.)
   */
  VIDEO = 'VIDEO',

  /**
   * Captura de pantalla
   */
  SCREENSHOT = 'SCREENSHOT',

  /**
   * Otro tipo de archivo
   */
  OTHER = 'OTHER',
}
