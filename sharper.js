const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const prompt = require('prompt')
const calledFromCommandLine = require.main === module

const promptSettings = {
  properties: {
    source: {
      required: true,
      default: './'
    },
    outputFolder: {
      required: false,
      default: 'resized'
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
    },
  }
}

if (calledFromCommandLine) {
  prompt.start()
  runPrompt()
}

function runPrompt () {
  prompt.get(promptSettings, async (err, result) => {
    if (err) return console.log(err)
    await resizeProgrammatically(result)
    runPrompt()
  })
}

function checkOptions (options) {
  options.width = parseInt(options.width)
  options.height = parseInt(options.height)
  if (isNaN(options.width)) delete options.width
  if (isNaN(options.height)) delete options.height

  options.source = options.source.replace(/\s+$/g, '')
  options.outputFolder = options.outputFolder.replace(/^\//g, '')

  if (!options.width && !options.height)
    return { err: 'Must specify at least one valid dimension' }
  if (options.width <=0 || options.height <= 0)
    return { err: 'Invalid width or height value.' }
  if (options.source.length === 0)
    options.source = './'
  
  return options
}

function initializeResize (options) {
  const results = resizeProgrammatically(options)
  if (!results.err && options.watch === true) {
    setInterval(() => {
      resizeProgrammatically(options)
    }, 2000)
  }
}

function resizeProgrammatically (options) {
  return new Promise(async resolve => {

    options = checkOptions(options)
    if (options.err) {
      console.log(options.err)
      return resolve(options)
    }

    const messages = []
    const source = []
    const resized = []

    if (isImage(options.source) || isFolder(options.source)) {

      const detailsOfImagesToResize = []

      if (isImage(options.source)) {
        const parsedImagePath = /(.*\/)?([^/]+\.(?:jpe?g|png))$/gim.exec(options.source)
        detailsOfImagesToResize.push({
          sourceImage: parsedImagePath[0],
          sourceDir: parsedImagePath[1] || '.',
          fileName: parsedImagePath[2],
        })
      }

      else {
        const details = await getDataOfImageFilesInFolder(options.source)
        // need to check for returned error here
        detailsOfImagesToResize.push(...details)
      }

      const resizedImageDetails = await resizeArrayOfImages(detailsOfImagesToResize, { ...options })

      messages.push('Resized images:')
      for (let details of resizedImageDetails) {
        source.push(details.source)
        resized.push(details.output)
        messages.push(`   ${details.fileName}`)
      }
      if (resizedImageDetails.length === 0) {
        messages.pop()
      }
      else
        messages.push(`to ${path.resolve(options.source, options.outputFolder)}`)

    }

    else {
      messages.push('Invalid path or image type.')
      resolve ({ err: 'Invalid path or image type' })
    }

    if (messages.length > 0) {
      console.log('')
      for (let message of messages)
        console.log(message)
      console.log('')
    }

    resolve({ source, resized })

  })
}

function resizeArrayOfImages(fileInfo, options) {
  return new Promise (async resolve => {
    const resizePromises = fileInfo
      .map(async info => await resizeImage({
        ...options,
        fileName: info.fileName,
        sourceImage: info.sourceImage,
        sourceDir: info.sourceDir
      }))

    Promise.all(resizePromises)
      .then((fileInfo) => resolve(fileInfo))
  })
}

async function resizeImage({ sourceImage, sourceDir, fileName, width, height, outputFolder }) {
  const outputFolderFullPath = path.resolve(sourceDir, outputFolder)
  const outputImageFullPath = outputFolderFullPath + '/' + fileName

  await createFolder(outputFolderFullPath)

  return sharp(sourceImage)
    .resize(width, height)
    .max()
    .toFile(outputImageFullPath)
    .then(() => {
      return {
        source: sourceImage,
        fileName,
        output: outputImageFullPath,
      }
    })
    .catch(e => console.log(e))
}

function createFolder (path) {
  return new Promise (resolve => {
    fs.access(path, (err) => {
      if (err && err.code !== 'EEXIST') {
        fs.mkdir(path, () => {
          resolve()
        })
      }
      else resolve ()
    })
  })
}

function getFilesInFolder (path) {
  return new Promise(resolve => {
    fs.readdir(path, (err, files) => {
      if (err) resolve(err)
      else resolve(files)
    })
  })
}

function getDataOfImageFilesInFolder (sourceDir) {
  return new Promise (async resolve => {
    if (!/.*\/$/g.exec(sourceDir))
      sourceDir += '/'

    let files = await getFilesInFolder(sourceDir)
    if (!Array.isArray(files))
      return resolve(files) //err

    files = files
      .filter(path => isImage(path))
      .map(fileName => ({
          sourceImage: sourceDir + fileName,
          fileName,
          sourceDir,
        })
      )

    resolve(files)
  })
}

function isImage (path) {
  return /.+\.(?:jpe?g|png)$/gi.exec(path)
}
function isFolder (path) {
  return /^(\.*\/)?(?:([^/\n])*\/)*([^/.\n])*\/?$|^.$/gi.exec(path)
}

module.exports = initializeResize