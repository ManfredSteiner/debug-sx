// Type definitions for debug-sx

declare var debugsx: debugsx.IDebug;

export = debugsx;
export as namespace debugsx;

declare namespace debugsx {
    export interface IDebug {
        (namespace: string): debug.IDebugger,
        coerce: (val: any) => any,
        disable: () => void,
        enable: (namespaces: string) => void,
        enabled: (namespaces: string) => boolean,
        names: string[],
        skips: string[],
        formatters: IFormatters,
        createDebug: (namespace: string, opts?: IDebugOpts) => IDebugger,
        openLogFile: (filename:string, groupname?:string) => void,
        closeLogFile: (groupname:string) => void,
        setGroup: (groupname:string, ...debugs: IDebugger []) => void,
        setColor: (name:string, color:string) => void,
        enableColors: (enable:boolean, groupName?: string) => boolean
    }

    export interface IFormatters {
        [formatter: string]: Function
    }

    export interface IDebugger {
        (formatter: any, ...args: any[]): void;
        enabled: boolean;
        //openLogFile (name:string, group:string) : void;
        log: Function;
        namespace: string;
        addGroup: (groupname:string) => void,
        removeGroup: (groupname:string) => void,
        enableConsole: (enable:boolean) => boolean
    }

    export interface IDebugOpts {
      colors?: [ IColorOpts ]
      location?: boolean;
      inspectOpts?: IInspectOpts; 
    }

    export interface IColorOpts {
      color: string;
      level? : string | RegExp;
      module?: string | RegExp;
      inversed?: boolean;
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
}
