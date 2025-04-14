import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './ScatterPlot.css';

const ScatterPlot = ({
  data,
  onDrinkSelect,
  selectedDrink,
  colorBy = 'cluster',
  getClusterLabel,
  embeddingType = 'combined'
}) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Очистка предыдущей визуализации
    d3.select(svgRef.current).selectAll("*").remove();

    // Настройка размеров
    // const margin = { top: 40, right: 180, bottom: 50, left: 60 };
    // const width = 800 - margin.left - margin.right;
    // const height = 600 - margin.top - margin.bottom;

    const width = 800;
    const height = 700;
    const legendWidth = 180;

    const svg = d3.select(svgRef.current)
      .attr("width", width + legendWidth)
      .attr("height", height);

    // Create group for zoomable content
    // const zoomableGroup = svg.append("g")
    //   .attr("class", "zoomable-group")
    //   .attr("transform", `translate(20, 20)`);
    //
    // // Use full data extent for consistent scaling
    // const fullXExtent = d3.extent(fullData || data, d => d.x || 0);
    // const fullYExtent = d3.extent(fullData || data, d => d.y || 0);

    // Setup scales
    // const xScale = d3.scaleLinear()
    //   .domain(fullXExtent)
    //   .range([0, width - 40]);
    //
    // const yScale = d3.scaleLinear()
    //   .domain(fullYExtent)
    //   .range([height - 40, 0]);

    // Получение кластера в зависимости от типа эмбеддинга
    const getClusterForEmbedding = (drink) => {
      if (!drink.cluster) return null;

      if (typeof drink.cluster === 'object') {
        return drink.cluster[embeddingType] !== undefined ? drink.cluster[embeddingType] : null;
      }

      return drink.cluster;
    };

    // Получение координат в зависимости от типа эмбеддинга
    const getX = (d) => {
      if (d.position && d.position[embeddingType]) {
        return d.position[embeddingType][0];
      }
      return d.tsne_x !== undefined ? d.tsne_x : 0;
    };

    const getY = (d) => {
      if (d.position && d.position[embeddingType]) {
        return d.position[embeddingType][1];
      }
      return d.tsne_y !== undefined ? d.tsne_y : 0;
    };

    // Настройка шкал
    const xExtent = d3.extent(data, getX);
    const yExtent = d3.extent(data, getY);

    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - 5, xExtent[1] + 5])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - 5, yExtent[1] + 5])
      .range([height, 0]);

    // Определение цветовой схемы
    let colorDomain;
    let colorValueFunction;

    switch(colorBy) {
      case 'category':
        colorDomain = [...new Set(data.map(d => d.category))];
        colorValueFunction = d => d.category;
        break;
      case 'taste':
        const allTastes = data.map(d =>
          d.taste && d.taste.length >= 1 ? d.taste[0] : 'N/A'
        );
        colorDomain = [...new Set(allTastes)];
        colorValueFunction = d => d.taste && d.taste.length >= 1 ? d.taste[0] : 'N/A';
        break;
      case 'cluster':
      default:
        // Фильтрация только валидных кластеров (0-7)
        const validClusters = [0, 1, 2, 3, 4, 5, 6, 7];
        colorDomain = [...new Set(data.map(d => getClusterForEmbedding(d)))]
          .filter(c => c !== null && c !== undefined && validClusters.includes(c))
          .sort((a, b) => a - b);

        colorValueFunction = d => {
          const cluster = getClusterForEmbedding(d);
          return validClusters.includes(cluster) ? cluster : null;
        };
        break;
    }

    // Определение цветовой палитры
    const clusterColors = d3.schemeSpectral[8] || d3.schemeTableau10;
    const colorScale = d3.scaleOrdinal()
      .domain(colorDomain)
      .range(colorBy === 'cluster' ? clusterColors : d3.schemeSpectral[colorDomain.length] || d3.schemeCategory10);

    // Создание всплывающей подсказки
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Добавление осей X и Y
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale));

    // Добавление подписей к осям
    svg.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .text(`t-SNE измерение 1 (${embeddingType})`);

    svg.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .text(`t-SNE измерение 2 (${embeddingType})`);

    // Добавление точек
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(getX(d)))
      .attr("cy", d => yScale(getY(d)))
      .attr("r", d => selectedDrink && selectedDrink[0] && d.name === selectedDrink[0].name ? 8 : 5)
      .attr("fill", d => {
        const value = colorValueFunction(d);
        return value !== null && value !== undefined && colorDomain.includes(value)
          ? colorScale(value)
          : "#cccccc";
      })
      .attr("stroke", d => selectedDrink && selectedDrink[0] && d.name === selectedDrink[0].name ? "#000" : "#fff")
      .attr("stroke-width", d => selectedDrink && selectedDrink[0] && d.name === selectedDrink[0].name ? 2 : 1)
      .on("mouseover", (event, d) => {
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);

        let tooltipContent = `<strong>${d.name}</strong><br/>`;

        const cluster = getClusterForEmbedding(d);
        if (cluster !== undefined && cluster !== null) {
          tooltipContent += `Кластер: ${getClusterLabel(cluster)} (${cluster})<br/>`;
        }

        tooltipContent += `Вкусы: ${d.taste ? d.taste.join(", ") : 'Н/Д'}<br/>`;
        tooltipContent += `Категория: ${d.category ? d.category.replace(/_/g, ' ') : 'Н/Д'}`;

        tooltip.html(tooltipContent)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .on("click", (event, d) => {
        if (onDrinkSelect) onDrinkSelect(d);
      });

    // Добавление выделения для выбранного напитка
    // svg.selectAll(".selected-highlight")
    //   .data(selectedDrink ? [selectedDrink[0]] : [])
    //   .enter()
    //   .append("circle")
    //   .attr("class", "selected-highlight")
    //   .attr("cx", d => xScale(getX(d)))
    //   .attr("cy", d => yScale(getY(d)))
    //   .attr("r", 12)
    //   .attr("fill", "none")
    //   .attr("stroke", "#ff4500")
    //   .attr("stroke-width", 2)
    //   .attr("stroke-dasharray", "3,3")
    //   .attr("opacity", 0.8);

    // Добавление легенды
    const legend = svg.append("g")
      .attr("transform", `translate(${width + 20}, 0)`);

    legend.append("text")
      .attr("x", 0)
      .attr("y", -20)
      .attr("font-weight", "bold")
      .text(`COlor by: ${colorBy === 'cluster' ? 'cluster' : 
             colorBy === 'category' ? 'category' : 'taste'}`);

    const sortedDomain = [...colorDomain].sort((a, b) => {
      if (colorBy === 'cluster') return a - b;
      return String(a).localeCompare(String(b));
    });

    sortedDomain.forEach((value, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorScale(value));

      let legendText;
      if (colorBy === 'cluster') {
        legendText = getClusterLabel ? `${getClusterLabel(value)} (${value})` : `CLuster ${value}`;
      } else {
        legendText = colorBy === 'category' ? value.replace(/_/g, ' ') : value;
      }

      legend.append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 12)
        .text(legendText)
        .style("font-size", "12px");
    });

    // Добавление возможности масштабирования
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        svg.selectAll(".dot")
          .attr("transform", event.transform);

        svg.select(".x-axis").call(
          d3.axisBottom(event.transform.rescaleX(xScale))
        );
        svg.select(".y-axis").call(
          d3.axisLeft(event.transform.rescaleY(yScale))
        );
      });

    d3.select(svgRef.current).call(zoom);

    return () => {
      tooltip.remove();
    };
  }, [data, onDrinkSelect, selectedDrink, colorBy, getClusterLabel, embeddingType]);

  return (
    <div className="scatter-plot-container">
      <h3>Individual drinks</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ScatterPlot;