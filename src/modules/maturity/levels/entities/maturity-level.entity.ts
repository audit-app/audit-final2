import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { BaseEntity } from '@core/entities/base.entity'
import { MaturityFrameworkEntity } from '../../frameworks/entities/maturity-framework.entity'

/**
 * Maturity Level Entity
 *
 * Representa un nivel específico dentro de un framework de madurez
 *
 * Cada nivel tiene:
 * - Un número de nivel (0-5 típicamente)
 * - Nombre y descripción
 * - Color para visualización
 * - Recomendaciones y observaciones predefinidas
 *
 * @example COBIT 5 - Nivel 3
 * ```typescript
 * const level3 = {
 *   frameworkId: 'uuid-cobit5',
 *   level: 3,
 *   name: 'Definido',
 *   shortName: 'Def',
 *   description: 'Los procesos están documentados, estandarizados...',
 *   color: '#F59E0B', // Amarillo/Naranja
 *   icon: '🟡',
 *   recommendations: 'Se recomienda implementar métricas...',
 *   observations: 'El proceso está documentado pero no se mide...',
 *   order: 3
 * }
 * ```
 */
@Entity('maturity_levels')
@Index(['frameworkId', 'level'], { unique: true })
export class MaturityLevelEntity extends BaseEntity {
  /**
   * Framework al que pertenece este nivel
   */
  @Column({ type: 'uuid' })
  frameworkId: string

  @ManyToOne(() => MaturityFrameworkEntity, (framework) => framework.levels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'frameworkId' })
  framework: MaturityFrameworkEntity

  /**
   * Número del nivel de madurez
   * Ejemplos:
   * - COBIT 5: 0, 1, 2, 3, 4, 5
   * - CMMI: 1, 2, 3, 4, 5
   */
  @Column({ type: 'int' })
  level: number

  /**
   * Nombre completo del nivel
   * Ejemplos COBIT 5:
   * - 0: 'Inexistente'
   * - 1: 'Inicial'
   * - 2: 'Repetible'
   * - 3: 'Definido'
   * - 4: 'Administrado'
   * - 5: 'Optimizado'
   */
  @Column({ type: 'varchar', length: 100 })
  name: string

  /**
   * Nombre corto del nivel (opcional)
   * Ejemplos: 'Init', 'Def', 'Adm', 'Opt'
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  shortName: string | null

  @Column({ type: 'text' })
  description: string

  @Column({ type: 'varchar', length: 7 })
  color: string

  /**
   * Icono del nivel (emoji opcional)
   * Ejemplos: '🔴', '🟠', '🟡', '🟢', '🔵'
   */
  @Column({ type: 'varchar', length: 10, nullable: true })
  icon: string | null

  @Column({ type: 'text', nullable: true })
  recommendations: string | null

  @Column({ type: 'text', nullable: true })
  observations: string | null

  @Column({ type: 'int' })
  order: number

  @Column({ type: 'boolean', default: false })
  isMinimumAcceptable: boolean

  @Column({ type: 'boolean', default: false })
  isTarget: boolean

  get displayName(): string {
    return this.icon ? `${this.icon} ${this.name}` : this.name
  }

  get uiName(): string {
    return this.shortName || this.name
  }
}
