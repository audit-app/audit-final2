// DTOs compartidos (usados en múltiples lugares)
export * from './organization-response.dto'

// DTOs específicos ahora están en sus respectivos use-cases:
// - CreateOrganizationDto → use-cases/create-organization/
// - UpdateOrganizationDto → use-cases/update-organization/
// - FindOrganizationsDto → use-cases/find-organizations-with-filters/
