import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { BaseEntity } from '@core/entities/base.entity'
import { OrganizationEntity } from '../../organizations/entities/organization.entity'
import { USER_CONSTRAINTS } from '../constants/user-schema.constants'
import { Role } from '@core'

@Index(['email'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['username'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['ci'], { unique: true, where: '"deletedAt" IS NULL' })
@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: USER_CONSTRAINTS.NAMES.MAX })
  names: string

  @Column({ type: 'varchar', length: USER_CONSTRAINTS.LAST_NAMES.MAX })
  lastNames: string

  @Column({ type: 'varchar', length: USER_CONSTRAINTS.EMAIL.MAX })
  email: string

  @Column({
    type: 'varchar',
    length: USER_CONSTRAINTS.USERNAME.MAX,
  })
  username: string

  @Column({ type: 'varchar', length: USER_CONSTRAINTS.CI.MAX })
  ci: string

  @Column({ type: 'varchar', length: 255, select: false, nullable: true })
  password: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerId: string | null

  @Column({ type: 'boolean', default: true })
  isTemporaryPassword: boolean

  @Column({ type: 'timestamp', nullable: true })
  firstLoginAt: Date | null

  @Column({ type: 'boolean', default: false })
  isTwoFactorEnabled: boolean

  @Column({
    type: 'varchar',
    length: USER_CONSTRAINTS.PHONE.MAX,
    nullable: true,
  })
  phone: string | null

  @Column({
    type: 'varchar',
    length: USER_CONSTRAINTS.ADDRESS.MAX,
    nullable: true,
  })
  address: string | null

  @Column({
    type: 'varchar',
    length: USER_CONSTRAINTS.IMAGE.MAX,
    nullable: true,
    transformer: {
      to: (value: string) => value,
      from: (value: string) =>
        value ? `http://localhost:3000/uploads/${value}` : null,
    },
  })
  image: string | null

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @Column({ type: 'uuid', nullable: false })
  organizationId: string

  @ManyToOne(() => OrganizationEntity, {
    nullable: false,
  })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity

  @Column({
    type: 'enum',
    enum: Role,
    array: true,
    default: [Role.CLIENTE],
  })
  roles: Role[]

  get fullName(): string {
    return `${this.names} ${this.lastNames}`
  }

  get provider(): 'local' | 'google' {
    return this.providerId ? 'google' : 'local'
  }

  changePassword(newPassword: string) {
    this.password = newPassword
    this.isTemporaryPassword = false
  }

  disable() {
    this.isActive = false
  }

  enable() {
    this.isActive = true
  }

  markFirstLogin() {
    if (!this.firstLoginAt) {
      this.firstLoginAt = new Date()
    }
  }

  markPasswordAsChanged() {
    this.isTemporaryPassword = false
  }

  twoFactorEnable() {
    this.isTwoFactorEnabled = true
  }

  twoFactorDisable() {
    this.isTwoFactorEnabled = false
  }

  updateAvatar(url: string): void {
    this.image = url
  }

  removeAvatar(): void {
    this.image = null
  }

  changeEmail(email: string): void {
    this.email = email
    this.isTemporaryPassword = false
  }

  /**
   * Vincula cuenta de Google al usuario
   *
   * CASO 1: Nunca hizo login (firstLoginAt = null)
   *   → password = null, isTemporaryPassword = false
   *
   * CASO 2: Ya hizo login local antes (firstLoginAt existe)
   *   → Mantener password existente, mantener isTemporaryPassword
   *
   * @param googleProviderId - ID del proveedor de Google
   */
  linkGoogleAccount(googleProviderId: string): void {
    this.providerId = googleProviderId

    // CASO 1: Nunca hizo login → eliminar password temporal
    if (!this.firstLoginAt) {
      this.password = null
      this.isTemporaryPassword = false
    }
    // CASO 2: Ya hizo login local → mantener password y flag
  }
}
