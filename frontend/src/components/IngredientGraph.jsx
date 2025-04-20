import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { getIngredientGraph } from '../api/drinks';

export default function IngredientGraph() {
  const svgRef = useRef();

  useEffect(() => {
    let width = window.innerWidth - 250;
    let height = window.innerHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', '250px');

    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#111');

    const g = svg.append('g');
    svg.call(
      d3.zoom().scaleExtent([0.2, 4]).on('zoom', ({ transform }) => g.attr('transform', transform))
    );

    getIngredientGraph().then((data) => {
      const nodes = data.vertices.map(d => ({ id: d.n_id, rawSize: d.size, origColor: d.color }));
      const links = data.edges.map(d => ({ source: d.source, target: d.target, weight: d.weight }));

      // Node sizing: normalize rawSize to reasonable radii
      const sizeExtent = d3.extent(nodes, d => d.rawSize);
      const nodeRadius = d3.scaleSqrt().domain(sizeExtent).range([5, 150]);

      // Color clusters by original API color mapping to palette
      const uniqueColors = Array.from(new Set(nodes.map(d => d.origColor.join(','))));
      const palette = ['#1f77b4', '#2ca02c', '#ff7f0e', '#9467bd', '#d62728', '#940000', '#0000b4'];
      const colorMap = {};
      uniqueColors.forEach((c, i) => colorMap[c] = palette[i % palette.length]);

      const clusterSizes = {};
      nodes.forEach(node => {
      const colorKey = node.origColor.join(',');
      clusterSizes[colorKey] = (clusterSizes[colorKey] || 0) + 1;
      });

      // function forceCluster(alpha) {
      //     nodes.forEach(nodeA => {
      //       const colorA = nodeA.origColor.join(',');
      //       nodes.forEach(nodeB => {
      //           const colorB = nodeB.origColor.join(',');
      //           if (colorA === colorB && nodeA !== nodeB) {
      //           // Притягиваем узлы одинакового цвета друг к другу
      //           const dx = nodeB.x - nodeA.x;
      //           const dy = nodeB.y - nodeA.y;
      //           const dist = Math.sqrt(dx * dx + dy * dy);
      //           if (dist > 0) {
      //               const force = alpha * 0.1 / dist;
      //               nodeA.vx += dx * force;
      //               nodeA.vy += dy * force;
      //               }
      //           }
      //       });
      //   });
      // }
      // function forceCluster(alpha) {
      //   const clusterCenters = {};
      //   const clusterNodes = {};
      //
      //   nodes.forEach(node => {
      //     const colorKey = node.origColor.join(',');
      //     if (!clusterNodes[colorKey]) clusterNodes[colorKey] = [];
      //     clusterNodes[colorKey].push(node);
      //   });
      //
      //   Object.keys(clusterNodes).forEach(colorKey => {
      //     const cluster = clusterNodes[colorKey];
      //     const centerX = d3.mean(cluster, d => d.x);
      //     const centerY = d3.mean(cluster, d => d.y);
      //     clusterCenters[colorKey] = { x: centerX, y: centerY };
      //   });
      //
      //   const clusterStrength = 0.2; // not too strong (was 0.3)
      //
      //   nodes.forEach(node => {
      //     const colorKey = node.origColor.join(',');
      //     const center = clusterCenters[colorKey];
      //     if (center) {
      //       node.vx += (center.x - node.x) * alpha * clusterStrength;
      //       node.vy += (center.y - node.y) * alpha * clusterStrength;
      //     }
      //   });
      //   }

      function forceCluster(alpha) {
        const clusterCenters = {};
        const clusterNodes = {};

        // Group nodes by cluster color
        nodes.forEach(node => {
          const colorKey = node.origColor.join(',');
          if (!clusterNodes[colorKey]) clusterNodes[colorKey] = [];
          clusterNodes[colorKey].push(node);
        });

        // Calculate each cluster's center
        Object.keys(clusterNodes).forEach(colorKey => {
          const cluster = clusterNodes[colorKey];
          clusterCenters[colorKey] = {
            x: d3.mean(cluster, d => d.x),
            y: d3.mean(cluster, d => d.y)
          };
        });

        // Apply attraction toward the cluster center
        const clusterStrength = 0.4; // Stronger pull inside cluster

        nodes.forEach(node => {
          const colorKey = node.origColor.join(',');
          const center = clusterCenters[colorKey];
          if (center) {
            const dx = center.x - node.x;
            const dy = center.y - node.y;
            node.vx += dx * alpha * clusterStrength;
            node.vy += dy * alpha * clusterStrength;
          }
        });
        }

      function forceCentering(alpha) {
        const centerX = width / 2;
        const centerY = height / 2;
        const centerStrength = 0.03; // Gentle overall pull to center

        nodes.forEach(node => {
          const dx = centerX - node.x;
          const dy = centerY - node.y;
          node.vx += dx * alpha * centerStrength;
          node.vy += dy * alpha * centerStrength;
        });
      }




      //   const simulation = d3.forceSimulation(nodes)
      // .force('link', d3.forceLink(links)
      //   .id(d => d.id)
      //   // .distance(100)
      //   // .strength(0.08)
      // )
      // .force('charge', d3.forceManyBody().strength(-50).theta(0.9).distanceMax(500))
      // .force('x', d3.forceX(width / 2).strength(0.01))
      // .force('y', d3.forceY(height / 2).strength(0.01))
      // .force('collision', d3.forceCollide().radius(d => nodeRadius(d.rawSize) + 4))
      // .force('cluster', forceCluster)  // Добавляем нашу силу кластеризации
      // .alphaDecay(0.03).alphaMin(0.001).velocityDecay(0.4);

      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links)
          .id(d => d.id)
          .distance(200) // shorter spring length, more compact
          .strength(0.08)
        )
        .force('charge', d3.forceManyBody()
          .strength(-50) // gravitationalConstant: -50
        )
        .force('x', d3.forceX(width / 2).strength(0.01))
        .force('y', d3.forceY(height / 2).strength(0.01))
        .force('collision', d3.forceCollide()
          .radius(d => nodeRadius(d.rawSize) + 8)
          .strength(0.9)
        )
        .force('cluster', forceCluster)   // clusters pull together
        .force('superCenter', forceCentering)  // everything pulled to center
        .alphaDecay(0.02);

        const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.weight))
      .attr('stroke-opacity', 0.6);

      // Draw nodes
      const node = g.append('g')
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('r', d => nodeRadius(d.rawSize))
        .attr('fill', d => colorMap[d.origColor.join(',')])
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .call(d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
        );

      // Labels: all nodes
      g.append('g')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .text(d => d.id)
        .attr('font-size', '8px')
        .attr('fill', '#fff')
        .attr('stroke', '#111')
        .attr('stroke-width', 2)
        .attr('paint-order', 'stroke')
        .attr('dx', d => nodeRadius(d.rawSize) + 3)
        .attr('dy', '.35em');

      // Tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'ingredient-tooltip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('color', '#fff')
        .style('padding', '4px 6px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('opacity', 0);

      node.on('mouseover', (event, d) => {
        tooltip.style('opacity', 1)
          .html(`<strong>${d.id}</strong><br/>Count: ${d.rawSize}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      }).on('mouseout', () => tooltip.style('opacity', 0));

      // Tick handling
      // simulation.on('tick', () => {
      //   g.selectAll('line')
      //     .attr('x1', d => d.source.x)
      //     .attr('y1', d => d.source.y)
      //     .attr('x2', d => d.target.x)
      //     .attr('y2', d => d.target.y);
      //
      //   node
      //     .attr('cx', d => d.x)
      //     .attr('cy', d => d.y);
      //
      //   g.selectAll('text')
      //     .attr('x', d => d.x)
      //     .attr('y', d => d.y);
      // });

        simulation.on('tick', () => {
      // Обновляем цвет рёбер на основе размеров кластеров
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .attr('stroke', d => {
          const sourceColor = d.source.origColor.join(',');
          const targetColor = d.target.origColor.join(',');

          // Если узлы из одного кластера, берём их цвет
          if (sourceColor === targetColor) {
            return colorMap[sourceColor];
          }

          // Иначе берём цвет узла из большего кластера
          return clusterSizes[sourceColor] >= clusterSizes[targetColor]
            ? colorMap[sourceColor]
            : colorMap[targetColor];
        });

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      g.selectAll('text')
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });
      // Resize handling
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

  return <svg ref={svgRef} />;
}
