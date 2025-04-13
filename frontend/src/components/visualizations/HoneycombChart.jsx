import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { hexbin } from 'd3-hexbin';
import './HoneycombChart.css';

const getClusterLabel = (cluster) => {
  const clusterLabels = {
    0: "Sweet & Fruity",
    1: "Rich & Creamy",
    2: "Citrus & Refreshing",
    3: "Spiced & Aromatic",
    4: "Floral & Delicate",
    5: "Tropical & Exotic",
    6: "Minty & Fresh",
    7: "Herbal & Botanical",
    // Add more clusters as needed
  };
  
  return clusterLabels[cluster] || `Cluster ${cluster}`;
};

const HoneycombChart = ({ data, fullData, onDrinkSelect, colorBy = 'cluster', getClusterLabel, embeddingType = 'combined' }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    // Setup dimensions
    const width = 800;
    const height = 600;
    const legendWidth = 180;

    const svg = d3.select(svgRef.current)
      .attr("width", width + legendWidth)
      .attr("height", height);

    // Create group for zoomable content
    const zoomableGroup = svg.append("g")
      .attr("class", "zoomable-group")
      .attr("transform", `translate(20, 20)`);

    // Use full data extent for consistent scaling
    const fullXExtent = d3.extent(fullData || data, d => d.x || 0);
    const fullYExtent = d3.extent(fullData || data, d => d.y || 0);

    // Setup scales
    const xScale = d3.scaleLinear()
      .domain(fullXExtent)
      .range([0, width - 40]);

    const yScale = d3.scaleLinear()
      .domain(fullYExtent)
      .range([height - 40, 0]);

    // Helper function to get the appropriate cluster based on embedding type
    const getClusterForEmbedding = (drink) => {
      if (!drink.cluster) return null;
      
      // Handle both object format and simple number format
      if (typeof drink.cluster === 'object') {
        return drink.cluster[embeddingType] !== undefined ? drink.cluster[embeddingType] : null;
      }
      
      return drink.cluster; // For backward compatibility
    };

    // Define color scheme based on selected parameter
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
        const allTastes = data.map(d =>
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
        break;
      case 'cluster':
      default:
        // Extract clusters for the current embedding type
        // Fix: Don't use filter(Boolean) as it removes cluster 0
        colorDomain = [...new Set(data.map(d => getClusterForEmbedding(d)))]
          .filter(c => c !== null && c !== undefined)
          .sort((a, b) => a - b);
          
        colorValueFunction = (items) => {
          const clusterCounts = {};
          items.forEach(item => {
            const cluster = getClusterForEmbedding(item);
            if (cluster !== undefined && cluster !== null) {
              clusterCounts[cluster] = (clusterCounts[cluster] || 0) + 1;
            }
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

    // Define color palettes
    const clusterColors = d3.schemeSpectral[8] || d3.schemeTableau10;
    const colorPalette = [];
    for (let i = 0; i < 25; i++) {
      colorPalette.push(d3.interpolateRainbow(i / 25));
    }

    const colorScale = d3.scaleOrdinal()
      .domain(colorDomain)
      .range(colorBy === 'cluster' ? clusterColors : d3.schemeSpectral[colorDomain.length] || colorPalette);

    // Create tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Function to get cluster statistics
    const getClusterStats = (items) => {
      // Count drinks by clusters
      const clusterCounts = {};
      items.forEach(item => {
        const cluster = getClusterForEmbedding(item);
        if (cluster !== undefined && cluster !== null) {
          clusterCounts[cluster] = (clusterCounts[cluster] || 0) + 1;
        }
      });

      // Count drinks by taste
      const tasteCounts = {};
      items.forEach(item => {
        if (item.taste && item.taste.length) {
          item.taste.forEach(taste => {
            tasteCounts[taste] = (tasteCounts[taste] || 0) + 1;
          });
        }
      });

      // Sort tastes by frequency
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

    // Function to render hexagons
    const renderHexagons = (scale) => {
      // Clear current hexagons and text counts
      zoomableGroup.selectAll(".hexagon, .hexagon-count, .drink-point").remove();

      // Dynamic hex radius based on scale
      const baseRadius = 15;
      const radius = scale >= 2.5 ? baseRadius / (scale / 2) : baseRadius;

      // If scale is large enough, switch to individual drinks
      if (scale >= 5) {
        // Render individual drinks as small circles
        zoomableGroup.selectAll(".drink-point")
          .data(data)
          .enter()
          .append("circle")
          .attr("class", "drink-point hexagon")
          .attr("cx", d => xScale(d.x || 0))
          .attr("cy", d => yScale(d.y || 0))
          .attr("r", 4)
          .attr("fill", d => {
            if (colorBy === 'cluster') {
              const cluster = getClusterForEmbedding(d);
              // Fix: explicitly check for null/undefined, not falsy
              return cluster !== null && cluster !== undefined ? colorScale(cluster) : "#cccccc";
            } else if (colorBy === 'category') {
              return d.category ? colorScale(d.category) : "#cccccc";
            } else {
              return d.taste && d.taste.length ? colorScale(d.taste[0]) : "#cccccc";
            }
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", 1 / scale)
          .style("cursor", "pointer")
          .on("mouseover", (event, d) => {
            tooltip.transition()
              .duration(200)
              .style("opacity", 0.9);

            let tooltipContent = `<strong>${d.name}</strong><br/>`;
            
            const cluster = getClusterForEmbedding(d);
            // Fix: explicitly check for null/undefined, not falsy
            if (cluster !== undefined && cluster !== null) {
              tooltipContent += `Cluster: ${getClusterLabel(cluster)} (${cluster})<br/>`;
            }
            
            tooltipContent += `Tastes: ${d.taste ? d.taste.join(", ") : 'N/A'}<br/>`;
            tooltipContent += `Category: ${d.category ? d.category.replace(/_/g, ' ') : 'N/A'}`;

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
      } else {
        // Create hexbin generator with scaled radius
        const hexbinGenerator = hexbin()
          .x(d => xScale(d.x || 0))
          .y(d => yScale(d.y || 0))
          .radius(radius)
          .extent([[0, 0], [width - 40, height - 40]]);

        // Group the data
        const bins = hexbinGenerator(data);

        // Render hexagons
        zoomableGroup.selectAll(".hexagon")
          .data(bins)
          .enter()
          .append("path")
          .attr("class", "hexagon")
          .attr("d", hexbinGenerator.hexagon())
          .attr("transform", d => `translate(${d.x}, ${d.y})`)
          .attr("fill", d => {
            const value = colorValueFunction(d);
            // Fix: explicitly check for null/undefined, not falsy
            return value !== null && value !== undefined ? colorScale(value) : "#cccccc";
          })
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

              let tooltipContent = `<strong>${d.length} drinks in group</strong><br/>`;
              
              // Fix: explicitly check for null/undefined, not falsy
              if (colorBy === 'cluster' && dominantValue !== null && dominantValue !== undefined) {
                tooltipContent += `<u>Dominant cluster:</u> ${getClusterLabel(dominantValue)} (${dominantValue})<br/>`;
                tooltipContent += `<u>Cluster distribution:</u><br/>`;
                stats.clusters.slice(0, 3).forEach(c => {
                  tooltipContent += `${getClusterLabel(c.cluster)} (${c.cluster}): ${c.count} (${c.percentage}%)<br/>`;
                });
              } else if (colorBy === 'category') {
                tooltipContent += `Dominant category: ${(dominantValue || '').replace(/_/g, ' ')}<br/>`;
              } else if (colorBy === 'taste') {
                tooltipContent += `Dominant taste: ${dominantValue || 'N/A'}<br/>`;
              }

              tooltipContent += `<br/><u>Top tastes:</u> ${stats.topTastes.join(", ") || 'N/A'}<br/>`;

              tooltip.html(tooltipContent)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            } else {
              const drink = d[0];
              let tooltipContent = `<strong>${drink.name}</strong><br/>`;
              
              const cluster = getClusterForEmbedding(drink);
              // Fix: explicitly check for null/undefined, not falsy
              if (cluster !== undefined && cluster !== null) {
                tooltipContent += `Cluster: ${getClusterLabel(cluster)} (${cluster})<br/>`;
              }
              
              tooltipContent += `Tastes: ${drink.taste ? drink.taste.join(", ") : 'N/A'}<br/>`;
              tooltipContent += `Category: ${drink.category ? drink.category.replace(/_/g, ' ') : 'N/A'}`;

              tooltip.html(tooltipContent)
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

        // Add count text for hexagons with multiple drinks
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

    // Initial hexagon rendering
    renderHexagons(1);

    // Zoom function with hexagon recalculation
    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .on("zoom", (event) => {
        zoomableGroup.attr("transform", event.transform);
        renderHexagons(event.transform.k);
      });

    // Apply zoom to SVG
    svg.call(zoom);

    // Reset zoom on double click
    svg.on("dblclick.zoom", null)
      .on("dblclick", () => {
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity);
      });

    // Debug: log the domain to check if 0 is included
    console.log("Color domain:", colorDomain);

    // Add legend (non-scalable part)
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 10}, 20)`);

    let sortedDomain = [...colorDomain];
    if (colorBy === 'cluster') {
      sortedDomain.sort((a, b) => a - b);
    } else {
      sortedDomain.sort();
    }

    sortedDomain.forEach((value, i) => {
      // Fix: explicitly check for null/undefined, not falsy
      if (value === undefined || value === null) return;
      
      // Debug: log each value to check if 0 makes it here
      console.log("Legend value:", value, typeof value);
      
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorScale(value));

      let legendText;
      if (colorBy === 'cluster') {
        legendText = getClusterLabel ? `${getClusterLabel(value)} (${value})` : `Cluster ${value}`;
      } else {
        legendText = colorBy === 'category' ? value.replace(/_/g, ' ') : value;
      }

      legend.append("text")
        .attr("x", 20)
        .attr("y", i * 20 + 12)
        .text(legendText)
        .style("font-size", "11px");
    });

    // Add usage instructions
    svg.append("text")
      .attr("x", 20)
      .attr("y", height - 20)
      .text("Scroll to zoom, Double-click to reset")
      .attr("font-size", "12px")
      .attr("fill", "#666");

    // Add embedding type info if showing clusters
    if (colorBy === 'cluster') {
      svg.append("text")
        .attr("x", 20)
        .attr("y", height - 5)
        .text(`Showing ${embeddingType} clusters`)
        .attr("font-size", "12px")
        .attr("fill", "#666");
    }

    return () => {
      // Cleanup tooltip on unmount
      tooltip.remove();
    };

  }, [data, fullData, onDrinkSelect, colorBy, getClusterLabel, embeddingType]);

  return (
    <div className="honeycomb-container">
      <h3>Drink Flavor Network Visualization</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default HoneycombChart;