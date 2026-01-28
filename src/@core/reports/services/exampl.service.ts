import { Injectable } from '@nestjs/common'
import { SimpleDocumentBuilderService } from './component.service'
import { ThemeManagerService } from './theme.service'
import { UserStyleOverridesDto } from '../dto/report.-congi.dto'
import { DocumentConfig } from '../interfaces'
import { MODERN_THEME } from '../theme'

@Injectable()
export class DocumentExampleService {
  constructor(
    private readonly builder: SimpleDocumentBuilderService,
    private readonly themeManager: ThemeManagerService,
    //  private readonly htmlConverter: HtmlToDocxService,
  ) {}

  async generateFullDocumentWithOptions(
    dto?: UserStyleOverridesDto,
  ): Promise<Buffer> {
    const tinyPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
    const tinyPngBuffer = Buffer.from(tinyPngBase64, 'base64')
    const config: DocumentConfig = {
      title: 'Informe Corporativo Global 2025',
      margins: { top: 1000, bottom: 1000, left: 1200, right: 1200 },

      theme: MODERN_THEME,
      header: {
        columns: [
          {
            type: 'image',
            imageBuffer: tinyPngBuffer,
            imageWidth: 60,
            imageHeight: 60,
          },
          {
            type: 'text',
            content: 'Informe Corporativo Global 2025',
            formatting: { bold: true, color: '2F5496' },
          },
          { type: 'pageNumber' },
        ],
        alignment: ['left', 'center', 'right'],
      },

      footer: {
        columns: [
          { type: 'date' },
          {
            type: 'text',
            content: 'Uso interno – Confidencial',
            formatting: { italic: true, color: 'C00000' },
          },
          { type: 'pageNumber' },
        ],
        alignment: ['left', 'center', 'right'],
      },

      tableOfContents: { enabled: true, insertAtBeginning: true, maxLevel: 3 },

      sections: [
        // 📌 Portada
        { type: 'nextPageBreak' },
        {
          type: 'heading',
          content: { text: 'Informe Corporativo Global 2025', level: 1 },
        },
        { type: 'paragraph', content: { text: 'Compañía XYZ S.A.' } },
        {
          type: 'image',
          content: {
            buffer: Buffer.from('...'),
            width: 500,
            height: 300,
            caption: 'Portada del informe',
            captionPosition: 'below',
            alignment: 'center',
          },
        },
        { type: 'nextPageBreak' },

        // 📌 Tabla de contenidos
        { type: 'heading', content: { text: 'Contenido', level: 1 } },
        { type: 'tableOfContents', content: {} },
        { type: 'nextPageBreak' },

        // 📌 Resumen ejecutivo
        {
          type: 'heading',
          content: { text: '1. Resumen Ejecutivo', level: 1 },
        },
        {
          type: 'paragraph',
          content: {
            styledText: [
              { text: 'El año ', style: {} },
              { text: '2025', style: { bold: true, color: '2F5496' } },
              { text: ' marcó un hito en la historia de ', style: {} },
              { text: 'Compañía XYZ', style: { italic: true } },
              {
                text: ', alcanzando un crecimiento sostenido y consolidando su liderazgo en el mercado global.',
                style: {},
              },
            ],
          },
        },
        {
          type: 'list',
          content: {
            type: 'bullet',
            items: [
              { text: 'Crecimiento en ventas digitales (+35%)' },
              { text: 'Expansión en Asia y Latinoamérica' },
              { text: 'Avances en sostenibilidad e innovación' },
            ],
          },
        },
        { type: 'spacer', content: { height: 200 } },

        // 📌 Métricas Financieras
        {
          type: 'heading',
          content: { text: '2. Métricas Financieras', level: 1 },
        },
        {
          type: 'table',
          content: {
            headers: ['Indicador', '2024', '2025', 'Variación'],
            rows: [
              ['Ingresos', '$120M', '$146M', '+22%'],
              ['EBITDA', '$30M', '$39M', '+30%'],
              ['Beneficio Neto', '$18M', '$24M', '+33%'],
              ['Margen Bruto', '35%', '38%', '+3pp'],
              ['Flujo de Caja Libre', '$12M', '$20M', '+67%'],
            ],
          },
        },
        { type: 'nextPageBreak' },

        // 📌 Análisis por regiones
        {
          type: 'heading',
          content: { text: '3. Análisis por Regiones', level: 1 },
        },
        { type: 'heading', content: { text: '3.1 Norteamérica', level: 2 } },
        {
          type: 'paragraph',
          content: {
            text: 'Representa el 45% de los ingresos totales, con un crecimiento del 18% respecto al año anterior.',
          },
        },
        {
          type: 'image',
          content: {
            buffer: Buffer.from('...'),
            width: 450,
            height: 280,
            caption: 'Figura 1. Crecimiento en Norteamérica',
            alignment: 'center',
          },
        },
        { type: 'heading', content: { text: '3.2 Europa', level: 2 } },
        {
          type: 'paragraph',
          content: {
            text: 'Crecimiento sólido del 20%, especialmente en Alemania, Francia y España.',
          },
        },
        { type: 'heading', content: { text: '3.3 Asia', level: 2 } },
        {
          type: 'paragraph',
          content: {
            text: 'La región con mayor potencial, registrando un aumento del 40% en ingresos.',
          },
        },
        { type: 'nextPageBreak' },

        // 📌 Proyectos estratégicos
        {
          type: 'heading',
          content: { text: '4. Proyectos Estratégicos', level: 1 },
        },
        {
          type: 'list',
          content: {
            type: 'checklist',
            items: [
              {
                text: 'Implementación de inteligencia artificial en operaciones',
              },
              { text: 'Ampliación de la red de distribución en África' },
              { text: 'Lanzamiento de productos sustentables certificados' },
              { text: 'Digitalización completa de procesos internos' },
            ],
          },
        },
        { type: 'spacer', content: { height: 200 } },

        // 📌 Anexos con HTML enriquecido
        {
          type: 'heading',
          content: { text: 'Anexo A: Resultados de Encuestas', level: 1 },
        },
        {
          type: 'html',
          content: {
            html: `
        <p><b>Encuesta de satisfacción 2025</b></p>
        <p style="text-align:justify;">
          Se realizaron encuestas a más de <u>10.000 clientes</u> en todo el mundo.Los resultados muestran un incremento notable en la <i>satisfacción general</i>.
        </p>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse; width:100%;">
          <tr style="background:#2F5496; color:#FFFFFF;">
            <th>Aspecto</th><th>2024</th><th>2025</th><th>Variación</th>
          </tr>
          <tr><td>Calidad del producto</td><td>85%</td><td>91%</td><td>+6pp</td></tr>
          <tr><td>Tiempo de entrega</td><td>78%</td><td>88%</td><td>+10pp</td></tr>
          <tr><td>Atención al cliente</td><td>82%</td><td>90%</td><td>+8pp</td></tr>
          <tr><td>Precio percibido</td><td>75%</td><td>82%</td><td>+7pp</td></tr>
        </table>
        <p><i>Conclusión:</i> Los indicadores mejoraron en todas las áreas clave.</p>
        <ol>
          <li>Mejorar programas de fidelización</li>
          <li>Reducir tiempos de entrega</li>
          <li>Expandir centros de atención regionales</li>
        </ol>
      `,
          },
        },
      ],
    }

    return await this.builder.buildDocument(config)
  }
}
