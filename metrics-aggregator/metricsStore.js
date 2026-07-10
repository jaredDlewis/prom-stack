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

  getAllContainerMemoryUsage() {
    return this.containerMemoryUsages;
  }

  getContainerMemoryUsage(id) {
    return this.containerMemoryUsages.find(container => container.id === id);
  }

  setContainerMemoryUsage(id, memoryUsage) {
    const container = getContainerMemoryUsage(id);
    if (container) {
      container.memoryUsage = memoryUsage;
    }
  }

  upsertMemoryUsages() {

  }

}

export const metricsStore = new MetricsStore;