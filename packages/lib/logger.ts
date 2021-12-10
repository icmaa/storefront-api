/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import pino from 'pino'

export interface BaseLogger {
  info(message: any, context?: string|Record<any, any>),
  error(message: any, trace?: string, context?: string|Record<any, any>),
  warn(message: any, context?: string|Record<any, any>),
  debug?(message: any, context?: string|Record<any, any>),
  overrideLogger?(): void
}

export type LogLevel = 'info' | 'error' | 'warn' | 'debug'

export class Logger implements BaseLogger {
  private static isProd: boolean = process.env.NODE_ENV === 'production'
  private static gaeMeta: any = {
    'logging.googleapis.com/labels': {
      module_id: process.env.GAE_SERVICE || '-',
      version_id: process.env.GAE_VERSION || '-',
      instance_id: process.env.GAE_INSTANCE || '-'
    }
  }

  public static pino = pino(!Logger.isProd
    ? {}
    : {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          levelFirst: true,
          translateTime: 'yyyy-dd-mm, h:MM:ss TT',
          ignore: 'hostname'
        }
      }
    }
  )

  public error (message: any, trace = '', context?: string|Record<string, any>): void {
    Logger.error(message, trace, context)
  }

  public info (message: any, context?: string|Record<string, any>): void {
    Logger.info(message, context)
  }

  public warn (message: any, context?: string|Record<string, any>): void {
    Logger.warn(message, context)
  }

  public debug (message: any, context?: string|Record<string, any>): void {
    Logger.debug(message, context)
  }

  public static info (message: any, context: string|Record<string, any> = ''): void {
    Logger.printMessage('info', message, context)
  }

  public static error (message: any, trace = '', context: string|Record<string, any> = ''): void {
    this.printMessage('error', message, context)
    this.printMessage('error', message, trace)
  }

  public static warn (message: any, context: string|Record<string, any> = ''): void {
    this.printMessage('warn', message, context)
  }

  public static debug (message: any, context: string|Record<string, any> = ''): void {
    if (this.isProd) return
    this.printMessage('debug', message, context)
  }

  private static printMessage (level: LogLevel, msg: any, context: string|Record<string, any>): void {
    const log = { msg }

    if (process.env.GCLOUD_OPERATIONS_ENABLED) {
      Object.assign(log, { ...Logger.gaeMeta, severity: level })
    }

    if (context) Object.assign(log, { context })

    Logger.pino[level](log)
  }

  public static overrideLogger (...context): void {
    console.error(context)
  }
}

export default Logger
