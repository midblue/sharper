const sharper = require('./app.js')

async function test() {

  const res = await sharper([
    {
      // source: './',
      // outputFolder: 'resized',
      height: 500,
      // width: 800,
      // overwrite: false,
    },
    {
      // source: './',
      outputFolder: 'resized/test/tiny',
      height: 10,
      // width: 800,
      // overwrite: false,
    },
  ])

  console.log('result:', res)

}

test()