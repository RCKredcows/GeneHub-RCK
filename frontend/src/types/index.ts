import type { Tables, TablesInsert, TablesUpdate, Database } from './database.types'

// ─── Table Row Types ────────────────────────────────────────
export type ActivityLog = Tables<'activity_log'>
export type AllowedEmail = Tables<'allowed_emails'>
export type Canister = Tables<'canisters'>
export type Customer = Tables<'customers'>
export type Employee = Tables<'employees'>
export type GeneticInventoryItem = Tables<'genetic_inventory'>
export type NitrogenFillHistory = Tables<'nitrogen_fill_history'>
export type NotificationLog = Tables<'notification_log'>
export type Sire = Tables<'sires'>
export type SupplyCategory = Tables<'supply_categories'>
export type SupplyInventory = Tables<'supply_inventory'>
export type SupplyUsageLog = Tables<'supply_usage_log'>
export type Tank = Tables<'tanks'>
export type UserSettings = Tables<'user_settings'>

// ─── Insert Types ───────────────────────────────────────────
export type ActivityLogInsert = TablesInsert<'activity_log'>
export type CanisterInsert = TablesInsert<'canisters'>
export type CustomerInsert = TablesInsert<'customers'>
export type GeneticInventoryInsert = TablesInsert<'genetic_inventory'>
export type NitrogenFillHistoryInsert = TablesInsert<'nitrogen_fill_history'>
export type SireInsert = TablesInsert<'sires'>
export type SupplyCategoryInsert = TablesInsert<'supply_categories'>
export type SupplyInventoryInsert = TablesInsert<'supply_inventory'>
export type SupplyUsageLogInsert = TablesInsert<'supply_usage_log'>
export type TankInsert = TablesInsert<'tanks'>
export type UserSettingsInsert = TablesInsert<'user_settings'>

// ─── Update Types ───────────────────────────────────────────
export type CanisterUpdate = TablesUpdate<'canisters'>
export type CustomerUpdate = TablesUpdate<'customers'>
export type GeneticInventoryUpdate = TablesUpdate<'genetic_inventory'>
export type SireUpdate = TablesUpdate<'sires'>
export type SupplyCategoryUpdate = TablesUpdate<'supply_categories'>
export type SupplyInventoryUpdate = TablesUpdate<'supply_inventory'>
export type TankUpdate = TablesUpdate<'tanks'>
export type UserSettingsUpdate = TablesUpdate<'user_settings'>

// ─── View Types ─────────────────────────────────────────────
export type CustomerInventoryView = Tables<'customer_inventory'>
export type LowNitrogenAlert = Tables<'v_low_nitrogen_alerts'>
export type LowStockAlert = Tables<'v_low_stock_alerts'>

// ─── RPC Return Types ───────────────────────────────────────
type DbFunctions = Database['public']['Functions']

export type SearchCustomerResult = DbFunctions['search_customers']['Returns'][number]
export type SearchGeneticInventoryResult =
  Extract<DbFunctions['search_genetic_inventory'], { Returns: unknown[] }>['Returns'][number]

// ─── Computed API Types (enriched with aggregate counts) ────
export type TankWithCount = Tank & { canister_count: number; canisters: undefined }
export type CanisterWithCount = Canister & { inventory_count: number }

// ─── Auth Types ─────────────────────────────────────────────
export interface AuthUser {
  id?: string
  email?: string
  user_metadata?: Record<string, unknown>
}

// ─── Common API Response Types ──────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error: Error | null
}

export interface ApiListResponse<T> {
  data: T[]
  count: number
  error: Error | null
}

export interface ApiSuccessResponse {
  success: boolean
  error: Error | null
}

// ─── Re-export database types ───────────────────────────────
export type { Database, Tables, TablesInsert, TablesUpdate } from './database.types'
export type { Json } from './database.types'
