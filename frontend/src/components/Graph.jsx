import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getAllDrinks, getDrinkByName, findSimilar } from "../api/drinks";
import DrinkInfo from "./DrinkInfo";

export default function Graph() {
  const svgRef = useRef();
  const [selectedDrink, setSelectedDrink] = useState(null);

  useEffect(() => {
    getAllDrinks().then((data) => {
      renderGraph(data);
    });
  }, []);

  const renderGraph = (drinks) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;

    const nodes = drinks.map((drink, i) => ({
      id: drink.name,
      group: i % 5,
    }));

    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40))
      .on("tick", ticked);

    const node = svg.selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 20)
      .attr("fill", "steelblue")
      .on("click", (event, d) => {
        getDrinkByName(d.id).then((info) => setSelectedDrink(info));
      });

    const labels = svg.selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text(d => d.id)
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .style("font-size", "10px")
      .style("fill", "white")
      .style("pointer-events", "none");

    function ticked() {
      node.attr("cx", d => d.x).attr("cy", d => d.y);
      labels.attr("x", d => d.x).attr("y", d => d.y);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <svg ref={svgRef} width={800} height={600} />
      {selectedDrink && <DrinkInfo drink={selectedDrink} />}
    </div>
  );
}
