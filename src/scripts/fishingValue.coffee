ReportTab = require '../../lib/scripts/reportTab.coffee'
templates = require '../templates/templates.js'

class FishingValueTab extends ReportTab
  name: 'Fishing Value'
  className: 'fishingValue'
  template: templates.fishingValue
  dependencies: ['FishingValue']

  render: () ->
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
    
    @$el.html @template.render(context, templates)

module.exports = FishingValueTab