ReportTab = require '../../lib/scripts/reportTab.coffee'
templates = require '../templates/templates.js'
enableLayerTogglers = require '../../lib/scripts/enableLayerTogglers.coffee'

class FishingValueTab extends ReportTab
  name: 'Fishing Value'
  className: 'fishingValue'
  template: templates.fishingValue
  dependencies: ['FishingValue']
  timeout: 60000

  render: () ->
    data = @results.get('data')
    percent = data?.results?[0]?.value?[0]?.features?[0]?.attributes?.PERCENT
    unless percent
      percent = 'error'
    else
      percent = parseFloat(percent)
      percent = Math.round(percent * 10) / 10

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      percent: percent
    
    @$el.html @template.render(context, templates)
    enableLayerTogglers(@$el)


module.exports = FishingValueTab