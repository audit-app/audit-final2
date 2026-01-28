import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SimpleDocumentBuilderService } from './component.service'
import { ThemeManagerService } from './theme.service'
import { UserStyleOverridesDto } from '../dto/report-config.dto'
import { DocumentConfig, DocumentSection } from '../interfaces'
import { MODERN_THEME } from '../theme'
import { TemplateEntity } from '../../../modules/audit-library/templates/entities/template.entity'
import { StandardEntity } from '../../../modules/audit-library/standards/entities/standard.entity'

@Injectable()
export class ReportsService {
  constructor(
    private readonly builder: SimpleDocumentBuilderService,
    private readonly themeManager: ThemeManagerService,
    @InjectRepository(TemplateEntity)
    private readonly templateRepository: Repository<TemplateEntity>,
    @InjectRepository(StandardEntity)
    private readonly standardRepository: Repository<StandardEntity>,
    //  private readonly htmlConverter: HtmlToDocxService,
  ) {}

  async generateFullDocumentWithOptions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dto?: UserStyleOverridesDto,
  ): Promise<Buffer> {
    // TODO: Implementar uso de dto para personalizar el documento
    const tinyPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
    const tinyPngBuffer = Buffer.from(tinyPngBase64, 'base64')

    const sections: DocumentSection[] = []

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📌 PORTADA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    sections.push(
      { type: 'nextPageBreak' },
      {
        type: 'heading',
        content: {
          text: 'Reporte de Ejemplo - Sistema de Auditoría ATR',
          level: 1,
        },
      },
      {
        type: 'paragraph',
        content: {
          styledText: [
            { text: 'Generado por: ', style: { bold: true } },
            { text: 'ATR - Audit Template Repository', style: {} },
          ],
        },
      },
      {
        type: 'paragraph',
        content: {
          styledText: [
            { text: 'Fecha: ', style: { bold: true } },
            { text: new Date().toLocaleDateString('es-ES'), style: {} },
          ],
        },
      },
      {
        type: 'paragraph',
        content: {
          text: 'Este documento muestra ejemplos de todas las capacidades del sistema de generación de reportes, incluyendo templates, standards, controles, niveles de madurez y más.',
        },
      },
      { type: 'nextPageBreak' },
    )

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📌 TABLA DE CONTENIDOS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    sections.push(
      {
        type: 'heading',
        content: { text: 'Tabla de Contenidos', level: 1 },
        includeInTOC: false, // No incluir este heading en el TOC
      },
      {
        type: 'tableOfContents',
        content: {
          maxLevel: 3, // Incluir headings de nivel 1, 2 y 3
          includePageNumbers: true, // Mostrar números de página
        },
      },
      { type: 'nextPageBreak' },
    )

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📌 1. TEMPLATES DE AUDITORÍA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    sections.push(
      {
        type: 'heading',
        content: { text: '1. Templates de Auditoría', level: 1 },
      },
      {
        type: 'paragraph',
        content: {
          text: 'Los templates son plantillas que definen la estructura de las auditorías. Cada template puede tener múltiples standards organizados jerárquicamente.',
        },
      },
      { type: 'spacer', content: { height: 200 } },
    )

    // Ejemplo: Template ISO 27001:2022
    sections.push(
      {
        type: 'heading',
        content: { text: '1.1 Template: ISO 27001:2022', level: 2 },
      },
      {
        type: 'table',
        content: {
          headers: ['Propiedad', 'Valor'],
          rows: [
            ['Código', 'ISO-27001-2022'],
            ['Nombre', 'ISO/IEC 27001:2022 - Seguridad de la Información'],
            ['Versión', '2022.1'],
            ['Estado', 'PUBLISHED'],
            [
              'Descripción',
              'Estándar internacional para sistemas de gestión de seguridad de la información (SGSI)',
            ],
            ['Total de Standards', '114'],
            ['Controles Auditables', '93'],
            ['Creado por', 'admin@atr.com'],
            ['Fecha Creación', '2025-01-15'],
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
    )

    // Ejemplo: Template COBIT 2019
    sections.push(
      {
        type: 'heading',
        content: { text: '1.2 Template: COBIT 2019', level: 2 },
      },
      {
        type: 'table',
        content: {
          headers: ['Propiedad', 'Valor'],
          rows: [
            ['Código', 'COBIT-2019'],
            ['Nombre', 'COBIT 2019 - Gobierno y Gestión de TI Empresarial'],
            ['Versión', '2019.2'],
            ['Estado', 'PUBLISHED'],
            [
              'Descripción',
              'Framework para el gobierno y la gestión de la información y tecnología de las empresas',
            ],
            ['Total de Standards', '40'],
            ['Controles Auditables', '40'],
            ['Creado por', 'admin@atr.com'],
            ['Fecha Creación', '2025-01-10'],
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
    )

    // Tabla resumen de templates
    sections.push(
      {
        type: 'heading',
        content: { text: '1.3 Resumen de Templates', level: 2 },
      },
      {
        type: 'table',
        content: {
          headers: [
            'Código',
            'Nombre',
            'Versión',
            'Estado',
            'Standards',
            'Auditables',
          ],
          rows: [
            [
              'ISO-27001-2022',
              'ISO 27001:2022',
              '2022.1',
              'PUBLISHED',
              '114',
              '93',
            ],
            ['COBIT-2019', 'COBIT 2019', '2019.2', 'PUBLISHED', '40', '40'],
            [
              'NIST-CSF-1.1',
              'NIST CSF v1.1',
              '1.1.0',
              'PUBLISHED',
              '108',
              '98',
            ],
            ['PCI-DSS-4.0', 'PCI-DSS v4.0', '4.0.0', 'DRAFT', '12', '12'],
            ['SOC2-2023', 'SOC 2 Type II', '2023.1', 'ARCHIVED', '64', '64'],
          ],
        },
      },
      { type: 'nextPageBreak' },
    )

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📌 2. ESTRUCTURA JERÁRQUICA DE STANDARDS (ISO 27001)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    sections.push(
      {
        type: 'heading',
        content: {
          text: '2. Estructura de Standards - ISO 27001:2022',
          level: 1,
        },
      },
      {
        type: 'paragraph',
        content: {
          text: 'Los standards se organizan jerárquicamente formando un árbol de controles. A continuación se muestra un ejemplo de la estructura de ISO 27001.',
        },
      },
      { type: 'spacer', content: { height: 200 } },
    )

    // Anexo A.5 - Políticas de seguridad de la información
    sections.push(
      {
        type: 'heading',
        content: {
          text: 'A.5 Políticas de seguridad de la información',
          level: 2,
        },
      },
      {
        type: 'paragraph',
        content: {
          text: 'Establecer la dirección de gestión y el apoyo para la seguridad de la información de acuerdo con los requisitos del negocio.',
        },
      },
      {
        type: 'table',
        content: {
          headers: ['Propiedad', 'Valor'],
          rows: [
            ['Código', 'A.5'],
            ['Nivel', '1'],
            ['Auditable', 'No'],
            ['Orden', '1'],
            ['Total de Controles Hijos', '2'],
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
    )

    // A.5.1 - Directrices de la dirección para la seguridad de la información
    sections.push(
      {
        type: 'heading',
        content: {
          text: 'A.5.1 Directrices de la dirección para la seguridad de la información',
          level: 3,
        },
      },
      {
        type: 'paragraph',
        content: {
          text: 'La dirección debe establecer, aprobar, publicar y comunicar las políticas de seguridad de la información.',
        },
      },
      {
        type: 'table',
        content: {
          headers: ['Propiedad', 'Valor'],
          rows: [
            ['Código', 'A.5.1'],
            ['Nivel', '2'],
            ['Auditable', 'Sí'],
            ['Orden', '1'],
            ['Padre', 'A.5'],
          ],
        },
      },
      {
        type: 'list',
        content: {
          type: 'checklist',
          items: [
            { text: 'Definir objetivos de seguridad de la información' },
            { text: 'Establecer responsabilidades y procedimientos' },
            { text: 'Comunicar políticas a todo el personal' },
            { text: 'Revisar y actualizar periódicamente' },
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
    )

    // A.5.2 - Revisión de las políticas de seguridad de la información
    sections.push(
      {
        type: 'heading',
        content: {
          text: 'A.5.2 Revisión de las políticas de seguridad de la información',
          level: 3,
        },
      },
      {
        type: 'paragraph',
        content: {
          text: 'Las políticas de seguridad de la información deben revisarse a intervalos planificados o cuando ocurran cambios significativos.',
        },
      },
      {
        type: 'table',
        content: {
          headers: ['Propiedad', 'Valor'],
          rows: [
            ['Código', 'A.5.2'],
            ['Nivel', '2'],
            ['Auditable', 'Sí'],
            ['Orden', '2'],
            ['Padre', 'A.5'],
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
    )

    // A.8 - Gestión de activos
    sections.push(
      {
        type: 'heading',
        content: { text: 'A.8 Gestión de activos', level: 2 },
      },
      {
        type: 'paragraph',
        content: {
          text: 'Identificar los activos de la organización y definir responsabilidades de protección apropiadas.',
        },
      },
      {
        type: 'table',
        content: {
          headers: ['Propiedad', 'Valor'],
          rows: [
            ['Código', 'A.8'],
            ['Nivel', '1'],
            ['Auditable', 'No'],
            ['Orden', '4'],
            ['Total de Controles Hijos', '10'],
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
    )

    // A.8.1 - Responsabilidad sobre los activos
    sections.push(
      {
        type: 'heading',
        content: { text: 'A.8.1 Responsabilidad sobre los activos', level: 3 },
      },
      {
        type: 'paragraph',
        content: {
          text: 'Los activos asociados con la información y las instalaciones de procesamiento de información deben ser identificados y un inventario de estos activos debe ser elaborado y mantenido.',
        },
      },
      {
        type: 'table',
        content: {
          headers: ['Propiedad', 'Valor'],
          rows: [
            ['Código', 'A.8.1'],
            ['Nivel', '2'],
            ['Auditable', 'Sí'],
            ['Orden', '1'],
            ['Padre', 'A.8'],
          ],
        },
      },
      { type: 'nextPageBreak' },
    )

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📌 3. CONTROLES AUDITABLES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    sections.push(
      {
        type: 'heading',
        content: { text: '3. Controles Auditables', level: 1 },
      },
      {
        type: 'paragraph',
        content: {
          text: 'Los controles auditables son aquellos standards marcados como "isAuditable: true". Estos controles son los que se evalúan durante una auditoría.',
        },
      },
      { type: 'spacer', content: { height: 200 } },
      {
        type: 'table',
        content: {
          headers: ['Código', 'Título', 'Nivel', 'Template', 'Descripción'],
          rows: [
            [
              'A.5.1',
              'Directrices de la dirección',
              '2',
              'ISO 27001:2022',
              'Establecer y comunicar políticas de seguridad',
            ],
            [
              'A.5.2',
              'Revisión de políticas',
              '2',
              'ISO 27001:2022',
              'Revisar políticas periódicamente',
            ],
            [
              'A.8.1',
              'Inventario de activos',
              '2',
              'ISO 27001:2022',
              'Identificar y mantener inventario de activos',
            ],
            [
              'A.8.2',
              'Propiedad de activos',
              '2',
              'ISO 27001:2022',
              'Asignar propietarios a cada activo',
            ],
            [
              'A.8.3',
              'Uso aceptable de activos',
              '2',
              'ISO 27001:2022',
              'Definir reglas de uso de activos',
            ],
            [
              'A.9.1',
              'Requisitos de negocio',
              '2',
              'ISO 27001:2022',
              'Política de control de acceso',
            ],
            [
              'APO01',
              'Gestionar el marco de TI',
              '1',
              'COBIT 2019',
              'Establecer y mantener el marco de gobernanza',
            ],
            [
              'DSS05',
              'Gestionar servicios de seguridad',
              '1',
              'COBIT 2019',
              'Proteger información contra uso no autorizado',
            ],
          ],
        },
      },
      { type: 'nextPageBreak' },
    )

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📌 4. FRAMEWORKS DE MADUREZ
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    sections.push(
      {
        type: 'heading',
        content: { text: '4. Frameworks de Madurez', level: 1 },
      },
      {
        type: 'paragraph',
        content: {
          text: 'Los frameworks de madurez permiten evaluar el nivel de implementación de los controles. El sistema soporta múltiples frameworks como COBIT 5, CMMI, etc.',
        },
      },
      { type: 'spacer', content: { height: 200 } },
    )

    // Framework COBIT 5
    sections.push(
      {
        type: 'heading',
        content: { text: '4.1 Framework: COBIT 5', level: 2 },
      },
      {
        type: 'table',
        content: {
          headers: ['Propiedad', 'Valor'],
          rows: [
            ['Código', 'cobit5'],
            ['Nombre', 'COBIT 5'],
            [
              'Descripción',
              'Control Objectives for Information and Related Technology v5',
            ],
            ['Rango de Niveles', '0 - 5'],
            ['Total de Niveles', '6'],
            ['Estado', 'Activo'],
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
      {
        type: 'heading',
        content: { text: '4.1.1 Niveles de Madurez COBIT 5', level: 3 },
      },
      {
        type: 'table',
        content: {
          headers: ['Nivel', 'Nombre', 'Nombre Corto', 'Descripción', 'Color'],
          rows: [
            [
              '0',
              'Inexistente',
              'N/A',
              'Los procesos no están implementados',
              '#DC3545',
            ],
            [
              '1',
              'Inicial / Ad Hoc',
              'Inicial',
              'Procesos implementados de forma ad hoc y desorganizada',
              '#FD7E14',
            ],
            [
              '2',
              'Repetible',
              'Rep.',
              'Procesos siguen un patrón regular pero no están documentados',
              '#FFC107',
            ],
            [
              '3',
              'Definido',
              'Def.',
              'Procesos están documentados y estandarizados',
              '#17A2B8',
            ],
            [
              '4',
              'Administrado',
              'Adm.',
              'Procesos están medidos y controlados',
              '#28A745',
            ],
            [
              '5',
              'Optimizado',
              'Opt.',
              'Procesos están optimizados mediante mejora continua',
              '#007BFF',
            ],
          ],
        },
      },
      { type: 'spacer', content: { height: 400 } },
    )

    // Framework CMMI
    sections.push(
      {
        type: 'heading',
        content: { text: '4.2 Framework: CMMI v2.0', level: 2 },
      },
      {
        type: 'table',
        content: {
          headers: ['Propiedad', 'Valor'],
          rows: [
            ['Código', 'cmmi'],
            ['Nombre', 'CMMI v2.0'],
            ['Descripción', 'Capability Maturity Model Integration v2.0'],
            ['Rango de Niveles', '1 - 5'],
            ['Total de Niveles', '5'],
            ['Estado', 'Activo'],
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
      {
        type: 'heading',
        content: { text: '4.2.1 Niveles de Madurez CMMI', level: 3 },
      },
      {
        type: 'table',
        content: {
          headers: ['Nivel', 'Nombre', 'Descripción', 'Color'],
          rows: [
            [
              '1',
              'Inicial',
              'Procesos impredecibles, poco controlados',
              '#DC3545',
            ],
            [
              '2',
              'Gestionado',
              'Procesos caracterizados para proyectos',
              '#FFC107',
            ],
            [
              '3',
              'Definido',
              'Procesos caracterizados para la organización',
              '#17A2B8',
            ],
            [
              '4',
              'Gestionado Cuantitativamente',
              'Procesos medidos y controlados',
              '#28A745',
            ],
            [
              '5',
              'En Optimización',
              'Foco en mejora continua de procesos',
              '#007BFF',
            ],
          ],
        },
      },
      { type: 'nextPageBreak' },
    )

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📌 5. ORGANIZACIONES Y USUARIOS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    sections.push(
      {
        type: 'heading',
        content: { text: '5. Organizaciones y Usuarios', level: 1 },
      },
      {
        type: 'paragraph',
        content: {
          text: 'El sistema gestiona múltiples organizaciones, cada una con sus propios usuarios y roles.',
        },
      },
      { type: 'spacer', content: { height: 200 } },
      { type: 'heading', content: { text: '5.1 Organizaciones', level: 2 } },
      {
        type: 'table',
        content: {
          headers: [
            'NIT',
            'Nombre',
            'Teléfono',
            'Email',
            'Estado',
            'Total Usuarios',
          ],
          rows: [
            [
              '1234567890',
              'TechCorp Bolivia S.A.',
              '+591-2-2123456',
              'info@techcorp.bo',
              'Activo',
              '45',
            ],
            [
              '9876543210',
              'Consultores Asociados',
              '+591-3-3456789',
              'contacto@consultores.bo',
              'Activo',
              '12',
            ],
            [
              '5555555555',
              'Banco Nacional',
              '+591-2-2987654',
              'auditoria@banconacional.bo',
              'Activo',
              '89',
            ],
            [
              '7777777777',
              'Empresa Pública XYZ',
              '+591-4-4123456',
              'sistemas@epxyz.gob.bo',
              'Inactivo',
              '23',
            ],
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
      {
        type: 'heading',
        content: { text: '5.2 Usuarios del Sistema', level: 2 },
      },
      {
        type: 'table',
        content: {
          headers: [
            'Usuario',
            'Nombre Completo',
            'Email',
            'Roles',
            'Organización',
            'Estado',
          ],
          rows: [
            [
              'jperez',
              'Juan Pérez García',
              'jperez@techcorp.bo',
              'ADMIN, AUDITOR',
              'TechCorp Bolivia',
              'Activo',
            ],
            [
              'mlopez',
              'María López Silva',
              'mlopez@techcorp.bo',
              'GERENTE',
              'TechCorp Bolivia',
              'Activo',
            ],
            [
              'rgarcia',
              'Roberto García Mendoza',
              'rgarcia@consultores.bo',
              'AUDITOR',
              'Consultores Asociados',
              'Activo',
            ],
            [
              'asanchez',
              'Ana Sánchez Torres',
              'asanchez@banconacional.bo',
              'CLIENTE',
              'Banco Nacional',
              'Activo',
            ],
            [
              'cmartinez',
              'Carlos Martínez Ruiz',
              'cmartinez@epxyz.gob.bo',
              'AUDITOR, GERENTE',
              'Empresa Pública XYZ',
              'Inactivo',
            ],
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
      { type: 'heading', content: { text: '5.3 Roles y Permisos', level: 2 } },
      {
        type: 'paragraph',
        content: {
          text: 'El sistema implementa control de acceso basado en roles (RBAC) usando Casbin:',
        },
      },
      {
        type: 'list',
        content: {
          type: 'bullet',
          items: [
            {
              text: 'ADMIN - Administrador con acceso completo al sistema',
            },
            {
              text: 'GERENTE - Gestión de templates, auditorías y reportes',
            },
            {
              text: 'AUDITOR - Ejecución de auditorías y evaluación de controles',
            },
            {
              text: 'CLIENTE - Visualización de reportes y resultados',
            },
          ],
        },
      },
      { type: 'nextPageBreak' },
    )

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📌 6. REGISTRO DE AUDITORÍA (AUDIT LOG)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    sections.push(
      {
        type: 'heading',
        content: { text: '6. Registro de Auditoría', level: 1 },
      },
      {
        type: 'paragraph',
        content: {
          text: 'El sistema registra automáticamente todos los cambios realizados en templates y standards, incluyendo quién realizó el cambio, cuándo y qué fue modificado.',
        },
      },
      { type: 'spacer', content: { height: 200 } },
      {
        type: 'table',
        content: {
          headers: [
            'Fecha/Hora',
            'Usuario',
            'Acción',
            'Entidad',
            'Campo Modificado',
            'Valor Anterior',
            'Valor Nuevo',
          ],
          rows: [
            [
              '2025-01-28 10:15:32',
              'jperez@techcorp.bo',
              'CREATE',
              'Template',
              '-',
              '-',
              'ISO 27001:2022',
            ],
            [
              '2025-01-28 10:20:45',
              'jperez@techcorp.bo',
              'CREATE',
              'Standard',
              '-',
              '-',
              'A.5 Políticas',
            ],
            [
              '2025-01-28 11:30:12',
              'mlopez@techcorp.bo',
              'UPDATE',
              'Standard',
              'title',
              'Políticas',
              'Políticas de seguridad',
            ],
            [
              '2025-01-28 14:22:08',
              'jperez@techcorp.bo',
              'PUBLISH',
              'Template',
              'status',
              'DRAFT',
              'PUBLISHED',
            ],
            [
              '2025-01-28 16:45:33',
              'rgarcia@consultores.bo',
              'UPDATE',
              'Standard',
              'isAuditable',
              'false',
              'true',
            ],
            [
              '2025-01-27 09:10:22',
              'mlopez@techcorp.bo',
              'ARCHIVE',
              'Template',
              'status',
              'PUBLISHED',
              'ARCHIVED',
            ],
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
      {
        type: 'paragraph',
        content: {
          styledText: [
            {
              text: 'Características del sistema de auditoría:',
              style: { bold: true },
            },
          ],
        },
      },
      {
        type: 'list',
        content: {
          type: 'bullet',
          items: [
            {
              text: 'Captura automática del usuario autenticado (via CLS - Continuation Local Storage)',
            },
            {
              text: 'Snapshot inmutable de datos del usuario (nombre, email)',
            },
            {
              text: 'Registro detallado de cambios campo por campo',
            },
            {
              text: 'Metadata adicional (IP, User-Agent, etc.)',
            },
            {
              text: 'Consultas optimizadas por template (rootId)',
            },
          ],
        },
      },
      { type: 'nextPageBreak' },
    )

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📌 7. ESTADÍSTICAS DEL SISTEMA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    sections.push(
      {
        type: 'heading',
        content: { text: '7. Estadísticas del Sistema', level: 1 },
      },
      {
        type: 'paragraph',
        content: {
          text: 'Resumen general del estado actual del sistema ATR.',
        },
      },
      { type: 'spacer', content: { height: 200 } },
      {
        type: 'table',
        content: {
          headers: ['Métrica', 'Valor', 'Descripción'],
          rows: [
            ['Total Templates', '5', 'Templates creados en el sistema'],
            ['Templates Publicados', '3', 'Templates listos para auditorías'],
            ['Templates en Borrador', '1', 'Templates en edición'],
            ['Templates Archivados', '1', 'Templates obsoletos'],
            ['Total Standards', '326', 'Controles y cláusulas definidos'],
            [
              'Controles Auditables',
              '267',
              'Standards marcados como auditables',
            ],
            ['Frameworks de Madurez', '2', 'COBIT 5 y CMMI v2.0'],
            ['Niveles de Madurez', '11', 'Total de niveles definidos'],
            ['Organizaciones Activas', '3', 'Organizaciones usando el sistema'],
            ['Total Usuarios', '169', 'Usuarios registrados'],
            ['Usuarios Activos', '146', 'Usuarios con acceso habilitado'],
            [
              'Registros de Auditoría',
              '1,247',
              'Cambios rastreados en el sistema',
            ],
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
    )

    // Gráfico de distribución de templates por estado
    sections.push(
      {
        type: 'heading',
        content: { text: '7.1 Distribución de Templates por Estado', level: 2 },
      },
      {
        type: 'html',
        content: {
          html: `
            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%;">
              <tr style="background:#2F5496; color:#FFFFFF;">
                <th>Estado</th>
                <th>Cantidad</th>
                <th>Porcentaje</th>
                <th style="width:300px;">Gráfico</th>
              </tr>
              <tr>
                <td><b>PUBLISHED</b></td>
                <td>3</td>
                <td>60%</td>
                <td style="background:#E7F3FF;">
                  <div style="background:#28A745; height:20px; width:60%;"></div>
                </td>
              </tr>
              <tr>
                <td><b>DRAFT</b></td>
                <td>1</td>
                <td>20%</td>
                <td style="background:#E7F3FF;">
                  <div style="background:#FFC107; height:20px; width:20%;"></div>
                </td>
              </tr>
              <tr>
                <td><b>ARCHIVED</b></td>
                <td>1</td>
                <td>20%</td>
                <td style="background:#E7F3FF;">
                  <div style="background:#DC3545; height:20px; width:20%;"></div>
                </td>
              </tr>
            </table>
          `,
        },
      },
      { type: 'spacer', content: { height: 200 } },
    )

    // Gráfico de usuarios por rol
    sections.push(
      {
        type: 'heading',
        content: { text: '7.2 Distribución de Usuarios por Rol', level: 2 },
      },
      {
        type: 'html',
        content: {
          html: `
            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%;">
              <tr style="background:#2F5496; color:#FFFFFF;">
                <th>Rol</th>
                <th>Cantidad</th>
                <th>Porcentaje</th>
                <th style="width:300px;">Gráfico</th>
              </tr>
              <tr>
                <td><b>ADMIN</b></td>
                <td>5</td>
                <td>3%</td>
                <td style="background:#E7F3FF;">
                  <div style="background:#DC3545; height:20px; width:3%;"></div>
                </td>
              </tr>
              <tr>
                <td><b>GERENTE</b></td>
                <td>23</td>
                <td>14%</td>
                <td style="background:#E7F3FF;">
                  <div style="background:#FFC107; height:20px; width:14%;"></div>
                </td>
              </tr>
              <tr>
                <td><b>AUDITOR</b></td>
                <td>67</td>
                <td>40%</td>
                <td style="background:#E7F3FF;">
                  <div style="background:#17A2B8; height:20px; width:40%;"></div>
                </td>
              </tr>
              <tr>
                <td><b>CLIENTE</b></td>
                <td>74</td>
                <td>43%</td>
                <td style="background:#E7F3FF;">
                  <div style="background:#28A745; height:20px; width:43%;"></div>
                </td>
              </tr>
            </table>
          `,
        },
      },
      { type: 'nextPageBreak' },
    )

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📌 8. CONCLUSIONES Y RECOMENDACIONES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    sections.push(
      {
        type: 'heading',
        content: { text: '8. Conclusiones', level: 1 },
      },
      {
        type: 'paragraph',
        content: {
          text: 'Este documento demostró todas las capacidades del sistema de generación de reportes de ATR, incluyendo:',
        },
      },
      {
        type: 'list',
        content: {
          type: 'checklist',
          items: [
            { text: 'Gestión completa de templates de auditoría' },
            { text: 'Estructura jerárquica de standards y controles' },
            { text: 'Frameworks de madurez (COBIT 5, CMMI)' },
            { text: 'Gestión de organizaciones y usuarios' },
            { text: 'Sistema de auditoría y trazabilidad completo' },
            { text: 'Estadísticas y visualizaciones de datos' },
            { text: 'Soporte para HTML enriquecido y tablas complejas' },
          ],
        },
      },
      { type: 'spacer', content: { height: 200 } },
      {
        type: 'paragraph',
        content: {
          styledText: [
            {
              text: 'Próximos pasos:',
              style: { bold: true, color: '2F5496' },
            },
          ],
        },
      },
      {
        type: 'list',
        content: {
          type: 'numbered',
          items: [
            {
              text: 'Implementar generación de reportes de evaluación de auditorías',
            },
            { text: 'Agregar gráficos y visualizaciones avanzadas' },
            { text: 'Incluir análisis de brechas (gap analysis)' },
            { text: 'Generar planes de acción y remediación' },
            {
              text: 'Exportar a múltiples formatos (PDF, Excel, PowerPoint)',
            },
          ],
        },
      },
      { type: 'spacer', content: { height: 400 } },
      {
        type: 'paragraph',
        content: {
          styledText: [
            { text: '─────────────────────────────────', style: {} },
          ],
        },
      },
      {
        type: 'paragraph',
        content: {
          styledText: [
            {
              text: 'Documento generado automáticamente por ATR',
              style: { italic: true, color: '666666' },
            },
          ],
        },
      },
      {
        type: 'paragraph',
        content: {
          styledText: [
            {
              text: `Fecha: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
              style: { italic: true, color: '666666' },
            },
          ],
        },
      },
    )

    // Configuración del documento
    const config: DocumentConfig = {
      title: 'Reporte de Ejemplo - Sistema ATR',
      margins: { top: 1000, bottom: 1000, left: 1200, right: 1200 },
      theme: MODERN_THEME,

      header: {
        columns: [
          {
            type: 'image',
            imageBuffer: tinyPngBuffer,
            imageWidth: 50,
            imageHeight: 50,
          },
          {
            type: 'text',
            content: 'ATR - Audit Template Repository',
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
            content: 'Confidencial - Uso Interno',
            formatting: { italic: true, color: 'C00000' },
          },
          { type: 'pageNumber' },
        ],
        alignment: ['left', 'center', 'right'],
      },

      tableOfContents: {
        enabled: true,
        insertAtBeginning: false,
        maxLevel: 3,
        includePageNumbers: true,
      },
      sections,
    }

    return await this.builder.buildDocument(config)
  }

  /**
   * Genera un reporte de auditoría basado en un template
   * Construye el documento con la estructura jerárquica de standards
   */
  async generateTemplateReport(templateId: string): Promise<Buffer> {
    // 1. Buscar el template con sus standards
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
      relations: ['standards'],
    })

    if (!template) {
      throw new NotFoundException(`Template con ID ${templateId} no encontrado`)
    }

    // 2. Organizar standards en estructura jerárquica
    const rootStandards = template.standards
      .filter((s) => s.parentId === null)
      .sort((a, b) => a.order - b.order)

    const standardsMap = new Map<string, StandardEntity[]>()
    template.standards.forEach((standard) => {
      if (standard.parentId) {
        const siblings = standardsMap.get(standard.parentId) || []
        siblings.push(standard)
        standardsMap.set(standard.parentId, siblings)
      }
    })

    // Ordenar hijos por orden
    standardsMap.forEach((children) => {
      children.sort((a, b) => a.order - b.order)
    })

    // 3. Construir secciones del documento
    const sections: DocumentSection[] = []

    // Portada
    sections.push(
      { type: 'nextPageBreak' },
      {
        type: 'heading',
        content: { text: `Reporte de Auditoría: ${template.name}`, level: 1 },
      },
      {
        type: 'paragraph',
        content: {
          styledText: [
            { text: 'Código: ', style: { bold: true } },
            { text: template.code, style: {} },
          ],
        },
      },
      {
        type: 'paragraph',
        content: {
          styledText: [
            { text: 'Versión: ', style: { bold: true } },
            { text: template.version, style: {} },
          ],
        },
      },
      {
        type: 'paragraph',
        content: {
          styledText: [
            { text: 'Estado: ', style: { bold: true } },
            { text: template.status, style: {} },
          ],
        },
      },
    )

    if (template.description) {
      sections.push({
        type: 'paragraph',
        content: { text: template.description },
      })
    }

    sections.push({ type: 'nextPageBreak' })

    // Tabla de contenidos
    sections.push(
      {
        type: 'heading',
        content: { text: 'Tabla de Contenidos', level: 1 },
        includeInTOC: false, // No incluir este heading en el TOC
      },
      {
        type: 'tableOfContents',
        content: {
          maxLevel: 3, // Incluir headings de nivel 1, 2 y 3
          includePageNumbers: true, // Mostrar números de página
        },
      },
      { type: 'nextPageBreak' },
    )

    // 4. Generar secciones por cada standard raíz
    rootStandards.forEach((rootStandard) => {
      this.addStandardSection(sections, rootStandard, standardsMap)
    })

    // 5. Resumen final con tabla de todos los standards auditables
    sections.push(
      { type: 'nextPageBreak' },
      {
        type: 'heading',
        content: { text: 'Resumen de Controles Auditables', level: 1 },
      },
      {
        type: 'paragraph',
        content: {
          text: 'A continuación se presenta un resumen de todos los controles auditables definidos en este template:',
        },
      },
    )

    const auditableStandards = template.standards
      .filter((s) => s.isAuditable)
      .sort((a, b) => a.code.localeCompare(b.code))

    if (auditableStandards.length > 0) {
      sections.push({
        type: 'table',
        content: {
          headers: ['Código', 'Título', 'Nivel', 'Descripción'],
          rows: auditableStandards.map((s) => [
            s.code,
            s.title,
            s.level.toString(),
            s.description || 'N/A',
          ]),
        },
      })
    } else {
      sections.push({
        type: 'paragraph',
        content: {
          text: 'No hay controles auditables definidos en este template.',
        },
      })
    }

    // 6. Configuración del documento
    const config: DocumentConfig = {
      title: `Reporte: ${template.name}`,
      margins: { top: 1000, bottom: 1000, left: 1200, right: 1200 },
      theme: MODERN_THEME,

      header: {
        columns: [
          {
            type: 'text',
            content: template.name,
            formatting: { bold: true, color: '2F5496' },
          },
          { type: 'pageNumber' },
        ],
        alignment: ['left', 'right'],
      },

      footer: {
        columns: [
          {
            type: 'text',
            content: `${template.code} v${template.version}`,
            formatting: { italic: true, color: '666666' },
          },
          { type: 'date' },
        ],
        alignment: ['left', 'right'],
      },

      tableOfContents: {
        enabled: true,
        insertAtBeginning: false,
        maxLevel: 3,
        includePageNumbers: true,
      },
      sections,
    }

    return await this.builder.buildDocument(config)
  }

  /**
   * Método recursivo para agregar un standard y sus hijos al documento
   */
  private addStandardSection(
    sections: DocumentSection[],
    standard: StandardEntity,
    standardsMap: Map<string, StandardEntity[]>,
  ): void {
    // Agregar heading del standard (máximo nivel 6)
    const headingLevel = Math.min(standard.level, 6) as 1 | 2 | 3 | 4 | 5 | 6
    sections.push({
      type: 'heading',
      content: {
        text: `${standard.code} ${standard.title}`,
        level: headingLevel,
      },
    })

    // Agregar descripción si existe
    if (standard.description) {
      sections.push({
        type: 'paragraph',
        content: { text: standard.description },
      })
    }

    // Agregar tabla con información del standard
    sections.push({
      type: 'table',
      content: {
        headers: ['Propiedad', 'Valor'],
        rows: [
          ['Código', standard.code],
          ['Nivel', standard.level.toString()],
          ['Auditable', standard.isAuditable ? 'Sí' : 'No'],
          ['Orden', standard.order.toString()],
        ],
      },
    })

    sections.push({ type: 'spacer', content: { height: 200 } })

    // Procesar hijos recursivamente
    const children = standardsMap.get(standard.id) || []
    children.forEach((child) => {
      this.addStandardSection(sections, child, standardsMap)
    })
  }
}
