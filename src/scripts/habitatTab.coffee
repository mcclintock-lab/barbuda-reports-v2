ReportTab = require '../../lib/scripts/reportTab.coffee'
templates = require '../templates/templates.js'
enableLayerTogglers = require '../../lib/scripts/enableLayerTogglers.coffee'

class HabitatTab extends ReportTab
  name: 'Habitat'
  className: 'habitat'
  template: templates.habitat
  dependencies: ['BarbudaHabitat']
  timeout: 60000
  
  render: () ->
    data = _.map @getResults('Habitats')[0].value[0].features, (feature) ->
      feature.attributes
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      habitats: data
    
    @$el.html @template.render(context, templates)
    enableLayerTogglers(@$el)

module.exports = HabitatTab