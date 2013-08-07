ReportTab = require '../../lib/scripts/reportTab.coffee'
templates = require '../templates/templates.js'
enableLayerTogglers = require '../../lib/scripts/enableLayerTogglers.coffee'

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview

  render: () ->
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      description: @model.getAttribute('DESCRIPTION')
      hasDescription: @model.getAttribute('DESCRIPTION')?.length > 0
    
    @$el.html @template.render(context, templates)
    enableLayerTogglers(@$el)


module.exports = OverviewTab