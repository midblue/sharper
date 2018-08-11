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
  overwrite: true
})
```

Property | Required | Type | Default | Values
--- | --- | --- | --- | ---
source | no | String | './' | A relative or absolute path to an image or directory.
outputFolder | no | String | 'resized' | A relative path to the output folder from the input folder (does not need to already exist)
width | * | Integer | - | Max width of image(s)
height | * | Integer | - | Max height of image(s)
overwrite | no | Boolean | false | Whether to overwrite files that share a name with a source file in the output folder

> *Only one dimension is required. The other will automatically scale to fit the provided dimension.
