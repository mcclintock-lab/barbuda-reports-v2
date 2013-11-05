templates = require '../templates/templates.js'
OverviewTab = require './overviewTab.coffee'
HabitatTab = require './habitatTab.coffee'
FishingValueTab = require './fishingValue.coffee'

class FishingPriorityValueTab extends FishingValueTab
  template: templates.fishingPriorityArea

class FishingPriorityOverviewTab extends OverviewTab
  renderMinimumWidth: false

class FishingPriorityHabitatTab extends HabitatTab
  heading: 'Habitats'

window.app.registerReport (report) ->
  report.tabs [FishingPriorityOverviewTab, FishingPriorityHabitatTab, FishingPriorityValueTab]
  # path must be relative to dist/
  report.stylesheets ['./fishingPriority.css']