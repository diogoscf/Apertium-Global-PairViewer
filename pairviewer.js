// Apertium Global Pairviewer
// Colin Pillsbury, Spring 2017
// cpillsb1@swarthmore.edu

var fixedWidth = window.innerWidth,
    fixedHeight = window.innerHeight;

var width = window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth;

var currentRepoFilter = [];
var currentPointFilter = [];
var currentDirFilter = [];

var proj = d3.geo.orthographic()
    .translate([fixedWidth / 2, fixedHeight / 2])
    .clipAngle(90)
    .scale(width / 4);

var sky = d3.geo.orthographic()
    .translate([fixedWidth / 2, fixedHeight / 2])
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
  .attr("width", fixedWidth)
  .attr("height", fixedHeight);
svg.style("background", "#311B92");

window.addEventListener("resize", resize);

var zoom = d3.behavior.zoom(true)
    .scale(proj.scale())
    .scaleExtent([100, 50000])
    .on("zoom", zoomed);

svg.call(zoom);
d3.select("svg").on("dblclick.zoom", null);

function resize() {
  fixedWidth = window.innerWidth;
  fixedHeight = window.innerHeight;
  svg.attr("width", fixedWidth).attr("height", fixedHeight);

  sky = d3.geo.orthographic()
      .translate([fixedWidth / 2, fixedHeight / 2])
      .clipAngle(90)
      .scale(width / 3);

  proj = d3.geo.orthographic()
      .translate([fixedWidth / 2, fixedHeight / 2])
      .clipAngle(90)
      .scale(width / 4);

  path = d3.geo.path().projection(proj).pointRadius(3);

  svg.selectAll("circle").attr("cx", fixedWidth / 2).attr("cy", fixedHeight / 2);
  
  if(o0) {
    proj.rotate(o0);
    sky.rotate(o0);
  }

  refresh();

  var sidenavHeight = $("#sidenav").css("height");
  var val = parseInt(sidenavHeight.substring(0,sidenavHeight.length-2));
  var offset = 267;
  var total = val - offset >= 0 ? val - offset : 0;
  $("#pointList").css("max-height", (total) + "px");
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
    .attr("cx", fixedWidth / 2).attr("cy", fixedHeight / 2)
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
      .attr("coordinate", function(d) {return d.geometry.coordinates})
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
      .attr("coordinate", function(d) {return d.geometry.coordinates})
      .attr("tag", function(d) { return d.tag })
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
      sourceTag: a.lg2,
      targetTag: a.lg1,
      stage: a.repo,
      direction: a.direction
    });
  });


  // build geoJSON features from links array
  links.forEach(function(e,i,a) {
    var feature =  { "type": "Feature", "geometry": { "type": "LineString", "coordinates": [e.source,e.target] }, "stage": e.stage, "sourceTag": e.sourceTag, "targetTag": e.targetTag, "direction": e.direction }
    arcLines.push(feature)
  })

  svg.append("g").attr("class","arcs")
    .selectAll("path").data(arcLines)
    .enter().append("path")
      .attr("class","arc")
      .attr("d",path)
      .attr("stage", function(d) {return d.stage})
      .attr("sourceTag", function(d) {return d.sourceTag})
      .attr("targetTag", function(d) {return d.targetTag})
      .attr("direction", function(d) {return d.direction})

  svg.append("g").attr("class","flyers")
    .selectAll("path").data(links)
    .enter().append("path")
    .attr("class","flyer")
    .attr("d", function(d) { return swoosh(flying_arc(d)) })
    .style("stroke", function(d) { return chooseColor(d) })

  // Populate the filter point list
  var alphaPointList = [];
  for(var i = 0; i < points.point_data.length; i++) {
    alphaPointList.push(points.point_data[i].tag);
  }
  alphaPointList.sort();
  for(var i = 0; i < alphaPointList.length; i++) {
    var newPoint = $("<a>")
      .attr("id", "point" + alphaPointList[i])
      .attr("class", "dropdown-select")
      .attr("onclick", "filterPoint('" + alphaPointList[i] + "')")
      .text(alphaPointList[i])
    $("#pointList").append(newPoint);
  }

  refresh();
  handleUnusedPoints();
}

//Position and hiding labels
function position_labels() {
  var centerPos = proj.invert([fixedWidth/2, fixedHeight/2]);
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

function setPoints(o1,o2) {
  svg.selectAll(".point").style("opacity", o1);
  svg.selectAll(".label").style("opacity", o2);
}

// Update globe and repo filter array
function selectRepoFilter(f) {
  if($("#checkmark" + f).length === 0) {
    $("#filter" + f).html(f + '<i id=checkmark' + f + ' class="fa fa-check checkmark"></i>');
    currentRepoFilter.push(f);
  }
  else {
    $("#checkmark" + f).remove();
    currentRepoFilter.splice(currentRepoFilter.indexOf(f),1);
  } 
  filterArcs();
  refresh();
  handleUnusedPoints();
}

// Update direction filter and globe
function selectDirFilter(dir) {
  if($("#checkmarkDir" + dir).length === 0) {
    $("#dir" + dir).html(dir + '<i id=checkmarkDir' + dir + ' class="fa fa-check checkmark"></i>');
    currentDirFilter.push(dir);
  }
  else {
    $("#checkmarkDir" + dir).remove();
    currentDirFilter.splice(currentDirFilter.indexOf(dir),1);
  }
  filterArcs();
  refresh();
  handleUnusedPoints();
}

// Update point filter and globe
function filterPoint(p) {
  if($("#checkmarkPoint" + p).length === 0) {
    $("#point" + p).html(p + '<i id=checkmarkPoint' + p + ' class="fa fa-check checkmark"></i>');
    currentPointFilter.push(p);
    rotateToPoint(p);
  }
  else {
    $("#checkmarkPoint" + p).remove();
    currentPointFilter.splice(currentPointFilter.indexOf(p),1);
  }
  filterArcs();
  refresh();
  handleUnusedPoints();
}

function resetFilters() {
  $(".checkmark").remove();
  
  currentRepoFilter = [];
  currentPointFilter = [];
  currentDirFilter = [];

  $("#pointSearch")[0].value = "";
  filterSearchPoints();

  $("#pointCheckbox").prop("checked", false);

  filterArcs();
  refresh();
  handleUnusedPoints();
}

function filterArcs() {
  for(var i = 0; i < svg.selectAll(".arc")[0].length; i++) {
    svg.selectAll(".arc")[0][i].setAttribute("opacity",1);
  }
  if(currentRepoFilter.length > 0) {
    for(var i = 0; i < svg.selectAll(".arc")[0].length; i++) {
      for(var j = 0; j < currentRepoFilter.length; j++) {
        if(svg.selectAll(".arc")[0][i].getAttribute("stage") !== currentRepoFilter[j].toLowerCase()) {
          svg.selectAll(".arc")[0][i].setAttribute("opacity",0);
        }
        else {
          svg.selectAll(".arc")[0][i].setAttribute("opacity",1);
          break;
        }
      }
    }
  }
  if(currentPointFilter.length > 0) {
    for(var i = 0; i < svg.selectAll(".arc")[0].length; i++) {
      if(svg.selectAll(".arc")[0][i].getAttribute("opacity") === "0") {
        continue;
      }
      var filterReturn = 0;
      for(var j = 0; j < currentPointFilter.length; j++) {
        if(svg.selectAll(".arc")[0][i].getAttribute("sourceTag") === currentPointFilter[j] || svg.selectAll(".arc")[0][i].getAttribute("targetTag") === currentPointFilter[j]) {
          filterReturn = 1;
          break;
        }
      }
      if(filterReturn === 0) {
        svg.selectAll(".arc")[0][i].setAttribute("opacity",0);
      }
    }
  }
  if(currentDirFilter.length > 0) {
    for(var i = 0; i < svg.selectAll(".arc")[0].length; i++) {
      if(svg.selectAll(".arc")[0][i].getAttribute("opacity") === "0") {
        continue;
      }
      var filterReturn = 0;
      for(var j = 0; j < currentDirFilter.length; j++) {
        if((svg.selectAll(".arc")[0][i].getAttribute("direction") === "<>" && currentDirFilter[j] === "Bidirectional") || (svg.selectAll(".arc")[0][i].getAttribute("direction") === ">" && currentDirFilter[j] === "Unidirectional") || (currentDirFilter[j] === "Unknown" && svg.selectAll(".arc")[0][i].getAttribute("direction") !== "<>" && svg.selectAll(".arc")[0][i].getAttribute("direction") !== ">")) {
          filterReturn = 1;
          break;
        }
      }
      if(filterReturn === 0) {
        svg.selectAll(".arc")[0][i].setAttribute("opacity",0);
      }
    }
  }

}

$(".eP").click(function(e) {
    e.stopPropagation();
});

$("body,html").click(function(e){
  if ($("#sidenav").css("left") === "0px"){
    closeNav();
  }
});

function openNav() {
  $("#sidenav").css("left", "0px");
}

function closeNav() {
  $("#sidenav").css("left", "-180px");
}

function toggleDropdown(t, id) {
  if($(id).css("display") === "none") {
    $(".dropdown-content").css("display", "none");
    for(var i = 0; i < $(".dropdown-content").length; i++) {
      var filterButton = $(".dropdown-content")[i].previousElementSibling;
      filterButton.innerHTML = filterButton.innerHTML.slice(0,filterButton.innerHTML.indexOf("<")) + '<i class="fa fa-caret-right"></i>';
    }
  }
  $(id).toggle();
  if($(id).css("display") === "none") {
    t.innerHTML = t.innerHTML.slice(0,t.innerHTML.indexOf("<")) + '<i class="fa fa-caret-right"></i>';
  }
  else {
    t.innerHTML = t.innerHTML.slice(0,t.innerHTML.indexOf("<")) + '<i class="fa fa-caret-down"></i>';
  }
  var sidenavHeight = $("#sidenav").css("height");
  var val = parseInt(sidenavHeight.substring(0,sidenavHeight.length-2));
  var offset = 267;
  var total = val - offset >= 0 ? val - offset : 0;
  $("#pointList").css("max-height", (total) + "px");
}

function checkPoints() {
  $("#pointCheckbox").prop("checked", !$("#pointCheckbox").prop("checked"));
  handleUnusedPoints();
}

function filterSearchPoints() {
  var searchValue = $("#pointSearch")[0].value;
  var points = $("#pointList")[0].children;
  var searchEmpty = 0;
  for(var i = 0; i < points.length; i++) {
    if($(points[i]).text().substring(0,searchValue.length).toUpperCase() !== searchValue.toUpperCase()) {
      $(points[i]).css("display","none");
    }
    else {
      $(points[i]).css("display","");
      searchEmpty = 1;
    }
  }
  if(searchEmpty === 0) {
    $("#pointList").css("min-height",0);
  }
  if(searchEmpty === 1 || searchValue === "") {
    $("#pointList").css("min-height",42);
  }
}

function handleUnusedPoints() {
  if($("#pointCheckbox").prop("checked") === false) {
    setPoints(0,0);
  }
  else {
    setPoints(0.6,0.9);
    return;
  }

  svg.selectAll(".flyer")
  .attr("opacity", function (d) {
    if(this.getAttribute("opacity") !== "0") {
      var dsource = String(d.source[0])+","+String(d.source[1]);
      var dtarget = String(d.target[0])+","+String(d.target[1]);
      for(var j = 0; j < svg.selectAll(".point")[0].length; j++) {
        if(svg.selectAll(".point")[0][j].getAttribute("coordinate") === dsource) {
          svg.selectAll(".point")[0][j].setAttribute("style", "opacity: 0.6");
        }
        if(svg.selectAll(".point")[0][j].getAttribute("coordinate") === dtarget) {
          svg.selectAll(".point")[0][j].setAttribute("style", "opacity: 0.6");
        }
      }
      for(var k = 0; k < svg.selectAll(".label")[0].length; k++) {
        if(svg.selectAll(".label")[0][k].getAttribute("coordinate") === dsource) {
          svg.selectAll(".label")[0][k].setAttribute("style", "opacity: 0.9");
        }
        if(svg.selectAll(".label")[0][k].getAttribute("coordinate") === dtarget) {
          svg.selectAll(".label")[0][k].setAttribute("style", "opacity: 0.9");
        }
      }
    }
    return fade_at_edge(d);
  })

  for(var i = 0; i < svg.selectAll(".point")[0].length; i++) {
    if(currentPointFilter.indexOf(svg.selectAll(".point")[0][i].getAttribute("tag")) !== -1) {
      svg.selectAll(".point")[0][i].setAttribute("style", "opacity: 0.6");
    }
  }
  for(var i = 0; i < svg.selectAll(".label")[0].length; i++) {
    if(currentPointFilter.indexOf(svg.selectAll(".label")[0][i].innerHTML) !== -1) {
      svg.selectAll(".label")[0][i].setAttribute("style", "opacity: 0.9");
    }
  }
  refresh();
}

function fade_at_edge(d) {
  if(currentRepoFilter.length > 0) {
    var filterReturn = 0;
    for(var i = 0; i < currentRepoFilter.length; i++) {
      if(d.stage === currentRepoFilter[i].toLowerCase()) {
        filterReturn = 1;
        break;
      }
    }
    if(filterReturn === 0) {
      return 0;
    }
  }

  if(currentPointFilter.length > 0) {
    var filterReturn = 0;
    for(var i = 0; i < currentPointFilter.length; i++) {
      if(d.sourceTag === currentPointFilter[i] || d.targetTag === currentPointFilter[i]) {
        filterReturn = 1;
        break;
      }
    }
    if(filterReturn === 0) {
      return 0;
    }
  }

  if(currentDirFilter.length > 0) {
    var filterReturn = 0;
    for(var i = 0; i < currentDirFilter.length; i++) {
      if((d.direction === "<>" && currentDirFilter[i] === "Bidirectional") || (d.direction === ">" && currentDirFilter[i] === "Unidirectional") || (currentDirFilter[i] === "Unknown" && d.direction !== "<>" && d.direction !== ">")) {
        filterReturn = 1;
        break;
      }
    }
    if(filterReturn === 0) {
      return 0;
    }
  }

  var centerPos = proj.invert([fixedWidth / 2, fixedHeight / 2]),

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

function rotateToPoint(p) {
  var rotate = proj.rotate();
  var coords;
  for(var i = 0; i < svg.selectAll(".point")[0].length; i++) {
    if(svg.selectAll(".point")[0][i].getAttribute("tag") === p) {
      coords = svg.selectAll(".point")[0][i].getAttribute("coordinate");
    }
  }
  var q = coords.split(',');
  d3.transition().duration(2500).tween("rotate", function() {
    var r = d3.interpolate(proj.rotate(), [-parseInt(q[0]), -parseInt(q[1])]);
    return function(t) {
      proj.rotate(r(t));
      sky.rotate(r(t));
      o0 = proj.rotate();
      refresh();
    }
  })
}

// modified from http://bl.ocks.org/KoGor/5994804
var sens = 0.25;
var o0;
svg.call(d3.behavior.drag()
    .origin(function() { var r = proj.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
    .on("drag", function() {
      var rotate = proj.rotate();
      var ydir = -d3.event.y * sens;
      ydir = ydir > 70 ? 70 : // Affects maximum turn (upper and lower limit)
                  ydir < -70 ? -70 :
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

// Zooms by interpolating
function zoomIn() {
  var scale = zoom.scale();

  d3.transition().duration(150).tween("zoom", function () {
    var interpolate_scale = d3.interpolate(scale, scale * 1.2);
    return function (t) {
      zoom.scale(interpolate_scale(t));
      zoomed();
    };
  });
}

function zoomOut() {
  var scale = zoom.scale();

  d3.transition().duration(150).tween("zoom", function () {
    var interpolate_scale = d3.interpolate(scale, scale / 1.2);
    return function (t) {
      zoom.scale(interpolate_scale(t));
      zoomed();
    };
  });
}

// Start off slightly zoomed-in
resetZoom();

function zoomed() {
  var scale = zoom.scale();
  width = scale;

  proj = d3.geo.orthographic()
      .translate([fixedWidth / 2, fixedHeight / 2])
      .clipAngle(90)
      .scale(scale / 4);

  sky = d3.geo.orthographic()
      .translate([fixedWidth / 2, fixedHeight / 2])
      .clipAngle(90)
      .scale(scale / 3);

  path = d3.geo.path().projection(proj).pointRadius(3);

  svg.selectAll("circle").attr("r", scale / 4);

  if(o0) {
    proj.rotate(o0);
    sky.rotate(o0);
  }
  sens = 0.25/zoom.scale()*1330;
  refresh();
}

function resetZoom() {
  var scale = zoom.scale();
  var initial = 2;
  var defaultScale = Math.min(initial*fixedHeight,initial*fixedWidth);

  d3.transition().duration(150).tween("zoom", function () {
    var interpolate_scale = d3.interpolate(scale, defaultScale);
    return function (t) {
      zoom.scale(interpolate_scale(t));
      zoomed();
    };
  });
}

// Zoom-in with + key and zoom-out with - key and reset with 0
window.onkeydown = function(e) {
  if (navigator.userAgent.search("Chrome") >= 0) {
    if(e.keyCode === 187) {
      e.preventDefault();
      zoomIn();
    }
    if(e.keyCode === 189) {
      e.preventDefault();
      zoomOut();
    }
    if(e.keyCode === 48) {
      e.preventDefault();
      resetZoom();
    }
  }
  else if (navigator.userAgent.search("Firefox") >= 0) {
    if(e.keyCode === 61) {
      e.preventDefault();
      zoomIn();
    }
    if(e.keyCode === 173) {
      e.preventDefault();
      zoomOut();
    }
    if(e.keyCode === 48) {
      e.preventDefault();
      resetZoom();
    }
  }
};
