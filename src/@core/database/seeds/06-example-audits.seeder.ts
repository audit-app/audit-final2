import { DataSource } from 'typeorm'
import { Seeder } from 'typeorm-extension'
import { AuditEntity } from '../../../modules/audits/entities/audit.entity'
import { AuditResponseEntity } from '../../../modules/audits/entities/audit-response.entity'
import { AuditStatus } from '../../../modules/audits/enums/audit-status.enum'
import { ResponseStatus } from '../../../modules/audits/enums/response-status.enum'
import { ComplianceLevel } from '../../../modules/audits/enums/compliance-level.enum'
import { TemplateEntity } from '../../../modules/audit-library/templates/entities/template.entity'
import { StandardEntity } from '../../../modules/audit-library/standards/entities/standard.entity'
import { OrganizationEntity } from '../../../modules/organizations/entities/organization.entity'
import { MaturityFrameworkEntity } from '../../../modules/maturity/frameworks/entities/maturity-framework.entity'

/**
 * Example Audits Seeder
 *
 * Crea auditorías de ejemplo para probar el sistema de reportes
 *
 * Incluye:
 * - Auditoría completa con respuestas variadas
 * - Diferentes niveles de cumplimiento
 * - Hallazgos y recomendaciones
 * - Ponderaciones que suman 100%
 */
export default class ExampleAuditsSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const auditRepo = dataSource.getRepository(AuditEntity)
    const responseRepo = dataSource.getRepository(AuditResponseEntity)
    const templateRepo = dataSource.getRepository(TemplateEntity)
    const standardRepo = dataSource.getRepository(StandardEntity)
    const organizationRepo = dataSource.getRepository(OrganizationEntity)
    const frameworkRepo = dataSource.getRepository(MaturityFrameworkEntity)

    console.log('🌱 Iniciando seeder de auditorías de ejemplo...')

    // Limpiar datos existentes
    await dataSource.query('DELETE FROM audit_responses')
    await dataSource.query('DELETE FROM audit_assignments')
    await dataSource.query('DELETE FROM audits')
    console.log('   ✅ Tablas limpiadas')

    // Obtener datos necesarios
    const template = await templateRepo.findOne({
      where: { code: 'ISO 27001' },
    })

    const organization = await organizationRepo.findOne({
      where: { name: 'Audit Corp Bolivia' },
    })

    const framework = await frameworkRepo.findOne({
      where: { name: 'COBIT 5' },
    })

    if (!template) {
      console.log('   ⚠️  No se encontró la plantilla ISO 27001')
      return
    }

    if (!organization) {
      console.log('   ⚠️  No se encontró la organización Audit Corp Bolivia')
      return
    }

    // Obtener standards auditables de la plantilla
    const standards = await standardRepo.find({
      where: { templateId: template.id, isAuditable: true },
      order: { order: 'ASC' },
    })

    if (standards.length === 0) {
      console.log('   ⚠️  No se encontraron standards auditables')
      return
    }

    console.log(`   📊 Encontrados ${standards.length} standards auditables`)

    // Crear auditoría de ejemplo
    const audit = auditRepo.create({
      code: 'AUD-2024-001',
      name: 'Auditoría ISO 27001 - Audit Corp Bolivia Q1 2024',
      description:
        'Auditoría de seguridad de la información para evaluar el cumplimiento con ISO 27001:2013',
      templateId: template.id,
      organizationId: organization.id,
      frameworkId: framework?.id || null,
      status: AuditStatus.CLOSED,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15'),
      actualStartDate: new Date('2024-01-15'),
      closedAt: new Date('2024-03-15'),
      maturityLevel: 3, // Nivel 3 = Definido
      createdBy: 'system',
      updatedBy: 'system',
    })

    await auditRepo.save(audit)
    console.log(`   ✅ Auditoría creada: ${audit.code} - ${audit.name}`)

    // Calcular peso por standard (distribuir equitativamente)
    const weightPerStandard = 100 / standards.length

    // Crear respuestas variadas para demostrar diferentes niveles de cumplimiento
    const responses: AuditResponseEntity[] = []

    for (let i = 0; i < standards.length; i++) {
      const standard = standards[i]

      // Crear diferentes niveles de cumplimiento de forma distribuida
      let complianceLevel: ComplianceLevel
      let score: number
      let findings: string | null = null
      let recommendations: string | null = null

      // Distribuir niveles de cumplimiento:
      // 40% COMPLIANT, 30% PARTIAL, 20% NON_COMPLIANT, 10% NOT_APPLICABLE
      const random = (i % 10) + 1

      if (random <= 4) {
        // 40% COMPLIANT
        complianceLevel = ComplianceLevel.COMPLIANT
        score = 85 + Math.floor(Math.random() * 15) // 85-100%
      } else if (random <= 7) {
        // 30% PARTIAL
        complianceLevel = ComplianceLevel.PARTIAL
        score = 50 + Math.floor(Math.random() * 35) // 50-84%
        findings = `Control ${standard.code} implementado parcialmente. Se identificaron brechas en la documentación y procedimientos.`
        recommendations = `Completar la documentación de políticas y procedimientos. Establecer controles de revisión periódica.`
      } else if (random <= 9) {
        // 20% NON_COMPLIANT
        complianceLevel = ComplianceLevel.NON_COMPLIANT
        score = 10 + Math.floor(Math.random() * 40) // 10-49%
        findings = `Control ${standard.code} no implementado. No existe evidencia de aplicación del control en la organización.`
        recommendations = `Implementar el control desde cero. Definir responsables, procedimientos y mecanismos de seguimiento. Prioridad: ALTA`
      } else {
        // 10% NOT_APPLICABLE
        complianceLevel = ComplianceLevel.NOT_APPLICABLE
        score = 0
        findings = `Control ${standard.code} no aplica debido a la naturaleza del negocio y el alcance actual de la organización.`
        recommendations = null
      }

      const response = responseRepo.create({
        auditId: audit.id,
        standardId: standard.id,
        weight: weightPerStandard,
        score,
        complianceLevel,
        status: ResponseStatus.REVIEWED,
        findings,
        recommendations,
        notes: `Evaluación completada el ${new Date().toLocaleDateString()}`,
        createdBy: 'system',
        updatedBy: 'system',
      })

      responses.push(response)
    }

    await responseRepo.save(responses)
    console.log(`   ✅ ${responses.length} respuestas creadas`)

    // Calcular estadísticas
    const compliantCount = responses.filter(
      (r) => r.complianceLevel === ComplianceLevel.COMPLIANT,
    ).length
    const partialCount = responses.filter(
      (r) => r.complianceLevel === ComplianceLevel.PARTIAL,
    ).length
    const nonCompliantCount = responses.filter(
      (r) => r.complianceLevel === ComplianceLevel.NON_COMPLIANT,
    ).length
    const notApplicableCount = responses.filter(
      (r) => r.complianceLevel === ComplianceLevel.NOT_APPLICABLE,
    ).length

    // Calcular score global
    const overallScore =
      responses.reduce((sum, r) => sum + ((r.score || 0) * r.weight) / 100, 0) /
      responses.length

    console.log(`
   📊 Estadísticas de la auditoría:
      - Score Global: ${overallScore.toFixed(2)}%
      - Cumplimiento Total: ${compliantCount} (${((compliantCount / responses.length) * 100).toFixed(1)}%)
      - Cumplimiento Parcial: ${partialCount} (${((partialCount / responses.length) * 100).toFixed(1)}%)
      - Sin Cumplimiento: ${nonCompliantCount} (${((nonCompliantCount / responses.length) * 100).toFixed(1)}%)
      - No Aplicable: ${notApplicableCount} (${((notApplicableCount / responses.length) * 100).toFixed(1)}%)
    `)

    console.log(`
✅ Auditoría de ejemplo creada exitosamente

   📋 Detalles:
      - Código: ${audit.code}
      - Nombre: ${audit.name}
      - Plantilla: ${template.name}
      - Organización: ${organization.name}
      - Standards evaluados: ${responses.length}
      - Framework: ${framework?.name || 'N/A'}

   🧪 Para probar el reporte:
      GET /api/audits/${audit.id}/reports/compliance
    `)
  }
}
