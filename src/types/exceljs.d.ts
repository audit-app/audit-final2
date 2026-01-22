// src/@types/exceljs.d.ts
import 'exceljs' // Importante para que TS sepa que es una aumentación

declare module 'exceljs' {
  export interface Xlsx {
    load(
      data: Buffer | ArrayBuffer | Uint8Array,
      options?: any, // Usar 'any' aquí está bien para opciones genéricas
    ): Promise<Workbook>
  }
}
