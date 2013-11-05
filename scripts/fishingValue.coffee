ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class FishingValueTab extends ReportTab
  name: 'Fishing Value'
  className: 'fishingValue'
  template: templates.fishingValue
  dependencies: ['FishingValue']
  timeout: 120000
  areaLabel: 'protected area'

  render: () ->
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      percent: @recordSet('FishingValue', 'FishingValue').float('PERCENT', 2)
      areaLabel: @areaLabel
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers(@$el)


module.exports = FishingValueTab