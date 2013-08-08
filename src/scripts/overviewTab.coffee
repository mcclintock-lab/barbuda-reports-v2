ReportTab = require '../../lib/scripts/reportTab.coffee'
templates = require '../templates/templates.js'
enableLayerTogglers = require '../../lib/scripts/enableLayerTogglers.coffee'

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  dependencies: ['Diameter']

  render: () ->
    DIAM_OK = @getFirstResult('Diameter', 'DIAM_OK')
    MAX_DIAM = @getFirstResult('Diameter', 'MAX_DIAM')
    MIN_DIAM = @getFirstResult('Diameter', 'MIN_DIAM')

    if DIAM_OK is 'true'
      text = "This area meets diameter length recommendation."
    else
      text = "Fails to meet diameter length recommendation."
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      description: @model.getAttribute('DESCRIPTION')
      hasDescription: @model.getAttribute('DESCRIPTION')?.length > 0
      DIAM_OK: DIAM_OK
      MAX_DIAM: MAX_DIAM
      MIN_DIAM: MIN_DIAM
      diameterText: text
    
    @$el.html @template.render(context, templates)
    enableLayerTogglers(@$el)


module.exports = OverviewTab