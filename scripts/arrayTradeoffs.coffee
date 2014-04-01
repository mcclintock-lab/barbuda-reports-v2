ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
round = require('api/utils').round
TOTAL_AREA = 164.8 # sq miles
TOTAL_LAGOON_AREA = 11.1
_partials = require 'api/templates'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class ArrayTradeoffsTab extends ReportTab
  name: 'Tradeoffs'
  className: 'tradeoffs'
  template: templates.arrayTradeoffs
  dependencies: ['TradeoffsPropId']
  timeout: 120000


  render: () ->
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
    @$el.html @template.render(context, partials)

    if window.d3
      tradeoff_data = @recordSet('TradeoffsPropId', 'TradeoffsPropId').toArray()

      h = 380
      w = 380
      margin = {left:40, top:5, right:40, bottom: 40, inner:5}
      halfh = (h+margin.top+margin.bottom)
      totalh = halfh*2
      halfw = (w+margin.left+margin.right)
      totalw = halfw*2

      #make sure its @scatterplot to pass in the right context (tab) for d3
      mychart = @scatterplot().xvar(0)
                             .yvar(1)
                             .xlab("Fishing Value")
                             .ylab("Ecological Value")
                             .height(h)
                             .width(w)
                             .margin(margin)


      ch = d3.select(@$('.tradeoff-chart'))
      ch.datum(tradeoff_data)
        .call(mychart)

      tooltip = d3.select("body")
        .append("div")
        .attr("class", "chart-tooltip")
        .attr("id", "chart-tooltip")
        .text("data")

      mychart.pointsSelect()
        .on "mouseover", (d) -> return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: "+d.PROPOSAL+"</strong><li> Fishing value: "+d.FISH_VAL+"</li><li> Conservation value: "+d.ECO_VAL+"</li></ul>")

      mychart.pointsSelect()
        .on "mousemove", (d) -> return tooltip.style("top", (event.pageY-10)+"px").style("left",(calc_ttip(event.pageX, d, tooltip))+"px")

      mychart.pointsSelect()
        .on "mouseout", (d) -> return tooltip.style("visibility", "hidden")

      mychart.labelsSelect()
        .on "mouseover", (d) -> return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: "+d.PROPOSAL+"</strong><li> Fishing value: "+d.FISH_VAL+"</li><li> Conservation value: "+d.ECO_VAL+"</li></ul>")

      mychart.labelsSelect()
        .on "mousemove", (d) -> return tooltip.style("top", (event.pageY-10)+"px").style("left",(calc_ttip(event.pageX, d, tooltip))+"px")

      mychart.labelsSelect()
        .on "mouseout", (d) -> return tooltip.style("visibility", "hidden")

  calc_ttip = (xloc, data, tooltip) ->
    tdiv = tooltip[0][0].getBoundingClientRect()
    tleft = tdiv.left
    tw = tdiv.width
    return xloc-(tw+10) if (xloc+tw > tleft+tw)
    return xloc+10


  scatterplot: () =>
    view = @
    width = 380
    height = 600
    margin = {left:40, top:5, right:40, bottom: 40, inner:5}
    axispos = {xtitle:25, ytitle:30, xlabel:5, ylabel:5}
    xlim = null
    ylim = null
    nxticks = 5
    xticks = null
    nyticks = 5
    yticks = null
    #rectcolor = d3.rgb(230, 230, 230)
    rectcolor = "#dbe4ee"
    pointsize = 5 # default = no visible points at markers
    xlab = "X"
    ylab = "Y score"
    yscale = d3.scale.linear()
    xscale = d3.scale.linear()
    legendheight = 300
    pointsSelect = null
    labelsSelect = null
    legendSelect = null
    if window.d3
      #clear out the old values
      view.$('.tradeoff-chart').html('')
      el = view.$('.tradeoff-chart')[0]

    ## the main function
    chart = (selection) ->
      selection.each (data) ->
        x = data.map (d) -> parseFloat(d.FISH_VAL)
        y = data.map (d) -> parseFloat(d.ECO_VAL)


        paneloffset = 0
        panelwidth = width

        panelheight = height

        xlim = [d3.min(x)-2, parseFloat(d3.max(x)+2)] if !(xlim?)

        ylim = [d3.min(y)-2, parseFloat(d3.max(y)+2)] if !(ylim?)

        # I'll replace missing values something smaller than what's observed
        na_value = d3.min(x.concat y) - 100
        currelem = d3.select(view.$('.tradeoff-chart')[0])
        svg = d3.select(view.$('.tradeoff-chart')[0]).append("svg").data([data])
        svg.append("g")

        # Update the outer dimensions.
        svg.attr("width", width+margin.left+margin.right)
           .attr("height", height+margin.top+margin.bottom+data.length*35)

        g = svg.select("g")

        # box
        g.append("rect")
         .attr("x", paneloffset+margin.left)
         .attr("y", margin.top)
         .attr("height", panelheight)
         .attr("width", panelwidth)
         .attr("fill", rectcolor)
         .attr("stroke", "none")


        # simple scales (ignore NA business)
        xrange = [margin.left+paneloffset+margin.inner, margin.left+paneloffset+panelwidth-margin.inner]
        yrange = [margin.top+panelheight-margin.inner, margin.top+margin.inner]
        xscale.domain(xlim).range(xrange)
        yscale.domain(ylim).range(yrange)
        xs = d3.scale.linear().domain(xlim).range(xrange)
        ys = d3.scale.linear().domain(ylim).range(yrange)


        # if yticks not provided, use nyticks to choose pretty ones
        yticks = ys.ticks(nyticks) if !(yticks?)
        xticks = xs.ticks(nxticks) if !(xticks?)

        # x-axis
        xaxis = g.append("g").attr("class", "x axis")
        xaxis.selectAll("empty")
             .data(xticks)
             .enter()
             .append("line")
             .attr("x1", (d) -> xscale(d))
             .attr("x2", (d) -> xscale(d))
             .attr("y1", margin.top)
             .attr("y2", margin.top+height)
             .attr("fill", "none")
             .attr("stroke", "white")
             .attr("stroke-width", 1)
             .style("pointer-events", "none")
        xaxis.selectAll("empty")
             .data(xticks)
             .enter()
             .append("text")
             .attr("x", (d) -> xscale(d))
             .attr("y", margin.top+height+axispos.xlabel)
             .text((d) -> formatAxis(xticks)(d))
        xaxis.append("text").attr("class", "xaxis-title")
             .attr("x", margin.left+width/2)
             .attr("y", margin.top+height+axispos.xtitle)
             .text(xlab)
        xaxis.selectAll("empty")
             .data(data)
             .enter()
             .append("circle")
             .attr("cx", (d,i) -> margin.left)
             .attr("cy", (d,i) -> margin.top+height+axispos.xtitle+((i+1)*30)+6)
             .attr("class", (d,i) -> "pt#{i}")
             .attr("r", pointsize)
             .attr("fill", (d,i) ->
                          val = i % 17
                          col = getColors(val)
                          return col
                          )
             .attr("stroke", (d, i) ->
                          val = Math.floor(i/17) % 5
                          col = getStrokeColor(val)
                          return col
                          )
             .attr("stroke-width", "1")

        xaxis.selectAll("empty")
             .data(data)
             .enter()
             .append("text")
             .attr("class", "legend-text")

             .attr("x", (d,i) ->
                return margin.left+20)
             .attr("y", (d,i) ->
                margin.top+height+axispos.xtitle+((i+1)*30))
             .text((d) -> return d.PROPOSAL)

        # y-axis
        yaxis = g.append("g").attr("class", "y axis")
        yaxis.selectAll("empty")
             .data(yticks)
             .enter()
             .append("line")
             .attr("y1", (d) -> yscale(d))
             .attr("y2", (d) -> yscale(d))
             .attr("x1", margin.left)
             .attr("x2", margin.left+width)
             .attr("fill", "none")
             .attr("stroke", "white")
             .attr("stroke-width", 1)
             .style("pointer-events", "none")
        yaxis.selectAll("empty")
             .data(yticks)
             .enter()
             .append("text")
             .attr("y", (d) -> yscale(d))
             .attr("x", margin.left-axispos.ylabel)
             .text((d) -> formatAxis(yticks)(d))
        yaxis.append("text").attr("class", "title")
             .attr("y", margin.top+height/2)
             .attr("x", margin.left-axispos.ytitle)
             .text(ylab)
             .attr("transform", "rotate(270,#{margin.left-axispos.ytitle},#{margin.top+height/2})")


        labels = g.append("g").attr("id", "labels")
        labelsSelect =
          labels.selectAll("empty")
                .data(data)
                .enter()
                .append("text")
                .text((d)-> return d.PROPOSAL)
                .attr("x", (d,i) ->
                  xpos = xscale(x[i])
                  string_end = xpos+this.getComputedTextLength()
                  overlap_xstart = xpos-(this.getComputedTextLength()+5)
                  return overlap_xstart if string_end > width
                  return xpos+5
                  )
                .attr("y", (d,i) ->
                  ypos = yscale(y[i])
                  return ypos+10 if (ypos < 50)
                  return ypos-5
                  )



        points = g.append("g").attr("id", "points")
        pointsSelect =
          points.selectAll("empty")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", (d,i) -> xscale(x[i]))
                .attr("cy", (d,i) -> yscale(y[i]))
                .attr("class", (d,i) -> "pt#{i}")
                .attr("r", pointsize)
                .attr("fill", (d,i) ->
                          val = i
                          col = getColors([val])
                          return col
                          )
                .attr("stroke", (d, i) ->
                          val = Math.floor(i/17) % 5
                          col = getStrokeColor(val)
                          return col
                          )
                .attr("stroke-width", "1")
                .attr("opacity", (d,i) ->
                     return 1 if (x[i]? or xNA.handle) and (y[i]? or yNA.handle)
                     return 0)

        # box
        g.append("rect")
               .attr("x", margin.left+paneloffset)
               .attr("y", margin.top)
               .attr("height", panelheight)
               .attr("width", panelwidth)
               .attr("fill", "none")
               .attr("stroke", "black")
               .attr("stroke-width", "none")



    ## configuration parameters


    chart.width = (value) ->
      return width if !arguments.length
      width = value
      chart

    chart.height = (value) ->
      return height if !arguments.length
      height = value
      chart

    chart.margin = (value) ->
      return margin if !arguments.length
      margin = value
      chart

    chart.axispos = (value) ->
      return axispos if !arguments.length
      axispos = value
      chart

    chart.xlim = (value) ->
      return xlim if !arguments.length
      xlim = value
      chart

    chart.nxticks = (value) ->
      return nxticks if !arguments.length
      nxticks = value
      chart

    chart.xticks = (value) ->
      return xticks if !arguments.length
      xticks = value
      chart

    chart.ylim = (value) ->
      return ylim if !arguments.length
      ylim = value
      chart

    chart.nyticks = (value) ->
      return nyticks if !arguments.length
      nyticks = value
      chart

    chart.yticks = (value) ->
      return yticks if !arguments.length
      yticks = value
      chart

    chart.rectcolor = (value) ->
      return rectcolor if !arguments.length
      rectcolor = value
      chart

    chart.pointcolor = (value) ->
      return pointcolor if !arguments.length
      pointcolor = value
      chart

    chart.pointsize = (value) ->
      return pointsize if !arguments.length
      pointsize = value
      chart

    chart.pointstroke = (value) ->
      return pointstroke if !arguments.length
      pointstroke = value
      chart

    chart.xlab = (value) ->
      return xlab if !arguments.length
      xlab = value
      chart

    chart.ylab = (value) ->
      return ylab if !arguments.length
      ylab = value
      chart

    chart.xvar = (value) ->
      return xvar if !arguments.length
      xvar = value
      chart

    chart.yvar = (value) ->
      return yvar if !arguments.length
      yvar = value
      chart

    chart.yscale = () ->
      return yscale

    chart.xscale = () ->
      return xscale

    chart.pointsSelect = () ->
      return pointsSelect

    chart.labelsSelect = () ->
      return labelsSelect

    chart.legendSelect = () ->
      return legendSelect

    # return the chart function
    chart

  getColors = (i) ->
    colors = ["LightGreen", "LightPink", "LightSkyBlue", "Moccasin", "BlueViolet", "Gainsboro", "DarkGreen", "DarkTurquoise", "maroon", "navy", "LemonChiffon", "orange",  "red", "silver", "teal", "white", "black"]
    return colors[i]

  getStrokeColor = (i) ->
    scolors = ["black", "white", "gray", "brown", "Navy"]
    return scolors[i]

  # function to determine rounding of axis labels
  formatAxis = (d) ->
    d = d[1] - d[0]
    ndig = Math.floor( Math.log(d % 10) / Math.log(10) )
    ndig = 0 if ndig > 0
    ndig = Math.abs(ndig)
    d3.format(".#{ndig}f")

module.exports = ArrayTradeoffsTab
