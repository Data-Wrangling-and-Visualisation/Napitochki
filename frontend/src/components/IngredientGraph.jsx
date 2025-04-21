import React, {useRef, useEffect, useState} from 'react';
import * as d3 from 'd3';
import { getIngredientGraph } from '../api/drinks';
import './IngredientGraph.css';

export default function IngredientGraph() {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const updateGraph = () => {
      if (!containerRef.current || !svgRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'ingredient-graph-svg');

      svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#ffffff');

      const g = svg.append('g');
      svg.call(
        d3.zoom().scaleExtent([0.2, 4]).on('zoom', ({ transform }) => g.attr('transform', transform))
      );

      getIngredientGraph().then((data) => {
        const nodes = data.vertices.map(d => ({ id: d.n_id, rawSize: d.size, origColor: d.color }));
        const links = data.edges.map(d => ({ source: d.source, target: d.target, weight: d.weight }));

        const sizeExtent = d3.extent(nodes, d => d.rawSize);
        const nodeRadius = d3.scaleSqrt().domain(sizeExtent).range([2, 80]);

        const uniqueColors = Array.from(new Set(nodes.map(d => d.origColor.join(','))));
        const palette = ['#91bedf', '#9ce19c', '#dab392', '#b695d8',
          '#a594da', '#e19696', '#8383cb'];
        const colorMap = {};
        uniqueColors.forEach((c, i) => colorMap[c] = palette[i % palette.length]);

        const clusterSizes = {};
        nodes.forEach(node => {
          const colorKey = node.origColor.join(',');
          clusterSizes[colorKey] = (clusterSizes[colorKey] || 0) + 1;
        });

        function forceCentering(alpha, nodes, width, height) {
          const centerX = width / 2;
          const centerY = height / 2;
          const centerStrength = 0.01; // Низкая сила для приоритета кластеризации

          nodes.forEach(node => {
            const dx = centerX - node.x;
            const dy = centerY - node.y;
            node.vx += dx * alpha * centerStrength;
            node.vy += dy * alpha * centerStrength;
          });
        }

        const simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links)
            .id(d => d.id)
            .distance(50)
            .strength(1))
          .force('charge', d3.forceManyBody()
            .strength(d => -Math.max(20, nodeRadius(d.rawSize) * 6))) // Сила отталкивания зависит от размера узла
          .force('x', d3.forceX(width / 2).strength(0.01))
          .force('y', d3.forceY(height / 2).strength(0.01))
          .force('collision', d3.forceCollide()
            .radius(d => nodeRadius(d.rawSize) + 10) // Увеличиваем радиус столкновения
            .strength(0.9)) // Увеличиваем силу столкновения
          .force('cluster', alpha => {
            const clusterCenters = {};
            const clusterStrength = 0.3;

            // Вычисляем центры кластеров
            nodes.forEach(node => {
              const colorKey = node.origColor.join(',');
              if (!clusterCenters[colorKey]) {
                clusterCenters[colorKey] = { x: 0, y: 0, count: 0 };
              }
              clusterCenters[colorKey].x += node.x;
              clusterCenters[colorKey].y += node.y;
              clusterCenters[colorKey].count++;
            });

            Object.keys(clusterCenters).forEach(colorKey => {
              clusterCenters[colorKey].x /= clusterCenters[colorKey].count;
              clusterCenters[colorKey].y /= clusterCenters[colorKey].count;
            });

            // Применяем силу кластеризации
            nodes.forEach(node => {
              const colorKey = node.origColor.join(',');
              const center = clusterCenters[colorKey];
              if (center) {
                const dx = center.x - node.x;
                const dy = center.y - node.y;
                const sizeFactor = Math.sqrt(node.rawSize);
                node.vx += dx * alpha * clusterStrength / sizeFactor;
                node.vy += dy * alpha * clusterStrength / sizeFactor;
              }
            });
          })
          .force('centering', alpha => forceCentering(alpha, nodes, width, height))
          .velocityDecay(0.5)
          .alphaDecay(0.02);

        const linkStroke = d3.scaleSqrt()
          .domain(d3.extent(links, d => d.weight))
          .range([1, 6]);

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
          .attr('font-size', '4px')
          .attr('fill', '#333')
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .attr('paint-order', 'stroke')
            .attr('text-anchor', 'middle')
          .attr('dy', d => nodeRadius(d.rawSize) + 5);

        const tooltip = d3.select('body').append('div')
          .attr('class', 'ingredient-tooltip')
          .style('opacity', 0);

        node.on('mouseover', (event, d) => {
          tooltip.style('opacity', 1)
            .html(`<strong>${d.id}</strong><br/>Count: ${d.rawSize}`)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`);
        }).on('mouseout', () => tooltip.style('opacity', 0));

        node.on('click', (event, d) => {
          const isActive = d3.select(event.currentTarget).classed('active');
          d3.selectAll('.ingredient-node').classed('active', false);
          d3.selectAll('.ingredient-link').classed('active', false);
          d3.selectAll('.ingredient-label').classed('active', false);

          if (!isActive) {
            link.attr('opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.2)
                .attr('stroke-width', l => (l.source.id === d.id || l.target.id === d.id) ? linkStroke(l.weight) : linkStroke(l.weight));

            node.attr('opacity', n => {
              return (n.id === d.id || links.some(l => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id))) ? 1 : 0.2;
            });

            label.attr('opacity', n => (n.id === d.id || links.some(l => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id))) ? 1 : 0.2);

            d3.select(event.currentTarget).classed('active', true);
          } else {
            link.attr('opacity', 0.6)
                .attr('stroke-width', l => linkStroke(l.weight));

            node.attr('opacity', 1);
            label.attr('opacity', 1);
          }
        });



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
          if (!containerRef.current) return;

          const newWidth = containerRef.current.clientWidth;
          const newHeight = containerRef.current.clientHeight;

          svg.attr('width', newWidth).attr('height', newHeight);
          svg.select('rect').attr('width', newWidth).attr('height', newHeight);

          simulation.force('x', d3.forceX(newWidth / 2).strength(0.02));
          simulation.force('y', d3.forceY(newHeight / 2).strength(0.02));
          simulation.alpha(0.3).restart();
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      });
    };

    updateGraph();

    return () => {
      d3.select(svgRef.current).selectAll('*').remove();
      d3.selectAll('.ingredient-tooltip').remove();
    };
  }, []);

  return (
    <div ref={containerRef} className="ingredient-graph-container">
      <svg ref={svgRef} className="ingredient-graph-svg"></svg>
    </div>
  );
}