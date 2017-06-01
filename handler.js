
const fs = require('fs');

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
ansiColors = {
  'bold': [1, 22],
  'italic': [3, 23],
  'underline': [4, 24],
  'inverse': [7, 27],
  'white': [37, 39],
  'grey': [90, 39],
  'black': [30, 39],
  'blue': [34, 39],
  'cyan': [36, 39],
  'green': [32, 39],
  'magenta': [35, 39],
  'red': [31, 39],
  'yellow': [33, 39]
};

defaultColorTable = [  
  { level: /DEB.*/, color: 'cyan', inverse: true },
  { level: /FINE.*/, color: 'white', inverse: true },
  { level: 'CONFIG', color: 'magenta', inverse: true },
  { level: 'INFO', color: 'green', inverse: true },
  { level: 'WARN', color: 'yellow', inverse: true },
  { level: 'SEVERE', color: 'red', inverse: true }
];


// export interface IHandler {
//   handler: NodeJS.WritableStream | LogFileStream | ConsoleStream;
//   namespace: string;
//   locationNamespace: string;
//   names: RegExp [],
//   skips: RegExp [],
//   location: { names: RegExp [], skips: RegExp [] },
//   colors: string,
//   colorTable: string
// }
class Handler {
  constructor (hstream, namespaces, locationNamespaces, colors) {
    this.hstream = hstream;
    this.namespaces = namespaces || '*';
    this.locationNamespaces = locationNamespaces || '';
    this.colors = colors || true;
    
    this.names = [];
    this.skips = [];
    this.location = { names: [], skips: [] };

    let split = (namespaces || '').split(/[\s,]+/);
    for (let s of split) {
      if (!s) continue; // ignore empty strings
      let n = s.replace(/\*/g, '.*?');
      if (n[0] === '-') {
        this.skips.push(new RegExp('^' + n.substr(1) + '$'));
      } else {
        this.names.push(new RegExp('^' + n + '$'));
      }
    }

    split = (locationNamespaces || '').split(/[\s,]+/);
    for (let s of split) {
      if (!s) continue; // ignore empty strings
      let n = s.replace(/\*/g, '.*?');
      if (n[0] === '-') {
        this.location.skips.push(new RegExp('^' + n.substr(1) + '$'));
      } else {
        this.location.names.push(new RegExp('^' + n + '$'));
      }
    }
    if (typeof colors === 'boolean' || colors === 'true' || colors ==='false') {
      let c = (colors === true || colors === 'true');
      this.colorTable = c ? createColorTable(defaultColorTable) : undefined;
    } else if (colors)
      this.colorTable = createColorTable(colors);

    this.getColorCodes = getColorCodes.bind(this);  
  }

  end () {
    this.hstream.end();
  }

  enabled (name) {
    for (let re of this.skips) {
      if (re.test(name)) {
        return false;
      }
    }
    for (let re of this.names) {
      if (re.test(name)) {
        return true;
      }
    }
    return false;
  }

  locationEnabled (name) {
    for (let re of this.location.skips) {
      if (re.test(name)) {
        return false;
      }
    }
    for (let re of this.location.names) {
      if (re.test(name)) {
        return true;
      }
    }
    return false;
  }
}


// export interface IActiveHandler {
//   handler: IHandler;
//   colorOn: string;
//   colorOff: string;
//   locationEnabled: boolean;
// }
class ActiveHandler {
  constructor (handler, colorCodes, enabled, locationEnabled) {
    this.handler = handler;
    this.colorOn = colorCodes ? colorCodes.on : '';
    this.colorOff = colorCodes ? colorCodes.off : '';
    this.enabled = enabled;
    this.locationEnabled = locationEnabled;
    this.write = handler.hstream.write.bind(handler.hstream);
  }
}

class HandlerWriteStream {
  constructor (wstream) {
    this.wstream = wstream;
    this.writeable = true;
  }
  
  write (...args) {
    if (this.writeable)
      return this.wstream.write.apply(this.wstream, args);
    else
      return false;
  }

  end () {
    if (this.writeable) {
      this.wstream.end();
      this.writeable = false;
    }
  }
}

class HandlerConsoleStream extends HandlerWriteStream {
  constructor (name) {
    super(process[name]);
    this.name = name;
  }

  end () {
    if (this.writeable) 
      this.writeable = false;
  }
}

class HandlerFileStream extends HandlerWriteStream {
  constructor (filename, wstream) {
    super(wstream ? wstream : fs.createWriteStream(filename, {flags: 'a'}));
    if (!wstream) {
      this.wstream.on('finish', function () {
        console.log('log file ' + filename + ' has been written');
      });
      this.wstream.on('error', function (err) {
        console.log('log file ' + filename + ' error');
        console.log(err);
      });
      this.wstream.on('close', function () {
        console.log('log file ' + filename + ' closed');
      });  
    }
    this.filename = filename;
  }
}

function convertPattern (pattern) {
  if (!pattern || (pattern instanceof RegExp))
    return pattern;
  
  if (typeof pattern !== 'string')
    return undefined; // value ignored

  if (pattern.indexOf('*') > 0 || (pattern.startsWith('/') && pattern.endsWith('/')) ) {
    let e = pattern.replace(/\*/g, '.*?');
    if (e.startsWith('/') && e.endsWith('/'))
      e = e.substr(1, e.length-2);
    return new RegExp('^' + e + '$')
  }

  return pattern;
}

function createColorTable (config) {
  let rv = { namespace: {}, level: {}, module: {}, regExpNamespace: [], regExpLevel: [], regExpModule: [] };
  if (!config)
    return rv;
  if (!Array.isArray(config))
    config = [ config ];

  for (let c of config) {
    let r = {};
    r.on = c.inverse ? '\u001b[' + ansiColors['inverse'][0] + 'm' : '';
    r.on += '\u001b[' + ansiColors[c.color][0] + 'm';
    r.off = c.inverse ? '\u001b[' + ansiColors['inverse'][1] + 'm' : '';
    r.off += '\u001b[' + ansiColors[c.color][1] + 'm';
    
    let pL = convertPattern(c.level);
    let pM = convertPattern(c.module);
    let pN = convertPattern(c.namespace);

    if (pN instanceof RegExp)
      r.regExp = pN;
    else if (pL instanceof RegExp)
      r.regExp = pL;
    else if (pM instanceof RegExp)
      r.regExp = pM;

    if (pN instanceof RegExp)
      rv.regExpNamespace.push(r);
    else if (pN) 
      rv.namespace[pN] = r;

    if (pL instanceof RegExp) 
      rv.regExpLevel.push(r);
    else if (pL) 
      rv.level[pL] = r;
    
    if (pM instanceof RegExp) 
      rv.regExpModule.push(r);
    else if (pM) 
      rv.module[pM] = r;
  }
  return rv;
}

function getColorCodes (namespace, module, level) {
    if (!this.colorTable)
      return undefined;
    
    let rv = this.colorTable.namespace[namespace] || this.colorTable.level[level] || this.colorTable.module[module];
    if (rv)
      return rv;
    
    for (let r of this.colorTable.regExpNamespace) {
      if (r.regExp.test(namespace))
        return r;
    }
    for (let r of this.colorTable.regExpLevel) {
      if (r.regExp.test(level))
        return r;
    }
    for (let r of this.colorTable.regExpModule) {
      if (r.regExp.test(module))
        return r;
    }
    
    return undefined;
  }

function createConsoleHandler (fd, namespaces, locationNamespaces, colors) {
  if (typeof filename === 'object') {
    let config = fd;
    fd = config.fd;
    namespaces = config.namespaces;
    locationNamespaces = config.locationNamespaces;
    colors = config.colors;
  }
  fd = fd || process.env['DEBUG_STREAM'] || 'stderr';
  namespaces = namespaces || process.env['DEBUG'];
  locationNamespaces = locationNamespaces || process.env['DEBUG_LOCATION'];
  colors = colors || process.env['DEBUG_COLORS'];
  let hstream = new HandlerConsoleStream(fd ? fd : 'stderr');
  return new Handler(hstream, namespaces, locationNamespaces, colors);
}

function createFileHandler (filename, namespaces, locationNamespaces, colors) {
  if (typeof filename === 'object') {
    let config = filename;
    filename = config.filename;
    namespaces = config.namespaces;
    locationNamespaces = config.locationNamespaces;
    colors = config.colors;
  }
  namespaces = namespaces || process.env['DEBUG'];
  locationNamespaces = locationNamespaces || process.env['DEBUG_LOCATION'];
  colors = colors || process.env['DEBUG_COLORS'];
  let hstream = new HandlerFileStream(filename);
  return new Handler(hstream, namespaces, locationNamespaces, colors);
}


module.exports.ActiveHandler = ActiveHandler;
module.exports.createConsoleHandler = createConsoleHandler; 
module.exports.createFileHandler = createFileHandler;