# Swagger Testing Module

Herramienta CLI para verificar y validar la documentación de Swagger/OpenAPI de la aplicación.

## 📋 Características

- ✅ **Validación de configuración**: Verifica título, versión, descripción y esquemas de seguridad
- 🏷️ **Análisis de tags**: Muestra todos los tags con conteo de endpoints
- 📡 **Listado de endpoints**: Agrupa endpoints por tag con métodos HTTP coloreados
- 📄 **Generación de JSON**: Exporta especificación OpenAPI completa
- 📊 **Cobertura de documentación**: Reporta % de endpoints documentados

## 🚀 Uso

### Pre-requisitos

**IMPORTANTE:** Este test requiere que Docker esté corriendo (PostgreSQL y Redis):

\`\`\`bash
# Iniciar servicios
docker compose up -d

# Verificar que estén corriendo
docker compose ps
\`\`\`

### Comandos disponibles

\`\`\`bash
# Verificar todo (ejecuta todos los escenarios)
npm run swagger:test

# Ayuda
npm run swagger:test help

# Escenarios específicos
npm run swagger:test validate    # Validar configuración
npm run swagger:test tags        # Mostrar tags
npm run swagger:test endpoints   # Listar endpoints
npm run swagger:test generate    # Generar JSON
npm run swagger:test coverage    # Verificar cobertura
\`\`\`

## 🌐 URLs útiles

Cuando la aplicación está corriendo (\`npm run dev\`):

- **Swagger UI**: http://localhost:3001/api/docs
- **OpenAPI JSON**: http://localhost:3001/api/docs-json

## 📝 Documentar endpoints

### Añadir summary y description

\`\`\`typescript
import { ApiOperation } from '@nestjs/swagger'

@Get()
@ApiOperation({
  summary: 'Listar usuarios',
  description: 'Retorna lista paginada de usuarios con filtros opcionales'
})
findAll() {
  // ...
}
\`\`\`

### Agrupar con tags

\`\`\`typescript
import { ApiTags } from '@nestjs/swagger'

@ApiTags('users')
@Controller('users')
export class UsersController {
  // ...
}
\`\`\`
