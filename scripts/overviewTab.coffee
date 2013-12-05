ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val
round = require('api/utils').round
ids = require './ids.coffee'
for key, value of ids
  window[key] = value


TOTAL_AREA = 175.95 # sq miles
# Diameter evaluation and visualization parameters
RECOMMENDED_DIAMETER = 
  min: 2
  max: 3

class OverviewTab extends ReportTab
  name: 'Size'
  className: 'overview'
  template: templates.overview

  dependencies: ['Diameter']
  timeout: 60000
  #  renderMinimumWidth: true
  render: () ->
    MIN_DIAM = @recordSet('Diameter', 'Diameter').float('MIN_DIAM')
    SQ_MILES = @recordSet('Diameter', 'Diameter').float('SQ_MILES')
    PERCENT = (SQ_MILES / TOTAL_AREA) * 100.0
    if MIN_DIAM > RECOMMENDED_DIAMETER.min
      DIAM_OK = true
    
    skid = @model.getAttribute('SC_ID')
    isNoNetZone = (@sketchClass.id is NO_NET_ZONES_ID)
    renderMinimumWidth = (!isNoNetZone)
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      anyAttributes: @model.getAttributes().length > 0
      admin: @project.isAdmin window.user
      description: @model.getAttribute('DESCRIPTION')
      hasDescription: @model.getAttribute('DESCRIPTION')?.length > 0
      DIAM_OK: DIAM_OK
      SQ_MILES: SQ_MILES
      DIAM: MIN_DIAM
      MIN_DIAM: RECOMMENDED_DIAMETER.min
      renderMinimumWidth: renderMinimumWidth
      PERCENT: round(PERCENT, 0)
      isNoNetZone: isNoNetZone
    
    @$el.html @template.render(context, partials)
    if renderMinimumWidth
      @enableLayerTogglers(@$el)
      @drawViz(MIN_DIAM)

  drawViz: (diam) ->
    if window.d3
      el = @$('.viz')[0]
      maxScale = d3.max([RECOMMENDED_DIAMETER.max * 1.2, diam * 1.2])
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
          .text((d) -> if x(d.end - d.start) > 110 then d.name else '')
          .append("span")
            .text (d) ->
              if d.class is 'above'
                "> #{d.start} miles"
              else
                "#{d.start}-#{d.end} miles"

      chart.selectAll("div.diam")
        .data([diam])
      .enter().append("div")
        .attr("class", "diam")
        .style("left", (d) -> x(d) + 'px')
        .text((d) -> "")


module.exports = OverviewTab