// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"scripts/log.js":[function(require,module,exports) {
const debug = process.env.DEBUG;
let minLength = 1;
const resetColor = '\x1b[0m';
const terminalColors = {
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m'
};

module.exports = function (name, color = 'green', debugOnly = false) {
	if (minLength < name.length + 1) minLength = name.length + 1;

	const isBrowser = typeof window !== 'undefined';
	let browserPrefix = name + ' ';
	while (browserPrefix.length < minLength) browserPrefix += ' ';
	browserPrefix += '| ';
	if (isBrowser) return (...args) => {
		console.log(`%c${browserPrefix}%c`, `color: ${color}`, `color: black`, ...args);
	};

	if (debugOnly && !debug) return () => undefined;
	return (...args) => {
		let prefix = name + ' ';
		while (prefix.length < minLength) prefix += ' ';
		prefix += '| ';
		const colorCode = terminalColors[color] || terminalColors.white;
		const time = new Date();
		const timeStamp = twoDigits(time.getHours()) + ':' + twoDigits(time.getMinutes()) + ':' + twoDigits(time.getSeconds());
		console.log(colorCode + (timeStamp + ' ' + prefix) + resetColor, ...args);
	};
};

function twoDigits(d) {
	if (0 <= d && d < 10) return "0" + d.toString();
	if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
	return d.toString();
}
},{}],"app.js":[function(require,module,exports) {
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt');
const calledFromCommandLine = require.main === module;
const log = require('./scripts/log');

const status = log('success');
const err = log('sharper error', 'red');

const DEFAULT_SOURCE = './';
const DEFAULT_OUTPUT_FOLDER = 'resized';

const promptSettings = {
  properties: {
    source: {
      required: true,
      default: DEFAULT_SOURCE
    },
    outputFolder: {
      required: false,
      default: DEFAULT_OUTPUT_FOLDER
    },
    width: {
      pattern: /^\d*$/,
      message: 'Must be an integer',
      type: 'integer',
      required: false
    },
    height: {
      pattern: /^\d*$/,
      message: 'Must be an integer',
      type: 'integer',
      required: false
    }
  }
};

if (calledFromCommandLine) {
  prompt.start();
  runPrompt();
}

function runPrompt() {
  prompt.get(promptSettings, async (err, enteredOptions) => {
    if (err) return err(err);
    await resizeProgrammatically(enteredOptions);
    runPrompt();
  });
}

function initializeResize(options) {
  return new Promise(async resolve => {
    const results = await resizeProgrammatically(options);
    resolve(results);
    // could add watching here later, etc
  });
}

function resizeProgrammatically(options) {
  return new Promise(async resolve => {

    options = checkOptions(options);
    if (options.err) {
      err(options.err);
      return resolve(options);
    }

    const messages = [];
    const source = [];
    const resized = [];
    let success, fail;

    if (isImage(options.source) || isFolder(options.source)) {

      let detailsOfImagesToResize = [];
      let detailsOfOutputFolderImages;

      if (isImage(options.source)) {
        const parsedImagePath = /(.*\/)?([^/]+\.(?:jpe?g|png))$/gim.exec(options.source);
        detailsOfImagesToResize.push({
          sourceImage: path.resolve(parsedImagePath[0]),
          sourceDir: path.resolve(parsedImagePath[1] || '.'),
          fileName: parsedImagePath[2]
        });
        if (!options.overwrite) detailsOfOutputFolderImages = await getDataOfImageFilesInFolder(path.resolve(parsedImagePath[1] || '.', options.outputFolder));
      } else {
        const sourceDetails = await getDataOfImageFilesInFolder(options.source);
        // need to check for returned error here
        detailsOfImagesToResize.push(...sourceDetails);
        if (!options.overwrite) detailsOfOutputFolderImages = await getDataOfImageFilesInFolder(path.resolve(options.source, options.outputFolder));
      }

      if (!options.overwrite) {
        // need to check for returned error here
        detailsOfImagesToResize = removeDuplicateFiles(detailsOfImagesToResize, detailsOfOutputFolderImages);
      }

      const resizedImageDetails = await resizeArrayOfImages(detailsOfImagesToResize, _extends({}, options));
      success = resizedImageDetails.length;
      fail = detailsOfImagesToResize.length - success;

      messages.push('Resized images:');
      for (let details of resizedImageDetails) {
        source.push(details.source);
        resized.push(details.output);
        messages.push(`   ${details.fileName}`);
      }
      if (resizedImageDetails.length === 0) {
        messages.pop();
      } else messages.push(`to ${path.resolve(options.source, options.outputFolder)}`);
    } else {
      messages.push('Invalid path or image type.');
      resolve({ err: 'Invalid path or image type' });
    }

    if (messages.length > 0 && calledFromCommandLine) {
      console.log('');
      for (let message of messages) status(message);
      console.log('');
    }

    resolve({ source, resized, success, fail });
  });
}

function checkOptions(options) {
  options.width = parseInt(options.width);
  options.height = parseInt(options.height);
  if (isNaN(options.width)) delete options.width;
  if (isNaN(options.height)) delete options.height;

  if (options.overwrite !== true && options.overwrite !== false) options.overwrite = false;

  options.source = (options.source || DEFAULT_SOURCE).replace(/\s+$/g, '');
  options.outputFolder = (options.outputFolder || DEFAULT_OUTPUT_FOLDER).replace(/^\//g, '');

  if (!options.width && !options.height) return { err: 'Must specify at least one valid dimension' };
  if (options.width <= 0 || options.height <= 0) return { err: 'Invalid width or height value.' };
  if (options.source.length === 0) options.source = './';

  return options;
}

function resizeArrayOfImages(fileInfo, options) {
  return new Promise(async resolve => {
    const resizePromises = fileInfo.map(async info => await resizeImage(_extends({}, options, {
      fileName: info.fileName,
      sourceImage: info.sourceImage,
      sourceDir: info.sourceDir
    })));

    Promise.all(resizePromises).then(fileInfo => resolve(fileInfo));
  });
}

async function resizeImage({ sourceImage, sourceDir, fileName, width, height, outputFolder }) {
  const outputFolderFullPath = path.resolve(sourceDir, outputFolder);
  const outputImageFullPath = outputFolderFullPath + '/' + fileName;

  await createFolder(outputFolderFullPath);

  return sharp(sourceImage).resize(width, height).max().toFile(outputImageFullPath).then(() => {
    return {
      source: path.resolve(sourceImage),
      fileName,
      output: outputImageFullPath
    };
  }).catch(e => err(e));
}

function createFolder(path) {
  return new Promise(resolve => {
    fs.access(path, err => {
      if (err && err.code !== 'EEXIST') {
        fs.mkdir(path, () => {
          resolve();
        });
      } else resolve();
    });
  });
}

function getFilesInFolder(path) {
  return new Promise(resolve => {
    fs.readdir(path, (err, files) => {
      if (err) resolve(err);else resolve(files);
    });
  });
}

function getDataOfImageFilesInFolder(sourceDir) {
  return new Promise(async resolve => {
    if (!/.*\/$/g.exec(sourceDir)) sourceDir += '/';

    let files = await getFilesInFolder(sourceDir);
    if (!Array.isArray(files)) return resolve(files); //err

    files = files.filter(path => isImage(path)).map(fileName => ({
      sourceImage: sourceDir + fileName,
      fileName,
      sourceDir
    }));

    resolve(files);
  });
}

function removeDuplicateFiles(toRemoveFrom, comparison) {
  return toRemoveFrom.map(fileData => comparison.find(comparisonData => fileData.fileName === comparisonData.fileName) ? null : fileData).filter(anyData => anyData);
}

function isImage(path) {
  return (/.+\.(?:jpe?g|png)$/gi.exec(path)
  );
}
function isFolder(path) {
  return (/^(\.*\/)?(?:([^/\n])*\/)*([^/.\n])*\/?$|^.$/gi.exec(path)
  );
}

module.exports = initializeResize;
},{"./scripts/log":"scripts/log.js"}]},{},["app.js"], null)
//# sourceMappingURL=/sharper.map