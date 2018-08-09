# sharper
Easily resize images by file or directory, programmatically or from the command line.

## Usage

### Command line
```
node sharper.js
```

### Programmatically:
```
const sharper = require('./sharper.js')

sharper({
  source: './myimages/jpg/',
  outputFolder: '../resized',
  width: 800,
  height: 500,
})
```

Property  | Default | Values
--- | --- | ---
source | './' | A relative or absolute path to an image or directory.
outputFolder | 'resized' | A relative path to the output folder from the input folder (does not need to already exist)
width | - | Max width of image(s)
height | - | Max height of image(s)
