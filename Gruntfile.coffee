module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    connect:
      server:
        options:
          port: 8080
          base: './dist'
          keepalive: true
    watch:
      scripts:
        files: [
          'scripts/**/*.coffee', 
          'node_modules/seasketch-reporting-api/scripts/**/*.coffee'
        ]
        tasks: ['browserify']
      templates:
        files: [
          'templates/**/*.mustache'
          'node_modules/seasketch-reporting-api/templates/**/*.mustache'
        ]
        tasks: ['hogan', 'browserify']
      stylesheets:
        files: [
          'stylesheets/**/*.less'
          'node_modules/backbone/less/*'
          'node_modules/seasketch-reporting-api/stylesheets/**/*.less'
        ]
        tasks: ['less']
      livereload:
        files: ['dist/**/*.css']
        options:
          livereload: true
    hogan:
      main:
        dest: 'templates/templates.js'
        src: 'templates/**/*.mustache'
      lib:
        dest: 'node_modules/seasketch-reporting-api/templates/templates.js'
        src: 'node_modules/seasketch-reporting-api/templates/**/*.mustache'
      options:
        commonJsWrapper: true
        defaultName: (filename) -> 
          filename
            .replace('templates/', '')
            .replace('node_modules/seasketch-reporting-api/templates/', '')
            .replace('.mustache', '')
    less:
      fishSanctuary:
        files:
          'dist/fishSanctuary.css': 'stylesheets/fishSanctuary.less'
      aquaculture:
        files:
          'dist/aquaculture.css': 'stylesheets/aquaculture.less'
      fishingPriority:
        files:
          'dist/fishingPriority.css': 'stylesheets/fishingPriority.less'
      mooring:
        files:
          'dist/mooring.css': 'stylesheets/mooring.less'
      proposal:
        files:
          'dist/proposal.css': 'stylesheets/proposal.less'
    browserify:
      fishSanctuary:
        src: 'scripts/fishSanctuary.coffee'
        dest: 'dist/fishSanctuary.js'
      aquaculture:
        src: 'scripts/aquaculture.coffee'
        dest: 'dist/aquaculture.js'
      fishingPriority:
        src: 'scripts/fishingPriority.coffee'
        dest: 'dist/fishingPriority.js'
      mooring:
        src: 'scripts/mooring.coffee'
        dest: 'dist/mooring.js'
      proposal:
        src: 'scripts/proposal.coffee'
        dest: 'dist/proposal.js'
      options:
        transform: ['coffeeify']
        debug: true
        alias: [
          'node_modules/seasketch-reporting-api/scripts/reportTab.coffee:reportTab'
          'node_modules/seasketch-reporting-api/scripts/utils.coffee:api/utils'
          'node_modules/seasketch-reporting-api/templates/templates.js:api/templates'
        ]
        ignore: ['views/collectionView']

  grunt.loadNpmTasks('grunt-contrib-connect')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-contrib-hogan')
  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-notify')
  
  # Default task(s).
  grunt.registerTask('default', ['less', 'hogan', 'browserify'])
