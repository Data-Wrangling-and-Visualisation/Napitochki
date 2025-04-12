// src/components/visualizations/HoneycombChart.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { hexbin } from 'd3-hexbin';
import './HoneycombChart.css';
import { getClusterLabel } from '../../utils/clusterDescriptions';

const HoneycombChart = ({ data, onSelectDrink, colorBy = 'cluster' }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Очистка предыдущей визуализации
    d3.select(svgRef.current).selectAll("*").remove();

    // Настройка размеров
    const width = 800;
    const height = 600;
    const legendWidth = 180; // Пространство для легенды

    const svg = d3.select(svgRef.current)
      .attr("width", width + legendWidth) // Добавляем место для легенды
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(20, 20)`);

    // Создание SVG

    // Настройка масштабов
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.tsne_x))
      .range([0, width - 40]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.tsne_y))
      .range([height - 40, 0]);

    // Определяем цветовую схему в зависимости от выбранного параметра
    let colorDomain;
    let colorValueFunction;

    switch(colorBy) {
      case 'category':
        colorDomain = [...new Set(data.map(d => d.category))];
        colorValueFunction = (items) => {
          const categoryCounts = {};
          items.forEach(item => {
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
          });
          return Object.keys(categoryCounts).reduce(
            (a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, Object.keys(categoryCounts)[0]
          );
        };
        break;
      case 'taste':
        { const allTastes = data.map(d =>
          d.taste && d.taste.length >= 1 ? d.taste[0] : 'N/A'
        );
        colorDomain = [...new Set(allTastes)];
        colorValueFunction = (items) => {
          const tasteCounts = {};
          items.forEach(item => {
            const taste = item.taste && item.taste.length >= 1
              ? item.taste[0]
              : 'N/A';
            tasteCounts[taste] = (tasteCounts[taste] || 0) + 1;
          });
          return Object.keys(tasteCounts).reduce(
            (a, b) => tasteCounts[a] > tasteCounts[b] ? a : b, Object.keys(tasteCounts)[0]
          );
        };
        break; }
      case 'cluster':
      default:
        colorDomain = [...new Set(data.map(d => d.cluster))].sort((a, b) => a - b);
        colorValueFunction = (items) => {
          const clusterCounts = {};
          items.forEach(item => {
            clusterCounts[item.cluster] = (clusterCounts[item.cluster] || 0) + 1;
          });

          // Находим кластер с максимальным количеством элементов
          let maxCluster = null;
          let maxCount = 0;

          for (const [cluster, count] of Object.entries(clusterCounts)) {
            if (count > maxCount) {
              maxCount = count;
              maxCluster = Number(cluster); // Преобразуем обратно в число
            }
          }

          return maxCluster;
        };
        break;
    }

    // Создание цветовой схемы
    // const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    //   .domain(colorDomain);

    const colorPalette = [];

    // Генерируем 25 различных цветов с использованием интерполяции
    for (let i = 0; i < 25; i++) {
      colorPalette.push(d3.interpolateRainbow(i / 25));
    }

    // Создаем цветовую шкалу с фиксированным соответствием значений и цветов
    const colorScale = d3.scaleOrdinal()
      .domain(colorDomain)
      .range(d3.schemeSpectral[colorDomain.length] || colorPalette);

    // Создание генератора шестиугольников
    const hexbinGenerator = hexbin()
      .x(d => xScale(d.tsne_x))
      .y(d => yScale(d.tsne_y))
      .radius(15)
      .extent([[0, 0], [width - 40, height - 40]]);

    // Группировка данных
    const bins = hexbinGenerator(data);

    // Создание подсказки
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("border", "1px solid #ccc")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Отрисовка шестиугольников
    svg.selectAll(".hexagon")
      .data(bins)
      .enter()
      .append("path")
      .attr("class", "hexagon")
      .attr("d", hexbinGenerator.hexagon())
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .attr("fill", d => colorScale(colorValueFunction(d)))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);

        if (d.length > 1) {
          const dominantValue = colorValueFunction(d);
          let tooltipContent = `${d.length} напитков в группе<br/>`;

          if (colorBy === 'cluster') {
            tooltipContent += `Преобладающий кластер: ${getClusterLabel(dominantValue)}`;
          } else if (colorBy === 'category') {
            tooltipContent += `Преобладающая категория: ${dominantValue}`;
          } else if (colorBy === 'taste') {
            tooltipContent += `Преобладающие вкусы: ${dominantValue}`;
          }

          tooltip.html(tooltipContent)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        } else {
          const drink = d[0];
          tooltip.html(`
            <strong>${drink.name}</strong><br/>
            Кластер: ${getClusterLabel(drink.cluster)}<br/>
            Вкусы: ${drink.taste.join(", ")}<br/>
            Категория: ${drink.category}
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        }
      })
      .on("mouseout", () => {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .on("click", (event, d) => {
        if (d.length === 1 && onSelectDrink) {
          onSelectDrink(d[0]);
        }
      });

    // Добавление легенды
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 30}, 20)`);


    // Сортировка элементов легенды в зависимости от типа цветового кодирования
    let sortedDomain = [...colorDomain];
    if (colorBy === 'cluster') {
      sortedDomain.sort((a, b) => a - b);
    } else {
      sortedDomain.sort();
    }

    sortedDomain.forEach((value, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorScale(value));

      // Форматируем текст легенды в зависимости от типа цветового кодирования
      let legendText;
      if (colorBy === 'cluster') {
        legendText = getClusterLabel(value);
      } else {
        legendText = value;
      }

      legend.append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 12)
        .text(legendText)
        .style("font-size", "11px");
    });

  }, [data, onSelectDrink, colorBy]);

  return (
    <div className="honeycomb-container">
      <h3>Шестиугольная диаграмма напитков</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default HoneycombChart;