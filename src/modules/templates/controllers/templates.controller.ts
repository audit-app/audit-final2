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
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger'
import type { Response } from 'express'
import { UploadSpreadsheet } from '@core/files'
import {
  ApiCreate,
  ApiList,
  ApiUpdate,
  ApiCustom,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiStandardResponses,
} from '@core/swagger'
import { UuidParamDto } from '@core/dtos'
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CloneTemplateDto,
} from '../use-cases'
import {
  ImportTemplateMetadataDto,
  TemplateResponseDto,
  FindTemplatesDto,
  TEMPLATE_SORTABLE_FIELDS,
  TEMPLATE_SEARCH_FIELDS,
} from '../dtos'
import { CreateTemplateUseCase } from '../use-cases/create-template/create-template.use-case'
import { UpdateTemplateUseCase } from '../use-cases/update-template/update-template.use-case'
import { DeleteTemplateUseCase } from '../use-cases/delete-template/delete-template.use-case'
import { FindTemplateUseCase } from '../use-cases/find-template/find-template.use-case'
import { FindTemplatesUseCase } from '../use-cases/find-templates/find-templates.use-case'
import { FindTemplatesWithFiltersUseCase } from '../use-cases/find-templates-with-filters/find-templates-with-filters.use-case'
import { PublishTemplateUseCase } from '../use-cases/publish-template/publish-template.use-case'
import { ArchiveTemplateUseCase } from '../use-cases/archive-template/archive-template.use-case'
import { CloneTemplateUseCase } from '../use-cases/clone-template/clone-template.use-case'
import { TemplateImportService } from '../services/template-import.service'
import { TemplateStatus } from '../constants/template-status.enum'

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly updateTemplateUseCase: UpdateTemplateUseCase,
    private readonly deleteTemplateUseCase: DeleteTemplateUseCase,
    private readonly findTemplateUseCase: FindTemplateUseCase,
    private readonly findTemplatesUseCase: FindTemplatesUseCase,
    private readonly findTemplatesWithFiltersUseCase: FindTemplatesWithFiltersUseCase,
    private readonly publishTemplateUseCase: PublishTemplateUseCase,
    private readonly archiveTemplateUseCase: ArchiveTemplateUseCase,
    private readonly cloneTemplateUseCase: CloneTemplateUseCase,
    private readonly templateImportService: TemplateImportService,
  ) {}

  @Post()
  @ApiCreate(TemplateResponseDto, {
    summary: 'Crear una nueva plantilla',
    description:
      'Crea una nueva plantilla de auditoría en estado DRAFT. El nombre y versión deben ser únicos.',
    conflictMessage: 'Ya existe una plantilla con ese nombre y versión',
  })
  async create(@Body() createTemplateDto: CreateTemplateDto) {
    return await this.createTemplateUseCase.execute(createTemplateDto)
  }

  @Get()
  @ApiList(TemplateResponseDto, {
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
  @ApiOperation({
    summary: 'Obtener una plantilla por ID',
    description:
      'Retorna los datos completos de una plantilla específica mediante su ID único.',
  })
  @ApiOkResponse(TemplateResponseDto, 'Plantilla encontrada')
  @ApiNotFoundResponse('Plantilla no encontrada')
  @ApiStandardResponses({ exclude: [400] })
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.findTemplateUseCase.execute(id)
  }

  @Patch(':id')
  @ApiUpdate(TemplateResponseDto, {
    summary: 'Actualizar una plantilla (solo si está en draft)',
    description:
      'Actualiza una plantilla solo si está en estado DRAFT. Las plantillas publicadas no se pueden editar directamente.',
    conflictMessage: 'Plantilla no editable (debe estar en estado draft)',
  })
  async update(
    @Param() { id }: UuidParamDto,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return await this.updateTemplateUseCase.execute(id, updateTemplateDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar una plantilla (solo si está en draft)',
    description:
      'Elimina permanentemente una plantilla solo si está en estado DRAFT. Retorna la plantilla eliminada para confirmación.',
  })
  @ApiOkResponse(TemplateResponseDto, 'Plantilla eliminada exitosamente')
  @ApiNotFoundResponse('Plantilla no encontrada')
  @ApiStandardResponses({ exclude: [400] })
  async remove(@Param() { id }: UuidParamDto) {
    return await this.deleteTemplateUseCase.execute(id)
  }

  @Patch(':id/publish')
  @ApiCustom(TemplateResponseDto, {
    summary: 'Publicar una plantilla (draft → published)',
    description:
      'Cambia el estado de una plantilla de DRAFT a PUBLISHED. Una vez publicada, la plantilla no se puede editar directamente.',
  })
  async publish(@Param() { id }: UuidParamDto) {
    return await this.publishTemplateUseCase.execute(id)
  }

  @Patch(':id/archive')
  @ApiCustom(TemplateResponseDto, {
    summary: 'Archivar una plantilla (published → archived)',
    description:
      'Cambia el estado de una plantilla de PUBLISHED a ARCHIVED. Las plantillas archivadas no se usan en nuevas auditorías.',
  })
  async archive(@Param() { id }: UuidParamDto) {
    return await this.archiveTemplateUseCase.execute(id)
  }

  @Post(':id/clone')
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
  }

  // ========================================
  // Import/Export Endpoints
  // ========================================

  @Post('import/excel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Importar plantilla desde Excel',
    description:
      'Sube un archivo Excel con 1 hoja "Estándares" + campos de formulario (name, description, version). Valida y crea la plantilla con sus estándares.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Plantilla importada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Errores de validación en el archivo o campos',
  })
  @UploadSpreadsheet({ fieldName: 'file', maxSize: 15 * 1024 * 1024 })
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

    // Step 3: Return validation errors
    return {
      success: false,
      message: 'Errores de validación encontrados',
      errors: {
        standards: importResult.standards.errors,
        crossValidation: importResult.crossValidationErrors,
      },
      summary: importResult.summary,
    }
  }

  @Post('import/csv')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Importar plantilla desde CSV',
    description:
      'Sube 1 archivo CSV con estándares + campos de formulario (name, description, version). Valida y crea la plantilla con sus estándares.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Plantilla importada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Errores de validación en el archivo o campos',
  })
  @UploadSpreadsheet({
    fieldName: 'file',
    maxSize: 10 * 1024 * 1024,
  })
  async importCSV(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: ImportTemplateMetadataDto,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo CSV')
    }

    // Extract CSV content as string
    const standardsCsv = file.buffer.toString('utf-8')

    // Step 1: Process and validate file
    const importResult =
      await this.templateImportService.processCSVFile(standardsCsv)

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

    // Step 3: Return validation errors
    return {
      success: false,
      message: 'Errores de validación encontrados',
      errors: {
        standards: importResult.standards.errors,
        crossValidation: importResult.crossValidationErrors,
      },
      summary: importResult.summary,
    }
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
  }

  @Get('export/csv-template')
  @ApiOperation({
    summary: 'Descargar plantilla CSV',
    description:
      'Descarga un archivo CSV vacío con la estructura correcta para importar estándares. Los metadatos de la plantilla se envían como campos de formulario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plantilla CSV generada (solo estándares)',
  })
  downloadCSVTemplate(@Res() res: Response) {
    const standardsCsv = this.templateImportService.generateCSVTemplate()

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=estandares-template.csv',
    )
    res.send(standardsCsv)
  }
}
