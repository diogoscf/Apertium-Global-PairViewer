// Apertium Global Pairviewer
// Colin Pillsbury, Spring 2017
// cpillsb1@swarthmore.edu

var width = window.innerWidth,
    height = window.innerHeight;
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
  .attr("height", height);
svg.style("background", "#311B92");

window.addEventListener("resize", resize);
var zoomBehavior = d3.behavior.zoom ().scaleExtent ([0.5, 8]).on('zoom', function () {
  zoom(d3.event.scale/viewScale);
});
svg.call(zoomBehavior);

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
    .defer(d3.json, "apertiumPoints.json")
    .await(ready);

function ready(error, world, places, points) {
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

  var markerDef = svg.append("defs");
  markerDef.append("marker")
        .attr("id", "trunkoneway")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", "2")
        .attr("refY", "2")
        .attr("markerWidth", "20")
        .attr("markerHeight", "20")
        .attr("orient", "auto")
        .style("fill", "#CDDC39")
        .style("stroke", "black")
        .style("stroke-width", "0.3px")
      .append("path")
        .attr("d", "M 1 1 L 3 2 L 1 3 Z");
  markerDef.append("marker")
        .attr("id", "trunktwoway")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", "2.5")
        .attr("refY", "2")
        .attr("markerWidth", "20")
        .attr("markerHeight", "20")
        .attr("orient", "auto")
        .style("fill", "#CDDC39")
        .style("stroke", "black")
        .style("stroke-width", "0.3px")
      .append("path")
        .attr("d", "M0 2 L 2 1 L 2 3 L 0 2 M 2.5 1 L 4.5 2 L 2.5 3 L 2.5 1");
  markerDef.append("marker")
        .attr("id", "stagingoneway")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", "2")
        .attr("refY", "2")
        .attr("markerWidth", "20")
        .attr("markerHeight", "20")
        .attr("orient", "auto")
        .style("fill", "#4CAF50")
        .style("stroke", "black")
        .style("stroke-width", "0.3px")
      .append("path")
        .attr("d", "M 1 1 L 3 2 L 1 3 Z");
  markerDef.append("marker")
        .attr("id", "stagingtwoway")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", "2.5")
        .attr("refY", "2")
        .attr("markerWidth", "20")
        .attr("markerHeight", "20")
        .attr("orient", "auto")
        .style("fill", "#4CAF50")
        .style("stroke", "black")
        .style("stroke-width", "0.3px")
      .append("path")
        .attr("d", "M0 2 L 2 1 L 2 3 L 0 2 M 2.5 1 L 4.5 2 L 2.5 3 L 2.5 1");
  markerDef.append("marker")
        .attr("id", "nurseryoneway")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", "2")
        .attr("refY", "2")
        .attr("markerWidth", "20")
        .attr("markerHeight", "20")
        .attr("orient", "auto")
        .style("fill", "#FFEB3B")
        .style("stroke", "black")
        .style("stroke-width", "0.3px")
      .append("path")
        .attr("d", "M 1 1 L 3 2 L 1 3 Z");
  markerDef.append("marker")
        .attr("id", "nurserytwoway")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", "2.5")
        .attr("refY", "2")
        .attr("markerWidth", "20")
        .attr("markerHeight", "20")
        .attr("orient", "auto")
        .style("fill", "#FFEB3B")
        .style("stroke", "black")
        .style("stroke-width", "0.3px")
      .append("path")
        .attr("d", "M0 2 L 2 1 L 2 3 L 0 2 M 2.5 1 L 4.5 2 L 2.5 3 L 2.5 1");
  markerDef.append("marker")
        .attr("id", "incubatoroneway")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", "2")
        .attr("refY", "2")
        .attr("markerWidth", "20")
        .attr("markerHeight", "20")
        .attr("orient", "auto")
        .style("fill", "#E91E63")
        .style("stroke", "black")
        .style("stroke-width", "0.3px")
      .append("path")
        .attr("d", "M 1 1 L 3 2 L 1 3 Z");
  markerDef.append("marker")
        .attr("id", "incubatortwoway")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", "2.5")
        .attr("refY", "2")
        .attr("markerWidth", "20")
        .attr("markerHeight", "20")
        .attr("orient", "auto")
        .style("fill", "#E91E63")
        .style("stroke", "black")
        .style("stroke-width", "0.3px")
      .append("path")
        .attr("d", "M0 2 L 2 1 L 2 3 L 0 2 M 2.5 1 L 4.5 2 L 2.5 3 L 2.5 1");

  svg.append("circle")
    .attr("cx", width / 2).attr("cy", height / 2)
    .attr("r", proj.scale())
    .attr("class", "noclicks")
    .attr("id", "circle1")
    .style("fill", "url(#ocean_fill)");

  svg.append("path")
    .datum(topojson.object(world, world.objects.land))
    .attr("class", "land")
    .attr("d", path).style("fill", "white");

  svg.append("path")
    .datum(borders)
    .attr("class", "mesh")
    .style("stroke", "#2196F3") // Border color can be changed here
    .style("fill", "999").style("fill","transparent");



  svg.append("g").attr("class","labels")
        .selectAll("text").data(points.point_data)
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
      .selectAll("text").data(points.point_data)
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
    var s, t;
    for(var pointInd = 0; pointInd < points.point_data.length; pointInd++) {
      if(points.point_data[pointInd].tag === a.lg2) {
        s = points.point_data[pointInd].geometry.coordinates;
      }
      if(points.point_data[pointInd].tag === a.lg1) {
        t = points.point_data[pointInd].geometry.coordinates;
      }
    }
    links.push({
      source: s,
      target: t,
      stage: a.repo,
      direction: a.direction
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
  var vM = Math.min(vW, vH);
  sky = sky.scale(vM / 3);

  proj = proj.scale(vM / 4);

  path = path.projection(proj).pointRadius(3);

  svg.selectAll("circle").attr("r", vM / 4);
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
    .attr("d", function (d) { return swoosh(flying_arc(d)) })
    .attr("marker-mid", function (d) {return addMarker(d)})
    .attr("opacity", function (d) {
      return fade_at_edge(d)
    });
}

function addMarker(d) {
  if(d.direction === "<>") {
    return "url(#" + d.stage + "twoway)";
  }
  else if (d.direction === ">") {
    return "url(#" + d.stage + "oneway)";
  }
  else {
    return "";
  }
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


// modified from http://bl.ocks.org/KoGor/5994804
var sens = 0.25;
var o0;
svg.call(d3.behavior.drag()
    .origin(function() { var r = proj.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
    .on("drag", function() {
      var rotate = proj.rotate();
      var ydir = -d3.event.y * sens;
      ydir = ydir > 40 ? 40 : // Affects maximum turn (upper and lower limit)
                  ydir < -40 ? -40 :
                  ydir;
      proj.rotate([d3.event.x * sens, ydir, rotate[2]]);
      sky.rotate([d3.event.x * sens, ydir, rotate[2]]);
      o0 = proj.rotate();
      refresh();
    })
);


window.addEventListener('touchmove',
  function (e) {
    e.preventDefault();
  }
, false);
zoom(1);
