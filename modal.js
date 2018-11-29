function chooseNodeColor(stage) {
  switch (stage) {
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

function calculateDX(label) {
  dx = 0;
  for (i = 0; i < label.length; i++) {
    if (
      label[i].toLowerCase() === "i" ||
      label[i].toLowerCase() === "j" ||
      label[i] === "l"
    ) {
      dx -= 2;
    } else if (
      label[i].toLowerCase() === "m" ||
      label[i].toLowerCase() === "w"
    ) {
      dx -= 4.5;
    } else {
      dx -= 3;
    }
  }
  return dx;
}

function displayModal(d, pairs) {
  let modal = document.getElementById("languageModal");
  let span = document.getElementsByClassName("close")[0];

  modal.style.display = "block";

  // Exits the modal
  span.onclick = function() {
    modal.style.display = "none";
    d3.select(".modal-body")
      .select("svg")
      .remove();
  };
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
      d3.select(".modal-body")
        .select("svg")
        .remove();
    }
  };

  document.getElementById("heading").innerHTML = codeToLanguage(d);

  const height = window.innerHeight * 0.7;
  const width = window.innerWidth * 0.8;

  const svgContainer = d3
    .select(".modal-body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  let nodes = [{ id: d, label: codeToLanguage(d), color: "#2196F3" }];
  let connections = [];
  for (i = 0; i < pairs.length; i++) {
    nodes.push({
      id: pairs[i][0],
      label: codeToLanguage(pairs[i][0]),
      color: chooseNodeColor(pairs[i][2])
    });
    connections.push({
      source: d,
      target: pairs[i][0],
      stems: pairs[i][1],
      color: chooseNodeColor(pairs[i][2]),
      strength: 0.05
    });
  }

  const linkForce = d3
    .forceLink()
    .id(function(link) {
      return link.id;
    })
    .strength(function(link) {
      return link.strength;
    });

  const simulation = d3
    .forceSimulation()
    .force("link", linkForce)
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const dragDrop = d3
    .drag()
    .on("start", function(node) {
      node.fx = node.x;
      node.fy = node.y;
    })
    .on("drag", function(node) {
      simulation.alphaTarget(0.7).restart();
      node.fx = d3.event.x;
      node.fy = d3.event.y;
    })
    .on("end", function(node) {
      if (!d3.event.active) {
        simulation.alphaTarget(0);
      }
      node.fx = null;
      node.fy = null;
    });

  const linkElements = svgContainer
    .append("g")
    .selectAll("line")
    .data(connections)
    .enter()
    .append("line")
    .attr("stroke-width", d =>
      d.stems < 0 ? 2 : Math.log(d.stems / 100, 2) * 3 + 4
    )
    .attr("stroke", d => (d.stems < 0 ? "#808080" : d.color))
    .attr("opacity", 0.5);

  const nodeElements = svgContainer
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", 30)
    .attr("fill", d => d.color)
    .call(dragDrop);

  const textElements = svgContainer
    .append("g")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .text(node => node.label)
    .attr("font-size", 15)
    .attr("dx", node => calculateDX(node.label))
    .attr("dy", 5)
    .style("pointer-events", "none");

  simulation.nodes(nodes).on("tick", () => {
    linkElements
      .attr("x1", link => link.source.x)
      .attr("y1", link => link.source.y)
      .attr("x2", link => link.target.x)
      .attr("y2", link => link.target.y);
    nodeElements.attr("cx", node => node.x).attr("cy", node => node.y);
    textElements.attr("x", node => node.x).attr("y", node => node.y);
  });

  simulation.force("link").links(connections);

  let legend = svgContainer
    .selectAll(".legend")
    .data(translationClasses)
    .enter()
    .append("g")
    .attr("transform", function(d, i) {
      {
        return "translate(0," + (i * 20 + 10) + ")";
      }
    });

  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", stage => chooseNodeColor(stage));

  legend
    .append("text")
    .attr("x", 20)
    .attr("y", 10)
    .text(stage => stage.toUpperCase())
    .style("font-size", 15);
}
