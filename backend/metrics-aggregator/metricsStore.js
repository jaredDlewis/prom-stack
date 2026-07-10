/*
{
  id: hash (string)
  metrics: {
    [metric-name]: metric-data-points
  }
}
*/

class MetricsStore {
  constructor() {
    this.containerMetrics = [];
  }

  getAllContainerMetrics() {
    return this.containerMetrics;
  }

  getOneContainerMetrics(id) {
    return this.containerMetrics.find((container) => container.id === id);
  }

  upsertOneContainerMetrics({ id, metrics }) {
    const container = this.getOneContainerMetrics(id);
    if (container) {
      container.metrics = { ...metrics };
    } else {
      this.containerMetrics.push({ id, metrics });
    }
  }

  upsertAllContainerMetrics(containerMetrics) {
    for (const container of containerMetrics) {
      this.upsertOneContainerMetrics(container);
    }
  }
}

// singleton to hold state
const metricsStore = new MetricsStore();
export default metricsStore;
