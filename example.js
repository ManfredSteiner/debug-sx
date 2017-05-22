process.env['DEBUG'] = "*::INFO, *::WARN, *::ERR";
process.env['DEBUG_LOCATION'] = "*::INFO";
process.env['DEBUG_COLORS'] = "true";
process.env['DEBUG_STREAM'] = "stdout";
process.env['DEBUG_WMODULE'] = "15";
process.env['DEBUG_WLEVEL'] = "6";
process.env['DEBUG_WTIMEDIFF'] = "6";
process.env['DEBUG_TIME'] = "ddd, yyyy-mm-dd HH:MM:ss.l";

const debugsx = require('debug-sx');
const version = '1.0';

const debug = {};
      debug.fine = debugsx('main::FINE');
      debug.info = debugsx('main::INFO');
      debug.warn = debugsx('main::WARN');
      debug.err = debugsx('main::ERR');

const testobject = { name: 'to', value: '1000' };

debug.info('Start of application, version %s', version);
debug.fine('Test object %o', testobject);
debug.warn('Not implemented yet');
debug.err('There is a problem ... %e', new Error('Problem 1'));

console.log('Hello world');

setTimeout(() => {
   debug.info('end of application');
}, 1000);

