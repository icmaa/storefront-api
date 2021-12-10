import isObject from 'lodash/isObject'
import { green, yellow, red, magentaBright, cyanBright } from 'cli-color'
import { inspect } from 'util'

export interface BaseLogger {
  info(message: any, context?: string|Record<any, any>),
  error(message: any, trace?: string, context?: string|Record<any, any>),
  warn(message: any, context?: string|Record<any, any>),
  debug?(message: any, context?: string|Record<any, any>),
  verbose?(message: any, context?: string|Record<any, any>)
}
export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'verbose';

export class Logger implements BaseLogger {
  private static logLevels: LogLevel[] = [
    'info',
    'error',
    'warn',
    'debug',
    'verbose'
  ];

  private static lastTimestamp?: number;
  private static instance?: typeof Logger | BaseLogger = Logger;
  protected context?: string
  private readonly isTimestampEnabled

  private static isProd: boolean = process.env.NODE_ENV === 'production'

  public constructor (isTimestampEnabled = false, context?: string) {
    this.isTimestampEnabled = isTimestampEnabled
    this.context = context
  }

  public error (message: any, trace = '', context?: string) {
    const instance = this.getInstance();
    if (!this.isLogLevelEnabled('error')) {
      return;
    }
    const test = context || this.context
    instance &&
    instance.error(message, trace, test);
  }

  public info (message: any, context?: string|Record<any, any>) {
    this.callFunction('info', message, context);
  }

  public warn (message: any, context?: string|Record<any, any>) {
    this.callFunction('warn', message, context);
  }

  public debug (message: any, context?: string|Record<any, any>) {
    if (Logger.isProd) return
    this.callFunction('debug', message, context);
  }

  public verbose (message: any, context?: string|Record<any, any>) {
    this.callFunction('verbose', message, context);
  }

  public setContext (context: string) {
    this.context = context;
  }

  public static overrideLogger (logger: BaseLogger | LogLevel[] | boolean) {
    if (Array.isArray(logger)) {
      this.logLevels = logger;
      return;
    }
    this.instance = isObject(logger) ? (logger as BaseLogger) : undefined;
  }

  public static info (message: any, context: string|Record<any, any> = '', isTimeDiffEnabled = true) {
    this.printMessage(message, green, context, isTimeDiffEnabled);
  }

  public static error (
    message: any,
    trace = '',
    context: string|Record<any, any> = '',
    isTimeDiffEnabled = true
  ) {
    this.printMessage(message, red, context, isTimeDiffEnabled);
    this.printStackTrace(trace);
  }

  public static warn (message: any, context: string|Record<any, any> = '', isTimeDiffEnabled = true) {
    this.printMessage(message, yellow, context, isTimeDiffEnabled);
  }

  public static debug (message: any, context: string|Record<any, any> = '', isTimeDiffEnabled = true) {
    if (this.isProd) return
    this.printMessage(message, magentaBright, context, isTimeDiffEnabled);
  }

  public static verbose (message: any, context: string|Record<any, any> = '', isTimeDiffEnabled = true) {
    this.printMessage(message, cyanBright, context, isTimeDiffEnabled);
  }

  private callFunction (
    name: 'info' | 'warn' | 'debug' | 'verbose',
    message: any,
    context?: string|Record<any, any>
  ) {
    if (!this.isLogLevelEnabled(name)) {
      return;
    }
    const instance = this.getInstance();
    const func = instance && (instance as typeof Logger)[name];
    func &&
    func.call(
      instance,
      message,
      context || this.context,
      this.isTimestampEnabled
    );
  }

  private getInstance (): typeof Logger | BaseLogger {
    const { instance } = Logger;
    return instance === this ? Logger : instance;
  }

  private isLogLevelEnabled (level: LogLevel): boolean {
    return Logger.logLevels.includes(level);
  }

  private static printMessage (
    message: any,
    color: (message: string) => string,
    context: string|Record<any, any> = '',
    isTimeDiffEnabled?: boolean
  ) {
    let output: string
    if (isObject(message)) {
      output = this.isProd
        ? `Object: ${JSON.stringify(message)}\n`
        : `${color('Object:')}\n${JSON.stringify(message, null, 2)}\n`
    } else {
      output = this.isProd ? message : color(message)
    }

    const localeStringOptions = {
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      day: '2-digit',
      month: '2-digit'
    };
    const timestamp = new Date(Date.now()).toLocaleString(
      undefined,
      localeStringOptions
    );

    let contextMessage = context === '' ? '' : yellow(context)
    if (isObject(context)) {
      contextMessage = this.isProd
        ? `\nObject: ${JSON.stringify(context)}\n`
        : `\n${yellow('Object:')} ${inspect(context, { colors: true })}\n`
    }

    const pidMessage = this.isProd
      ? `[Storefront-API] ${process.pid} - `
      : color(`[Storefront-API] ${process.pid} - `)

    const timestampDiff = this.updateAndGetTimestampDiff(isTimeDiffEnabled);

    console.log(`${pidMessage}${timestamp}  ${output}${timestampDiff} ${contextMessage}`)
  }

  private static updateAndGetTimestampDiff (
    isTimeDiffEnabled?: boolean
  ): string {
    const includeTimestamp = Logger.lastTimestamp && isTimeDiffEnabled;
    const result = includeTimestamp
      ? this.isProd
        ? ` +${Date.now() - Logger.lastTimestamp}ms`
        : yellow(` +${Date.now() - Logger.lastTimestamp}ms`)
      : '';

    Logger.lastTimestamp = Date.now();
    return result;
  }

  private static printStackTrace (trace: string) {
    if (!trace) {
      return;
    }
    console.log(trace);
  }
}

export default Logger;
