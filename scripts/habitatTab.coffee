ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

class HabitatTab extends ReportTab
  name: 'Habitat'
  className: 'habitat'
  template: templates.habitat
  dependencies: ['BarbudaHabitat']
  paramName: 'Habitats'
  timeout: 120000
  heading: "Habitat Representation"
  
  render: () ->
    depName = @dependencies[0]
    data = @recordSet(depName, @paramName).toArray()
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      habitats: data
      heading: @heading
    
    @$el.html @template.render(context, templates)
    @enableLayerTogglers(@$el)

module.exports = HabitatTab