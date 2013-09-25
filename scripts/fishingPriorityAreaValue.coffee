ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class FishingPriorityAreaValueTab extends ReportTab
  name: 'Fishing Value'
  className: 'fishingValue'
  template: templates.fishingValue
  dependencies: ['FishingPriorityArea']
  timeout: 120000

  render: () ->
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      percent: @recordSet('FishingValue', 'FishingValue').float('PERCENT', 2)
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers(@$el)

module.exports = FishingPriorityAreaValueTab