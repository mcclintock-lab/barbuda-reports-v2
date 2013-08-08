ReportTab = require '../../lib/scripts/reportTab.coffee'
templates = require '../templates/templates.js'
enableLayerTogglers = require '../../lib/scripts/enableLayerTogglers.coffee'
utils = require '../../lib/scripts/utils.coffee'
d3 = require '../../node_modules/d3/index-browserify.js'

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
    @drawViz(MIN_DIAM)

  drawViz: (diam) ->
    el = @$('.viz')[0]
    console.log diam * 1.5
    maxScale = d3.max([RECOMMENDED_DIAMETER.max * 1.5, diam * 1.5])
    ranges = [
      {
        name: 'Below recommended'
        start: 0
        end: RECOMMENDED_DIAMETER.min
        bg: "#8e5e50"
        class: 'below'
      }
      {
        name: 'Recommended'
        start: RECOMMENDED_DIAMETER.min
        end: RECOMMENDED_DIAMETER.max
        bg: '#588e3f'
        class: 'recommended'
      }
      {
        name: 'Above recommended'
        start: RECOMMENDED_DIAMETER.max
        end: maxScale
        class: 'above'
      }
    ]

    x = d3.scale.linear()
      .domain([0, maxScale])
      .range([0, 400])
    
    chart = d3.select(el)
    chart.selectAll("div.range")
      .data(ranges)
    .enter().append("div")
      .style("width", (d) -> x(d.end - d.start) + 'px')
      .attr("class", (d) -> "range " + d.class)
      .append("span")
        .text((d) -> d.name)
        .append("span")
          .text((d) -> "#{d.start}-#{d.end}km")

    chart.selectAll("div.diam")
      .data([diam])
    .enter().append("div")
      .attr("class", "diam")
      .style("left", (d) -> x(d) + 'px')
      .text((d) -> "")



module.exports = OverviewTab