import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './ScatterPlot.css';
import { getClusterLabel } from '../../utils/clusterDescriptions';

const ScatterPlot = ({ data, onDrinkSelect, selectedDrink, colorBy = 'cluster' }) => {
  const svgRef = useRef();
  const tooltipRef = useRef(null);
  // Массив для хранения всех кликнутых напитков
  const [clickedDrinks, setClickedDrinks] = useState([]);

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

    // Функция создания tooltip с определенным id
    const createTooltip = (drinkId) => {
      // Удаляем существующий тултип с таким id, если он есть
      d3.select(`#tooltip-${drinkId}`).remove();

      return d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .attr("id", `tooltip-${drinkId}`)
        .style("opacity", 0);
    };

    // Добавляем кнопку сброса в нижний правый угол графика
    const buttonSize = 32;
    const resetButton = svg.append("g")
      .attr("class", "reset-button")
      .attr("transform", `translate(${width - buttonSize - 10}, ${height - buttonSize - 10})`)
      .style("cursor", "pointer")
      .on("click", () => {
        // Сбрасываем выбранный напиток
        onDrinkSelect(null);

        // Очищаем массив кликнутых напитков
        setClickedDrinks([]);

        // Скрываем и удаляем все тултипы
        d3.selectAll(".tooltip")
          .transition()
          .duration(200)
          .style("opacity", 0)
          .remove();
      });

    // Фон кнопки
    resetButton.append("rect")
      .attr("width", buttonSize)
      .attr("height", buttonSize)
      .attr("rx", 4)
      .style("fill", "#f0f0f0")
      .style("stroke", "#ccc");

    // Иконка перезагрузки
    resetButton.append("path")
      .attr("d", "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z")
      .attr("transform", `translate(${buttonSize * 0.2}, ${buttonSize * 0.2}) scale(${buttonSize * 0.6/24})`)
      .style("fill", "#666");

    // Шкалы для осей
    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.tsne_x) - 5, d3.max(data, d => d.tsne_x) + 5])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.tsne_y) - 5, d3.max(data, d => d.tsne_y) + 5])
      .range([height, 0]);

    // Оси
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale));

    // Подписи к осям
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

    // Цветовая схема
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

    const colorPalette = [];
    for (let i = 0; i < 25; i++) {
      colorPalette.push(d3.interpolateRainbow(i / 25));
    }

    const colorScale = d3.scaleOrdinal()
      .domain(colorDomain)
      .range(d3.schemeSpectral[colorDomain.length] || colorPalette);

    // Функция отображения tooltip
    const showTooltip = (event, d) => {
      const drinkId = d.name.replace(/\s+/g, '-');

      // Проверяем, есть ли уже тултип для этого напитка
      let tooltip = d3.select(`#tooltip-${drinkId}`);

      // Если нет, создаем новый
      if (tooltip.empty()) {
        tooltip = createTooltip(drinkId);
      }

      tooltip.html(`
        <strong>${d.name}</strong><br/>
        Кластер: ${getClusterLabel(d.cluster)}<br/>
        Категория: ${d.category}<br/>
        Вкус: ${d.taste.join(', ')}
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px")
        .transition()
        .duration(200)
        .style("opacity", .9);
    };

    // Добавляем точки на график
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.tsne_x))
      .attr("cy", d => yScale(d.tsne_y))
      .attr("r", d => selectedDrink && d.name === selectedDrink.name ? 8 : 5)
      .style("fill", d => colorScale(colorFunction(d)))
      .style("stroke", d => {
        // Подсвечиваем текущий выбранный напиток сильнее
        if (selectedDrink && d.name === selectedDrink.name) return "#000";
        // Подсвечиваем все кликнутые напитки слабее
        if (clickedDrinks.some(drink => drink.name === d.name)) return "#666";
        return "none";
      })
      .style("stroke-width", d => {
        if (selectedDrink && d.name === selectedDrink.name) return 2;
        if (clickedDrinks.some(drink => drink.name === d.name)) return 1;
        return 0;
      })
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8);

        showTooltip(event, d);
      })
      .on("mouseout", function(event, d) {
        // Для обычных точек - возвращаем к начальному состоянию
        if (!selectedDrink || d.name !== selectedDrink.name) {
          if (!clickedDrinks.some(drink => drink.name === d.name)) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 5);

            // Скрываем tooltip если точка не кликнута
            if (!clickedDrinks.some(drink => drink.name === d.name)) {
              d3.select(`#tooltip-${d.name.replace(/\s+/g, '-')}`)
                .transition()
                .duration(200)
                .style("opacity", 0);
            }
          }
        }
      })
      .on("click", (event, d) => {
        // Проверяем, был ли этот напиток уже кликнут
        const isAlreadyClicked = clickedDrinks.some(drink => drink.name === d.name);

        // Добавляем в массив кликнутых, если его там еще нет
        if (!isAlreadyClicked) {
          setClickedDrinks(prev => [...prev, d]);
        }

        // Выбираем напиток как текущий
        onDrinkSelect(d);

        // Показываем tooltip
        showTooltip(event, d);
      });

    // Отображаем тултипы для всех кликнутых напитков
    clickedDrinks.forEach(clickedDrink => {
      const drinkData = data.find(d => d.name === clickedDrink.name);
      if (drinkData) {
        const x = xScale(drinkData.tsne_x);
        const y = yScale(drinkData.tsne_y);

        const svgRect = svgRef.current.getBoundingClientRect();
        const fakeEvent = {
          pageX: x + margin.left + svgRect.left + window.scrollX,
          pageY: y + margin.top + svgRect.top + window.scrollY
        };

        showTooltip(fakeEvent, drinkData);
      }
    });

    // Отдельно обрабатываем текущий выбранный напиток (чтобы он был сверху)
    if (selectedDrink) {
      const drinkData = data.find(d => d.name === selectedDrink.name);
      if (drinkData) {
        const x = xScale(drinkData.tsne_x);
        const y = yScale(drinkData.tsne_y);

        const svgRect = svgRef.current.getBoundingClientRect();
        const fakeEvent = {
          pageX: x + margin.left + svgRect.left + window.scrollX,
          pageY: y + margin.top + svgRect.top + window.scrollY
        };

        showTooltip(fakeEvent, drinkData);
      }
    }

    // Легенда
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 30}, 20)`);

    let sortedDomain = [...colorDomain];
    if (colorBy === 'cluster') {
      sortedDomain.sort((a, b) => a - b);
    } else {
      sortedDomain.sort();
    }

    sortedDomain.forEach((value, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendItem.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", colorScale(value));

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

    // Очищаем при размонтировании
    return () => {
      d3.selectAll(".tooltip").remove();
    };

  }, [data, onDrinkSelect, colorBy, selectedDrink, clickedDrinks]);

  return (
    <div className="scatter-plot-container">
      <h3>t-SNE Визуализация напитков</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ScatterPlot;