ReportTab = require '../../lib/scripts/reportTab.coffee'
templates = require '../templates/templates.js'

class HabitatTab extends ReportTab
  name: 'Habitat'
  className: 'habitat'
  template: templates.habitat

  render: () ->
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
    
    @$el.html @template.render(context, templates)


module.exports = HabitatTab