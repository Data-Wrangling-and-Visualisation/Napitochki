// src/components/visualizations/ScatterPlot.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './ScatterPlot.css';
import { getClusterLabel } from '../../utils/clusterDescriptions';

const ScatterPlot = ({ data, onDrinkSelect, colorBy = 'cluster' }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    const legendWidth = 180;

    // Очищаем предыдущую визуализацию
    d3.select(svgRef.current).selectAll("*").remove();

    // Создаем SVG элемент
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right + legendWidth)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Определяем шкалы для осей
    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.tsne_x) - 5, d3.max(data, d => d.tsne_x) + 5])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.tsne_y) - 5, d3.max(data, d => d.tsne_y) + 5])
      .range([height, 0]);

    // Создаем оси
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Добавляем оси на график
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

    svg.append("g")
      .attr("class", "y-axis")
      .call(yAxis);

    // Добавляем подписи к осям
    svg.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.top + 20)
      .text("t-SNE X");

    svg.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height / 2))
      .attr("y", -margin.left + 10)
      .text("t-SNE Y");

    // Определяем цветовую схему в зависимости от выбранного параметра
    let colorDomain;
    let colorFunction;

    switch(colorBy) {
      case 'category':
        colorDomain = [...new Set(data.map(d => d.category))].sort();
        colorFunction = d => d.category;
        break;
      case 'taste':
        colorDomain = [...new Set(data.flatMap(d =>
          d.taste && d.taste.length >= 2 ? [`${d.taste[0]}, ${d.taste[1]}`] : ['N/A']
        ))];
        colorFunction = d => d.taste && d.taste.length >= 2 ? `${d.taste[0]}, ${d.taste[1]}` : 'N/A';
        break;
      case 'cluster':
      default:
        colorDomain = [...new Set(data.map(d => d.cluster))].sort((a, b) => a - b);
        colorFunction = d => d.cluster;
        break;
    }

    // Создаем цветовую шкалу
    // const colorScale = d3.scaleOrdinal()
    //   .domain(colorDomain)
    //   .range(d3.schemeCategory10);

    const colorPalette = [];

    // Генерируем 25 различных цветов с использованием интерполяции
    for (let i = 0; i < 25; i++) {
      colorPalette.push(d3.interpolateRainbow(i / 25));
    }

    // Создаем цветовую шкалу с фиксированным соответствием значений и цветов
    const colorScale = d3.scaleOrdinal()
      .domain(colorDomain)
      .range(d3.schemeSpectral[colorDomain.length] || colorPalette);

    // Создаем подсказку (tooltip)
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Добавляем точки на график
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.tsne_x))
      .attr("cy", d => yScale(d.tsne_y))
      .attr("r", 5)
      .style("fill", d => colorScale(colorFunction(d)))
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8);

        tooltip.transition()
          .duration(200)
          .style("opacity", .9);

        tooltip.html(`
          <strong>${d.name}</strong><br/>
          Кластер: ${getClusterLabel(d.cluster)}<br/>
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
          .attr("r", 5);

        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .on("click", (event, d) => {
        onDrinkSelect(d);
      });

    // Добавляем легенду
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 30}, 20)`);

    let sortedDomain = [...colorDomain];
    if (colorBy === 'cluster') {
      sortedDomain.sort((a, b) => a - b);
    } else {
      sortedDomain.sort();
    }

    colorDomain.forEach((value, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendItem.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", colorScale(value));

      // Форматируем текст легенды в зависимости от типа цветового кодирования
      let legendText;
      if (colorBy === 'cluster') {
        legendText = getClusterLabel(value);
      } else {
        legendText = value;
      }

      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(legendText)
        .style("font-size", "11px");
    });

  }, [data, onDrinkSelect, colorBy]);

  return (
    <div className="scatter-plot-container">
      <h3>t-SNE Визуализация напитков</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ScatterPlot;