templates = require '../templates/templates.js'
OverviewTab = require './overviewTab.coffee'
HabitatTab = require './habitatTab.coffee'
FishingValueTab = require './fishingValue.coffee'

class AquaFishingValueTab extends FishingValueTab
  template: templates.aquacultureFishingValue

class AquaOverviewTab extends OverviewTab
  renderMinimumWidth: false

window.app.registerReport (report) ->
  report.tabs [AquaOverviewTab, HabitatTab, AquaFishingValueTab]
  # path must be relative to dist/
  report.stylesheets ['./aquaculture.css']