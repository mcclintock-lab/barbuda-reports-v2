ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
round = require('api/utils').round
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
    SQ_MILES = 0
    for rs in @recordSets 'Diameter', 'Diameter'
      SQ_MILES += rs.float('SQ_MILES')

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      numSketches: @children.length
      SQ_MILES: round(SQ_MILES, 2)
    
    @$el.html @template.render(context, partials)

module.exports = ArrayOverviewTab