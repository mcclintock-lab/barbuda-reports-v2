templates = require '../templates/templates.js'
ArrayOverviewTab = require './arrayOverviewTab.coffee'

window.app.registerReport (report) ->
  report.tabs [ArrayOverviewTab]
  # path must be relative to dist/
  report.stylesheets ['./proposal.css']