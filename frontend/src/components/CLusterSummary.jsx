// src/components/ClusterSummary.jsx
import React from 'react';
import { clusterDescriptions } from '../utils/clusterDescriptions';
import './ClusterSummary.css';

const ClusterSummary = () => {
  return (
    <div className="cluster-summary">
      <h3>Описание кластеров напитков</h3>
      <div className="cluster-cards">
        {Object.entries(clusterDescriptions).map(([clusterId, cluster]) => (
          <div className="cluster-card" key={clusterId}>
            <h4>{`Кластер ${clusterId}: ${cluster.name}`}</h4>
            <p>Основные вкусы:</p>
            <ul>
              {cluster.tastes.map(taste => (
                <li key={taste}>{taste}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClusterSummary;