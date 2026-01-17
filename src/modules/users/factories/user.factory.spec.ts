import { UserFactory } from './user.factory'
import { CreateUserDto, UpdateUserDto } from '../dtos'
import { UserEntity, Role } from '../entities/user.entity'

describe('UserFactory', () => {
  let factory: UserFactory

  beforeEach(() => {
    factory = new UserFactory()
  })
  describe('createFromDto', () => {
    const baseDto: CreateUserDto = {
      names: 'Juan Carlos',
      lastNames: 'Pérez López',
      email: 'juan@test.com',
      username: 'juanperez',
      ci: '12345678',
      phone: '71234567',
      address: 'Calle Test 123',
      organizationId: 'org-1',
      roles: [Role.AUDITOR],
    }

    it('should create user entity with all fields', () => {
      // Act
      const result = factory.createFromDto(baseDto)

      // Assert
      expect(result).toBeInstanceOf(UserEntity)
      expect(result.names).toBe(baseDto.names)
      expect(result.lastNames).toBe(baseDto.lastNames)
      expect(result.ci).toBe(baseDto.ci)
      expect(result.phone).toBe(baseDto.phone)
      expect(result.address).toBe(baseDto.address)
      expect(result.organizationId).toBe(baseDto.organizationId)
      expect(result.roles).toEqual(baseDto.roles)
      expect(result.isActive).toBe(true)
      expect(result.isTwoFactorEnabled).toBe(false)
      expect(result.image).toBeNull()
    })

    it('should normalize email to lowercase', () => {
      // Arrange
      const dto: CreateUserDto = {
        ...baseDto,
        email: 'JUAN@TEST.COM', // UPPERCASE
      }

      // Act
      const result = factory.createFromDto(dto)

      // Assert
      expect(result.email).toBe('juan@test.com')
    })

    it('should normalize username to lowercase', () => {
      // Arrange
      const dto: CreateUserDto = {
        ...baseDto,
        username: 'JuanPerez', // Mixed case
      }

      // Act
      const result = factory.createFromDto(dto)

      // Assert
      expect(result.username).toBe('juanperez')
    })

    it('should handle optional fields as null', () => {
      // Arrange
      const dto: CreateUserDto = {
        names: 'Test',
        lastNames: 'User',
        email: 'test@test.com',
        username: 'testuser',
        ci: '12345678',
        phone: undefined,
        address: undefined,
        organizationId: 'org-1',
        roles: [Role.CLIENTE],
      }

      // Act
      const result = factory.createFromDto(dto)

      // Assert
      expect(result.phone).toBeNull()
      expect(result.address).toBeNull()
      expect(result.image).toBeNull()
    })

    it('should handle multiple roles', () => {
      // Arrange
      const dto: CreateUserDto = {
        ...baseDto,
        roles: [Role.ADMIN, Role.GERENTE, Role.AUDITOR],
      }

      // Act
      const result = factory.createFromDto(dto)

      // Assert
      expect(result.roles).toEqual([Role.ADMIN, Role.GERENTE, Role.AUDITOR])
      expect(result.roles.length).toBe(3)
    })

    it('should handle email with mixed case and normalize', () => {
      // Arrange
      const dto: CreateUserDto = {
        ...baseDto,
        email: 'JuAn.PeReZ@TeSt.CoM',
      }

      // Act
      const result = factory.createFromDto(dto)

      // Assert
      expect(result.email).toBe('juan.perez@test.com')
    })
  })

  describe('updateFromDto', () => {
    let existingUser: UserEntity

    beforeEach(() => {
      // Usuario existente
      existingUser = {
        id: '1',
        names: 'Original Names',
        lastNames: 'Original LastNames',
        email: 'original@test.com',
        username: 'originaluser',
        ci: '12345678',
        password: 'hashed_password', // El password se maneja en el use case
        phone: '71234567',
        address: 'Original Address',
        organizationId: 'org-1',
        roles: [Role.CLIENTE],
        isActive: true,
        isTwoFactorEnabled: false,
        emailVerified: true,
        image: null,
      } as UserEntity
    })

    it('should update only provided fields', () => {
      // Arrange
      const dto: UpdateUserDto = {
        names: 'Updated Names',
        phone: '79999999',
      }

      // Act
      const result = factory.updateFromDto(existingUser, dto)

      // Assert
      expect(result).toBe(existingUser)
      expect(result.names).toBe('Updated Names')
      expect(result.phone).toBe('79999999')

      // Campos no proporcionados NO deben cambiar
      expect(result.lastNames).toBe('Original LastNames')
      expect(result.email).toBe('original@test.com')
      expect(result.username).toBe('originaluser')
      expect(result.ci).toBe('12345678')
      expect(result.address).toBe('Original Address')
      expect(result.isActive).toBe(true)
    })

    it('should normalize email to lowercase when updating', () => {
      // Arrange
      const dto: UpdateUserDto = {
        email: 'UPDATED@TEST.COM',
      }

      // Act
      const result = factory.updateFromDto(existingUser, dto)

      // Assert
      expect(result.email).toBe('updated@test.com')
    })

    it('should normalize username to lowercase when updating', () => {
      // Arrange
      const dto: UpdateUserDto = {
        username: 'NewUsername',
      }

      // Act
      const result = factory.updateFromDto(existingUser, dto)

      // Assert
      expect(result.username).toBe('newusername')
    })

    it('should NOT update password (passwords handled by auth module)', () => {
      // Arrange
      const originalPassword = existingUser.password
      const dto: UpdateUserDto = {
        names: 'Updated Names',
      }

      // Act
      const result = factory.updateFromDto(existingUser, dto)

      // Assert
      expect(result.password).toBe(originalPassword)
    })

    it('should update multiple fields at once', () => {
      // Arrange
      const dto: UpdateUserDto = {
        names: 'New Names',
        lastNames: 'New LastNames',
        email: 'NEW@TEST.COM',
        phone: '77777777',
      }

      // Act
      const result = factory.updateFromDto(existingUser, dto)

      // Assert
      expect(result.names).toBe('New Names')
      expect(result.lastNames).toBe('New LastNames')
      expect(result.email).toBe('new@test.com')
      expect(result.phone).toBe('77777777')
    })

    it('should update roles array', () => {
      // Arrange
      const dto: UpdateUserDto = {
        roles: [Role.ADMIN, Role.GERENTE],
      }

      // Act
      const result = factory.updateFromDto(existingUser, dto)

      // Assert
      expect(result.roles).toEqual([Role.ADMIN, Role.GERENTE])
    })

    it('should not modify fields not present in DTO', () => {
      // Arrange
      const dto: UpdateUserDto = {
        phone: '79999999', // Solo actualizar teléfono
      }

      // Act
      factory.updateFromDto(existingUser, dto)

      // Assert - Todos los demás campos deben mantenerse
      expect(existingUser.names).toBe('Original Names')
      expect(existingUser.email).toBe('original@test.com')
      expect(existingUser.username).toBe('originaluser')
      expect(existingUser.ci).toBe('12345678')
      expect(existingUser.phone).toBe('79999999')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long names', () => {
      // Arrange
      const longName = 'A'.repeat(100)
      const dto: CreateUserDto = {
        names: longName,
        lastNames: 'Test',
        email: 'test@test.com',
        username: 'testuser',
        organizationId: 'org-1',
        ci: '12345678',
        roles: [Role.CLIENTE],
      }

      // Act
      const result = factory.createFromDto(dto)

      // Assert
      expect(result.names).toBe(longName)
    })

    it('should handle email with + symbol (valid email)', () => {
      // Arrange
      const dto: CreateUserDto = {
        names: 'Test',
        lastNames: 'User',
        email: 'test+filter@test.com',
        username: 'testuser',
        ci: '12345678',
        organizationId: 'org-1',
        roles: [Role.CLIENTE],
      }

      // Act
      const result = factory.createFromDto(dto)

      // Assert
      expect(result.email).toBe('test+filter@test.com')
    })

    it('should handle username with numbers', () => {
      // Arrange
      const dto: CreateUserDto = {
        names: 'Test',
        lastNames: 'User',
        email: 'test@test.com',
        organizationId: 'org-1',
        username: 'User123Test',
        ci: '12345678',
        roles: [Role.CLIENTE],
      }

      // Act
      const result = factory.createFromDto(dto)

      // Assert
      expect(result.username).toBe('user123test')
    })

    it('should handle empty roles array', () => {
      // Arrange
      const dto: CreateUserDto = {
        names: 'Test',
        lastNames: 'User',
        email: 'test@test.com',
        username: 'testuser',
        organizationId: 'org-1',
        ci: '12345678',
        roles: [],
      }

      // Act
      const result = factory.createFromDto(dto)

      // Assert
      expect(result.roles).toEqual([])
    })

    it('should set default values correctly', () => {
      // Arrange & Act
      const user1 = factory.createFromDto({
        names: 'Test',
        lastNames: 'User',
        email: 'test1@test.com',
        username: 'test1',
        ci: '11111111',
        organizationId: 'org-1',
        roles: [Role.CLIENTE],
      })

      const user2 = factory.createFromDto({
        names: 'Test',
        lastNames: 'User',
        email: 'test2@test.com',
        username: 'test2',
        ci: '22222222',
        roles: [Role.CLIENTE],
        organizationId: 'org-1',
      })

      // Assert - Todos los usuarios nuevos deben tener valores por defecto
      expect(user1.isActive).toBe(true)
      expect(user1.isTwoFactorEnabled).toBe(false)
      expect(user1.image).toBeNull()

      expect(user2.isActive).toBe(true)
      expect(user2.isTwoFactorEnabled).toBe(false)
      expect(user2.image).toBeNull()
    })

    it('should handle all Role values', () => {
      // Arrange
      const dto: CreateUserDto = {
        names: 'Test',
        lastNames: 'User',
        email: 'test@test.com',
        username: 'testuser',
        organizationId: 'org-1',
        ci: '12345678',
        roles: [Role.ADMIN, Role.GERENTE, Role.AUDITOR, Role.CLIENTE],
      }

      // Act
      const result = factory.createFromDto(dto)

      // Assert
      expect(result.roles).toContain(Role.ADMIN)
      expect(result.roles).toContain(Role.GERENTE)
      expect(result.roles).toContain(Role.AUDITOR)
      expect(result.roles).toContain(Role.CLIENTE)
      expect(result.roles.length).toBe(4)
    })
  })
})
