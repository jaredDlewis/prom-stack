import { useState, useEffect } from 'react';

import { MEMORY_USAGE_TOTAL, MEMORY_PERCENT } from './constants';

const TIMEOUT_DELAY = 500;

function transformMetrics(metrics) {
  return metrics.map((m) => {
    return {
      id: m.id,
      [MEMORY_USAGE_TOTAL]: m.metrics[MEMORY_USAGE_TOTAL][0]['as_int'],
      [MEMORY_PERCENT]: m.metrics[MEMORY_PERCENT][0]['as_double'],
    };
  }).sort((a, b) => a[MEMORY_USAGE_TOTAL] - b[MEMORY_USAGE_TOTAL]);
}

export function useMetrics() {
  const [metrics, setMetrics] = useState([]);

  const getAndSetMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3000/metrics');
      const body = await response.json();
      const rawMetricsData = body.data;
      setMetrics(rawMetricsData);
      setTimeout(getAndSetMetrics, TIMEOUT_DELAY);
    } catch (error) {
      console.error('Error getting metrics: ', error);
      setTimeout(getAndSetMetrics, TIMEOUT_DELAY);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(getAndSetMetrics, TIMEOUT_DELAY);
    return () => clearTimeout(timeoutId);
  });

  const transformedMetrics = transformMetrics(metrics);
  
  return { metrics: transformedMetrics };
}
