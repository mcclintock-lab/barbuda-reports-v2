ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
ids = require './ids.coffee'
for key, value of ids
  window[key] = value

class ArrayFishingValueTab extends ReportTab
  name: 'Fishing Value'
  className: 'fishingValue'
  template: templates.arrayFishingValue
  dependencies: ['FishingValue']
  timeout: 240000

  render: () ->
    sanctuaries = @getChildren SANCTUARY_ID
    if sanctuaries.length
      sanctuaryPercent = @recordSet(
        'FishingValue', 
        'FishingValue', 
        SANCTUARY_ID
      ).float('PERCENT', 0)

    aquacultureAreas = @getChildren AQUACULTURE_ID
    if aquacultureAreas.length
      aquaculturePercent = @recordSet(
        'FishingValue', 
        'FishingValue', 
        AQUACULTURE_ID
      ).float('PERCENT', 0)

    moorings = @getChildren MOORING_ID
    if moorings.length
      mooringPercent = @recordSet(
        'FishingValue', 
        'FishingValue', 
        MOORING_ID
      ).float('PERCENT', 2)

    fishingAreas = @getChildren FISHING_PRIORITY_AREA_ID
    if fishingAreas.length
      fishingAreaPercent = @recordSet(
        'FishingPriorityArea', 
        'FishingPriorityArea', 
        FISHING_PRIORITY_AREA_ID
      ).float('PERCENT', 0)

    noNetZones = @getChildren NO_NET_ZONES_ID
    if noNetZones.length
      noNetZonesPercent = @recordSet(
        'FishingValue', 
        'FishingValue', 
        NO_NET_ZONES_ID
      ).float('PERCENT', 0)

    scid = @sketchClass.id
    console.log("scid:: ", scid)
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      sanctuaryPercent: sanctuaryPercent
      numSanctuaries: sanctuaries.length
      sanctuaries: sanctuaries.length > 0
      sancPlural: sanctuaries.length > 1
      mooringAreaPercent: mooringPercent
      numMoorings: moorings.length
      moorings: moorings.length > 0
      mooringsPlural: moorings.length > 1
      fishingAreaPercent: fishingAreaPercent
      numFishingAreas: fishingAreas.length
      fishingAreas: fishingAreas.length > 0
      fishingAreasPlural: fishingAreas.length > 1

      aquacultureAreaPercent: aquaculturePercent
      numAquacultureAreas: aquacultureAreas.length
      aquacultureAreas: aquacultureAreas.length > 0
      aquacultureAreasPlural: aquacultureAreas.length > 1

      noNetZonesPercent: noNetZonesPercent
      numNoNetZones: noNetZones.length
      hasNoNetZones: noNetZones.length > 0
      noNetZonesPlural: noNetZones.length > 1

    @$el.html @template.render(context, templates)
    @enableLayerTogglers(@$el)


module.exports = ArrayFishingValueTab