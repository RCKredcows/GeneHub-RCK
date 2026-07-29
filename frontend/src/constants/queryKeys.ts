export const QUERY_KEYS = {
  // Tanks
  tanks: ['tanks'] as const,
  nitrogenFillHistory: (tankId: string) => ['nitrogenFillHistory', tankId] as const,
  nitrogenConsumptionStats: (tankId: string) => ['nitrogenConsumptionStats', tankId] as const,
  canisters: (tankId: string) => ['canisters', tankId] as const,
  canisterInventory: (canisterId: string) => ['canisterInventory', canisterId] as const,

  // Genetic Inventory
  geneticInventory: ['geneticInventory'] as const,
  geneticInventoryCounts: ['geneticInventoryCounts'] as const,

  // Sires
  sires: ['sires'] as const,
  sireCount: ['sireCount'] as const,

  // Customers
  customers: ['customers'] as const,
  customerCount: ['customerCount'] as const,
  customersWithInventory: ['customersWithInventory'] as const,
  customerInventory: (customerId: string) => ['customerInventory', customerId] as const,

  // Medical/Supply Inventory
  medicalInventory: ['medicalInventory'] as const,
  medicalCategories: ['medicalCategories'] as const,
  medicalInventoryStats: (days: number) => ['medicalInventoryStats', days] as const,
  usageHistory: (itemId: string) => ['usageHistory', itemId] as const,

  // Base keys for invalidating all parameterized queries
  allMedicalInventoryStats: ['medicalInventoryStats'] as const,
  allUsageHistory: ['usageHistory'] as const,

  // Activity Log
  activityLog: ['activityLog'] as const,

  // User Settings
  userSettings: (userId: string) => ['userSettings', userId] as const,
} as const;
