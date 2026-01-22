import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Res,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import type { Response } from 'express'
import {
  ApiCreate,
  ApiList,
  ApiFindOne,
  ApiUpdateWithMessage,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'
import { ResponseMessage } from '@core/decorators'
import { UploadSpreadsheet } from '@core/files/decorators'
import {
  CreateTemplateUseCase,
  UpdateTemplateUseCase,
  FindTemplateUseCase,
  FindTemplatesUseCase,
  PublishTemplateUseCase,
  ArchiveTemplateUseCase,
  ExportTemplateUseCase,
  ImportTemplateUseCase,
} from '../use-cases'
import { TemplateExampleService } from '../services'
import {
  CreateTemplateDto,
  FindTemplatesDto,
  TEMPLATE_SEARCH_FIELDS,
  TEMPLATE_SORTABLE_FIELDS,
  UpdateTemplateDto,
} from '../dtos'
import { TemplateEntity } from '../entities'
import { TemplateStatus } from '../constants'

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly updateTemplateUseCase: UpdateTemplateUseCase,
    private readonly findTemplateUseCase: FindTemplateUseCase,
    private readonly publishTemplateUseCase: PublishTemplateUseCase,
    private readonly archiveTemplateUseCase: ArchiveTemplateUseCase,
    private readonly findTemplatesWithFiltersUseCase: FindTemplatesUseCase,
    private readonly exportTemplateUseCase: ExportTemplateUseCase,
    private readonly importTemplateUseCase: ImportTemplateUseCase,
    private readonly templateExampleService: TemplateExampleService,
  ) {}

  @Post()
  @ApiCreate(TemplateEntity, {
    summary: 'Crear una nueva plantilla',
    description:
      'Crea una nueva plantilla de auditoría en estado DRAFT. El nombre y versión deben ser únicos.',
    conflictMessage: 'Ya existe una plantilla con ese nombre y versión',
  })
  async create(@Body() createTemplateDto: CreateTemplateDto) {
    return await this.createTemplateUseCase.execute(createTemplateDto)
  }

  @Get('download-example')
  @ApiOperation({
    summary: 'Descargar plantilla de ejemplo para importación',
    description:
      'Descarga un archivo Excel de ejemplo que muestra la estructura correcta para importar templates. ' +
      'El archivo incluye:\n' +
      '- Hoja "Template": Metadatos de ejemplo de la plantilla\n' +
      '- Hoja "Standards": Ejemplos de controles con estructura jerárquica correcta (ISO 27001)\n' +
      '- Hoja "Instrucciones": Guía detallada de cómo llenar el archivo\n' +
      '- Comentarios en celdas para facilitar el uso\n\n' +
      'Los usuarios pueden usar este archivo como plantilla base, modificar los datos según sus necesidades, ' +
      'y luego importarlo usando el endpoint POST /templates/import',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel de ejemplo generado exitosamente',
    headers: {
      'Content-Type': {
        description:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      'Content-Disposition': {
        description: 'attachment; filename=template_example_YYYY-MM-DD.xlsx',
      },
    },
  })
  async downloadExample(@Res() res: Response): Promise<void> {
    // Generar archivo Excel de ejemplo
    const buffer = await this.templateExampleService.generateExampleFile()

    // Generar nombre del archivo
    const fileName = this.templateExampleService.getFileName()

    // Configurar headers para descarga
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)

    // Enviar buffer
    res.send(buffer)
  }

  @Post('import')
  @UploadSpreadsheet({
    fieldName: 'file',
    description:
      'Archivo Excel (.xlsx) con la hoja "Standards" que contiene las columnas: código, título, descripción, código padre, orden, nivel, auditable.',
  })
  @ApiBody({
    description: 'Archivo Excel + metadatos de la plantilla',
    schema: {
      type: 'object',
      required: ['file', 'name', 'version'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel (.xlsx) con la hoja "Standards"',
        },
        name: {
          type: 'string',
          description: 'Nombre de la plantilla',
          example: 'ISO 27001',
        },
        version: {
          type: 'string',
          description: 'Versión de la plantilla',
          example: '1.0',
        },
        description: {
          type: 'string',
          description: 'Descripción de la plantilla (opcional)',
          example: 'Plantilla de controles ISO 27001:2022',
        },
        code: {
          type: 'string',
          description: 'Código de la plantilla (opcional)',
          example: 'ISO27001',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Importar plantilla desde Excel',
    description:
      'Importa una plantilla completa con todos sus standards desde un archivo Excel. ' +
      'El archivo debe tener una hoja "Standards" con las columnas: código, título, descripción, código padre, orden, nivel, auditable.',
  })
  @ApiResponse({
    status: 201,
    description: 'Plantilla importada exitosamente',
    type: TemplateEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Errores de validación en el archivo',
  })
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: CreateTemplateDto,
  ): Promise<TemplateEntity> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo')
    }
    return await this.importTemplateUseCase.execute(file.buffer, metadata)
  }

  @Get()
  @ApiList(TemplateEntity, {
    summary: 'Listar plantillas con paginación y filtros',
    searchFields: TEMPLATE_SEARCH_FIELDS,
    sortableFields: TEMPLATE_SORTABLE_FIELDS.map(String),
    defaultSortBy: 'createdAt',
    filterFields: [
      {
        name: 'status',
        description: 'Filtrar por estado de la plantilla',
        type: `enum: ${Object.values(TemplateStatus).join(', ')}`,
        example: 'draft',
      },
    ],
  })
  async findAll(@Query() query: FindTemplatesDto) {
    return await this.findTemplatesWithFiltersUseCase.execute(query)
  }

  @Get(':id')
  @ApiFindOne(TemplateEntity)
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.findTemplateUseCase.execute(id)
  }

  @Patch(':id')
  @ResponseMessage('Plantilla actualizada exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Actualizar una plantilla (solo si está en draft)',
    description:
      'Actualiza una plantilla solo si está en estado DRAFT. Las plantillas publicadas no se pueden editar directamente. Retorna un mensaje de confirmación.',
    conflictMessage: 'Plantilla no editable (debe estar en estado draft)',
  })
  async update(
    @Param() { id }: UuidParamDto,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    await this.updateTemplateUseCase.execute(id, updateTemplateDto)
  }

  @Patch(':id/publish')
  @ResponseMessage('Plantilla publicada exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Publicar una plantilla (draft → published)',
    description:
      'Cambia el estado de una plantilla de DRAFT a PUBLISHED. Una vez publicada, la plantilla no se puede editar directamente. Retorna un mensaje de confirmación.',
  })
  async publish(@Param() { id }: UuidParamDto) {
    await this.publishTemplateUseCase.execute(id)
  }

  @Patch(':id/archive')
  @ResponseMessage('Plantilla archivada exitosamente')
  @ApiUpdateWithMessage({
    summary: 'Archivar una plantilla (published → archived)',
    description:
      'Cambia el estado de una plantilla de PUBLISHED a ARCHIVED. Las plantillas archivadas no se usan en nuevas auditorías. Retorna un mensaje de confirmación.',
  })
  async archive(@Param() { id }: UuidParamDto) {
    await this.archiveTemplateUseCase.execute(id)
  }

  @Get(':id/export')
  @ApiOperation({
    summary: 'Exportar plantilla a Excel',
    description:
      'Exporta una plantilla completa con todos sus standards a un archivo Excel. ' +
      'El archivo contiene 2 hojas: "Template" con metadatos y "Standards" con todos los controles ordenados jerárquicamente. ' +
      'Útil para backup, compartir entre entornos o generar datos de prueba.',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo Excel generado exitosamente',
    headers: {
      'Content-Type': {
        description:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      'Content-Disposition': {
        description: 'attachment; filename=NombrePlantilla_vVersion_Date.xlsx',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Plantilla no encontrada',
  })
  async exportTemplate(
    @Param() { id }: UuidParamDto,
    @Res() res: Response,
  ): Promise<void> {
    // Obtener el template para generar el nombre del archivo
    const template = await this.findTemplateUseCase.execute(id)

    // Exportar el template a Excel
    const buffer = await this.exportTemplateUseCase.execute(id)

    // Generar nombre del archivo
    const sanitizedName = template.name.replace(/[^a-zA-Z0-9]/g, '_')
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `${sanitizedName}_v${template.version}_${timestamp}.xlsx`

    // Configurar headers para descarga
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)

    // Enviar buffer
    res.send(buffer)
  }
}
