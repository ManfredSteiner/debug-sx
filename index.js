const debug = require('debug');
const debugOriginal = debug;

const sprintf = require('sprintf-js').sprintf;
const dateFormat = require('dateformat');
const fs = require('fs');
const util = require('util');
const semver = require('semver');
const handler = require('./handler')

module.exports =  debug;
debug.humanize = require('ms');

debug.sprefix = process.env['DEBUG_PREFIX'] || ''; 
debug.modulewidth = +process.env['DEBUG_WMODULE'] || 1;
debug.levelwidth = +process.env['DEBUG_WLEVEL'] || 1;
debug.npattern =  '%-' + debug.modulewidth + 's %-' + debug.levelwidth + 's';
debug.tpattern = process.env['DEBUG_TIME'] || 'HH:MM:ss.l';
debug.dpattern = process.env['DEBUG_WTIMEDIFF'] ? '+%-' + process.env['DEBUG_WTIMEDIFF'] + 's' : '';

if (process.env['DEBUG_COLORS'] === undefined) {
  process.env['DEBUG_COLORS'] = 'true';
}

debug.loggers = [];
debug.handlers = [];
debug.defaultHandler = handler.createConsoleHandler();

debug.formatArgsOriginal = debug.formatArgs;
debug.formatArgs = function formatArgs(args) {
  if (!this.activeHandlers) {
    debug.formatArgsOriginal.call(this, args);
  }
}

debug.log = function (...p) {
  if (!Array.isArray(this.activeHandlers)) {
    // no debug-sx object, use original debug log function
    let logFn = exports.log || console.log.bind(console);
    logFn.apply(debug, p);
    return;
  }

  let s = formatLogData(p);
  let sname = sprintf(debug.npattern, this.module, this.level);
  let stime = debug.tpattern ? dateFormat(this.curr, debug.tpattern) : '';
  let sdiff = debug.dpattern ? sprintf(debug.dpattern, debug.humanize(this.diff)) : '';      
  let prefix = debug.sprefix + stime + ' ' + sdiff + ' ' + sname;
  let eprefix = ' '.repeat(prefix.length);
  let split = s.split('\n');
  let msg;
  if (split.length > 1)
    msg = ' ' + split.join('\n ' + eprefix) + '\n' + eprefix + ' -----------------------------------------------------';
  else
    msg = ' ' + split;
  let msgl;

  for (let ah of this.activeHandlers) {
    if (!ah.enabled) continue;
    if (ah.locationEnabled && !msgl) {
      let location = '\n ' + (new Error).stack.split('\n')[3];;
      msgl = msg + location.split('\n').join('\n' + eprefix);
    }
    ah.write(ah.colorOn);
    ah.write(prefix);
    ah.write(ah.colorOff);
    ah.write(ah.locationEnabled ? msgl : msg);
    ah.write('\n');
  }

}

debug.createDebug = function(namespace, opts) {
  debug.opts = opts;
  let d = debug(namespace);
  delete debug.opts;
  return d;
};

debug.initOriginal = debug.init;
debug.init = function (d) {
  debug.initOriginal(d);
  if (typeof debug.opts === 'object') {
    for (let att in debug.opts) 
      d.inspectOpts[att] = debug.opts[att];
  }
  let i = d.namespace.lastIndexOf('::');
  d.module = i !== -1 ? d.namespace.substr(0, i) : d.namespace;
  d.level = i !== -1 ? d.namespace.substr(i+2) : '';
  d.init = init.bind(d);
  d.init();
  debug.loggers.push(d);
}

init = function () {
  this.activeHandlers = [];
  this.locationEnabled = false;
  this.useColors = true;
  let handlers = debug.handlers.length === 0 ? [ debug.defaultHandler ] : debug.handlers; 
  for (let h of handlers) {
    if (!h.enabled(this.namespace)) continue;
    let locationEnabled = h.locationEnabled(this.namespace);
    let colorCodes;
    if (h.colorTable) 
      colorCodes = h.getColorCodes(this.namespace, this.module, this.level);
    else
      this.useColors = false;

    let ah = new handler.ActiveHandler(h, colorCodes, true, locationEnabled);
    this.locationEnabled = this.locationEnabled || locationEnabled;
    this.activeHandlers.push(ah);
  }
  this.enabled = this.activeHandlers.length > 0;
  
}


debug.createConsoleHandler = handler.createConsoleHandler;
debug.createFileHandler = handler.createFileHandler;

debug.addHandler = function (...handler) {
  if (!Array.isArray(handler))
    handler = [ handler ];
  this.handlers = this.handlers.concat(handler);
  for (let d of debug.loggers)
    d.init();
}
 
 
debug.removeHandler = function (handler) {
  let i = this.handlers.findIndex(h => handler === h);
  if (i < 0)
    return false;
  this.handlers.splice(i, 1);
  for (let d of debug.loggers)
    d.init();
  return true;
}

debug.formatters.l = function (v) {
  return '\n    ' + (new Error).stack.split('\n')[6];
};

debug.formatters.e = function (e) {
  if (e instanceof Error) {
    let rv = e.stack || e.message;
    while (e.cause && e.cause instanceof Error) {
      e = e.cause;
      rv += '\nCaused by: ' + e.stack || e.message;
    }
    return rv;
  }
  x = this.inspectOpts;
  return util.inspect(e, x).replace(/\s*\n\s*/g, ' ');
};

debug.formatters.f = function (f) {
  if (typeof f === 'function') {
    return f.call(this);
  }
  return '';
}


// function from log4js / layout.js
function wrapErrorsWithInspect(items) {
  return items.map(function(item) {
    if ((item instanceof Error) && item.stack) {
      return { inspect: function() {
        if (semver.satisfies(process.version, '>=6')) {
          return util.format(item);
        } else {
          return util.format(item) + '\n' + item.stack;
        }
      } };
    } else {
      return item;
    }
  });
}

// function from log4js / layout.js
function formatLogData(logData) {
  var data = logData;
  if (!Array.isArray(data)) {
    var numArgs = arguments.length;
    data = new Array(numArgs);
    for (var i = 0; i < numArgs; i++) {
      data[i] = arguments[i];
    }
  }
  return util.format.apply(util, wrapErrorsWithInspect(data));
}

debug.createSimpleLogger = function (namespace) {
  return {
    info: debug.createDebug(namespace + '::INFO'),
    warn: debug.createDebug(namespace + '::WARN')
  };
}

debug.createDefaultLogger = function (namespace) {
  return  {
    fine:   debug.createDebug(namespace + '::FINE'),
    config: debug.createDebug(namespace + '::CONFIG'),
    info:   debug.createDebug(namespace + '::INFO'),
    warn:   debug.createDebug(namespace + '::WARN'),
  };
}
debug.createFullLogger = function (namespace) {
  return  {
    finest: debug.createDebug(namespace + '::FINEST'),
    finer:  debug.createDebug(namespace + '::FINER'),
    fine:   debug.createDebug(namespace + '::FINE'),
    config: debug.createDebug(namespace + '::CONFIG'),
    info:   debug.createDebug(namespace + '::INFO'),
    warn:   debug.createDebug(namespace + '::WARN'),
    severe: debug.createDebug(namespace + '::SEVERE')
  };
}



