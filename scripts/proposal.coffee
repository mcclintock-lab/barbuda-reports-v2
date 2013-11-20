templates = require '../templates/templates.js'
ArrayOverviewTab = require './arrayOverviewTab.coffee'
ArrayHabitatTab = require './arrayHabitatTab.coffee'
ArrayFishingValueTab = require './arrayFishingValueTab.coffee'
ArrayTradeoffsTab = require './arrayTradeoffs.coffee'
#OverviewTab = require './overviewTab.coffee'
window.app.registerReport (report) ->
  report.tabs [ArrayOverviewTab, ArrayHabitatTab, ArrayFishingValueTab, ArrayTradeoffsTab]
  #report.tabs [OverviewTab]
  # path must be relative to dist/
  report.stylesheets ['./proposal.css']