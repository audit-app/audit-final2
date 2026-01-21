import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  Res,
  BadRequestException,
  UploadedFile,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger'
import type { Response } from 'express'
import {
  ApiCreate,
  ApiList,
  ApiFindOne,
  ApiUpdateWithMessage,
  ApiRemoveWithMessage,
  ApiNotFoundResponse,
  ApiStandardResponses,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'
import { ResponseMessage } from '@core/decorators'
import {
  CreateTemplateUseCase,
  UpdateTemplateUseCase,
  FindTemplateUseCase,
  FindTemplatesUseCase,
  PublishTemplateUseCase,
  ArchiveTemplateUseCase,
  FindTemplatesWithFiltersUseCase,
} from '../use-cases'
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
    private readonly findTemplatesWithFiltersUseCase: FindTemplatesWithFiltersUseCase,
    private readonly templateImportService: FindTemplatesUseCase,
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

  // OPCIÓN 1: Devolver entidad actualizada (RECOMENDADO para frontends modernos)
  // @Patch(':id')
  // @ApiUpdate(TemplateEntity, {
  //   summary: 'Actualizar una plantilla (solo si está en draft)',
  //   description:
  //     'Actualiza una plantilla solo si está en estado DRAFT. Las plantillas publicadas no se pueden editar directamente.',
  //   conflictMessage: 'Plantilla no editable (debe estar en estado draft)',
  // })
  // async update(
  //   @Param() { id }: UuidParamDto,
  //   @Body() updateTemplateDto: UpdateTemplateDto,
  // ) {
  //   return await this.updateTemplateUseCase.execute(id, updateTemplateDto)
  // }

  // OPCIÓN 2: Devolver mensaje genérico (más ligero)
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

  /*   @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Clonar una plantilla para crear una nueva versión',
    description:
      'Crea una copia de una plantilla existente con todos sus estándares para crear una nueva versión editable en estado DRAFT.',
  })
  @ApiResponse({ status: 201, description: 'Plantilla clonada exitosamente' })
  @ApiNotFoundResponse('Plantilla no encontrada')
  @ApiResponse({
    status: 409,
    description: 'Ya existe una plantilla con ese nombre y versión',
  })
  @ApiStandardResponses()
  async clone(
    @Param() { id }: UuidParamDto,
    @Body() cloneTemplateDto: CloneTemplateDto,
  ) {
    return await this.cloneTemplateUseCase.execute(id, cloneTemplateDto)
  } */

  // ========================================
  // Import/Export Endpoints
  // ========================================

  /*   @Post('import/excel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Importar plantilla desde Excel',
    description:
      'Sube un archivo Excel con 1 hoja "Estándares" + campos de formulario (name, description, version). ' +
      'El archivo debe contener las columnas: codigo, titulo, descripcion, codigo_padre, orden, nivel, es_auditable, esta_activo. ' +
      'Valida la estructura jerárquica y crea la plantilla con sus estándares.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo Excel + metadatos de la plantilla',
    schema: {
      type: 'object',
      required: ['file', 'name', 'description', 'version'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo Excel (.xlsx) con la hoja "Estándares"',
        },
        name: {
          type: 'string',
          description: 'Nombre de la plantilla',
          example: 'ISO 27001',
          maxLength: 100,
        },
        description: {
          type: 'string',
          description: 'Descripción de la plantilla',
          example: 'Plantilla de controles ISO 27001:2022',
        },
        version: {
          type: 'string',
          description: 'Versión de la plantilla',
          example: '1.0',
          maxLength: 20,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Plantilla importada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Plantilla importada exitosamente',
        },
        data: {
          type: 'object',
          properties: {
            templateId: { type: 'string', format: 'uuid' },
            standardsCount: { type: 'number', example: 50 },
          },
        },
        summary: {
          type: 'object',
          properties: {
            totalRows: { type: 'number', example: 50 },
            totalValidRows: { type: 'number', example: 50 },
            totalErrors: { type: 'number', example: 0 },
            hierarchyDepth: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Errores de validación en el archivo o campos',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Errores de validación encontrados',
        },
        errors: {
          type: 'object',
          properties: {
            standards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  row: { type: 'number', example: 5 },
                  field: { type: 'string', example: 'code' },
                  value: { type: 'string' },
                  message: {
                    type: 'string',
                    example: 'El código es requerido',
                  },
                },
              },
            },
            crossValidation: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  row: { type: 'number', example: 8 },
                  field: { type: 'string', example: 'parentCode' },
                  value: { type: 'string' },
                  message: {
                    type: 'string',
                    example: 'Código padre no encontrado',
                  },
                },
              },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            totalRows: { type: 'number', example: 50 },
            totalValidRows: { type: 'number', example: 45 },
            totalErrors: { type: 'number', example: 5 },
            hierarchyDepth: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: ImportTemplateMetadataDto,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo')
    }

    // Step 1: Process and validate file
    const importResult = await this.templateImportService.processExcelFile(
      file.buffer,
    )

    // Step 2: If validation successful, save to database
    if (importResult.success) {
      const savedResult = await this.templateImportService.saveImportResult(
        metadata,
        importResult,
      )
      return {
        success: true,
        message: 'Plantilla importada exitosamente',
        data: savedResult,
        summary: importResult.summary,
      }
    }

    // Step 3: Return validation errors with 400 status
    throw new BadRequestException({
      success: false,
      message: 'Errores de validación encontrados',
      errors: {
        standards: importResult.standards.errors,
        crossValidation: importResult.crossValidationErrors,
      },
      summary: importResult.summary,
    })
  }

  @Get('export/excel-template')
  @ApiOperation({
    summary: 'Descargar plantilla de Excel',
    description:
      'Descarga un archivo Excel vacío con la estructura correcta para importar estándares (1 hoja). Los metadatos de la plantilla se envían como campos de formulario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plantilla Excel generada (solo estándares)',
  })
  downloadExcelTemplate(@Res() res: Response) {
    const buffer = this.templateImportService.generateExcelTemplate()

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=estandares-template.xlsx',
    )
    res.send(buffer)
  } */
}
