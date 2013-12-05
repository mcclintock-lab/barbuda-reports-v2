ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
ids = require './ids.coffee'
for key, value of ids
  window[key] = value

round = require('api/utils').round
TOTAL_AREA = 164.8 # sq miles
TOTAL_LAGOON_AREA = 11.1
_partials = require 'api/templates'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class ArrayOverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.arrayOverview
  dependencies: ['Diameter']
  timeout: 120000

  render: () ->
    #OCEAN_AREA = @recordSet('Diameter', 'Diameter').float('OCEAN_AREA')
    #LAGOON_AREA = @recordSet('Diameter', 'Diameter').float('LAGOON_AREA')
    #OCEAN_PERCENT = (OCEAN_AREA / TOTAL_AREA) * 100.0
    #LAGOON_PERCENT = (LAGOON_AREA / TOTAL_LAGOON_AREA) * 100.0
    sanctuaries = []
    aquacultureAreas = []
    moorings = []
    noNetZones = []
    fishingAreas = []

    sanctuaries = _.filter @children, (c) -> 
      c.get('sketchclass') is SANCTUARY_ID
    numSanctuaries = sanctuaries.length
    if numSanctuaries > 0
      sanctuaryOceanArea = @recordSet(
        'Diameter', 
        'Diameter', 
        SANCTUARY_ID
      ).float('OCEAN_AREA', 1)
      sanctuaryLagoonArea = @recordSet(
        'Diameter', 
        'Diameter', 
        SANCTUARY_ID
      ).float('LAGOON_AREA', 1)
      sanctuaryOceanPercent = @recordSet(
        'Diameter', 
        'Diameter', 
        SANCTUARY_ID
      ).float('OCEAN_PERCENT', 1)
      sanctuaryLagoonPercent = @recordSet(
        'Diameter', 
        'Diameter', 
        SANCTUARY_ID
      ).float('LAGOON_PERCENT', 1)
    else
      sanctuaryOceanArea = 0
      sanctuaryOceanPercent = 0.0
      sanctuaryLagoonArea = 0
      sanctuaryLagoonPercent = 0.0

    aquacultureAreas = _.filter @children, (c) -> 
      c.get('sketchclass') is AQUACULTURE_ID
    numAquacultureAreas = aquacultureAreas.length
    if numAquacultureAreas > 0
      aquacultureOceanArea = @recordSet(
        'Diameter', 
        'Diameter', 
        AQUACULTURE_ID
      ).float('OCEAN_AREA', 1)
      aquacultureLagoonArea = @recordSet(
        'Diameter', 
        'Diameter', 
        AQUACULTURE_ID
      ).float('LAGOON_AREA', 1)
      aquacultureOceanPercent = @recordSet(
        'Diameter', 
        'Diameter', 
        AQUACULTURE_ID
      ).float('OCEAN_PERCENT', 1)
      aquacultureLagoonPercent = @recordSet(
        'Diameter', 
        'Diameter', 
        AQUACULTURE_ID
      ).float('LAGOON_PERCENT', 1)
    else
      aquacultureOceanArea = 0
      aquacultureOceanPercent = 0.0
      aquacultureLagoonArea = 0
      aquacultureLagoonPercent = 0.0

    moorings =  _.filter @children, (c) -> 
      c.get('sketchclass') is MOORING_ID
    numMoorings = moorings.length
    if numMoorings > 0
      mooringsOceanArea = @recordSet(
        'Diameter', 
        'Diameter', 
        MOORING_ID
      ).float('OCEAN_AREA', 1)
      mooringsLagoonArea = @recordSet(
        'Diameter', 
        'Diameter', 
        MOORING_ID
      ).float('LAGOON_AREA', 1)
      mooringsOceanPercent = @recordSet(
        'Diameter', 
        'Diameter', 
        MOORING_ID
      ).float('OCEAN_PERCENT', 1)
      mooringsLagoonPercent = @recordSet(
        'Diameter', 
        'Diameter', 
        MOORING_ID
      ).float('LAGOON_PERCENT', 1)
    else
      mooringsOceanArea = 0
      mooringsOceanPercent = 0.0
      mooringsLagoonArea = 0
      mooringsLagoonPercent = 0.0

    noNetZones = _.filter @children, (c) -> 
      c.get('sketchclass') is NO_NET_ZONES_ID
    numNoNetZones = noNetZones.length
    if numNoNetZones > 0
      noNetZonesOceanArea = @recordSet(
        'Diameter', 
        'Diameter', 
        NO_NET_ZONES_ID
      ).float('OCEAN_AREA', 1)
      noNetZonesLagoonArea = @recordSet(
        'Diameter', 
        'Diameter', 
        NO_NET_ZONES_ID
      ).float('LAGOON_AREA', 1) 
      noNetZonesOceanPercent = @recordSet(
        'Diameter', 
        'Diameter', 
        NO_NET_ZONES_ID
      ).float('OCEAN_PERCENT', 1)
      noNetZonesLagoonPercent = @recordSet(
        'Diameter', 
        'Diameter', 
        NO_NET_ZONES_ID
      ).float('LAGOON_PERCENT', 1) 
    else
      noNetZonesOceanArea = 0
      noNetZonesOceanPercent = 0.0
      noNetZonesLagoonArea = 0
      noNetZonesLagoonPercent = 0.0

    fishingAreas = _.filter @children, (c) -> 
      c.get('sketchclass') is FISHING_PRIORITY_AREA_ID

    numFishingAreas = fishingAreas.length
    if numFishingAreas > 0
      fishingAreasOceanArea = @recordSet(
        'Diameter', 
        'Diameter', 
        FISHING_PRIORITY_AREA_ID
      ).float('OCEAN_AREA', 0)
      fishingAreasLagoonArea = @recordSet(
        'Diameter', 
        'Diameter', 
        FISHING_PRIORITY_AREA_ID
      ).float('LAGOON_AREA', 0)
      fishingAreasOceanPercent = @recordSet(
        'Diameter', 
        'Diameter', 
        FISHING_PRIORITY_AREA_ID
      ).float('OCEAN_PERCENT', 0)
      fishingAreasLagoonPercent = @recordSet(
        'Diameter', 
        'Diameter', 
        FISHING_PRIORITY_AREA_ID
      ).float('LAGOON_PERCENT', 0)
    else
      fishingAreasOceanArea = 0
      fishingAreasOceanPercent = 0.0
      fishingAreasLagoonArea = 0
      fishingAreasLagoonPercent = 0.0

    numTotalZones = numSanctuaries+numNoNetZones+numAquacultureAreas+numMoorings+numFishingAreas
    sumOceanArea = sanctuaryOceanArea+noNetZonesOceanArea+aquacultureOceanArea+mooringsOceanArea+fishingAreasOceanArea
    sumOceanPercent = sanctuaryOceanPercent+noNetZonesOceanPercent+aquacultureOceanPercent+mooringsOceanPercent+fishingAreasOceanPercent
    sumLagoonArea = sanctuaryLagoonArea+noNetZonesLagoonArea+aquacultureLagoonArea+mooringsLagoonArea+fishingAreasLagoonArea
    sumLagoonPercent = sanctuaryLagoonPercent+noNetZonesLagoonPercent+aquacultureLagoonPercent+mooringsLagoonPercent+fishingAreasLagoonPercent
    hasSketches = numTotalZones > 0

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user

      numSanctuaries: sanctuaries.length
      hasSanctuaries: sanctuaries.length > 0
      sanctuariesPlural: sanctuaries.length > 1
      sanctuaryOceanPercent: round(sanctuaryOceanPercent, 2)
      sanctuaryOceanArea: round(sanctuaryOceanArea, 1)
      sanctuaryLagoonArea: round(sanctuaryLagoonArea, 2)
      sanctuaryLagoonPercent: round(sanctuaryLagoonPercent, 1)
      
      numNoNetZones: noNetZones.length
      hasNoNetZones: noNetZones.length > 0
      noNetZonesPlural: noNetZones.length > 1
      noNetZonesOceanPercent: round(noNetZonesOceanPercent, 2)
      noNetZonesOceanArea: round(noNetZonesOceanArea, 1)
      noNetZonesLagoonArea: round(noNetZonesLagoonArea, 2)
      noNetZonesLagoonPercent: round(noNetZonesLagoonPercent, 1)

      numAquaculture: aquacultureAreas.length
      hasAquaculture: aquacultureAreas.length > 0
      aquaculturePlural: aquacultureAreas.length > 1
      aquacultureOceanPercent: round(aquacultureOceanPercent, 2)
      aquacultureOceanArea: round(aquacultureOceanArea, 1)
      aquacultureLagoonArea: round(aquacultureLagoonArea, 2)
      aquacultureLagoonPercent: round(aquacultureLagoonPercent, 1)

      numMoorings: moorings.length
      hasMoorings: moorings.length > 0
      mooringsPlural: moorings.length > 1
      mooringsOceanPercent: round(mooringsOceanPercent, 2)
      mooringsOceanArea: round(mooringsOceanArea, 1)
      mooringsLagoonArea: round(mooringsLagoonArea, 2)
      mooringsLagoonPercent: round(mooringsLagoonPercent, 1)
      
      numFishingAreas: fishingAreas.length
      hasFishingAreas: fishingAreas.length > 0
      fishingAreasPlural: fishingAreas.length > 1
      fishingAreasOceanPercent: round(fishingAreasOceanPercent, 2)
      fishingAreasOceanArea: round(fishingAreasOceanArea, 1)
      fishingAreasLagoonArea: round(fishingAreasLagoonArea, 2)
      fishingAreasLagoonPercent: round(fishingAreasLagoonPercent, 1)

      hasSketches: hasSketches
      sketchesPlural: numTotalZones > 1
      numSketches: numTotalZones
      sumOceanArea: sumOceanArea
      sumOceanPercent: sumOceanPercent
      sumLagoonPercent: sumLagoonPercent
      sumLagoonArea: sumLagoonArea
    
    @$el.html @template.render(context, partials)

    # nodes = [@model]
    # @model.set 'open', true
    # nodes = nodes.concat @children
    # console.log 'nodes', nodes, 'children', @children
    # for node in nodes
    #   node.set 'selected', false
    # TableOfContents = window.require('views/tableOfContents')
    # @toc = new TableOfContents(nodes)
    # @$('.tocContainer').append @toc.el
    # @toc.render()

  remove: () ->
    @toc?.remove()
    super()

module.exports = ArrayOverviewTab