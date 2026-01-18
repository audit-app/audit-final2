import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { BaseEntity } from '@core/entities/base.entity'
import { OrganizationEntity } from '../../organizations/entities/organization.entity'
import { USER_CONSTRAINTS } from '../constants/user-schema.constants'

export enum Role {
  ADMIN = 'admin',
  GERENTE = 'gerente',
  AUDITOR = 'auditor',
  CLIENTE = 'cliente',
}
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

  // Campos no gestionables directamente por el usuario
  @Column({ type: 'boolean', default: false })
  emailVerified: boolean

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date | null

  // Habilitación de 2FA
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

  changePassword(newPassword: string) {
    this.password = newPassword
  }

  disable() {
    this.isActive = false
  }

  enable() {
    this.isActive = true
  }

  verifyEmail() {
    this.emailVerified = true
    this.emailVerifiedAt = new Date()
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
}
