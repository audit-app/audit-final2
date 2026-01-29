import { Injectable, OnModuleInit } from '@nestjs/common'
import { DiscoveryService, MetadataScanner, ModuleRef } from '@nestjs/core'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
import { TransactionService } from './transaction.service'
import { TRANSACTIONAL_METADATA_KEY } from './transactional.decorator'
import { LoggerService } from '@core/logger'

@Injectable()
export class TransactionDiscoveryService implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly moduleRef: ModuleRef,
    private readonly transactionService: TransactionService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit(): void {
    this.logger.log('Iniciando escaneo de métodos @Transactional()...')

    const providers = this.discoveryService.getProviders()
    let wrappedCount = 0

    for (const wrapper of providers) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { instance } = wrapper

      if (!instance || typeof instance !== 'object') {
        continue
      }

      const prototype = Object.getPrototypeOf(instance) as object | null
      if (!prototype) {
        continue
      }

      // Escaneamos todos los métodos de la clase
      const methodNames = this.metadataScanner.getAllMethodNames(prototype)

      for (const methodName of methodNames) {
        // Verificamos si el método tiene el metadata @Transactional
        const isTransactional = Reflect.getMetadata(
          TRANSACTIONAL_METADATA_KEY,
          prototype,
          methodName,
        ) as boolean | undefined

        if (isTransactional) {
          this.wrapMethodWithTransaction(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            instance,
            prototype,
            methodName,
            wrapper,
          )
          wrappedCount++
        }
      }
    }

    this.logger.log(
      `Escaneo completado: ${wrappedCount} métodos envueltos con @Transactional()`,
    )
  }

  private wrapMethodWithTransaction(
    instance: object,
    prototype: object,
    methodName: string,
    wrapper: InstanceWrapper,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const prototypeAny = prototype
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const originalMethod = prototypeAny[methodName]

    if (typeof originalMethod !== 'function') {
      return
    }

    const className = wrapper.metatype?.name || 'Unknown'

    this.logger.debug(
      `Envolviendo método ${className}.${methodName} con transacción`,
    )

    // Guardamos la referencia al transactionService
    const transactionService = this.transactionService

    // Reemplazamos el método con el wrapper
    // Usamos una arrow function que captura el contexto correctamente
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    prototypeAny[methodName] = async function (
      this: any,
      ...args: unknown[]
    ): Promise<any> {
      // Ejecutamos dentro de una transacción
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await transactionService.runInTransaction(async () => {
        // Llamamos al método original con el contexto correcto (this)
        // El 'this' aquí será la instancia real cuando se llame el método
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return await originalMethod.apply(this, args)
      })
    }
  }
}
