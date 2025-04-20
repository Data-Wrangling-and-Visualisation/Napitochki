import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { getIngredientGraph } from '../api/drinks';
import './IngredientGraph.css'; // Импортируем CSS файл

export default function IngredientGraph() {
  const svgRef = useRef();

  useEffect(() => {
    let width = window.innerWidth - 250;
    let height = window.innerHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'ingredient-graph-svg')
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', '250px');

    // Меняем цвет фона с черного на белый
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#ffffff'); // Меняем с #111 на #ffffff

    const g = svg.append('g');
    svg.call(
      d3.zoom().scaleExtent([0.2, 4]).on('zoom', ({ transform }) => g.attr('transform', transform))
    );

    getIngredientGraph().then((data) => {
      const nodes = data.vertices.map(d => ({ id: d.n_id, rawSize: d.size, origColor: d.color }));
      const links = data.edges.map(d => ({ source: d.source, target: d.target, weight: d.weight }));

      const sizeExtent = d3.extent(nodes, d => d.rawSize);
      const nodeRadius = d3.scaleSqrt().domain(sizeExtent).range([5, 150]);

      const uniqueColors = Array.from(new Set(nodes.map(d => d.origColor.join(','))));
      const palette = ['#1f77b4', '#2ca02c', '#ff7f0e', '#9467bd', '#d62728', '#940000', '#0000b4'];
      const colorMap = {};
      uniqueColors.forEach((c, i) => colorMap[c] = palette[i % palette.length]);

      const clusterSizes = {};
      nodes.forEach(node => {
        const colorKey = node.origColor.join(',');
        clusterSizes[colorKey] = (clusterSizes[colorKey] || 0) + 1;
      });

      function forceCluster(alpha) {
        // Сохраняем весь код forceCluster без изменений
        const clusterCenters = {};
        const clusterNodes = {};

        nodes.forEach(node => {
          const colorKey = node.origColor.join(',');
          if (!clusterNodes[colorKey]) clusterNodes[colorKey] = [];
          clusterNodes[colorKey].push(node);
        });

        Object.keys(clusterNodes).forEach(colorKey => {
          const cluster = clusterNodes[colorKey];
          clusterCenters[colorKey] = {
            x: d3.mean(cluster, d => d.x),
            y: d3.mean(cluster, d => d.y)
          };
        });

        const clusterStrength = 0.3; // Increased cluster strength
        const linkClusterStrength = 0.02; // Reduced interaction strength between different clusters

        nodes.forEach(node => {
          const colorKey = node.origColor.join(',');
          const ownCenter = clusterCenters[colorKey];

          if (ownCenter) {
            const dx = ownCenter.x - node.x;
            const dy = ownCenter.y - node.y;
            node.vx += dx * alpha * clusterStrength;
            node.vy += dy * alpha * clusterStrength;
          }

          links.forEach(link => {
            if (link.source.id === node.id || link.target.id === node.id) {
              const otherNode = link.source.id === node.id ? link.target : link.source;
              const otherColor = otherNode.origColor.join(',');
              const otherCenter = clusterCenters[otherColor];

              if (otherCenter && otherColor !== colorKey) {
                const dx = otherCenter.x - node.x;
                const dy = otherCenter.y - node.y;
                node.vx += dx * alpha * linkClusterStrength;
                node.vy += dy * alpha * linkClusterStrength;
              }
            }
          });
        });
      }

      function forceCentering(alpha) {
        // Сохраняем весь код forceCentering без изменений
        const centerX = width / 2;
        const centerY = height / 2;
        const centerStrength = 0.01; // Lower strength to allow clustering to take precedence

        nodes.forEach(node => {
          const dx = centerX - node.x;
          const dy = centerY - node.y;
          node.vx += dx * alpha * centerStrength;
          node.vy += dy * alpha * centerStrength;
        });
      }

      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(100).strength(0.15))
        .force('charge', d3.forceManyBody().strength(-10))
        .force('x', d3.forceX(width / 2).strength(0.01))
        .force('y', d3.forceY(height / 2).strength(0.01))
        .force('collision', d3.forceCollide().radius(d => nodeRadius(d.rawSize) + 8).strength(1))
        .force('cluster', forceCluster)
        .force('superCenter', forceCentering)
        .velocityDecay(0.9)
        .alphaDecay(0.02); // Reduced alpha decay for better stabilization

      const linkStroke = d3.scaleSqrt()
        .domain(d3.extent(links, d => d.weight))
        .range([1, 8]);

      const link = g.append('g')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('class', 'ingredient-link')
        .attr('stroke-width', d => linkStroke(d.weight));

      const node = g.append('g')
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('class', 'ingredient-node')
        .attr('r', d => nodeRadius(d.rawSize))
        .attr('fill', d => colorMap[d.origColor.join(',')])
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .call(d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.05).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
        );

      const label = g.append('g')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .attr('class', 'ingredient-label')
        .text(d => d.id)
        .attr('font-size', '8px')
        .attr('fill', '#333') // Меняем цвет текста с '#fff' на '#333'
        .attr('stroke', '#fff') // Меняем цвет обводки с '#111' на '#fff'
        .attr('stroke-width', 2)
        .attr('paint-order', 'stroke')
        .attr('dx', d => nodeRadius(d.rawSize) + 3)
        .attr('dy', '.35em');

      // Обновляем стили подсказки
      const tooltip = d3.select('body').append('div')
        .attr('class', 'ingredient-tooltip')
        .style('opacity', 0);

      node.on('mouseover', (event, d) => {
        tooltip.style('opacity', 1)
          .html(`<strong>${d.id}</strong><br/>Count: ${d.rawSize}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      }).on('mouseout', () => tooltip.style('opacity', 0));

      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)
          .attr('stroke', d => {
            const sourceColor = d.source.origColor.join(',');
            const targetColor = d.target.origColor.join(',');
            return sourceColor === targetColor
              ? colorMap[sourceColor]
              : (clusterSizes[sourceColor] >= clusterSizes[targetColor]
                ? colorMap[sourceColor]
                : colorMap[targetColor]);
          });

        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);

        label
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      });

      const handleResize = () => {
        width = window.innerWidth - 250;
        height = window.innerHeight;
        svg.attr('width', width).attr('height', height);
        simulation.force('x', d3.forceX(width / 2).strength(0.02));
        simulation.force('y', d3.forceY(height / 2).strength(0.02));
        simulation.alpha(0.3).restart();
      };

      window.addEventListener('resize', handleResize);
    });

    return () => {
      d3.select(svgRef.current).selectAll('*').remove();
      d3.selectAll('.ingredient-tooltip').remove();
      window.removeEventListener('resize', () => {});
    };
  }, []);

  return (
    <div className="ingredient-graph-container">
      <svg ref={svgRef} className="ingredient-graph-svg" />
    </div>
  );
}