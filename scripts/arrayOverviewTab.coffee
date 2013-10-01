ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
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
    OCEAN_AREA = 0
    for rs in @recordSets 'Diameter', 'Diameter'
      OCEAN_AREA += rs.float('OCEAN_AREA')
    OCEAN_PERCENT = (OCEAN_AREA / TOTAL_AREA) * 100.0
    LAGOON_AREA = 0
    for rs in @recordSets 'Diameter', 'Diameter'
      LAGOON_AREA += rs.float('LAGOON_AREA')
    LAGOON_PERCENT = (LAGOON_AREA / TOTAL_LAGOON_AREA) * 100.0
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      numSketches: @children.length
      OCEAN_AREA: round(OCEAN_AREA, 2)
      OCEAN_PERCENT: round(OCEAN_PERCENT, 0)
      LAGOON_AREA: round(LAGOON_AREA, 2)
      LAGOON_PERCENT: round(LAGOON_PERCENT, 0)
    
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