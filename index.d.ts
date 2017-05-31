// Type definitions for debug-sx
// see also: https://www.typescriptlang.org/docs/handbook/modules.html
//           https://www.typescriptlang.org/docs/handbook/modules.html#export--and-import--require
//           https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html

declare let debugsx: debugsx.IDebug;

export = debugsx;
export as namespace debugsx;

declare namespace debugsx {
  export interface IDebug {
    (namespace: string): debug.IDebugger,
    coerce: (val: any) => any,
    disable: () => void,
    enable: (namespaces: string) => void,
    enabled: (namespaces: string) => boolean,
    // names: string[],
    // skips: string[],
    locationEnable: (namespaces: string) => void,
    locationEnabled: (namespaces: string) => boolean,
    formatters: IFormatters,
    handlers: IHandler [],
    loggers: IDebugger [],

    createDebug (namespace: string, opts?: IInspectOpts): IDebugger,
    createConsoleHandler (fd?: string, namespaces?: string, locationNamespaces?: string, colors?: IColor []): IHandler, 
    createConsoleHandler (config: IConsoleHandlerConfig): IHandler, 
    createFileHandler (filename:string, namespaces?: string, locationNamespaces?: string, colors?: IColor []): IHandler,
    createFileHandler (config: IFileHandlerConfig): IHandler,
    addHandler: (...handler: IHandler []) => void,
    removeHandler: (handler: IHandler) => boolean
  }


  export interface IDebugger {
    (formatter: any, ...args: any[]): void;
    enabled: boolean;
    locationEnabled: boolean;
    log: Function;
    namespace: string;
    activeHandlers : IActiveHandler [];
  }

  export interface IFormatters {
    [formatter: string]: Function
  }

  export interface IInspectOpts {
    showHidden?: boolean;
    depth?: number;
    colors?: boolean;
    customInspect?: boolean;
    showProxy?: boolean;
    maxArrayLength?: number;
    breakLength?: number;
  }

  export interface IActiveHandler {
    handler: IHandler;
    colorOn: string;
    colorOff: string;
    locationEnabled: boolean;
  }

  export interface IHandler {
    hstream: IHandlerWriteStream | IHandlerFileStream | IHandlerConsoleStream;
    namespaces: string;
    locationNamespaces: string;
    colors: string,
    names: RegExp [],
    skips: RegExp [],
    location: { names: RegExp [], skips: RegExp [] },
    colorTable: string
    end(): void;
    enabled(name: string): boolean;
    locationEnabled(name: string): boolean;
    getColorCodes(module: string, level:string): IColorCodes;
  }

  export interface IHandlerWriteStream {
    wstream: NodeJS.WritableStream;
    writable: boolean;
    write(buffer: Buffer | string, cb?: Function): boolean;
    write(str: string, encoding?: string, cb?: Function): boolean;
    end(): void;
  }


  export interface IHandlerFileStream extends IHandlerWriteStream {
    filename: string;
  }

  export interface IHandlerConsoleStream extends IHandlerWriteStream {
    name: string;
  }

  export interface IColorCodes {
    on: string;
    off: string;
  }

  export interface IColor {
    color: string;
    namespace?: string | RegExp;
    level?: string | RegExp;
    module?: string | RegExp;
    inverse?: boolean;
  }

  export interface IFileHandlerConfig {
    filename: string,
    namespaces?: string;
    locationNamespaces?: string,
    colors?: string
  }

  export interface IConsoleHandlerConfig {
    fd: string,
    namespaces?: string;
    locationNamespaces?: string,
    colors?: string
  }

}
