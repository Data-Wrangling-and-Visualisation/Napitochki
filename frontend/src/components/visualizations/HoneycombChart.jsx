// src/components/visualizations/HoneycombChart.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { hexbin } from 'd3-hexbin';
import './HoneycombChart.css';
import { getClusterLabel } from '../../utils/clusterDescriptions';

const HoneycombChart = ({ data, fullData, onDrinkSelect, colorBy = 'cluster' }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Очистка предыдущей визуализации
    d3.select(svgRef.current).selectAll("*").remove();

    // Настройка размеров
    const width = 800;
    const height = 600;
    const legendWidth = 180;

    const svg = d3.select(svgRef.current)
      .attr("width", width + legendWidth)
      .attr("height", height);

    // Создаем группу для масштабируемого содержимого
    const zoomableGroup = svg.append("g")
      .attr("class", "zoomable-group")
      .attr("transform", `translate(20, 20)`);

    const fullXExtent = d3.extent(fullData, d => d.tsne_x);
    const fullYExtent = d3.extent(fullData, d => d.tsne_y);

    // Настройка масштабов
    // const xScale = d3.scaleLinear()
    //   .domain(d3.extent(data, d => d.tsne_x))
    //   .range([0, width - 40]);
    //
    // const yScale = d3.scaleLinear()
    //   .domain(d3.extent(data, d => d.tsne_y))
    //   .range([height - 40, 0]);

    const xScale = d3.scaleLinear()
      .domain(fullXExtent)
      .range([0, width - 40]);

    const yScale = d3.scaleLinear()
      .domain(fullYExtent)
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
          let maxCluster = null;
          let maxCount = 0;
          for (const [cluster, count] of Object.entries(clusterCounts)) {
            if (count > maxCount) {
              maxCount = count;
              maxCluster = Number(cluster);
            }
          }
          return maxCluster;
        };
        break;
    }

    const colorPalette = [];
    for (let i = 0; i < 25; i++) {
      colorPalette.push(d3.interpolateRainbow(i / 25));
    }

    const colorScale = d3.scaleOrdinal()
      .domain(colorDomain)
      .range(d3.schemeSpectral[colorDomain.length] || colorPalette);

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

    // Функция для получения статистики кластера
    const getClusterStats = (items) => {
      // Считаем напитки по кластерам
      const clusterCounts = {};
      items.forEach(item => {
        clusterCounts[item.cluster] = (clusterCounts[item.cluster] || 0) + 1;
      });

      // Собираем самые частые вкусы в кластере
      const tasteCounts = {};
      items.forEach(item => {
        if (item.taste && item.taste.length) {
          item.taste.forEach(taste => {
            tasteCounts[taste] = (tasteCounts[taste] || 0) + 1;
          });
        }
      });

      // Сортируем вкусы по частоте
      const topTastes = Object.entries(tasteCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

      return {
        totalDrinks: items.length,
        clusters: Object.entries(clusterCounts).map(([cluster, count]) => ({
          cluster: Number(cluster),
          count,
          percentage: Math.round((count / items.length) * 100)
        })).sort((a, b) => b.count - a.count),
        topTastes
      };
    };

    // Функция для создания и отрисовки шестиугольников с учетом текущего масштаба
    // Функция для создания и отрисовки шестиугольников с учетом текущего масштаба
    const renderHexagons = (scale) => {
      // Очищаем текущие шестиугольники и тексты с количеством
      zoomableGroup.selectAll(".hexagon, .hexagon-count, .drink-point").remove();

      // Динамический радиус соты в зависимости от масштаба
      const baseRadius = 15;
      const radius = scale >= 2.5 ? baseRadius / (scale / 2) : baseRadius;

      // Если масштаб больше определенного значения, переключаемся на отдельные напитки
      if (scale >= 5) {
        // Отрисовка индивидуальных напитков как маленьких кружков
        zoomableGroup.selectAll(".drink-point")
          .data(data)
          .enter()
          .append("circle")
          .attr("class", "drink-point hexagon")
          .attr("cx", d => xScale(d.tsne_x))
          .attr("cy", d => yScale(d.tsne_y))
          .attr("r", 4)
          .attr("fill", d => colorScale(colorBy === 'cluster' ? d.cluster :
                             colorBy === 'category' ? d.category :
                             d.taste && d.taste.length ? d.taste[0] : 'N/A'))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1 / scale)
          .style("cursor", "pointer")
          .on("mouseover", (event, d) => {
            tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);

            tooltip.html(`
                  <strong>${d.name}</strong><br/>
                  Кластер: ${getClusterLabel(d.cluster)}<br/>
                  Вкусы: ${d.taste.join(", ")}<br/>
                  Категория: ${d.category}
                `)
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

        // Добавляем текст "1" над каждой точкой
        // zoomableGroup.selectAll(".point-count")
        //   .data(data)
        //   .enter()
        //   .append("text")
        //   .attr("class", "hexagon-count")
        //   .attr("x", d => xScale(d.tsne_x))
        //   .attr("y", d => yScale(d.tsne_y) - 6)
        //   .attr("text-anchor", "middle")
        //   .attr("font-size", 8)
        //   .attr("fill", "black")
        //   .attr("pointer-events", "none")
        //   .text("1");
      } else {
        // Создание генератора шестиугольников с масштабированным радиусом
        const hexbinGenerator = hexbin()
          .x(d => xScale(d.tsne_x))
          .y(d => yScale(d.tsne_y))
          .radius(radius)
          .extent([[0, 0], [width - 40, height - 40]]);

        // Группировка данных
        const bins = hexbinGenerator(data);

        // Отрисовка шестиугольников
        zoomableGroup.selectAll(".hexagon")
          .data(bins)
          .enter()
          .append("path")
          .attr("class", "hexagon")
          .attr("d", hexbinGenerator.hexagon())
          .attr("transform", d => `translate(${d.x}, ${d.y})`)
          .attr("fill", d => colorScale(colorValueFunction(d)))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1 / scale)
          .style("cursor", "pointer")
          .on("mouseover", (event, d) => {
            tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);

            if (d.length > 1) {
              const dominantValue = colorValueFunction(d);
              const stats = getClusterStats(d);

              let tooltipContent = `<strong>${d.length} напитков в группе</strong><br/>`;

              if (colorBy === 'cluster') {
                tooltipContent += `<u>Распределение по кластерам:</u><br/>`;
                stats.clusters.forEach(c => {
                  tooltipContent += `${getClusterLabel(c.cluster)}: ${c.count} (${c.percentage}%)<br/>`;
                });
              } else if (colorBy === 'category') {
                tooltipContent += `Преобладающая категория: ${dominantValue}<br/>`;
              } else if (colorBy === 'taste') {
                tooltipContent += `Преобладающий вкус: ${dominantValue}<br/>`;
              }

              tooltipContent += `<br/><u>Топ вкусы:</u> ${stats.topTastes.join(", ")}<br/>`;

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
            if (d.length === 1 && onDrinkSelect) {
              onDrinkSelect(d[0]);
            }
          });

        // Добавляем отображение числа напитков для всех шестиугольников
        // если больше 2 напитков
        zoomableGroup.selectAll(".hexagon-count")
          .data(bins)
          .enter()
          .append("text")
          .attr("class", "hexagon-count")
          .attr("x", d => d.x)
          .attr("y", d => d.y + 4)
          .attr("text-anchor", "middle")
          .attr("font-size", 10)
          .attr("fill", "white")
          .attr("pointer-events", "none")
          .text(d => d.length > 1 ? d.length : "");
      }
    };

    // Начальная отрисовка шестиугольников
    renderHexagons(1);

    // Функция зума с пересчетом шестиугольников
    const zoom = d3.zoom()
      .scaleExtent([1, 10]) // минимальный и максимальный масштаб
      .on("zoom", (event) => {
        // Обновляем трансформацию группы
        zoomableGroup.attr("transform", event.transform);

        // Перерисовываем шестиугольники с учетом нового масштаба
        renderHexagons(event.transform.k);
      });

    // Применяем зум к SVG
    svg.call(zoom);

    // При двойном клике сбрасываем зум
    svg.on("dblclick.zoom", null)
      .on("dblclick", () => {
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity);
      });

    // Добавление легенды (не масштабируемая часть)
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 10}, 20)`);

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

    // Добавление инструкции по использованию зума
    svg.append("text")
      .attr("x", 20)
      .attr("y", height - 20)
      .text("Scroll to zoom")
      .attr("font-size", "12px")
      .attr("fill", "#666");

    // Информация о режимах масштабирования
    svg.append("text")
      .attr("x", 20)
      .attr("y", height - 5)
      .attr("font-size", "10px")
      .attr("fill", "#666");


  }, [data, onDrinkSelect, colorBy]);

  return (
    <div className="honeycomb-container">
      <h3>Honeycomb</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default HoneycombChart;
