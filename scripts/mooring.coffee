templates = require '../templates/templates.js'
OverviewTab = require './overviewTab.coffee'
HabitatTab = require './habitatTab.coffee'
FishingValueTab = require './fishingValue.coffee'

class MooringHabitatTab extends HabitatTab
  heading: "Habitats Impacted by Mooring Area"

class MooringOverviewTab extends OverviewTab
  renderMinimumWidth: false

class MooringFishingValueTab extends FishingValueTab
  areaLabel: 'mooring area'

window.app.registerReport (report) ->
  report.tabs [MooringOverviewTab, MooringHabitatTab, MooringFishingValueTab]
  # path must be relative to dist/
  report.stylesheets ['./mooring.css']