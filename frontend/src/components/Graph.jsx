import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getAllDrinks, getAllTastes } from "../api/drinks";
import DrinkInfo from "./DrinkInfo";

export default function Graph() {
  const svgRef = useRef();
  const [drinks, setDrinks] = useState([]);
  const [tastes, setTastes] = useState([]);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [drinksData, tastesData] = await Promise.all([
          getAllDrinks(),
          getAllTastes()
        ]);
        setDrinks(drinksData);
        setTastes(tastesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && drinks.length > 0) {
      renderGraph();
    }
  }, [loading, drinks]);

  const renderGraph = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 900;
    const height = 700;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    // Create a map of taste occurrences for positioning
    const tasteGroups = {};
    tastes.forEach((taste, i) => {
      tasteGroups[taste] = i;
    });

    // Process data for visualization
    const nodes = drinks.map(drink => ({
      id: drink.name,
      tastes: drink.taste || [],
      data: drink,
      // Position nodes based on their primary taste
      group: drink.taste && drink.taste.length > 0 ? 
        tasteGroups[drink.taste[0]] % 10 : 0
    }));

    // Create links between drinks that share tastes
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const commonTastes = nodes[i].tastes.filter(taste => 
          nodes[j].tastes.includes(taste)
        );
        
        if (commonTastes.length > 0) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            strength: commonTastes.length / 5, // Normalize strength
            tastes: commonTastes
          });
        }
      }
    }

    // Color scale for taste groups
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create SVG container
    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    // Define the arrow marker
    svg.append("defs").selectAll("marker")
      .data(["arrow"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5");

    // Create the force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force("collision", d3.forceCollide().radius(30));

    // Create links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.max(1, d.strength * 2));

    // Create node groups
    const node = svg.append("g")
      .selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add circles to nodes
    node.append("circle")
      .attr("r", 20)
      .attr("fill", d => colorScale(d.group))
      .on("click", (event, d) => {
        setSelectedDrink([d.data]); // Wrap in array for DrinkInfo
      });

    // Add labels to nodes
    node.append("text")
      .text(d => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", 30)
      .style("font-size", "10px")
      .style("fill", "#333");

    // Add title for hover effect
    node.append("title")
      .text(d => {
        const tasteList = d.tastes.join(", ");
        return `${d.id}\nTastes: ${tasteList}`;
      });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x}, ${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add legend for taste groups
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 150}, 20)`);

    // Get unique taste groups from the data
    const uniqueGroups = [...new Set(nodes.map(d => d.group))];

    uniqueGroups.forEach((group, i) => {
      const tasteName = Object.keys(tasteGroups).find(key => tasteGroups[key] === group) || `Group ${group}`;
      
      legend.append("circle")
        .attr("cx", 10)
        .attr("cy", i * 25)
        .attr("r", 7)
        .attr("fill", colorScale(group));

      legend.append("text")
        .attr("x", 25)
        .attr("y", i * 25 + 5)
        .text(tasteName)
        .style("font-size", "12px");
    });
  };

  return (
    <div className="graph-container">
      <h2>Drink Flavor Relationship Graph</h2>
      <p>This graph shows relationships between drinks based on their common flavors.</p>
      
      {loading ? (
        <div>Loading graph data...</div>
      ) : (
        <div className="visualization-area">
          <svg ref={svgRef} className="flavor-graph"></svg>
          
          {selectedDrink && (
            <div className="selected-drink-info">
              <h3>Selected Drink</h3>
              <DrinkInfo drinkData={selectedDrink} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
