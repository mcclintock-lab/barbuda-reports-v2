OverviewTab = require './overviewTab.coffee'
HabitatTab = require './habitatTab.coffee'
FishingValueTab = require './fishingValue.coffee'

window.app.registerReport (report) ->
  report.tabs [OverviewTab, HabitatTab, FishingValueTab]
  # path must be relative to dist/
  report.stylesheets ['./fishSanctuary.css']

console.log 'working?'