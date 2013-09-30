ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
ids = require './ids.coffee'
for key, value of ids
  window[key] = value


class ArrayHabitatTab extends ReportTab
  name: 'Habitat'
  className: 'habitat'
  template: templates.arrayHabitats
  dependencies: ['BarbudaHabitat', 'HabitatsInMooring']
  timeout: 240000
  
  render: () ->
    sanctuaries = @getChildren SANCTUARY_ID
    if sanctuaries.length
      sanctuary = @recordSet(
        'BarbudaHabitat', 
        'Habitats', 
        SANCTUARY_ID
      ).toArray()
      for row in sanctuary
        if parseFloat(row.Percent) >= 33
          row.meetsGoal = true

    aquacultureAreas = @getChildren AQUACULTURE_ID
    if aquacultureAreas.length
      aquaculture = @recordSet(
        'BarbudaHabitat', 
        'Habitats', 
        AQUACULTURE_ID
      ).toArray()

    moorings = @getChildren MOORING_ID
    if moorings.length
      mooringData = @recordSet(
        'HabitatsInMooring', 
        'HabitatsInMooring', 
        MOORING_ID
      ).toArray()

    fishingAreas = @getChildren FISHING_PRIORITY_AREA_ID
    if fishingAreas.length
      fishingAreaData = @recordSet(
        'BarbudaHabitat', 
        'Habitats', 
        FISHING_PRIORITY_AREA_ID
      ).toArray()

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      numSanctuaries: sanctuaries.length
      sanctuaries: sanctuaries.length > 0
      sanctuaryHabitat: sanctuary
      sanctuaryPlural: sanctuaries.length > 1
      numAquaculture: aquacultureAreas.length
      aquacultureAreas: aquacultureAreas.length > 0
      aquaPlural: aquacultureAreas.length > 1
      aquacultureHabitat: aquaculture
      moorings: moorings.length > 0
      numMoorings: moorings.length
      mooringData: mooringData
      mooringPlural: moorings.length > 1
      fishingAreas: fishingAreas.length > 0
      numFishingAreas: fishingAreas.length
      fishingAreaData: fishingAreaData
      fishingAreaPlural: fishingAreas.length > 1
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers(@$el)

module.exports = ArrayHabitatTab