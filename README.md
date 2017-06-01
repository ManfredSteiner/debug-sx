# debug-sx

An extension for the tiny and high performant Node.js debugging utility [debug][1].

This documentation uses the original documentation of **debug** in a quoted style, in order to allow distinctness between **debug** and **debug-sx** features.

**debug-sx** can be used instead of debug. It extends the original debug instance with a couple of new features.

## Features

   * ability to print out the **location** where the message is created
   * ability to print out **call stack** of Errors
   * **level based logging**
   * **handlers** for console and files can be used to control which message should be printed out in which style to which target
   *  **improved output format** for better readability
   * absolut **timestamps** which format can be configured
   * high performant implementation prevents lack of speed, especially when no messages are created.
   * usable for Javascript and Typescript

## Chapters in this documentation
* [Features](#features)
* [Usage](#usage)
* [Conventions for namespaces](#conventions-for-namespaces)
* [Wildcards](#wildcards)
* [Environment Variables](#environment-variables)
* [Formatters](#formatters)
* [Browser support](#browser-support)
* [Output streams](#output-streams)
* [Colors](#colors)
* [Handlers](#handlers)
* [Typescript](#typescript)
* [Advanced Example](#advanced-example)

## Usage

**Example**:

```js
process.env['DEBUG'] = "*";

const debugsx = require('debug-sx');
const version = '1.0';

const debug = {};
      debug.fine = debugsx('main::FINE');
      debug.info = debugsx('main::INFO');
      debug.warn = debugsx('main::WARN');
      debug.err = debugsx('main::ERR');

const testobject = { name: 'to', value: '1000' };

...
debug.info('Start of application, version %s', version);
debug.info('Test object %o', testobject);
debug.warn('Not implemented yet');
debug.err('There is a problem ...\n%e', new Error());
```
Like the original Node.js module [debug][1], the __DEBUG__ environment variable controls, which namespaces are printed out. The usage of regular expressions allows proper configuration.

Log-Levels are part of the namespace. The last "::" in namespace is used to separate module and level name. 

**Example**: only *INFO*, *WARN* and *ERR* messages should be printed out.  
Set the environment variable before start of application (use command *set* on Windows systems).

`DEBUG="*::INFO, *::WARN, *::ERR"`

... or define this configuration by program before you import **debug-sx**:

```js
process.env['DEBUG'] = "*::INFO, *::WARN, *::ERR";
const debugsx = require('debug-sx');
...
```

## Conventions for namespaces

> If you're using this in one or more of your libraries, you _should_ use the name of your library so that developers may toggle debugging as desired without guessing names. If you have more than one debuggers you _should_ prefix them with your library name and use ":" to separate features. For example "bodyParser" from Connect would then be "connect:bodyParser".

-------------------------------------------------

#### Additional features of debug-sx: ####
Use "::" in namespace to add a **level**. You can name the level as you need.  
Some level names are preconfigured: INFO, WARN, ERR,CONF, FINE, DEB


## Wildcards

> The `*` character may be used as a wildcard. Suppose for example your library has debuggers named "connect:bodyParser", "connect:compress", "connect:session", instead of listing all three with `DEBUG=connect:bodyParser,connect:compress,connect:session`, you may simply do `DEBUG=connect:*`, or to run everything using this module simply use `DEBUG=*`.

> You can also exclude specific debuggers by prefixing them with a "-" character.  For example, `DEBUG=*,-connect:*` would include all debuggers except those starting with "connect:".

## Environment Variables

> When running through Node.js, you can set a few environment variables that will change the behavior of the debug logging:

| Name      | Purpose                                         |
|-----------|-------------------------------------------------|
| `DEBUG`   | Enables/disables specific debugging namespaces. |
| `DEBUG_COLORS`| Whether or not to use colors in the debug output. |
| `DEBUG_DEPTH` | Object inspection depth. |
| `DEBUG_SHOW_HIDDEN` | Shows hidden properties on inspected objects. |

>  __Note:__ The environment variables beginning with `DEBUG_` end up being converted into an Options object that gets used with `%o`/`%O` formatters. 

> See the Node.js documentation for [`util.inspect()`](https://nodejs.org/api/util.html#util_util_inspect_object_options) for the complete list.

---------------------------------------------

#### Additional features of debug-sx: ####

A couple of additional environment variables are possible:

| Name      | Purpose                                         |
|-----------|-------------------------------------------------|
| `DEBUG_WMODULE`   | Fixed minimum width of the module name when printed out. Missing characters will be filled with spaces. |
| `DEBUG_WLEVEL`   | Fixed minimum width of the level name when printed out. Missing characters will be filled with spaces. |
| `DEBUG_WTIMEDIFF`   | Fixed minimum width of the time diff value when printed out. Missing characters will be filled with spaces. |
| `DEBUG_TIME`   | Format of printed out time stamp. The format of the module [dateformat][2] can be used<br>Example: 'ddd, yyyy-mm-dd HH:MM:ss.l'  |
| `DEBUG_PREFIX`   | General prefix used on all messages. |
| `DEBUG_LOCATION`   | Enables/disables specific location output namespaces. |
| `DEBUG_STREAM`   | Default output for console handlers. The values `stdout` oder `stderr` are used. If no value is given, `stderr` is used. |

Object inspect definitions can also be given in a dedicated way to one handler or one debug instance.

For an example see file [example.js][4].

## Formatters
> Debug uses [printf-style](https://wikipedia.org/wiki/Printf_format_string) formatting. Below are the officially supported formatters:

| Formatter | Representation |
|-----------|----------------|
| `%O`      | Pretty-print an Object on multiple lines. |
| `%o`      | Pretty-print an Object all on a single line. |
| `%s`      | String. |
| `%d`      | Number (both integer and float). |
| `%j`      | JSON. Replaced with the string '[Circular]' if the argument contains circular references. |
| `%%`      | Single percent sign ('%'). This does not consume an argument. |

---------------------------------------------

#### Additional features of debug-sx: ####

A couple of additional formatters are available:

| Formatter | Representation |
|-----------|----------------|
| `%e`      | Pretty-print an error object with call stack. If the error object contains the attribute *cause*, the value of *cause* (normally a error object too) is printed as error after a "Caused by:" line. This principle is repeated as long, as the error object has an attribute *cause*. |
| `%l`      | Print the source code location |
| `%f`      | Print the result of a callback function. The callback function must be given as parameter and returns a string. |


### Custom formatters

> You can add custom formatters by extending the `debug.formatters` object. For example, if you wanted to add support for rendering a Buffer as hex with `%h`, you could do something like:

```js
const createDebug = require('debug')
createDebug.formatters.h = (v) => {
  return v.toString('hex')
}

// …elsewhere
const debug = createDebug('foo')
debug('this is hex: %h', new Buffer('hello world'))
//   foo this is hex: 68656c6c6f20776f726c6421 +0ms
```

## Browser support

There is no browser support and therefor Web Inspector Colors are not supported.

## Output streams

> By default `debug` will log to stderr, however this can be configured per-namespace by overriding the `log` method.

---------------------------------------------

#### Additional features of debug-sx: ####

`debug-sx` offers handlers for console and files. See the chapter [Handlers](#handlers).

## Colors

Colors can be configured globally using environment variables, or indivdually on handler. As example it is possible to use colors for console and to avoid colors for log file output.

Colors will be defined by a color record:

```js
{
  namespace: "main.INFO",
  color:"blue",
  inverse:true 
}
```
Instead of `namespace`, you can also use `module` or `level` to define which namespace should be covered by this color record. It is also allowed to use regular expressions or wildcards in the string. Any string beginning with "/" and ending with "/" is converted into a regular expression. 

The available colors are:  
*bold*, *italic*, *underline*, *white*, *grey*, *black*,  *blue*, *cyan*, *green*, *magenta*, *red* and *yellow*.

__Hint:__ Hold in mind, that support of color depends on terminal type.

These color records will be combined to an array table, which can be used when a handler is created.

```js
let colorConfig = [
  { level: /DEB*/, color: 'cyan', inverse: true },
  { level: /FINE*/, color: 'white', inverse: true },
  { level: /CONF*/, color: 'magenta', inverse: true },
  { level: /INFO*/, color: 'green', inverse: true },
  { level: 'WARN', color: 'yellow', inverse: true },
  { level: 'ERR', color: 'red', inverse: true }
];
```
This example is used as *default color table* when no custom colors are configured.

## Handlers

Handlers are used to direct the messages in different style and visiblity to different targets.

For example, you can print out all messages to a log file without locations and colors and in parallel print out "WARN" and "ERR" level messages to the console with location and in a colored style.

General format rules, for example the timestamp format, cannot be set individually, in order to prevent loss of performance.

If no handler is configured, a default console handler for `stderr` will be used by default.

There are two handler types available:
* console handler (for `stdout` or `stderr`)
* file handler

Handlers can be added or removed while runtime. But hold in mind, that on each change of handler, all debug instances are checked if they are covered by this change. This may need some amount of time, depending of the quantity of debug instances created up to now.

### Usage

Simple Example for parallel logging to console and file:

```js
const debugsx = require('debug-sx');
const debug = {};
      debug.info = debugsx('main::INFO');

let h1 = debugsx.createConsoleHandler();
let h2 = debugsx.createFileHandler('/tmp/app.log');
debugsx.addHandler(h1, h2);
```
The create functions accept up to four parameters:

| Parameter | Description |
|-----------|----------------|
| First     | filename for `createFileHandler`. |
| First     | output for `createConsoleHandler`, the values `stdout` and `stderr` are allowed. |
| Second     | comma seperated list of enabled namespaces (use prefix '-' to disable namespaces). |
| Third    | comma seperated list of namespaces, where also locations should be printed (use prefix '-' to disable). |
| Fourth    | color table (use undefined if no individually color table is desired).|

## Typescript

Typescript definition file is included in this module.

Example for a typescript source file:


```ts
import * as debugsx from "debug-sx";

const debug: debugsx.ISimpleLogger = debugsx.createSimpleLogger('main');
let h : debugsx.IHandler = debugsx.createConsoleHandler('stdout', "*");
debugsx.addhandler(h);

debug.info('Start of application');
debug.warn(new Error('This is an exception'));
```
There are three default loggers available:
1)  **ISimpleLogger**  
    Levels: *info*, *warn*
2)  **IDefaultLogger**   
    Levels: *fine*, *config*, *info*, *warn*
3)  **IFullLogger**  
    Levels: *finest*, *finer*, *fine*, *config*, *info*, *warn*, *severe*

You can also define custom levels:
```ts
import * as debugsx from "debug-sx";

const debug: {
  debx: debug.IDebugger, 
  info: debug.IDebugger, 
  warn: debug.IDebugger 
} = {
  debx: debugsx('main::DEBX'),
  info: debugsx('main::INFO'),
  warn: debugsx('main::WARN')
};

let h : debugsx.IHandler = debugsx.createConsoleHandler('stdout', "*");
debugsx.addhandler(h);

debug.debx('Start of application');
```

Find more information about the interface and the available functions in the file [index.d.ts][3].


## Advanced example ##

Example for parallel logging to console and file:

```js
process.env['DEBUG'] = "*::INFO, *::WARN, *::ERR";
process.env['DEBUG_LOCATION'] = "*::INFO";
process.env['DEBUG_COLORS'] = "true";
process.env['DEBUG_STREAM'] = "stdout";
process.env['DEBUG_WMODULE'] = "15";
process.env['DEBUG_WLEVEL'] = "6";
process.env['DEBUG_WTIMEDIFF'] = "6";
process.env['DEBUG_TIME'] = "ddd, yyyy-mm-dd HH:MM:ss.l";

const debugsx = require('debug-sx');
const debug = {};
      debug.info = debugsx('main::INFO');
      debug.warn = debugsx('main::WARN');

let hc = debugsx.createConsoleHandler('stdout', "*", "-*", []);
let hf = debugsx.createFileHandler(
           '/tmp/app.log',    // file name
           '*::ERR,*::WARN',  // enabled namespaces
           "*::ERR,-*::INFO", // enabled for printing location
           [
             { level: "ERR", color:"red", inverse:true },
             { namespace: /.*::WARN/, color:"blue", inverse:true },
             { module: "server*", color:"magenta"}
           ]);

debugsx.addHandler(hc, hf);

debug.info('Start of application');
debug.warn('Message should be visible in file...');

debugsx.removeHandler(hf);
debug.info('Message only visible on console');

setTimeout(() => { debug.info('end of application') }, 1000);

```


[1]: https://www.npmjs.com/package/debug
[2]: https://www.npmjs.com/package/dateformat
[3]: https://github.com/ManfredSteiner/debug-sx/blob/work/index.d.ts
[4]: https://github.com/ManfredSteiner/debug-sx/blob/work/example.js
