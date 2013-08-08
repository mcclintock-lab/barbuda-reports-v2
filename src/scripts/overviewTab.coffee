ReportTab = require '../../lib/scripts/reportTab.coffee'
templates = require '../templates/templates.js'
enableLayerTogglers = require '../../lib/scripts/enableLayerTogglers.coffee'
utils = require '../../lib/scripts/utils.coffee'

# Diameter evaluation and visualization parameters
RECOMMENDED_DIAMETER = 
  min: 10
  max: 20

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  dependencies: ['Diameter']

  render: () ->
    MIN_DIAM = utils.round(@getFirstResult('Diameter', 'MIN_DIAM'), 2)
    SQ_MILES = utils.round(@getFirstResult('Diameter', 'SQ_MILES'), 2)    

    if MIN_DIAM > RECOMMENDED_DIAMETER.min
      DIAM_OK = true

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      description: @model.getAttribute('DESCRIPTION')
      hasDescription: @model.getAttribute('DESCRIPTION')?.length > 0
      DIAM_OK: DIAM_OK
      SQ_MILES: SQ_MILES
      DIAM: MIN_DIAM
      MIN_DIAM: RECOMMENDED_DIAMETER.min
    
    @$el.html @template.render(context, templates)
    enableLayerTogglers(@$el)


module.exports = OverviewTab