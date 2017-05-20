
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
  { level: /DEB*/, color: 'cyan', inversed: true },
  { level: /FINE*/, color: 'white', inversed: true },
  { level: /CONF*/, color: 'magenta', inversed: true },
  { level: /INFO*/, color: 'green', inversed: true },
  { level: 'WARN', color: 'yellow', inversed: true },
  { level: 'ERR', color: 'red', inversed: true }
];

class Handler {
  
  constructor (name, wstream, colors, locations) {
    this.name = name;
    this.wstream = wstream ? wstream : process.stderr;
    this.colors = colors;
    this.colorTable = createColorTable(colors);
    this.locations = locations;
  }
  
  setColorTable (colors) {
    this.colors = colors;
    this.colorTable = createColorTable(colors);
  }

  updateColorTable (colors) {
    if (!Array.isArray(colors))
      colors = [ colors ];
    let ct = createColorTable(colors);
    this.colors.concat(colors);
    for (let att of Object.keys(ct.level))
      this.colorTable.level[att] = ct.level[att];
    for (let att of Object.keys(ct.module))
      this.colorTable.module[att] = ct.module[att];
    for (let re of ct.regExpLevel) {
      let found = this.colorTable.regExpLevel.filter(el => String(el.regExp) === String(re.regExp));
      if (Array.isArray(found) && found.length > 0)
        found.forEach(el => el.regExp = ct.regExp);
      else
        this.colorTable.regExpLevel.push(re);
    }
    for (let re of ct.regExpModule) {
      let found = this.colorTable.regExpModule.filter(el => String(el.regExp) === String(re.regExp));
      if (Array.isArray(found) && found.length > 0)
        found.forEach(el => el.regExp = ct.regExp);
      else
        this.colorTable.regExpModule.push(re);
    }
  }

  get getName () {
    return this.name;
  }

  get getWriteStream () {
    return this.wstream;
  }

  get getColors () {
    return this.colors;
  }
  
  getColorCodes (module, level) {
    if (!this.colorTable)
      return undefined;
    
    let rv = this.colorTable.level[level] || this.colorTable.module[module];
    if (rv)
      return rv;
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

  isLocationDesired (module, level) {
    if (typeof this.location === 'boolean')
      return this.location;
    return false;
  }

}


createColorTable = function (config) {
  let rv = { level: {}, module: {}, regExpLevel: [], regExpModule: [] };
  for (let c of config) {
    let r = {};
    r.on = c.inversed ? '\u001b[' + ansiColors['inverse'][0] + 'm' : '';
    r.on += '\u001b[' + ansiColors[c.color][0] + 'm';
    r.off = c.inversed ? '\u001b[' + ansiColors['inverse'][1] + 'm' : '';
    r.off += '\u001b[' + ansiColors[c.color][1] + 'm';
    
    if (c.level instanceof RegExp)
      r.regExp = c.level;
    else if (c.module instanceof RegExp)
      r.regExp = c.module;
    
    if (c.level instanceof RegExp) {
      rv.regExpLevel.push(r);
    } else if (typeof c.level === 'string') 
      rv.level[c.level] = r;
    
    if (c.module instanceof RegExp) 
      rv.regExpModule.push(r);
    if (typeof c.module === 'string') 
      rv.module[c.module] = r;
  }
  return rv;
}




function createHandler (name, wstream, colors) {
  return new Handler(name, wstream, colors);
}


module.exports.Handler = Handler;
module.exports.createColorTable = createColorTable;
module.exports.createHandler = createHandler;
module.exports.defaultColorTable = defaultColorTable;