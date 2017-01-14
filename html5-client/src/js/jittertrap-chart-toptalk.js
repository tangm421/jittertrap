/* jittertrap-chart-toptalk.js */

/* global d3 */
/* global JT:true */

JT = (function (my) {
  'use strict';

  my.charts.toptalk = {};

  var chartData = [];

  var clearChartData = function () {
    chartData.length = 0;
  };

  /* must return a reference to an array of {x:x, y:y} */
  my.charts.toptalk.getDataRef = function () {
    return chartData;
  };

  my.charts.toptalk.toptalkChart = (function (m) {
    var margin = {
      top: 20,
      right: 20,
      bottom: 40,
      left: 75
    };

    var size = { width: 960, height: 300 };
    var xScale = d3.scale.linear().range([0, size.width]);
    var yScale = d3.scale.linear().range([size.height, 0]);
    var colorScale = d3.scale.category10();
    var xAxis = d3.svg.axis();
    var yAxis = d3.svg.axis();
    var xGrid = d3.svg.axis();
    var yGrid = d3.svg.axis();
    var area = d3.svg.area();

/*
    var line = d3.svg
          .line()
          .x(function(d) { return xScale(d.f.ts); })
          .y(function(d) { return yScale(d.f[0].bytes); })
          .interpolate("basis");
*/

    var stack = d3.layout.stack()
                .offset("zero")
                .values(function(flow) { return flow.values; })
                .x(function(d) { return d.ts; })
                .y(function(d) { return d.bytes; })

    
    var svg = {};

    /* Reset and redraw the things that don't change for every redraw() */
    m.reset = function() {

      d3.select("#chartToptalk").selectAll("svg").remove();

      svg = d3.select("#chartToptalk")
            .append("svg");

      var width = size.width - margin.left - margin.right;
      var height = size.height - margin.top - margin.bottom;

      xScale = d3.scale.linear().range([0, width]);
      yScale = d3.scale.linear().range([height, 0]);

      xAxis = d3.svg.axis()
              .scale(xScale)
              .ticks(10)
              .orient("bottom");

      yAxis = d3.svg.axis()
              .scale(yScale)
              .ticks(5)
              .orient("left");

      xGrid = d3.svg.axis()
          .scale(xScale)
           .orient("bottom")
           .tickSize(-height)
           .ticks(10)
           .tickFormat("");

      yGrid = d3.svg.axis()
          .scale(yScale)
           .orient("left")
           .tickSize(-width)
           .ticks(5)
           .tickFormat("");

/*
      line = d3.svg.line()
             .x(function(d) { return xScale(d.f[0].ts); })
             .y(function(d) { return yScale(d.f[0].bytes); })
             .interpolate("basis");
*/

      svg.attr("width", width + margin.left + margin.right)
         .attr("height", height + margin.top + margin.bottom);

      var graph = svg.append("g")
         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      graph.append("text")
         .attr("class", "title")
         .attr("text-anchor", "middle")
         .attr("x", width/2)
         .attr("y", -margin.top/2)
         .text("Top flows");

      graph.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height + ")")
         .call(xAxis);

      graph.append("text")
           .attr("class", "x label")
           .attr("text-anchor", "middle")
           .attr("x", width/2)
           .attr("y", height + 15 + 0.5 * margin.bottom)
           .text("Time");

      graph.append("g")
         .attr("class", "y axis")
         .call(yAxis)
         .append("text")
         .attr("x", -margin.left)
         .attr("transform", "rotate(-90)")
         .attr("y", -margin.left)
         .attr("dy", ".71em")
         .style("text-anchor", "end")
         .text("Bytes");

      graph.append("g")
        .attr("class", "xGrid")
        .attr("transform", "translate(0," + height + ")")
        .call(xGrid)
        .attr(
             {
               "fill" : "none",
               "shape-rendering" : "crispEdges",
               "stroke" : "grey",
               "opacity": 0.4,
               "stroke-width" : "1px"
             });

      graph.append("g")
        .attr("class", "yGrid")
        .call(yGrid)
        .attr(
             {
               "fill" : "none",
               "shape-rendering" : "crispEdges",
               "stroke" : "grey",
               "opacity": 0.4,
               "stroke-width" : "1px"
             });

      graph.append("g")
         .attr("id", "flows");

      my.charts.resizeChart("#chartToptalk", size)();
    };


    /* To find the range of the y-axis, find max of the stacked x values */
    var maxBytesSlice = function(chartData) {
      var i, j;
      var flowCount, sampleCount, maxSlice = 0;

      flowCount = chartData.length;
      if (!flowCount) {
        return 0;
      }

      sampleCount = chartData[0].values.length;

      for (i = 0; i < sampleCount; i++) {
        var thisSliceBytes = 0;
        for (j = 0; j < flowCount; j++) {
          thisSliceBytes += chartData[j].values[i].bytes;
        }
        if (thisSliceBytes > maxSlice) {
          maxSlice = thisSliceBytes;
        }
      }
      return maxSlice;
    };


    /* Make a displayable title from the flow key */
    var title = function(fkey) {
      var [cnt, src, sport, dst, dport, proto] = fkey.split("/");
      return "" + src + ":" + sport + " -> " + dst + ":" + dport + " " + proto;
    };


    /* Update the chart (try to avoid memory allocations here!) */
    m.redraw = function() {

      var width = size.width - margin.left - margin.right;
      var height = size.height - margin.top - margin.bottom;

      xScale = d3.scale.linear().range([0, width]);
      yScale = d3.scale.linear().range([height, 0]);

      /* compute the domain of x as the [min,max] extent of timestamps
       * of the first (largest) flow */
      if (chartData[0]) {
        xScale.domain(d3.extent(chartData[0].values, function(d) {
          return d.ts;
        }));
      }

      yScale.domain([0, maxBytesSlice(chartData)]);

      xAxis.scale(xScale);
      yAxis.scale(yScale);

      xGrid.scale(xScale);
      yGrid.scale(yScale);

      svg = d3.select("#chartToptalk");
      //svg.select(".line").attr("d", line(chartData));
      svg.select(".x.axis").call(xAxis);
      svg.select(".y.axis").call(yAxis);
      svg.select(".xGrid").call(xGrid);
      svg.select(".yGrid").call(yGrid);

      var fkeys = chartData.map(function(f) { return f.fkey; });
      colorScale.domain(fkeys);
      var stackedChartData = stack(chartData);

      area = d3.svg.area()
               .interpolate("monotone")
               .x(function (d) { return xScale(d.ts); })
               .y0(function (d) { return yScale(d.y0); })
               .y1(function (d) { return yScale(d.y0 + d.y); });

      svg.select("#flows").selectAll(".layer").remove();

      svg.select("#flows").selectAll("path")
         .data(stackedChartData)
       .enter().append("path")
         .attr("class", "layer")
         .attr("d", function(d) { return area(d.values); })
         .style("fill", function(d, i) { return colorScale(i); })
         .append("svg:title").text(function(d) { return title(d.fkey); });
    };


    /* Set the callback for resizing the chart */
    d3.select(window).on('resize.chartToptalk',
                         my.charts.resizeChart("#chartToptalk", size));

    return m;

  }({}));

  return my;
}(JT));
/* End of jittertrap-chart-toptalk.js */
