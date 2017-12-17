// Apertium Global Pairviewer
// Colin Pillsbury, Spring 2017
// cpillsb1@swarthmore.edu

d3.select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup).on("touchmove", mousemove)
    .on("touchend", mouseup);


var width = window.innerWidth, //These intial values are the only ones that work, not too sure why
    height = window.innerHeight; // Something might be hardcoded somewhere else
var viewScale = 1;

var proj = d3.geo.orthographic()
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .scale(width / 4);

var sky = d3.geo.orthographic()
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .scale(width / 3);

// Point radius can be updated here
var path = d3.geo.path().projection(proj).pointRadius(3);

var swoosh = d3.svg.line()
      .x(function(d) { return d[0] })
      .y(function(d) { return d[1] })
      .interpolate("cardinal")
      .tension(.0);

var links = [],
    arcLines = [];

// Defining tooltip
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Table used to look up full language names
var codeToLangTable = {};
    d3.json("languages.json", function(error, table) {
        codeToLangTable = jQuery.extend(true, {}, table);
    });

// Currently not using long/lat lines, but can be used by uncommenting and pathing
// var graticule = d3.geo.graticule();

var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .on("mousedown", mousedown).on("touchstart", mousedown);
//svg.on("mousewheel",mousewheel)
svg.style("background", "#311B92");
window.addEventListener("resize", resize);
var zoomT = d3.behavior.zoom ().scaleExtent ([0.5, 8]).on('zoom', function () {
  console.log("zoom", d3.event.scale);
 // alert("zoom");
  zoom(d3.event.scale/viewScale);

});
svg.call(zoomT);
function resize() {
  var off = proj([0, 0]);
  var off2 = sky([0, 0]);
  width = window.innerWidth;
  height = window.innerHeight;
  svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
  proj = proj.translate([-off[0], -off[1]]).translate([width / 2, height / 2]);
  sky = sky.translate([-off2[0], -off2[1]]).translate([width / 2, height / 2]);
  path = path.projection(proj).pointRadius(3);
  
    svg.selectAll("circle").attr("r", width / 4).attr("cx", width / 2).attr("cy", height / 2);
  zoom(1);
}

queue()
    .defer(d3.json, "world-110m.json")
    .defer(d3.json, "apertiumPairs.json")
    .await(ready);

function ready(error, world, places) {
  var land = topojson.object(world, world.objects.land),
      borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });
      // grid = graticule(); currently lat lon lines not used, can uncomment to use


  var ocean_fill = svg.append("defs").append("radialGradient")
        .attr("id", "ocean_fill")
        .attr("cx", "75%")
        .attr("cy", "25%");
      ocean_fill.append("stop").attr("offset", "5%").attr("stop-color", "#82B1FF");
      ocean_fill.append("stop").attr("offset", "100%").attr("stop-color", "#2196F3");

  var drop_shadow = svg.append("defs").append("radialGradient")
        .attr("id", "drop_shadow")
        .attr("cx", "50%")
        .attr("cy", "50%");
      drop_shadow.append("stop")
        .attr("offset","20%").attr("stop-color", "#000")
        .attr("stop-opacity",".5")
      drop_shadow.append("stop")
        .attr("offset","100%").attr("stop-color", "#000")
        .attr("stop-opacity","0")


  svg.append("circle")
    .attr("cx", width / 2).attr("cy", height / 2)
    .attr("r", proj.scale())
    .attr("class", "noclicks")
    .style("fill", "url(#ocean_fill)");

  svg.append("path")
    .datum(topojson.object(world, world.objects.land))
    .attr("class", "land")
    .attr("d", path).style("fill", "white");
/*
  svg.append("circle")
    .attr("cx", width / 2).attr("cy", height / 2)
    .attr("r", proj.scale())
    .attr("class","noclicks")
    .style("fill", "url(#globe_highlight)");

  svg.append("circle")
    .attr("cx", width / 2).attr("cy", height / 2)
    .attr("r", proj.scale())
    .attr("class","noclicks")
    .style("fill", "url(#globe_shading)");
*/
  svg.append("path")
    .datum(borders)
    .attr("class", "mesh")
    .style("stroke", "#2196F3") // Border color can be changed here
    .style("fill", "999").style("fill","transparent");


  svg.append("g").attr("class","labels")
        .selectAll("text").data(places.point_data)
      .enter().append("text")
      .attr("class", "label")
      .text(function(d) { return d.tag })
      .on("mouseover", function(d) { //Hovering over labels for tooltip
            div.transition()
                .duration(200)
                .style("opacity", .9);

            div	.html(d.tag + "<br/>" + codeToLanguage(d.tag)) // Looking up full name
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });

  svg.append("g").attr("class","points")
      .selectAll("text").data(places.point_data)
    .enter().append("path")
      .attr("class", "point")
      .attr("d", path)
      .on("mouseover", function(d) { //Also added hovering over points for tooltip
            div.transition()
                .duration(200)
                .style("opacity", .9);

            div	.html(d.tag + "<br/>" + codeToLanguage(d.tag))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });


  // LONG AND LAT LINES, need to uncomment other graticule references to use
  // svg.append("path")
  //       .datum(graticule)
  //       .attr("class", "graticule noclicks")
  //       .attr("d", path);



  places.pairs.forEach(function(a) {
    links.push({
      source: a.coordinates1,
      target: a.coordinates2,
      stage: a.repo
    });
  });


  // build geoJSON features from links array
  links.forEach(function(e,i,a) {
    var feature =  { "type": "Feature", "geometry": { "type": "LineString", "coordinates": [e.source,e.target] }}
    arcLines.push(feature)
  })

  svg.append("g").attr("class","arcs")
    .selectAll("path").data(arcLines)
    .enter().append("path")
      .attr("class","arc")
      .attr("d",path)

  svg.append("g").attr("class","flyers")
    .selectAll("path").data(links)
    .enter().append("path")
    .attr("class","flyer")
    .attr("d", function(d) { return swoosh(flying_arc(d)) })
    .style("stroke", function(d) { return chooseColor(d) })

  refresh();
}

//Position and hiding labels
function position_labels() {
  var centerPos = proj.invert([width/2, height/2]);
  var arc = d3.geo.greatArc();

  svg.selectAll(".label")
    .attr("label-anchor",function(d) {
      var x = proj(d.geometry.coordinates)[0];
      return x < width/2-20 ? "end" :
             x < width/2+20 ? "middle" :
             "start"
    })
    .attr("transform", function(d) {
      var loc = proj(d.geometry.coordinates),
        x = loc[0],
        y = loc[1];
      var offset = x < width/2 ? -5 : 5;
      return "translate(" + (x+offset) + "," + (y-2) + ")"
    })
    .style("display",function(d) {
      var d = arc.distance({source: d.geometry.coordinates, target: centerPos});
      return (d > 1.57) ? 'none' : 'inline';
    })

}

// Chooses flyer color based on language pair stage
function chooseColor(d) {
  var color = "#FF9800";
  if (d.stage == "trunk") {
    color = "#CDDC39";
  }
  else if (d.stage == "staging") {
    color = "#4CAF50";
  }
  else if (d.stage == "nursery") {
    color = "#FFEB3B";
  }
  else if (d.stage == "incubator") {
    color = "#E91E63";
  }
  else {
    color = "#9C27B0"
  }
  return color;
}



function zoom(factor) {
  svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
  width = window.innerWidth;
  height = window.innerHeight;
  
  if (factor > 0) { 
    viewScale = viewScale * factor;
  }
  var vH = height * viewScale;  
  var vW = width * viewScale;  
  var vM = Math.min(vW , vH );
  sky = sky.scale(vM / 3);

  proj = proj.scale(vM / 4);

  path = path.projection(proj).pointRadius(3);

  svg.selectAll("circle").attr("r", vM/ 4);
  refresh();

}



function flying_arc(pts) {
  var source = pts.source,
      target = pts.target;

  var mid = location_along_arc(source, target, .5);
  var result = [ proj(source),
                 sky(mid),
                 proj(target)]
  
  return result;
}

function codeToLanguage(code) {
    // Presuming that it is in fact a three-letter terminological code
    if (codeToLangTable[code] === undefined) {
        return "Unknown";
    }
    return codeToLangTable[code];
}


function refresh() {
  svg.selectAll(".land").attr("d", path);
  svg.selectAll(".point").attr("d", path);
  svg.selectAll(".mesh").attr("d", path);
  svg.selectAll(".arc").attr("d", path);
  // svg.selectAll(".graticule").attr("d", path); //This adds long and lat lines

  position_labels();

  svg.selectAll(".flyer")
    .attr("d", function(d) { return swoosh(flying_arc(d)) })
    .attr("opacity", function(d) {
      return fade_at_edge(d)
    })
}

function fade_at_edge(d) {
  var centerPos = proj.invert([width / 2, height / 2]),
      arc = d3.geo.greatArc(),
      start, end;
  // function is called on 2 different data structures..
  if (d.source) {
    start = d.source,
    end = d.target;
  }
  else {
    start = d.coordinates1;
    end = d.coordinates2;
  }

  var start_dist = 1.57 - arc.distance({source: start, target: centerPos}),
      end_dist = 1.57 - arc.distance({source: end, target: centerPos});

  var fade = d3.scale.linear().domain([-.1,0]).range([0,.1])
  var dist = start_dist < end_dist ? start_dist : end_dist;
  return fade(dist)
}

function location_along_arc(start, end, loc) {
  var interpolator = d3.geo.interpolate(start,end);
  return interpolator(loc)
}

// modified from http://bl.ocks.org/1392560
var m0, o0;
function mousedown() {
  m0 = [d3.event.pageX|(d3.event.touches?d3.event.touches:[d3.event])[0].pageX, d3.event.pageY|(d3.event.touches?d3.event.touches:[d3.event])[0].pageY];
  o0 = proj.rotate();
  d3.event.preventDefault();
}
function mousewheel() {
  //console.log(d3.event, d3.event.wheelDelta);
  var delta = d3.event.wheelDelta;
  var mxChange = 10;
  delta = Math.max(Math.min(delta, mxChange), -mxChange);
  var factor = Math.pow(1.01, delta);
  zoom(factor);
  d3.event.preventDefault();
}
function mousemove() {
  if (m0) {
    var m1 = [d3.event.pageX|(d3.event.touches?d3.event.touches:[d3.event])[0].pageX, d3.event.page|(d3.event.touches?d3.event.touches:[d3.event])[0].pageY]
      , o1 = [o0[0] + (m1[0] - m0[0]) / 6, o0[1] + (m0[1] - m1[1]) / 6];
    o1[1] = o1[1] > 40  ? 40  :  // Affects maximum turn (upper and lower limit)
            o1[1] < -40 ? -40 :
            o1[1];
    proj.rotate(o1);
    sky.rotate(o1);
    refresh();
  }
}
function mouseup() {
  if (m0) {
    mousemove();
    m0 = null;
  }
}
