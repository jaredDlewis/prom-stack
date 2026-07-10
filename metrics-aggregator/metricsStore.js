/*
{
  id: hash (string)
  memoryUsage: bytes (string)
}
*/

class MetricsStore {
  constructor() {
    this.containerMemoryUsages = [];
  }

  getContainerMemoryUsages() {
    return this.containerMemoryUsages;
  }

  getContainerMemoryUsage(id) {
    return this.containerMemoryUsages.find((container) => container.id === id);
  }

  upsertContainerMemoryUsage({ id, memoryUsage }) {
    const container = this.getContainerMemoryUsage(id);
    if (container) {
      container.memoryUsage = memoryUsage;
    } else {
      this.containerMemoryUsages.push({ id, memoryUsage });
    }
  }

  upsertContainerMemoryUsages(containerMemoryUsages) {
    for (const container of containerMemoryUsages) {
      this.upsertContainerMemoryUsage(container);
    }
  }
}

// singleton to hold state
const metricsStore = new MetricsStore();
export default metricsStore;
