templates = require '../templates/templates.js'
ArrayOverviewTab = require './arrayOverviewTab.coffee'
ArrayHabitatTab = require './arrayHabitatTab.coffee'
ArrayFishingValueTab = require './arrayFishingValueTab.coffee'

window.app.registerReport (report) ->
  report.tabs [ArrayOverviewTab, ArrayHabitatTab, ArrayFishingValueTab]
  # path must be relative to dist/
  report.stylesheets ['./proposal.css']