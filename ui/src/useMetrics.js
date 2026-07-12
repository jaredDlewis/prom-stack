import { useState, useEffect } from 'react';

import {
  MEMORY_USAGE_TOTAL,
  MEMORY_PERCENT,
  MEMORY_USAGE_DISPLAY,
  MEMORY_USAGE_LIMIT,
} from './constants';
import { mockResponse } from '../mocks';

const TIMEOUT_DELAY = 500;
const memoryUnits = [
  'B',
  'KB',
  'MB',
  'GB',
  'TB',
  'PB',
  'EB',
  'ZB',
  'YB',
  'RB',
  'QB',
];

function getScaledMemoryText(memoryRaw) {
  for (let i = 0; i < memoryUnits.length; i++) {
    // base case: displayMetricsNum / 1000 ** i is less than 1000
    const memoryScaled = (memoryRaw / 1000 ** i).toPrecision(4);
    if (memoryScaled < 1000) {
      return `${memoryScaled}${memoryUnits[i]}`;
    }
  }
}

function getMemoryUsageDisplay(memoryUsageTotalRaw, memoryUsageLimitRaw) {
  return `${getScaledMemoryText(memoryUsageTotalRaw)} / ${getScaledMemoryText(memoryUsageLimitRaw)}`;
}

function transformMetrics(metrics) {
  return metrics
    .map((m) => {
      const memoryUsageTotalRaw = m.metrics[MEMORY_USAGE_TOTAL][0]['as_int'];
      const memoryUsageLimitRaw = m.metrics[MEMORY_USAGE_LIMIT][0]['as_int'];
      return {
        id: m.id,
        [MEMORY_USAGE_TOTAL]: memoryUsageTotalRaw,
        [MEMORY_PERCENT]: m.metrics[MEMORY_PERCENT][0]['as_double'],
        [MEMORY_USAGE_DISPLAY]: getMemoryUsageDisplay(
          memoryUsageTotalRaw,
          memoryUsageLimitRaw,
        ),
      };
    })
    .sort((a, b) => a[MEMORY_USAGE_TOTAL] - b[MEMORY_USAGE_TOTAL]);
}

export function useMetrics() {
  const [metrics, setMetrics] = useState([]);

  const getAndSetMetrics = async () => {
    try {
      // const response = await fetch('http://localhost:3000/metrics');
      // const body = await response.json();
      const body = mockResponse;
      const rawMetricsData = body.data;
      setMetrics(rawMetricsData);
    } catch (error) {
      console.warn('Error getting metrics: ', error);
    }
  };

  useEffect(() => {
    let timeoutId = null;
    function metricsLoop() {
      getAndSetMetrics();
      timeoutId = setTimeout(metricsLoop, TIMEOUT_DELAY);
    }
    metricsLoop();
    return () => clearTimeout(timeoutId);
  });

  const transformedMetrics = transformMetrics(metrics);

  return { metrics: transformedMetrics };
}
