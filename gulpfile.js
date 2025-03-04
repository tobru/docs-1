'use strict'

const connect = require('gulp-connect')
const fs = require('fs')
const generator = require('@antora/site-generator')
const { reload: livereload } = process.env.LIVERELOAD === 'true' ? require('gulp-connect') : {}
const { series, src, watch } = require('gulp')
const yaml = require('js-yaml')

const playbookFilename = 'antora-playbook-for-development.yml'
const playbook = yaml.load(fs.readFileSync(playbookFilename, 'utf8'))
const outputDir = (playbook.output || {}).dir || './out/docs'
const serverConfig = { name: 'Preview Site', livereload, host: '0.0.0.0', port: 4000, root: outputDir }
const antoraArgs = ['--playbook', playbookFilename]
const watchPatterns = playbook.content.sources.filter((source) => !source.url.includes(':')).reduce((accum, source) => {
  accum.push(`./antoraplaybook.yml`)
  accum.push(`./gulpfile.js`)
  accum.push(`./docs/antora.yml`)
  accum.push(`./docs/modules/**/**/*`)
  accum.push(`./supplemental-ui/**/*`)
  return accum
}, [])


function generate(done) {
  require('./generate-api-reference.js')
  // done()
  generator(antoraArgs, process.env)
    .then(() => done())
    .catch((err) => {
      console.log(err)
      done()
    })
}

function serve(done) {
  connect.server(serverConfig, function () {
    this.server.on('close', done)
    watch(watchPatterns, generate)
    if (livereload) watch(this.root).on('change', (filepath) => src(filepath, { read: false }).pipe(livereload()))
  })
}

module.exports = { serve, generate, default: series(generate, serve) }
