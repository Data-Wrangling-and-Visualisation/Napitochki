// src/components/visualizations/NetworkGraph.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './NetworkGraph.css';

const NetworkGraph = ({ data, onDrinkSelect }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Очищаем предыдущую визуализацию
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 800;
    const height = 600;

    // Создаем SVG элемент
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Создаем связи между напитками на основе общих ингредиентов
    const links = [];
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        const drink1 = data[i];
        const drink2 = data[j];

        // Находим общие ингредиенты
        const commonIngredients = drink1.ingredients_no_units.filter(
          ingredient => drink2.ingredients_no_units.includes(ingredient)
        );

        if (commonIngredients.length > 0) {
          links.push({
            source: i,
            target: j,
            value: commonIngredients.length,
            commonIngredients
          });
        }
      }
    }

    // Создаем симуляцию силы для сетевого графа
    const simulation = d3.forceSimulation(data)
      .force("link", d3.forceLink(links).id((d, i) => i).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Создаем цветовую шкалу для кластеров
    const clusters = [...new Set(data.map(d => d.cluster))];
    const colorScale = d3.scaleOrdinal()
      .domain(clusters)
      .range(d3.schemeCategory10);

    // Создаем подсказку (tooltip)
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Добавляем связи
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke-width", d => Math.sqrt(d.value))
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .on("mouseover", function(event, d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);

        tooltip.html(`
          <strong>Общие ингредиенты:</strong><br/>
          ${d.commonIngredients.join('<br/>')}
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Добавляем узлы (напитки)
    const node = svg.append("g")
      .selectAll("circle")
      .data(data)
      .enter().append("circle")
      .attr("r", 10)
      .attr("fill", d => colorScale(d.cluster))
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 15);

        tooltip.transition()
          .duration(200)
          .style("opacity", .9);

        tooltip.html(`
          <strong>${d.name}</strong><br/>
          Кластер: ${d.cluster}<br/>
          Категория: ${d.category}<br/>
          Вкус: ${d.taste.join(', ')}
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 10);

        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .on("click", (event, d) => {
        onDrinkSelect(d);
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Добавляем названия напитков
    const text = svg.append("g")
      .selectAll("text")
      .data(data)
      .enter().append("text")
      .text(d => d.name)
      .attr("font-size", 10)
      .attr("dx", 12)
      .attr("dy", 4);

    // Обновляем позиции при каждом "тике" симуляции
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x = Math.max(15, Math.min(width - 15, d.x)))
        .attr("cy", d => d.y = Math.max(15, Math.min(height - 15, d.y)));

      text
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    // Функции для drag & drop
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

    // Добавляем легенду
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(20, 20)`);

    clusters.forEach((cluster, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendItem.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", colorScale(cluster));

      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(`Кластер ${cluster}`);
    });

  }, [data, onDrinkSelect]);

  return (
    <div className="network-graph-container">
      <h3>Сетевой граф связей между напитками</h3>
      <p className="graph-description">Связи отражают общие ингредиенты между напитками</p>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default NetworkGraph;