import { Logger } from '@nestjs/common'
import { StandardTreeNode } from '../interfaces/import-data.interface'

/**
 * Tree Builder Utility
 *
 * Construye árboles jerárquicos desde listas planas.
 *
 * Algoritmo eficiente O(n):
 * 1. Crear mapa de TODOS los nodos (1 pasada)
 * 2. Conectar padres-hijos usando parentCode (1 pasada)
 * 3. Retornar solo nodos raíz
 *
 * Ventajas:
 * - ✅ Reutilizable (no solo para import)
 * - ✅ Eficiente O(n) en vez de O(n²)
 * - ✅ Soporta jerarquías de cualquier profundidad
 * - ✅ Maneja casos edge (padres faltantes)
 */
export class TreeBuilderUtil {
  private static readonly logger = new Logger(TreeBuilderUtil.name)

  /**
   * Construye árbol jerárquico desde lista plana
   *
   * @param items - Lista plana de items con code y parentCode
   * @returns Árbol (solo nodos raíz con children anidados)
   *
   * @example
   * const flat = [
   *   { code: 'A.1', parentCode: null },
   *   { code: 'A.1.1', parentCode: 'A.1' },
   *   { code: 'A.2', parentCode: null },
   * ]
   * const tree = TreeBuilderUtil.buildTree(flat)
   * // [
   * //   { code: 'A.1', children: [{ code: 'A.1.1', children: [] }] },
   * //   { code: 'A.2', children: [] }
   * // ]
   */
  static buildTree<T extends { code: string; parentCode?: string | null }>(
    items: T[],
  ): StandardTreeNode[] {
    if (items.length === 0) {
      return []
    }

    this.logger.debug(`🌳 Construyendo árbol desde ${items.length} items...`)

    // 1. Crear mapa de TODOS los nodos
    const nodesMap = new Map<string, StandardTreeNode>()

    items.forEach((item) => {
      nodesMap.set(item.code, {
        code: item.code,
        title: (item as any).title,
        description: (item as any).description,
        order: (item as any).order,
        level: (item as any).level,
        isAuditable: (item as any).isAuditable ?? true,
        isActive: (item as any).isActive ?? true,
        children: [], // Se llenará en paso 2
      })
    })

    // 2. Conectar padres con hijos
    const rootNodes: StandardTreeNode[] = []

    items.forEach((item) => {
      const currentNode = nodesMap.get(item.code)!

      if (item.parentCode) {
        // Tiene padre → agregarlo como hijo del padre
        const parentNode = nodesMap.get(item.parentCode)

        if (parentNode) {
          parentNode.children.push(currentNode)
        } else {
          // Padre no existe → tratarlo como raíz
          // (este caso debería detectarse en validación de jerarquía)
          this.logger.warn(
            `⚠️  Padre "${item.parentCode}" no encontrado para "${item.code}". Tratando como raíz.`,
          )
          rootNodes.push(currentNode)
        }
      } else {
        // Sin padre → es raíz
        rootNodes.push(currentNode)
      }
    })

    const depth = this.calculateTreeDepth(rootNodes)
    this.logger.debug(
      `✅ Árbol construido: ${rootNodes.length} raíces, ${depth} niveles`,
    )

    return rootNodes
  }

  /**
   * Calcula profundidad máxima del árbol
   */
  private static calculateTreeDepth(nodes: StandardTreeNode[]): number {
    if (nodes.length === 0) return 0

    let maxDepth = 1

    nodes.forEach((node) => {
      if (node.children.length > 0) {
        const childDepth = this.calculateTreeDepth(node.children)
        maxDepth = Math.max(maxDepth, 1 + childDepth)
      }
    })

    return maxDepth
  }

  /**
   * Aplana árbol a lista (operación inversa)
   * Útil para exportar o mostrar lista plana
   */
  static flattenTree(nodes: StandardTreeNode[]): StandardTreeNode[] {
    const result: StandardTreeNode[] = []

    const traverse = (node: StandardTreeNode) => {
      result.push(node)
      node.children.forEach(traverse)
    }

    nodes.forEach(traverse)
    return result
  }

  /**
   * Cuenta total de nodos en el árbol
   */
  static countNodes(nodes: StandardTreeNode[]): number {
    let count = 0

    const traverse = (node: StandardTreeNode) => {
      count++
      node.children.forEach(traverse)
    }

    nodes.forEach(traverse)
    return count
  }
}
