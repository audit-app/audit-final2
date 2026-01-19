import { Entity, Column, OneToMany, Index } from 'typeorm'
import { BaseEntity } from '@core/entities'
import { UserEntity } from '../../users/entities/user.entity'
@Index(['nit'], { unique: true, where: '"deletedAt" IS NULL' })
@Index(['name'], { unique: true, where: '"deletedAt" IS NULL' })
@Entity('organizations')
export class OrganizationEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string

  @Column({ type: 'varchar', length: 50 })
  nit: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null

  @Column({ type: 'varchar', length: 200, nullable: true })
  email: string | null

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    transformer: {
      to: (value: string) => value,
      from: (value: string) =>
        value ? `http://localhost:3000/uploads/${value}` : null,
    },
  })
  logoUrl: string | null

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @OneToMany(() => UserEntity, (user) => user.organization)
  users: UserEntity[]

  activate() {
    this.isActive = true
  }

  deactivate() {
    this.isActive = false
  }

  updateLogo(logoUrl: string) {
    this.logoUrl = logoUrl
  }

  removeLogo() {
    this.logoUrl = null
  }
}
