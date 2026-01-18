// DTOs compartidos (usados en múltiples lugares)
export * from './user-response.dto'

// DTOs específicos ahora están en sus respectivos use-cases:
// - CreateUserDto → use-cases/create-user/
// - UpdateUserDto → use-cases/update-user/
// - FindUsersDto → use-cases/find-all-users/
// - VerifyEmailDto → use-cases/verify-email/
