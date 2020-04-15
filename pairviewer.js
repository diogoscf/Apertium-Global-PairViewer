// Apertium Global Pairviewer
// Colin Pillsbury, Spring 2017
// cpillsb1@swarthmore.edu

let fixedWidth = window.innerWidth,
  fixedHeight = window.innerHeight;

let width =
  window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth;

let currentRepoFilter = [];
let currentPointFilter = [];
let currentDirFilter = [];

let MARKER_SIZE = "40";

let proj = d3
  .geoOrthographic()
  .translate([fixedWidth / 2, fixedHeight / 2])
  .clipAngle(90)
  .scale(width / 4);

let sky = d3
  .geoOrthographic()
  .translate([fixedWidth / 2, fixedHeight / 2])
  .clipAngle(90)
  .scale(width / 3.75);

// Point radius can be updated here
let path = d3
  .geoPath()
  .projection(proj)
  .pointRadius(3);

let swoosh = d3
  .line()
  .x(d => d[0])
  .y(d => d[1])
  .curve(d3.curveCardinal.tension(-1.5));

let space = d3
  .geoAzimuthalEquidistant()
  .translate([fixedWidth / 2, fixedHeight / 2])
  .clipAngle(90)
  .scale(width);

let spacePath = d3
  .geoPath()
  .projection(space)
  .pointRadius(1);

let links = [],
  arcLines = [];

// Defining tooltip
let div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Table used to look up full language names
let codeToLangTable = {};
d3.json("languages.json", function (error, table) {
  codeToLangTable = jQuery.extend(true, {}, table);
});

// Currently not using long/lat lines, but can be used by uncommenting and pathing
// let graticule = d3.geo.graticule();

let svg = d3
  .select("body")
  .append("svg")
  .attr("width", fixedWidth)
  .attr("height", fixedHeight);
svg.style("background", "black");

let zoom = d3
  .zoom()
  .scaleExtent([500, 50000])
  .on("start", zoomstart)
  .on("zoom", zoomed)
  .on("end", zoomend);

svg.call(zoom);

d3.select("svg").on("dblclick.zoom", null);

window.addEventListener("resize", resize);

/**
 * Called on window resize
 * Recenters the globe, keeping the old rotation and zoom
 */
function resize() {
  fixedWidth = window.innerWidth;
  fixedHeight = window.innerHeight;
  drawLegend();
  svg.attr("width", fixedWidth).attr("height", fixedHeight);

  sky = d3
    .geoOrthographic()
    .translate([fixedWidth / 2, fixedHeight / 2])
    .clipAngle(90)
    .scale(width / 3.75);

  proj = d3
    .geoOrthographic()
    .translate([fixedWidth / 2, fixedHeight / 2])
    .clipAngle(90)
    .scale(width / 4);

  path = d3
    .geoPath()
    .projection(proj)
    .pointRadius(3);

  space = d3
    .geoAzimuthalEquidistant()
    .translate([fixedWidth / 2, fixedHeight / 2])
    .clipAngle(90)
    .scale(width);

  spacePath = d3
    .geoPath()
    .projection(space)
    .pointRadius(1);

  svg
    .select("#globe")
    .attr("cx", fixedWidth / 2)
    .attr("cy", fixedHeight / 2);

  if (o0) {
    proj.rotate(o0);
    sky.rotate(o0);
    space.rotate([-o0[0], -o0[1], o0[2]]);
  }

  refresh();
}

let diversityById = {};

/**
 * Colours the globe according to language diversity, or decolours it
 */
function colourMap() {
  if (!$("#toggleMapColourCheckbox").prop("checked")) {
    svg
      .selectAll("path.land")
      .style("fill", "white")
      .style("stroke", "gray");

    svg.select(".labels").style("fill", "black");

    svg.select(".points").style("fill", "black");

    d3.select("#toggleLegend").style("display", "none");
    svg.select(".legend").style("visibility", "hidden");
  } else {
    svg
      .selectAll("path.land")
      .style("fill", d => countryColor(diversityById[d.id]))
      .style("stroke", "#001a00");

    svg.select(".labels").style("fill", "white");

    svg.select(".points").style("fill", "#e0e0e0");
    d3.select("#toggleLegend").style("display", "block");
    svg.select(".legend").style("visibility", $("#toggleLegendCheckbox").prop("checked") ? "visible" : "hidden");
  }
}

/**
 * Changes whether the map is coloured or not
 */
function toggleMapColour() {
  $("#toggleMapColourCheckbox").prop(
    "checked",
    !$("#toggleMapColourCheckbox").prop("checked")
  );

  colourMap();
  refresh();
}

/**
 * Displays or hides the globe's colour legend
 */
function toggleLegend() {
  $("#toggleLegendCheckbox").prop(
    "checked",
    !$("#toggleLegendCheckbox").prop("checked")
  );

  if (!$("#toggleLegendCheckbox").prop("checked")) {
    svg.select(".legend").style("visibility", "hidden");
  } else {
    svg.select(".legend").style("visibility", "visible");
  }
}

let legend = svg.append("defs")
  .append("svg:linearGradient")
  .attr("id", "gradient")
  .attr("x1", "0%")
  .attr("y1", "100%")
  .attr("x2", "100%")
  .attr("y2", "100%")
  .attr("spreadMethod", "pad");

legend.append("stop")
  .attr("offset", "0%")
  .attr("stop-color", "#55b380")
  .attr("stop-opacity", 1);

legend.append("stop")
  .attr("offset", "100%")
  .attr("stop-color", "#003300")
  .attr("stop-opacity", 1);

let legendWidth = 200;
let legendHeight = 20;

let yScale = d3.scaleLinear()
  .range([200, 0])
  .domain([1, 0]);

let yAxis = d3.axisBottom()
  .scale(yScale)
  .ticks(5);

/**
 * Draws the globe colour legend
 */
function drawLegend() {
  d3.select(".legend").remove();

  let key = svg.append("g").attr("class", "legend")
    .style("visibility", $("#toggleLegendCheckbox").prop("checked") ? "visible" : "hidden");
  key.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#gradient)")
    .attr("transform", "translate(" + (fixedWidth - legendWidth - 10) + ",10)");

  key.append("g")
    .attr("class", "yAxis")
    .attr("transform", "translate(" + (fixedWidth - legendWidth - 10) + ",30)")
    .call(yAxis);

  key.append("text")
    .attr("class", "legendHeading")
    .attr("y", 70)
    .attr("x", fixedWidth - legendWidth + 25)
    .style("fill", "white")
    .text("Linguistic Diversity");
}

/**
 * Draws the stars in space along a rotateable sphere
 * @param {Number} stars Number of stars to create
 */
function drawStars(stars) {
  let data = [];
  for (let i = 0; i < stars; i++) {
    data.push({
      geometry: {
        type: "Point",
        coordinates: randomLonLat()
      },
      type: "Feature",
      properties: {
        radius: Math.random() * 1.5 + 0.2
      }
    });
  }
  svg.append("g").attr("class", "stars")
    .selectAll(".star")
    .data(data)
    .enter()
    .append("path")
    .attr("class", "star")
    .attr("d", function (d) {
      spacePath.pointRadius(d.properties.radius);
      return spacePath(d);
    })
    .style("fill", "#fff");
}

/**
 * Generates a random longitude and latitude
 * @return {Array} random longitude and latitude
 */
function randomLonLat() {
  return [Math.random() * 360 - 180, Math.random() * 180 - 90];
}

/**
 * Changes the filtered language according to the clicked point
 * @param {String} d Clicked point
 */
function singleClick(d) {
  if (d === currentFiltered) {
    filterPoint(currentFiltered);
    currentFiltered = "none";
  } else if (currentFiltered === "none") {
    filterPoint(d);
    currentFiltered = d;
  } else {
    filterPoint(currentFiltered);
    filterPoint(d);
    currentFiltered = d;
  }
}

/**
 * Finds the language name for a given three-letter code
 * @param {String} code Language Code
 * @return {String} Language Name
 */
function codeToLanguage(code) {
  return codeToLangTable[code] || "Unknown";
}

let timer = 0;
let delay = 200;
let prevent = false;

queue()
  .defer(d3.json, "world-110m.json")
  .defer(d3.json, "apertiumPairs.json")
  .defer(d3.json, "apertiumPoints.json")
  .defer(d3.tsv, "linguistic_diversity.tsv")
  .await(ready);

/**
 * Runs when all external resources have been loaded
 * Draws the svg (globe, points, flyers, stars)
 * @param {Error} error Error while loading resources
 * @param {Object} world Data for world aspect (land, oceans, international borders)
 * @param {Object} places Language pairs supported by Apertium and respective data
 * @param {Object} points Languages supported by Apertium and respective coordinates
 * @param {Array} diversity Linguistic diversity for each country (used for colouring the globe)
 */
function ready(error, world, places, points, diversity) {
  // grid = graticule(); currently lat lon lines not used, can uncomment to use

  drawStars(500); // You can change the number of stars here

  let oceanFill = svg
    .append("defs")
    .append("radialGradient")
    .attr("id", "oceanFill")
    .attr("cx", "75%")
    .attr("cy", "25%");
  oceanFill
    .append("stop")
    .attr("offset", "5%")
    .attr("stop-color", "#82B1FF");
  oceanFill
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#2196F3");

  let dropShadow = svg
    .append("defs")
    .append("radialGradient")
    .attr("id", "dropShadow")
    .attr("cx", "50%")
    .attr("cy", "50%");
  dropShadow
    .append("stop")
    .attr("offset", "20%")
    .attr("stop-color", "#000")
    .attr("stop-opacity", ".5");
  dropShadow
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#000")
    .attr("stop-opacity", "0");

  let markerDef = svg.append("defs");
  markerDef
    .append("marker")
    .attr("id", "trunkoneway")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", "2")
    .attr("refY", "2")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("markerWidth", MARKER_SIZE)
    .attr("markerHeight", MARKER_SIZE)
    .attr("orient", "auto")
    .style("fill", TRUNK_COLOR)
    .style("stroke", "black")
    .style("stroke-width", "0.3px")
    .append("path")
    .attr("d", "M 1 1 L 3 2 L 1 3 Z");
  markerDef
    .append("marker")
    .attr("id", "trunktwoway")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", "2.5")
    .attr("refY", "2")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("markerWidth", MARKER_SIZE)
    .attr("markerHeight", MARKER_SIZE)
    .attr("orient", "auto")
    .style("fill", TRUNK_COLOR)
    .style("stroke", "black")
    .style("stroke-width", "0.3px")
    .append("path")
    .attr("d", "M0 2 L 2 1 L 2 3 L 0 2 M 2.5 1 L 4.5 2 L 2.5 3 L 2.5 1");
  markerDef
    .append("marker")
    .attr("id", "stagingoneway")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", "2")
    .attr("refY", "2")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("markerWidth", MARKER_SIZE)
    .attr("markerHeight", MARKER_SIZE)
    .attr("orient", "auto")
    .style("fill", STAGING_COLOR)
    .style("stroke", "black")
    .style("stroke-width", "0.3px")
    .append("path")
    .attr("d", "M 1 1 L 3 2 L 1 3 Z");
  markerDef
    .append("marker")
    .attr("id", "stagingtwoway")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", "2.5")
    .attr("refY", "2")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("markerWidth", MARKER_SIZE)
    .attr("markerHeight", MARKER_SIZE)
    .attr("orient", "auto")
    .style("fill", STAGING_COLOR)
    .style("stroke", "black")
    .style("stroke-width", "0.3px")
    .append("path")
    .attr("d", "M0 2 L 2 1 L 2 3 L 0 2 M 2.5 1 L 4.5 2 L 2.5 3 L 2.5 1");
  markerDef
    .append("marker")
    .attr("id", "nurseryoneway")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", "2")
    .attr("refY", "2")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("markerWidth", MARKER_SIZE)
    .attr("markerHeight", MARKER_SIZE)
    .attr("orient", "auto")
    .style("fill", NURSERY_COLOR)
    .style("stroke", "black")
    .style("stroke-width", "0.3px")
    .append("path")
    .attr("d", "M 1 1 L 3 2 L 1 3 Z");
  markerDef
    .append("marker")
    .attr("id", "nurserytwoway")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", "2.5")
    .attr("refY", "2")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("markerWidth", MARKER_SIZE)
    .attr("markerHeight", MARKER_SIZE)
    .attr("orient", "auto")
    .style("fill", NURSERY_COLOR)
    .style("stroke", "black")
    .style("stroke-width", "0.3px")
    .append("path")
    .attr("d", "M0 2 L 2 1 L 2 3 L 0 2 M 2.5 1 L 4.5 2 L 2.5 3 L 2.5 1");
  markerDef
    .append("marker")
    .attr("id", "incubatoroneway")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", "2")
    .attr("refY", "2")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("markerWidth", MARKER_SIZE)
    .attr("markerHeight", MARKER_SIZE)
    .attr("orient", "auto")
    .style("fill", INCUBATOR_COLOR)
    .style("stroke", "black")
    .style("stroke-width", "0.3px")
    .append("path")
    .attr("d", "M 1 1 L 3 2 L 1 3 Z");
  markerDef
    .append("marker")
    .attr("id", "incubatortwoway")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", "2.5")
    .attr("refY", "2")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("markerWidth", MARKER_SIZE)
    .attr("markerHeight", MARKER_SIZE)
    .attr("orient", "auto")
    .style("fill", INCUBATOR_COLOR)
    .style("stroke", "black")
    .style("stroke-width", "0.3px")
    .append("path")
    .attr("d", "M0 2 L 2 1 L 2 3 L 0 2 M 2.5 1 L 4.5 2 L 2.5 3 L 2.5 1");

  svg
    .append("circle")
    .attr("cx", fixedWidth / 2)
    .attr("cy", fixedHeight / 2)
    .attr("r", proj.scale())
    .attr("class", "noclicks")
    .attr("id", "globe")
    .style("fill", "url(#oceanFill)");

  diversity.forEach(function (d) {
    diversityById[d.id] = d.diversity;
  });

  svg
    .append("g")
    .selectAll("path.land")
    .data(world.features)
    .enter()
    .append("path")
    .attr("class", "land")
    .attr("d", path)
    .style("stroke-width", 1)
    .style("opacity", 0.8);

  // LONG AND LAT LINES, need to uncomment other graticule references to use
  // svg.append("path")
  //       .datum(graticule)
  //       .attr("class", "graticule noclicks")
  //       .attr("d", path);

  // Parse default pairs
  places.pairs.forEach(function (a) {
    let s, t;
    for (let pointInd = 0; pointInd < points.point_data.length; pointInd++) {
      if (points.point_data[pointInd].tag === a.lg2) {
        s = points.point_data[pointInd].geometry.coordinates;
      }
      if (points.point_data[pointInd].tag === a.lg1) {
        t = points.point_data[pointInd].geometry.coordinates;
      }
    }
    links.push({
      source: s,
      target: t,
      sourceTag: a.lg2,
      targetTag: a.lg1,
      stage: a.repo,
      stems: a.stems,
      direction: a.direction,
      filtered: "true" // If filtered is true, make flyer visible.
    });
  });

  // build geoJSON features from links array
  links.forEach(function (e) {
    let feature = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [e.source, e.target]
      },
      stage: e.stage,
      sourceTag: e.sourceTag,
      targetTag: e.targetTag,
      direction: e.direction
    };
    arcLines.push(feature);
  });

  svg
    .append("g")
    .attr("class", "arcs")
    .selectAll("path")
    .data(arcLines)
    .enter()
    .append("path")
    .attr("class", "arc")
    .attr("d", path)
    .attr("stage", d => d.stage)
    .attr("sourceTag", d => d.sourceTag)
    .attr("targetTag", d => d.targetTag)
    .attr("direction", d => d.direction);

  svg
    .append("g")
    .attr("class", "flyers")
    .selectAll("path")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "flyer")
    .attr("sourceTag", d => d.sourceTag)
    .attr("targetTag", d => d.targetTag)
    .attr("d", d => swoosh(flyingArc(d)))
    .style("stroke", d => chooseColor(d))
    .on("mouseover", function (d) {
      // Hovering over flyers for tooltip
      if (d.filtered === "false") {
        return;
      }
      div
        .transition()
        .duration(200)
        .style("opacity", 0.9);
      $(this).css("stroke-width", "4px");
      let arrow = d.direction === "<>" ? "↔" : d.direction === ">" ? "→" : "–";
      let repo =
        d.stage === undefined ? "Unknown" : d.stage.charAt(0).toUpperCase() + d.stage.slice(1);
      div
        .html(
          d.sourceTag +
          " " +
          arrow +
          " " +
          d.targetTag +
          "<br/>" +
          (d.stems === undefined || d.stems === -1 ? "Unknown" : d.stems) +
          "<br/>" +
          repo
        )
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      div
        .transition()
        .duration(500)
        .style("opacity", 0);
      $(this).css("stroke-width", "2px");
    });

  // Create labels and points AFTER flyers and arcs so they appear above
  svg
    .append("g")
    .attr("class", "labels")
    .style("fill", "white")
    .selectAll("text")
    .data(points.point_data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("coordinate", d => d.geometry.coordinates)
    .text(d => d.tag)
    .on("mouseover", function (d) {
      // Hovering over labels for tooltip
      if ($(this).css("opacity") === "0") {
        return;
      }
      div
        .transition()
        .duration(200)
        .style("opacity", 0.9);

      div
        .html(d.tag + "<br/>" + codeToLanguage(d.tag)) // Looking up full name
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      div
        .transition()
        .duration(500)
        .style("opacity", 0);
    });

  // Points
  svg
    .append("g")
    .attr("class", "points")
    .style("fill", "#e0e0e0")
    .selectAll("text")
    .data(points.point_data)
    .enter()
    .append("path")
    .attr("class", "point")
    .attr("d", path)
    .attr("coordinate", d => d.geometry.coordinates)
    .attr("tag", d => d.tag)
    .on("mouseover", function (d) {
      // Hovering over points for tooltip
      if ($(this).css("opacity") === "0") {
        return;
      }
      div
        .transition()
        .duration(200)
        .style("opacity", 0.9);

      div
        .html(d.tag + "<br/>" + codeToLanguage(d.tag))
        .style("left", d3.event.pageX + "px")
        .style("top", d3.event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      div
        .transition()
        .duration(500)
        .style("opacity", 0);
    })
    .on("click", function (d) {
      timer = setTimeout(function () {
        if (!prevent) {
          singleClick(d.tag);
        }
        prevent = false;
      }, delay);
    })
    .on("dblclick", function (d) {
      clearTimeout(timer);
      prevent = true;
      rotateToPoint(d.tag);
    });

  // Populate the filter point list
  let alphaPointList = [];
  for (let i = 0; i < points.point_data.length; i++) {
    alphaPointList.push(points.point_data[i].tag);
  }
  alphaPointList.sort();
  for (let i = 0; i < alphaPointList.length; i++) {
    let newPoint = $("<a>")
      .attr("id", "point" + alphaPointList[i])
      .attr("class", "dropdown-select")
      .attr("onclick", "filterPoint('" + alphaPointList[i] + "')")
      .text(alphaPointList[i]);
    $("#pointList").append(newPoint);
  }

  drawLegend();
  $("#toggleLegendCheckbox").prop("checked", false);
  colourMap();
  d3.selectAll(".legend").style("visibility", "hidden");

  filterArcsAndFlyers();
  refresh();
  handleUnusedPoints();
}

/**
 * Positions the flyer labels
 */
function positionLabels() {
  let centerPos = proj.invert([fixedWidth / 2, fixedHeight / 2]);

  svg
    .selectAll(".label")
    .attr("label-anchor", function (d) {
      let x = proj(d.geometry.coordinates)[0];
      return x < width / 2 - 20 ? "end" : x < width / 2 + 20 ? "middle" : "start";
    })
    .attr("transform", function (d) {
      let loc = proj(d.geometry.coordinates),
        x = loc[0],
        y = loc[1];
      let offset = x < width / 2 ? -5 : 5;
      return "translate(" + (x + offset) + "," + (y - 2) + ")";
    })
    .style("display", function (d) {
      let dist = d3.geoDistance(d.geometry.coordinates, centerPos);
      return dist > 1.57 ? "none" : "inline";
    });
}

/**
 * Find coordinates of a point along an arc
 * @param {Number} start Start of the arc
 * @param {Number} end End of the arc
 * @param {Number} loc Relative distance to the start of the arc (in range [0, 1])
 * @return {Array} Coordinates of point
 */
function locationAlongArc(start, end, loc) {
  let interpolator = d3.geoInterpolate(start, end);
  return interpolator(loc);
}

/**
 * Finds the coordinates for a flyer
 * @param {Object} pt Point data
 * @return {Array} Coordinates for the flyer
 */
function flyingArc(pt) {
  let source = pt.source,
    target = pt.target;

  let mid = locationAlongArc(source, target, 0.5);
  let result = [proj(source), sky(mid), proj(target)];

  return result;
}

/**
 * Refreshes the globe. Called after any change
 */
function refresh() {
  svg.selectAll(".land").attr("d", path);
  svg.selectAll(".point").attr("d", path);
  svg.selectAll(".mesh").attr("d", path);
  svg.selectAll(".arc").attr("d", path);
  svg.selectAll(".star").attr("d", function (d) {
                spacePath.pointRadius(d.properties.radius);
                return spacePath(d);
            });
  // svg.selectAll(".graticule").attr("d", path); //This adds long and lat lines

  positionLabels();

  svg
    .selectAll(".flyer")
    .attr("d", d => swoosh(flyingArc(d)))
    .attr("marker-mid", d => addMarker(d))
    .attr("opacity", d => fadeAtEdge(d));
}

/**
 * Return the correct marker for a flyer
 * @param {Object} d flyer
 * @return {String} marker
 */
function addMarker(d) {
  if (d.direction === "<>") {
    return "url(#" + d.stage + "twoway)";
  } else if (d.direction === ">") {
    return "url(#" + d.stage + "oneway)";
  } else {
    return "";
  }
}

/**
 * Changes the opacity of all points and labels
 * @param {Number} o1 Point opacity
 * @param {Number} o2 Label opacity
 */
function setPoints(o1, o2) {
  svg.selectAll(".point").style("opacity", o1);
  svg.selectAll(".label").style("opacity", o2);
}

/**
 * Filters pairs by repo
 * @param {String} f Repo (Trunk, Staging, Incubator or Nursery)
 */
function selectRepoFilter(f) {
  if ($("#checkmark" + f).length === 0) {
    $("#filter" + f).html(
      f + "<i id=checkmark" + f + " class='fa fa-check checkmark'></i>"
    );
    currentRepoFilter.push(f);
  } else {
    $("#checkmark" + f).remove();
    currentRepoFilter.splice(currentRepoFilter.indexOf(f), 1);
  }

  filterArcsAndFlyers();
  refresh();
  handleUnusedPoints();
}

/**
 * Filters pairs by direction
 * @param {String} dir Direction (Bidirectional, Unidirectional or Unknown)
 */
function selectDirFilter(dir) {
  if ($("#checkmarkDir" + dir).length === 0) {
    $("#dir" + dir).html(
      dir + "<i id=checkmarkDir" + dir + " class='fa fa-check checkmark'></i>"
    );
    currentDirFilter.push(dir);
  } else {
    $("#checkmarkDir" + dir).remove();
    currentDirFilter.splice(currentDirFilter.indexOf(dir), 1);
  }

  filterArcsAndFlyers();
  refresh();
  handleUnusedPoints();
}

let currentFiltered = "none";

/**
 * Filters pairs by language, and rotates to the language point if necessary
 * @param {String} p Language to filter by
 */
function filterPoint(p) {
  let needToRotate = false;
  if ($("#checkmarkPoint" + p).length === 0) {
    $("#point" + p).html(
      p + "<i id=checkmarkPoint" + p + " class='fa fa-check checkmark'></i>"
    );
    currentPointFilter.push(p);
    needToRotate = true;
  } else {
    $("#checkmarkPoint" + p).remove();
    currentPointFilter.splice(currentPointFilter.indexOf(p), 1);
  }

  filterArcsAndFlyers();
  refresh();
  handleUnusedPoints();
  if (needToRotate) {
    rotateToPoint(p);
  }
}

/**
 * Resets all user choices to default
 */
function resetFilters() {
  $(".checkmark").remove();

  currentRepoFilter = [];
  currentPointFilter = [];
  currentDirFilter = [];

  $("#pointSearch")[0].value = "";
  filterSearchPoints();

  $("#pointCheckbox").prop("checked", false);
  $("#fullDepthCheckbox").prop("checked", false);
  $("#toggleShadowsCheckbox").prop("checked", true);
  $("#colorStemCheckbox").prop("checked", true);
  $("#unknownStemCheckbox").prop("checked", true);
  $("#toggleMapColourCheckbox").prop("checked", true);
  $("#toggleLegendCheckbox").prop("checked", false);
  d3.selectAll(".legend").style("visibility", "hidden");

  $("#stemFilterSlider").attr("value", 0);
  $("#stemFilterCount").attr("value", 0);

  svg.selectAll(".flyer").style("stroke", d => chooseColor(d));
  filterArcsAndFlyers();
  refresh();
  colourMap();
  handleUnusedPoints();
}

/**
 * Filters out the arc with a certain source and target
 * @param {String} s Source of arc to filter out
 * @param {String} t Target of arc to filter out
 */
function filterArc(s, t) {
  for (let i = 0; i < svg.selectAll(".arc")._groups[0].length; i++) {
    if (
      svg.selectAll(".arc")._groups[0][i].getAttribute("sourceTag") === s &&
      svg.selectAll(".arc")._groups[0][i].getAttribute("targetTag") === t
    ) {
      svg.selectAll(".arc")._groups[0][i].setAttribute("opacity", 0);
      break;
    }
  }
}

let filterReturn,
    visitMap = new Map();

/**
 * Filters Arcs and Flyers according to user choice
 */
function filterArcsAndFlyers() {
  if ($("#toggleShadowsCheckbox").prop("checked")) {
    for (let i = 0; i < svg.selectAll(".arc")._groups[0].length; i++) {
      svg.selectAll(".arc")._groups[0][i].setAttribute("opacity", 1);
    }
  } else {
    for (let i = 0; i < svg.selectAll(".arc")._groups[0].length; i++) {
      svg.selectAll(".arc")._groups[0][i].setAttribute("opacity", 0);
    }
  }
  if ($("#fullDepthCheckbox").prop("checked") === true) {
    for (let i = 0; i < svg.selectAll(".point")._groups[0].length; i++) {
      visitMap.set(
        svg.selectAll(".point")._groups[0][i].getAttribute("tag"),
        false
      );
    }
    for (let i = 0; i < currentPointFilter.length; i++) {
      fullDepthFilter(currentPointFilter[i]);
    }
  }

  svg.selectAll(".flyer").attr("opacity", function (d) {
    if (
      $("#fullDepthCheckbox").prop("checked") === false ||
      currentPointFilter.length === 0
    ) {
      d.filtered = "true";
    } else if (d.filtered === "temp") {
       d.filtered = "true";
    } else {
       d.filtered = "false";
       filterArc(d.sourceTag, d.targetTag);
    }

    if (
      currentPointFilter.length > 0 &&
      $("#fullDepthCheckbox").prop("checked") === false
    ) {
      filterReturn = 0;
      for (let i = 0; i < currentPointFilter.length; i++) {
        if (
          d.sourceTag === currentPointFilter[i] ||
          d.targetTag === currentPointFilter[i]
        ) {
          filterReturn = 1;
          break;
        }
      }
      if (filterReturn === 0) {
        d.filtered = "false";
        filterArc(d.sourceTag, d.targetTag);
      }
    }

    if (currentRepoFilter.length > 0) {
      filterReturn = 0;
      for (let i = 0; i < currentRepoFilter.length; i++) {
        if (d.stage === currentRepoFilter[i].toLowerCase()) {
          filterReturn = 1;
          break;
        }
      }
      if (filterReturn === 0) {
        d.filtered = "false";
        filterArc(d.sourceTag, d.targetTag);
      }
    }

    if (currentDirFilter.length > 0) {
      filterReturn = 0;
      for (let i = 0; i < currentDirFilter.length; i++) {
        if (
          (d.direction === "<>" && currentDirFilter[i] === "Bidirectional") ||
          (d.direction === ">" && currentDirFilter[i] === "Unidirectional") ||
          (currentDirFilter[i] === "Unknown" &&
            d.direction !== "<>" &&
            d.direction !== ">")
        ) {
          filterReturn = 1;
          break;
        }
      }
      if (filterReturn === 0) {
        d.filtered = "false";
        filterArc(d.sourceTag, d.targetTag);
      }
    }

    if ($("#unknownStemCheckbox").prop("checked")) {
      if (!(d.stems === undefined || d.stems === -1) && d.stems < parseInt($("#stemFilterCount").attr("value"))) {
        d.filtered = "false";
        filterArc(d.sourceTag, d.targetTag);
      }
    } else if (d.stems < parseInt($("#stemFilterCount").attr("value"))) {
      d.filtered = "false";
      filterArc(d.sourceTag, d.targetTag);
    }
    return fadeAtEdge(d);
  });
}

/**
 * Filters out only languages completely isolated from a set language (curr)
 * @param {String} curr Language to filter by
 */
function fullDepthFilter(curr) {
  if (visitMap.get(curr) === true) {
    return;
  }
  visitMap.set(curr, true);
  svg.selectAll(".flyer").attr("opacity", function (d) {
    if (d.sourceTag === curr) {
      d.filtered = "temp";
      fullDepthFilter(d.targetTag);
    } else if (d.targetTag === curr) {
      d.filtered = "temp";
      fullDepthFilter(d.sourceTag);
    }
    return fadeAtEdge(d);
  });
}

/**
 * Displays or hides unused points, according to user choice
 */
function handleUnusedPoints() {
  if ($("#pointCheckbox").prop("checked") === false) {
    setPoints(0, 0);
  } else {
    setPoints(0.6, 0.9);
    return;
  }

  svg.selectAll(".flyer").attr("opacity", function (d) {
    if (this.getAttribute("opacity") !== "0") {
      let dsource = String(d.source[0]) + "," + String(d.source[1]);
      let dtarget = String(d.target[0]) + "," + String(d.target[1]);
      let points = svg.selectAll(".point")._groups[0];
      for (let j = 0; j < points.length; j++) {
        if (points[j].getAttribute("coordinate") === dsource) {
          points[j].setAttribute("style", "opacity: 0.6");
        }
        if (points[j].getAttribute("coordinate") === dtarget) {
          points[j].setAttribute("style", "opacity: 0.6");
        }
      }
      let labels = svg.selectAll(".label")._groups[0];
      for (let k = 0; k < labels.length; k++) {
        if (labels[k].getAttribute("coordinate") === dsource) {
          labels[k].setAttribute("style", "opacity: 0.9");
        }
        if (labels[k].getAttribute("coordinate") === dtarget) {
          labels[k].setAttribute("style", "opacity: 0.9");
        }
      }
    }
    return fadeAtEdge(d);
  });

  for (let i = 0; i < svg.selectAll(".point")._groups[0].length; i++) {
    if (
      currentPointFilter.indexOf(
        svg.selectAll(".point")._groups[0][i].getAttribute("tag")
      ) !== -1
    ) {
      svg
        .selectAll(".point")
        ._groups[0][i].setAttribute("style", "opacity: 0.6");
    }
  }
  for (let i = 0; i < svg.selectAll(".label")._groups[0].length; i++) {
    if (
      currentPointFilter.indexOf(
        svg.selectAll(".label")._groups[0][i].innerHTML
      ) !== -1
    ) {
      svg
        .selectAll(".label")
        ._groups[0][i].setAttribute("style", "opacity: 0.9");
    }
  }
  refresh();
}

/**
 * Determine opacity of a flyer, depending on the globe rotation
 * @param {Object} d Flyer
 * @return {Number} Opacity
 */
function fadeAtEdge(d) {
  if (d.filtered === "false") {
    return 0;
  }

  let centerPos = proj.invert([fixedWidth / 2, fixedHeight / 2]),
    start = d.source,
    end = d.target,
    distancePair = d3.geoDistance(start, end); // distance of a flyer (in radians)

  let startDist = 1.57 - d3.geoDistance(start, centerPos),
    endDist = 1.57 - d3.geoDistance(end, centerPos);

  let fade = d3
    .scaleLinear()
    .domain([-0.1, 0])
    .range([0, 0.15]);

  let dist = startDist < endDist ? startDist : endDist;

  if (distancePair >= 1.7) {
    /* 1.7 radians has been taken as an approximate value for a "long" flyer.
     However, this value can be as desired.*/
    let avgLongitudeStartEnd = (start[0] + end[0]) / 2,
    avgLatitudeStartEnd = (start[1] + end[1]) / 2,
    diffAvgCenterLongitude = avgLongitudeStartEnd - centerPos[0],
    diffAvgCenterLatitude = avgLatitudeStartEnd - centerPos[1],
    atBack = false; // boolean representing if the flyer is at the back of the globe

    diffAvgCenterLongitude = (diffAvgCenterLongitude + 540) % 360 - 180;
    diffAvgCenterLatitude = (diffAvgCenterLatitude + 540) % 360 - 180;

    if ((diffAvgCenterLongitude <= -90 && diffAvgCenterLongitude >= -180) ||
      (diffAvgCenterLongitude >= 90 && diffAvgCenterLongitude <= 180) ||
      (diffAvgCenterLatitude <= -90 && diffAvgCenterLatitude >= -180) ||
      (diffAvgCenterLatitude >= 90 && diffAvgCenterLatitude <= 180)) {
        atBack = true;
    }

    if (atBack) {
      return 0;
    }

    return fade(dist + 0.4);
    /* 0.4 makes the flyer visible in most parts of it,
     without seeing the end part through the globe
     (if the end part is at the back of the globe).
     This value can also be changed as desired.*/
  }
  return fade(dist);
}

/**
 * Rotates the globe (and the stars) to center on a point
 * @param {String} p Point to rotate to
 */
function rotateToPoint(p) {
  let coords;
  for (let i = 0; i < svg.selectAll(".point")._groups[0].length; i++) {
    if (svg.selectAll(".point")._groups[0][i].getAttribute("tag") === p) {
      coords = svg.selectAll(".point")._groups[0][i].getAttribute("coordinate");
      break;
    }
  }
  let q = coords.split(",");
  d3.transition()
    .duration(1000)
    .tween("rotate", function () {
      let r = d3.geoInterpolate(proj.rotate(), [-parseInt(q[0]), -parseInt(q[1])]);
      return function (t) {
        let s = r(t);
        s.push(proj.rotate()[2]);
        proj.rotate(s);
        sky.rotate(s);
        space.rotate([-s[0], -s[1], s[2]]);
        o0 = proj.rotate();
        refresh();
      };
    });
}

$(".eP").click(e => e.stopPropagation());

$("body,html").click(function () {
  if ($("#sidenav").css("left") === "0px") {
    closeNav();
  }
});

/**
 * Opens the settings navbar
 */
function openNav() {
  $("#sidenav").css("left", "0px");
}

/**
 * Closes the settings navbar
 */
function closeNav() {
  $("#sidenav").css("left", "-185px");
}

/**
 * Toggles a certain dropdown
 * @param {Object} t Dropdown button
 * @param {String} id Dropdown html id
 */
function toggleDropdown(t, id) {
  if ($(id).css("display") === "none") {
    $(".dropdown-content").css("display", "none");
    for (let i = 0; i < $(".dropdown-content").length; i++) {
      let filterButton = $(".dropdown-content")[i].previousElementSibling;
      filterButton.innerHTML =
        filterButton.innerHTML.slice(0, filterButton.innerHTML.indexOf("<")) +
        "<i class='fa fa-caret-right'></i>";
    }
  }
  $(id).toggle();
  if ($(id).css("display") === "none") {
    t.innerHTML =
      t.innerHTML.slice(0, t.innerHTML.indexOf("<")) +
      "<i class='fa fa-caret-right'></i>";
  } else {
    t.innerHTML =
      t.innerHTML.slice(0, t.innerHTML.indexOf("<")) +
      "<i class='fa fa-caret-down'></i>";
  }
}

/**
 * Changes whether unused points are displayed or not, according to user choice
 */
function checkPoints() {
  $("#pointCheckbox").prop("checked", !$("#pointCheckbox").prop("checked"));
  handleUnusedPoints();
}

/**
 * Changes whether filtering by language is done in full depth, according to user choice
 */
function fullDepth() {
  $("#fullDepthCheckbox").prop(
    "checked",
    !$("#fullDepthCheckbox").prop("checked")
  );
  filterArcsAndFlyers();
  refresh();
  handleUnusedPoints();
}

/**
 * Changes shadows (arcs) are displayed
 */
function toggleShadows() {
  $("#toggleShadowsCheckbox").prop(
    "checked",
    !$("#toggleShadowsCheckbox").prop("checked")
  );
  filterArcsAndFlyers();
  refresh();
}

/**
 * Filter points in the filter by language dropdown, according to the text entered by the user
 */
function filterSearchPoints() {
  let searchValue = $("#pointSearch")[0].value;
  let points = $("#pointList")[0].children;
  let searchEmpty = 0;
  for (let i = 0; i < points.length; i++) {
    if (
      $(points[i])
      .text()
      .substring(0, searchValue.length)
      .toUpperCase() !== searchValue.toUpperCase()
    ) {
      $(points[i]).css("display", "none");
    } else {
      $(points[i]).css("display", "");
      searchEmpty = 1;
    }
  }
  if (searchEmpty === 0) {
    $("#pointList").css("min-height", 0);
  }
  if (searchEmpty === 1 || searchValue === "") {
    $("#pointList").css("min-height", 42);
  }
}

$("#stemFilterSlider").on("input", function () {
  $("#stemFilterCount").attr("value", this.value);
});

$("#stemFilterSlider").on("change", function () {
  filterArcsAndFlyers();
  refresh();
  handleUnusedPoints();
});

$("#stemFilterCount").on("change", function () {
  let val = this.value;
  val = Math.max(0, val);
  val = Math.min(100000, val);
  $(this).attr("value", val);
  $("#stemFilterSlider").attr("value", this.value);
  filterArcsAndFlyers();
  refresh();
  handleUnusedPoints();
});

/**
 * Changes whether pairs with an unknown amount of stems are displayed
 */
function unknownStem() {
  $("#unknownStemCheckbox").prop(
    "checked",
    !$("#unknownStemCheckbox").prop("checked")
  );
  filterArcsAndFlyers();
  refresh();
  handleUnusedPoints();
}

/**
 * Chooses flyer colour based on language pair stage or number of stems (depends on user choice)
 * @param {Object} d Selected flyer attributes
 * @return {String|Object} Colour of flyer (hex or hsl format)
 * Note: see colours.js to change returned colours
 */
function chooseColor(d) {
  if (!$("#colorStemCheckbox").prop("checked")) {
    switch (d.stage) {
      case "trunk":
        return TRUNK_COLOR;
      case "staging":
        return STAGING_COLOR;
      case "nursery":
        return NURSERY_COLOR;
      case "incubator":
        return INCUBATOR_COLOR;
      default:
        return UNKNOWN_COLOR;
    }
  }
  if (d.stems === undefined || d.stems === -1) {
    return UNKNOWN_COLOR;
  }
  try {
    // Even if d.stems is a non-numerical String, it does not throw an error...
    if (isNaN(Math.log(d.stems))) {
      throw new Error("Node has unknown stem count");
    }
    // Shunt <= 99 to colour 0
    return d3
      .scaleOrdinal()
      .domain(translationClasses)
      .range(translationClassColours)(d.stage)[
        d.stems <= 99 ? 0 : parseInt(Math.log(d.stems) / Math.LN10) - 1
      ];
  } catch (e) {
    // Give it the lightest colour if the stem count is unknown
    return d3
      .scaleOrdinal()
      .domain(translationClasses)
      .range(translationClassColours)(d.stage)[0];
  }
}

/**
 * Colours the stems and refreshes the globe
 */
function colorStem() {
  $("#colorStemCheckbox").prop(
    "checked",
    !$("#colorStemCheckbox").prop("checked")
  );

  svg.selectAll(".flyer").style("stroke", d => chooseColor(d));
  refresh();
}

let o0, v0, r0, q0;

window.addEventListener("touchmove", e => e.preventDefault(), false);

/**
 * Zooms in by a factor of 2
 */
function zoomIn() {
  svg
    .transition()
    .duration(500)
    .call(zoom.scaleBy, 2);
}

/**
 * Zooms out by a factor of 2
 */
function zoomOut() {
  svg
    .transition()
    .duration(500)
    .call(zoom.scaleBy, 0.5);
}

// Start off zoomed based off of window size
resetZoom();

/**
 * Sets the values of mouse position and rotation at the start of a zoom event
 */
function zoomstart() {
  if (d3.event.sourceEvent) {
    v0 = versor.cartesian(proj.invert(d3.mouse(this)));
    r0 = proj.rotate();
    q0 = versor(r0);
  }
}

/**
 * Rotates and/or zooms the globes during a zoom event
 */
function zoomed() {
  let scale = d3.event.transform.k;
  if (width === scale) {
    // If not zooming, rotating.
    let v1 = versor.cartesian(proj.rotate(r0).invert(d3.mouse(this)));
    let q1 = versor.multiply(q0, versor.delta(v0, v1));
    let r1 = versor.rotation(q1);
    proj.rotate(r1);
    sky.rotate(r1);
    space.rotate([-r1[0], -r1[1], r1[2]]);
    refresh();
  } else {
    width = scale;

    proj = d3
      .geoOrthographic()
      .translate([fixedWidth / 2, fixedHeight / 2])
      .clipAngle(90)
      .scale(scale / 4);

    sky = d3
      .geoOrthographic()
      .translate([fixedWidth / 2, fixedHeight / 2])
      .clipAngle(90)
      .scale(scale / 3.75);

    path = d3
      .geoPath()
      .projection(proj)
      .pointRadius(3);

   space = d3
      .geoAzimuthalEquidistant()
      .translate([fixedWidth / 2, fixedHeight / 2])
      .clipAngle(90)
      .scale(scale);

   spacePath = d3
      .geoPath()
      .projection(space)
      .pointRadius(1);

    svg.select("#globe").attr("r", scale / 4);

    if (o0) {
      proj.rotate(o0);
      sky.rotate(o0);
      space.rotate([-o0[0], -o0[1], o0[2]]);
    }

    refresh();
  }
}

/**
 * Sets the value of the globe's rotation at the end of a zoom event
 */
function zoomend() {
  o0 = proj.rotate();
}

/**
 * Resets zoom to fit window size
 */
function resetZoom() {
  let initial = 2;
  svg
    .transition()
    .call(
      zoom.transform,
      d3.zoomIdentity.scale(
        Math.min(initial * fixedHeight, initial * fixedWidth)
      )
    );
}

/**
 * Zoom-in with + key and zoom-out with - key and reset with 0
 */
window.onkeydown = function (e) {
  if (navigator.userAgent.search("Chrome") >= 0) {
    if (e.keyCode === 187) {
      e.preventDefault();
      zoomIn();
    }
    if (e.keyCode === 189) {
      e.preventDefault();
      zoomOut();
    }
    if (e.keyCode === 48) {
      e.preventDefault();
      resetZoom();
    }
  } else if (navigator.userAgent.search("Firefox") >= 0) {
    if (e.keyCode === 61) {
      e.preventDefault();
      zoomIn();
    }
    if (e.keyCode === 173) {
      e.preventDefault();
      zoomOut();
    }
    if (e.keyCode === 48) {
      e.preventDefault();
      resetZoom();
    }
  }
};

// Modified from http://bl.ocks.org/tlfrd/df1f1f705c7940a6a7c0dca47041fec8
/********** versor.js **********/
let acos = Math.acos,
  asin = Math.asin,
  atan2 = Math.atan2,
  cos = Math.cos,
  max = Math.max,
  min = Math.min,
  PI = Math.PI,
  sin = Math.sin,
  sqrt = Math.sqrt,
  abs = Math.abs,
  radians = PI / 180,
  degrees = 180 / PI;

/**
 * Returns the unit quaternion for the given Euler rotation angles
 * @param {Array} e Euler rotation angles [λ, φ, γ]
 * @return {Array} Unit quaternion
 */
function versor(e) {

  // fix poles
  if (e[1] + 90 < 1e-9) e[1] = -90 + 1e-9;
  if (abs(e[1] - 90) < 1e-9) e[1] = 90 - 1e-9;

  let l = (e[0] / 2) * radians,
    sl = sin(l),
    cl = cos(l), // λ / 2
    p = (e[1] / 2) * radians,
    sp = sin(p),
    cp = cos(p), // φ / 2
    g = (e[2] / 2) * radians,
    sg = sin(g),
    cg = cos(g); // γ / 2
  return [
    cl * cp * cg + sl * sp * sg,
    sl * cp * cg - cl * sp * sg,
    cl * sp * cg + sl * cp * sg,
    cl * cp * sg - sl * sp * cg
  ];
}

/**
 * Returns Cartesian coordinates given spherical coordinates
 * @param {Array} e Spherical coordinates [λ, φ]
 * @return {Array} Cartesian coordinates [x, y, z]
 */
versor.cartesian = function (e) {
  let l = e[0] * radians,
    p = e[1] * radians,
    cp = cos(p);
  return [cp * cos(l), cp * sin(l), sin(p)];
};

/**
 * Returns the Euler rotation angles for the given quaternion
 * @param {Array} q Unit quaternion
 * @return {Array} Euler rotation angles [λ, φ, γ]
 */
versor.rotation = function (q) {
  return [
    atan2(
      2 * (q[0] * q[1] + q[2] * q[3]),
      1 - 2 * (q[1] * q[1] + q[2] * q[2])
    ) * degrees,
    asin(max(-1, min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) * degrees,
    atan2(
      2 * (q[0] * q[3] + q[1] * q[2]),
      1 - 2 * (q[2] * q[2] + q[3] * q[3])
    ) * degrees
  ];
};

/**
 * Returns the quaternion to rotate between two cartesian points on the sphere
 * @param {Array} v0 Cartesian coordinates of the first point
 * @param {Array} v1 Cartesian coordinates of the second point
 * @return {Array} Quaternion
 */
versor.delta = function (v0, v1) {
  let w = cross(v0, v1),
    l = sqrt(dot(w, w));
  if (!l) {
    return [1, 0, 0, 0];
  }
  let t = acos(max(-1, min(1, dot(v0, v1)))) / 2,
    s = sin(t); // t = θ / 2
  return [cos(t), (w[2] / l) * s, (-w[1] / l) * s, (w[0] / l) * s];
};

/**
 * Returns the quaternion that represents q0 * q1
 * @param {Array} q0 3D vector (cartesian coordinates)
 * @param {Array} q1 3D vector (cartesian coordinates)
 * @return {Array} Quaternion
 */
versor.multiply = function (q0, q1) {
  return [
    q0[0] * q1[0] - q0[1] * q1[1] - q0[2] * q1[2] - q0[3] * q1[3],
    q0[0] * q1[1] + q0[1] * q1[0] + q0[2] * q1[3] - q0[3] * q1[2],
    q0[0] * q1[2] - q0[1] * q1[3] + q0[2] * q1[0] + q0[3] * q1[1],
    q0[0] * q1[3] + q0[1] * q1[2] - q0[2] * q1[1] + q0[3] * q1[0]
  ];
};

/**
 * Returns the cross (vectorial) product of two 3D vectors
 * @param {Array} v0 3D vector (cartesian coordinates)
 * @param {Array} v1 3D vector (cartesian coordinates)
 * @return {Array} Cross product
 */
function cross(v0, v1) {
  return [
    v0[1] * v1[2] - v0[2] * v1[1],
    v0[2] * v1[0] - v0[0] * v1[2],
    v0[0] * v1[1] - v0[1] * v1[0]
  ];
}

/**
 * Returns the dot (scalar) product of two 3D vectors
 * @param {Array} v0 3D vector (cartesian coordinates)
 * @param {Array} v1 3D vector (cartesian coordinates)
 * @return {Number} Dot product
 */
function dot(v0, v1) {
  return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
}

/********** end of versor.js **********/
