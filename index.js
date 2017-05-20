const debug = require('debug');
const debugOriginal = debug;

const sprintf = require('sprintf-js').sprintf;
const dateFormat = require('dateformat');
const fs = require('fs');
const util = require('util');
const semver = require('semver');
const handler = require('./handler')

exports.humanize = require('ms');

debug['loggers'] = [];

function init () {
  if (exports.location)
    return;
  
  exports.colors = process.env['DEBUG_COLORS'];
  
  exports.sprefix = '';
  if (process.env['DEBUG_PREFIX'] !== undefined) {
    exports.sprefix = process.env['DEBUG_PREFIX'];
  }
  
  let modulewidth = process.env['DEBUG_MODULEWIDTH'];
  if (modulewidth === undefined)
    modulewidth = 1;
  
  let levelwidth = process.env['DEBUG_LEVELWIDTH'];
  if (levelwidth === undefined)
    levelwidth = 1;
  
  exports.npattern =  '%-' + modulewidth + 's %-' + levelwidth + 's';
  
  exports.tpattern = 'HH:MM:ss.l';
  if (process.env['DEBUG_TIME']) {
    exports.tpattern = process.env['DEBUG_TIME'];
  }  

  if (process.env['DEBUG_TIMEDIFF']) {
    exports.dpattern = '+%-' + process.env['DEBUG_TIMEDIFF'] + 's';
  }  

  exports.format = function (diff, module, level, msg) {
    let c = false;
    let x = this.colors;
    if (exports.defaultColorTable && exports.defaultColorTable[level]) {
      c = exports.defaultColorTable[level];
    }
    let sname = sprintf(exports.npattern, module, level);
    let stime = exports.tpattern ? dateFormat(new Date(), exports.tpattern) : '';
    let sdiff = exports.dpattern ? sprintf(exports.dpattern, debug.humanize(diff)) : '';      
    let prefix = exports.sprefix + stime + ' ' + sdiff + ' ' + sname + ' ';
    let eprefix = ' '.repeat(prefix.length);
    let firstLine = c ? c + prefix + '\u001b[0m' : prefix;       
    return firstLine + msg.split('\n').join('\n' + eprefix);
  };
  
  let locNamespaces = process.env['DEBUG_LOCATION'];
  if (locNamespaces === undefined) {
    exports.location = null;
    return;
  }
  
  var split = (locNamespaces || '').split(/[\s,]+/);
  var len = split.length;
  var names = [];
  var skips = [];

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    locNamespaces = split[i].replace(/\*/g, '.*?');
    if (locNamespaces[0] === '-') {
      skips.push(new RegExp('^' + locNamespaces.substr(1) + '$'));
    } else {
      names.push(new RegExp('^' + locNamespaces + '$'));
    }
  }

  exports.location = {};
  exports.location.skips = skips;
  exports.location.names = names;
  exports.handlers = [ debug.createDefaultHandler() ];
}

debug.formatArgsOriginal = debug.formatArgs;
debug.formatArgs = function formatArgs(args) {
  if (!this.handlers) {
    debug.formatArgsOriginal.call(this, args);
  }
}


debug.log = function (...p) {
  if (!this.handlers) {
    // no debug-sx init() done, use original debug log function
    let logFn = exports.log || console.log.bind(console);
    logFn.apply(debug, p);
  } else {
    let s = formatLogData(p);
    let i = this.namespace.lastIndexOf('.');
    let module = i !== -1 ? this.namespace.substr(0, i) : this.namespace;
    let level = i !== -1 ? this.namespace.substr(i+1) : '';
    let date = new Date();
    if (this.handlers) {
      let msg, msgl, prefix;
      for (let h of this.handlers) {
        if (!msg) {
          let sname = sprintf(exports.npattern, module, level);
          let stime = exports.tpattern ? dateFormat(this.curr, exports.tpattern) : '';
          let sdiff = exports.dpattern ? sprintf(exports.dpattern, debug.humanize(this.diff)) : '';      
          prefix = exports.sprefix + stime + ' ' + sdiff + ' ' + sname;
          let eprefix = ' '.repeat(prefix.length);
          msg = ' ' + s.split('\n').join('\n' + eprefix);
        }
        if (h.isLocationDesired(module, level)) {
          location = '\n    ' + (new Error).stack.split('\n')[3];
          msgl = msg + location.split('\n').join('\n' + eprefix);
        }
        let colors = h.getColorCodes(module, level);

        if (h.wstream) {
          if (colors) {
            h.wstream.write(colors.on);
            h.wstream.write(prefix);
            h.wstream.write(colors.off);
          } else {
            h.wstream.write(msgl ? msgl :msg);
          }
          h.wstream.write('\n');         
        } else if (hname === 'console') {
          if (h.location) {
            if (colors)
            console.log(colors.on + prefix + colors.off + msgl ? msgl : msg);
          } else {
            console.log(cOn + prefix + cOff + msg);
          }
        }
      }
    }
  }
};


function locationEnabled (name) {
  if (!exports.location)
    return;
  
  var i, len;
  for (i = 0, len = exports.location.skips.length; i < len; i++) {
    if (exports.location.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.location.names.length; i < len; i++) {
    if (exports.location.names[i].test(name)) {
      return true;
    }
  }
  return false;
}



debug.formatters.l = (v) => {
  return '\n    ' + (new Error).stack.split('\n')[6];
};

debug.formatters.e = (e) => {
  if (e instanceof Error) {
    let rv = e.stack || e.message;
    while (e.cause && e.cause instanceof Error) {
      e = e.cause;
      rv += '\nCaused by: ' + e.stack || e.message;
    }
    return rv;
  }
  return JSON.stringify(e);
};



// setting group to change output channel
debug.setGroup = function (groupname, ...debug) {
  if (Array.isArray(debug)) {
    for (let d of debug) {
      if (!d.groups[groupname]) {
        d.groups[groupname] = { enabled: true, useColors: debug.useColors };
        d.consoleEnabled = false;
      }
    }
  }
};

// to monitor file use tail -f <file> or less -RS +F <file> 
// or less -RS <file> and press Shift f (CTRL C to stop waiting)
debug.openLogFile = function(filename, groupname) {
  let sname = groupname ? groupname + '_wstream' : 'default_wstream';
  let wstream = fs.createWriteStream(filename, {flags: 'a'});
  debug[sname] = wstream;
  wstream.on('finish', function () {
    console.log('log file ' + filename + ' has been written');
  });
  wstream.on('error', function (err) {
    console.log('log file ' + filename + ' error');
    console.log(err);
  });
  wstream.on('close', function () {
    console.log('log file ' + filename + ' closed');
  });
};


debug.closeLogFile = function(groupname) {
  let sname = groupname ? groupname + '_wstream' : 'wstream';
  if (debug[sname]) {
    debug[sname].close();
    delete debug[sname];
  }
};

debug.setColor = function(name, color) {
  if (!debug.colors)
    debug.colors = {};
  if (!color && debug.colors[name]) {
    delete debug.colors[name];
  } else {
    debug.colors[name] = color;
  }
};

debug.enableColors = function(enable, groupName) {
  if (!debug.colors)
    debug.colors = {};
  let oldValue = groupName;
  
}

debug.createDefaultHandler = function () {
  return handler.createHandler('console', process.stdout, handler.defaultColorTable);
}

debug.createHandler = function (name, stream, colors) {
  return handler.createHandler(name, stream, colors);
}

debug.createDebug = function(namespace, opts) {
  //debug.inspectOpts.colors = false;
  let d = debug(namespace);
  debug.loggers.push(d);
  if (!exports.handlers)
    init();
  d.handlers = exports.handlers.slice();

  if (opts) {
    if (opts.inspectOpts) {
      d.useColors = opts.inspectOpts.colors;
      d.inspectOpts = opts.inspectOpts;
    } else {
      d.useColors = false;
    }
    if (opts.colors) {
      d.handlers = [ debug.createDefaultHandler() ];
      for (let h of d.handlers) {
        h.updateColorTable(opts.colors);
      }
    }
  }

  d['addHandler'] = function (name, config) { 
    d.handlers[name] = true; 
  };
  d['removeHandler'] = function (name) {
    delete d.handlers[name]; 
    if (Object.keys(d.handlers).length === 0)
      debug.handlers.console = { };
  };
  
  return d;
};

debug.originalEnable = debug.enable;
debug.enable = function(namespaces) {
  debug.originalEnable(namespaces);
  let isEnabled = require('debug').enabled;
  for (let d of debug.loggers) {
    d.enabled = isEnabled(d.namespace);
  }
};


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





module.exports =  debug;

