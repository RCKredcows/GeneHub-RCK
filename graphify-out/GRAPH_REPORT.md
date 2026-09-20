# Graph Report - .  (2026-09-20)

## Corpus Check
- 246 files · ~137,163 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1125 nodes · 2184 edges · 95 communities (83 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_TS Node Config|TS Node Config]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_TS App Config|TS App Config]]
- [[_COMMUNITY_Stripe Edge Functions|Stripe Edge Functions]]
- [[_COMMUNITY_Stripe Function Helpers|Stripe Function Helpers]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_DB Backup Script|DB Backup Script]]
- [[_COMMUNITY_DB Restore Script|DB Restore Script]]
- [[_COMMUNITY_Storage Backup Script|Storage Backup Script]]
- [[_COMMUNITY_Storage Restore Script|Storage Restore Script]]
- [[_COMMUNITY_Tenant Config & Owner Labels|Tenant Config & Owner Labels]]
- [[_COMMUNITY_App Entry & PWA|App Entry & PWA]]
- [[_COMMUNITY_Supabase DB Types|Supabase DB Types]]
- [[_COMMUNITY_Activity Log & Sire API|Activity Log & Sire API]]
- [[_COMMUNITY_Customer API|Customer API]]
- [[_COMMUNITY_Tank Cards|Tank Cards]]
- [[_COMMUNITY_Query Keys & Category Lists|Query Keys & Category Lists]]
- [[_COMMUNITY_Medical Inventory Form|Medical Inventory Form]]
- [[_COMMUNITY_Nitrogen Tank API|Nitrogen Tank API]]
- [[_COMMUNITY_User Settings|User Settings]]
- [[_COMMUNITY_Canister & Genetic Fetch|Canister & Genetic Fetch]]
- [[_COMMUNITY_Medical Inventory API|Medical Inventory API]]
- [[_COMMUNITY_Async Searchable Select|Async Searchable Select]]
- [[_COMMUNITY_Page Prop Types|Page Prop Types]]
- [[_COMMUNITY_Test Utilities|Test Utilities]]
- [[_COMMUNITY_Sidebar|Sidebar]]
- [[_COMMUNITY_Inventory Display Utils|Inventory Display Utils]]
- [[_COMMUNITY_Settings Page Tests|Settings Page Tests]]
- [[_COMMUNITY_Inventory & Canister Mutations|Inventory & Canister Mutations]]
- [[_COMMUNITY_Loading Spinner|Loading Spinner]]
- [[_COMMUNITY_Customers Page|Customers Page]]
- [[_COMMUNITY_Auth & Sessions|Auth & Sessions]]
- [[_COMMUNITY_Tenant Branding|Tenant Branding]]
- [[_COMMUNITY_Check-in Modal|Check-in Modal]]
- [[_COMMUNITY_Async Operation Hook|Async Operation Hook]]
- [[_COMMUNITY_Form Validation|Form Validation]]
- [[_COMMUNITY_Sires Page|Sires Page]]
- [[_COMMUNITY_Notification Settings|Notification Settings]]
- [[_COMMUNITY_Billing & Members|Billing & Members]]
- [[_COMMUNITY_Medical Inventory Page|Medical Inventory Page]]
- [[_COMMUNITY_Tenant & Checkout API|Tenant & Checkout API]]
- [[_COMMUNITY_Customer Detail & Inventory|Customer Detail & Inventory]]
- [[_COMMUNITY_Usage Log & CRUD Hooks|Usage Log & CRUD Hooks]]
- [[_COMMUNITY_Widget Settings Config|Widget Settings Config]]
- [[_COMMUNITY_Canister Manager|Canister Manager]]
- [[_COMMUNITY_Customer Form|Customer Form]]
- [[_COMMUNITY_Medical Item Detail|Medical Item Detail]]
- [[_COMMUNITY_Dashboard Sections|Dashboard Sections]]
- [[_COMMUNITY_Canister & Fill Forms|Canister & Fill Forms]]
- [[_COMMUNITY_Category Mutations|Category Mutations]]
- [[_COMMUNITY_Activity Page|Activity Page]]
- [[_COMMUNITY_Inventory Type Fields|Inventory Type Fields]]
- [[_COMMUNITY_Owner Fields|Owner Fields]]
- [[_COMMUNITY_Customer Table|Customer Table]]
- [[_COMMUNITY_Landing Showcase|Landing Showcase]]
- [[_COMMUNITY_Landing Setup Steps|Landing Setup Steps]]
- [[_COMMUNITY_Inventory Form|Inventory Form]]
- [[_COMMUNITY_Stock Status Utils|Stock Status Utils]]
- [[_COMMUNITY_Category Form|Category Form]]
- [[_COMMUNITY_Category Tree UI|Category Tree UI]]
- [[_COMMUNITY_Usage Log Modal|Usage Log Modal]]
- [[_COMMUNITY_Restock Modal|Restock Modal]]
- [[_COMMUNITY_Activity Items|Activity Items]]
- [[_COMMUNITY_Tank Status Section|Tank Status Section]]
- [[_COMMUNITY_Location & Sex Fields|Location & Sex Fields]]
- [[_COMMUNITY_Details Fields|Details Fields]]
- [[_COMMUNITY_Tank Form|Tank Form]]
- [[_COMMUNITY_Deploy Infra Script|Deploy Infra Script]]
- [[_COMMUNITY_Migration Rehearsal|Migration Rehearsal]]
- [[_COMMUNITY_Build & Push Script|Build & Push Script]]
- [[_COMMUNITY_Prod Migration Script|Prod Migration Script]]
- [[_COMMUNITY_Destroy Infra Script|Destroy Infra Script]]
- [[_COMMUNITY_Terraform Ops Scripts|Terraform Ops Scripts]]
- [[_COMMUNITY_Tenant Branding Config|Tenant Branding Config]]
- [[_COMMUNITY_Project Docs Hub|Project Docs Hub]]
- [[_COMMUNITY_Key Migrations|Key Migrations]]
- [[_COMMUNITY_Tenancy & AWS Decisions|Tenancy & AWS Decisions]]
- [[_COMMUNITY_Stripe Billing Functions|Stripe Billing Functions]]
- [[_COMMUNITY_Lapsed Workspace Migration|Lapsed Workspace Migration]]
- [[_COMMUNITY_Search Overload Migration|Search Overload Migration]]
- [[_COMMUNITY_App Icon 192|App Icon 192]]
- [[_COMMUNITY_RCK Genetics Logo|RCK Genetics Logo]]
- [[_COMMUNITY_GeneHub Logo SVG|GeneHub Logo SVG]]
- [[_COMMUNITY_App Icon 512|App Icon 512]]
- [[_COMMUNITY_Apex vs Subdomain Hosting|Apex vs Subdomain Hosting]]
- [[_COMMUNITY_Migrations & Roles Docs|Migrations & Roles Docs]]
- [[_COMMUNITY_SQL Tests & Backups|SQL Tests & Backups]]
- [[_COMMUNITY_Environments & Deploy Ops|Environments & Deploy Ops]]
- [[_COMMUNITY_React Query Architecture|React Query Architecture]]

## God Nodes (most connected - your core abstractions)
1. `logActivity()` - 28 edges
2. `QUERY_KEYS` - 26 edges
3. `useModalState()` - 23 edges
4. `useFormState()` - 21 edges
5. `tenant` - 20 edges
6. `useUserSettings()` - 20 edges
7. `useFormValidation()` - 20 edges
8. `getFieldClassName()` - 20 edges
9. `compilerOptions` - 17 edges
10. `AuthUser` - 17 edges

## Surprising Connections (you probably didn't know these)
- `tenant config singleton (tenant.ts)` --references--> `tenant`  [INFERRED]
  graphify-out/memory/query_20260920_155458_why_does_tenant_bridge_auth___sessions_to_so_many.md → frontend/src/config/tenant.ts
- `applyTenant` --references--> `applyTenant()`  [INFERRED]
  graphify-out/memory/query_20260920_155458_why_does_tenant_bridge_auth___sessions_to_so_many.md → frontend/src/config/tenant.ts
- `tenantSlugFromHostname` --references--> `tenantSlugFromHostname()`  [INFERRED]
  graphify-out/memory/query_20260920_155458_why_does_tenant_bridge_auth___sessions_to_so_many.md → frontend/src/config/tenant.ts
- `tenantSlugFromHostname()` --references--> `tenantSlugFromHostname()`  [INFERRED]
  README.md → frontend/src/config/tenant.ts
- `QUERY_KEYS (queryKeys.ts)` --references--> `QUERY_KEYS`  [INFERRED]
  README.md → frontend/src/constants/queryKeys.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Stripe-gated workspace creation flow** — functions_readme_create_checkout_session, functions_readme_stripe_webhook, functions_readme_activate_paid_tenant, aws_migration_plan_create_tenant_with_owner, migrations_readme_migration_008 [EXTRACTED 0.90]
- **Logo composition: emblem, wordmark, tagline** — public_rck_logo_dark_final_2_dna_emblem, public_rck_logo_dark_final_2_wordmark, public_rck_logo_dark_final_2_tagline [EXTRACTED 1.00]
- **Logo helix composition** — public_logo_teal_strand, public_logo_purple_strand, public_logo_base_pair_rungs [EXTRACTED 1.00]
- **Tenant isolation mechanisms (RLS, current_tenant_id, composite FKs)** — aws_migration_plan_rls_isolation, aws_migration_plan_current_tenant_id, aws_migration_plan_composite_foreign_keys, aws_migration_plan_isolation_test_suite [EXTRACTED 0.95]
- **Stripe-gated workspace creation flow** — aws_migration_plan_stripe_checkout_workspace_creation, aws_migration_plan_signup_ordering, aws_migration_plan_roles_and_invitations, readme_edge_functions_billing, cutover_stripe_live_configuration [INFERRED 0.85]
- **Production cutover sequence (DNS, secret, DB migration, build, infra, Stripe, verify)** — cutover_dns_and_certificate, cutover_aws_secret_rebuild, cutover_production_database_migration, cutover_stripe_live_configuration, cutover_verification [EXTRACTED 0.95]

## Communities (95 total, 12 thin omitted)

### Community 23 - "TS Node Config"
Cohesion: 0.12
Nodes (15): compilerOptions, target, lib, module, skipLibCheck, moduleResolution, allowImportingTsExtensions, isolatedModules (+7 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.05
Nodes (39): name, private, version, type, scripts, dev, build, lint (+31 more)

### Community 14 - "TS App Config"
Cohesion: 0.11
Nodes (18): compilerOptions, target, useDefineForClassFields, lib, module, skipLibCheck, moduleResolution, allowImportingTsExtensions (+10 more)

### Community 5 - "Stripe Edge Functions"
Cohesion: 0.11
Nodes (22): stripe, db, stripe, db, TRIAL_DAYS, CORS, ROLE_LABELS, InvitationEmail (+14 more)

### Community 32 - "PWA Manifest"
Cohesion: 0.17
Nodes (11): name, short_name, description, start_url, display, background_color, theme_color, orientation (+3 more)

### Community 67 - "DB Backup Script"
Cohesion: 0.50
Nodes (4): supabase, TABLES, exportTable(), main()

### Community 53 - "DB Restore Script"
Cohesion: 0.33
Nodes (5): supabase, NULLABLE_EMPLOYEE_FK_FIELDS, TABLES, restoreTable(), main()

### Community 68 - "Storage Backup Script"
Cohesion: 0.60
Nodes (4): supabase, listAllFiles(), downloadFile(), main()

### Community 83 - "Storage Restore Script"
Cohesion: 0.67
Nodes (3): supabase, walkDir(), main()

### Community 10 - "Tenant Config & Owner Labels"
Cohesion: 0.18
Nodes (15): App(), resetTenant(), tenantSlugFromHostname(), baseDomain(), tenantHostname(), OWNER_TYPE, OwnerType, COMPANY (+7 more)

### Community 49 - "App Entry & PWA"
Cohesion: 0.29
Nodes (3): queryClient, registerServiceWorker(), BeforeInstallPromptEvent

### Community 7 - "Supabase DB Types"
Cohesion: 0.08
Nodes (26): Json, DatabaseWithoutInternals, DefaultSchema, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes (+18 more)

### Community 6 - "Activity Log & Sire API"
Cohesion: 0.11
Nodes (22): Database, Sire, ActivityLogInsert, SireInsert, SireUpdate, useImageUpload(), SireFormData, SelectChangeEvent (+14 more)

### Community 15 - "Customer API"
Cohesion: 0.15
Nodes (13): Customer, CustomerInsert, CustomerUpdate, CustomerFormData, initialFormData, fetchSiresPaginated(), fetchCustomers(), createCustomer() (+5 more)

### Community 36 - "Tank Cards"
Cohesion: 0.31
Nodes (9): GeneticInventoryItem, TankWithCount, CanisterWithCount, getNitrogenPercentage(), isLowNitrogen(), fetchInventoryByCanister(), getTitleSizeClass(), TankCardProps (+1 more)

### Community 24 - "Query Keys & Category Lists"
Cohesion: 0.15
Nodes (10): SupplyCategory, QUERY_KEYS, ENTITY_ROUTES, ACTION_LABELS, ENTITY_LABELS, ActivityFilters, CategoryTreeNode, CategoryOption (+2 more)

### Community 56 - "Medical Inventory Form"
Cohesion: 0.29
Nodes (6): SupplyInventory, InventoryFormData, InventoryFormOptions, initialFormData, createInventoryItem(), deleteInventoryItem()

### Community 9 - "Nitrogen Tank API"
Cohesion: 0.12
Nodes (20): Tank, TankInsert, TankUpdate, TankFormData, SaveMutationVars, DeleteMutationVars, initialFormData, normalizeTankPositions() (+12 more)

### Community 26 - "User Settings"
Cohesion: 0.25
Nodes (11): UserSettings, UserSettingsUpdate, DashboardWidgets, DEFAULT_SETTINGS, UseUserSettingsOptions, SettingsResult, UpdateMutationVariables, SaveMutationVariables (+3 more)

### Community 8 - "Canister & Genetic Fetch"
Cohesion: 0.10
Nodes (21): CanisterInsert, GeneticInventoryInsert, CanisterUpdate, GeneticInventoryUpdate, FetchTanksReturn, UseUserSettingsReturn, createTestQueryClient(), renderWithRouter() (+13 more)

### Community 22 - "Medical Inventory API"
Cohesion: 0.17
Nodes (12): SupplyCategoryInsert, SupplyInventoryInsert, SupplyCategoryUpdate, SupplyInventoryUpdate, InventoryItemWithCategory, InlineUpdateVars, InventoryCounts, checkCategoryDependencies() (+4 more)

### Community 19 - "Async Searchable Select"
Cohesion: 0.18
Nodes (10): SearchCustomerResult, OptionItem, SyntheticChangeEvent, SearchResult, AsyncSearchableSelectProps, AsyncSearchableSelect(), useDebounce(), PaginatedQueryOptions (+2 more)

### Community 44 - "Page Prop Types"
Cohesion: 0.22
Nodes (9): AuthUser, CustomersProps, SettingsProps, SiresProps, MedicalInventoryProps, ActivityProps, DashboardProps, GeneticInventoryProps (+1 more)

### Community 71 - "Test Utilities"
Cohesion: 0.70
Nodes (3): createTestQueryClient(), createQueryWrapper(), TestQueryWrapper()

### Community 55 - "Sidebar"
Cohesion: 0.29
Nodes (3): NavigationItem, SidebarUser, SidebarProps

### Community 4 - "Inventory Display Utils"
Cohesion: 0.07
Nodes (20): ownerLabel(), QuantityItem, QuantityEditorProps, ConfirmModalProps, SireCardData, SireCardProps, SireCard(), SireFormProps (+12 more)

### Community 70 - "Settings Page Tests"
Cohesion: 0.50
Nodes (4): mockNavigate, mockSettings, createTestQueryClient(), renderWithRouter()

### Community 0 - "Inventory & Canister Mutations"
Cohesion: 0.05
Nodes (67): mockedUseInventoryList, mockedUseInventoryForm, mockedUseInventoryDependencies, mockedUseQuickCreate, mockedUseCheckinForm, createTestQueryClient(), renderWithRouter(), createTestQueryClient() (+59 more)

### Community 39 - "Customers Page"
Cohesion: 0.47
Nodes (7): createTestQueryClient(), renderWithRouter(), useCustomerForm(), useCustomerList(), useCustomerDetail(), useCustomersReport(), Customers()

### Community 1 - "Auth & Sessions"
Cohesion: 0.07
Nodes (32): validateEmail(), validatePassword(), validatePasswordMatch(), validateRequired(), validateCheckbox(), LoginFormErrors, validateLoginForm(), SignUpFormData (+24 more)

### Community 18 - "Tenant Branding"
Cohesion: 0.18
Nodes (12): TEST_TENANT, applyTenant(), Branding, BrandingError, BrandingResult, fetchBranding(), updateBranding(), LOGO_TYPES (+4 more)

### Community 33 - "Check-in Modal"
Cohesion: 0.18
Nodes (6): OptionItem, SyntheticChangeEvent, SearchableSelectProps, CheckinItem, CheckinFormData, CheckinModalProps

### Community 35 - "Async Operation Hook"
Cohesion: 0.22
Nodes (8): formatErrorMessage(), AsyncOperationOptions, ExecuteOptions, ExecuteResult, useAsyncOperation(), FillFormData, FillMutationVars, initialFillFormData

### Community 61 - "Form Validation"
Cohesion: 0.33
Nodes (4): MinMaxRule, RequiredIfRule, FieldRule, ValidationRules

### Community 20 - "Sires Page"
Cohesion: 0.24
Nodes (12): mockedUseSireList, mockedUseSireForm, mockedUseSireQuickCreate, createTestQueryClient(), renderWithRouter(), useSireList(), SireFormRef, SireQuickCreateOptions (+4 more)

### Community 2 - "Billing & Members"
Cohesion: 0.08
Nodes (33): ProtectedRouteProps, SubscriptionNotice(), Role, ROLE_LABELS, ROLE_HINTS, Member, Invitation, MemberError (+25 more)

### Community 40 - "Medical Inventory Page"
Cohesion: 0.38
Nodes (7): createTestQueryClient(), renderWithRouter(), useInventoryList(), useUsageLog(), useCategoryList(), useMedicalInventoryReport(), MedicalInventory()

### Community 16 - "Tenant & Checkout API"
Cohesion: 0.17
Nodes (15): TenantConfig, DEFAULT_TENANT, fetchCurrentTenant(), fetchTenantBranding(), isSlugAvailable(), CreateTenantError, CreateTenantResult, startCheckout() (+7 more)

### Community 11 - "Customer Detail & Inventory"
Cohesion: 0.14
Nodes (14): tenant, useTanksReport(), InventoryReportItem, ReportInventoryItem, ReportCategory, ReportCustomer, ReportInventoryItem, ReportOptions (+6 more)

### Community 12 - "Usage Log & CRUD Hooks"
Cohesion: 0.12
Nodes (16): SaveMutationVariables, DeleteMutationVariables, QueryKeyItem, MutationAsyncFn, CRUDMutationOptions, SimpleMutationOptions, useSimpleMutation(), LogFormData (+8 more)

### Community 34 - "Widget Settings Config"
Cohesion: 0.25
Nodes (7): WidgetConfig, DefaultSettingsType, ITEMS_PER_PAGE_OPTIONS, TANK_DISPLAY_COUNT_OPTIONS, STAT_CARD_CONFIG, SECTION_CONFIG, WidgetListItemProps

### Community 46 - "Canister Manager"
Cohesion: 0.32
Nodes (6): CanisterItem, TankItem, CanisterManagerProps, CanisterManager(), DraggableItem, useDragReorder()

### Community 52 - "Customer Form"
Cohesion: 0.29
Nodes (4): FieldErrorProps, CustomerFormData, CustomerFormProps, CustomerForm()

### Community 13 - "Medical Item Detail"
Cohesion: 0.13
Nodes (13): getPageNumbers(), PaginationProps, Pagination(), MedicalItem, formatDate(), getExpirationStatus(), getStockStatus(), ItemDetailProps (+5 more)

### Community 21 - "Dashboard Sections"
Cohesion: 0.14
Nodes (9): useUserSettings(), useDashboard(), Settings(), Dashboard(), MedicalStats, MedicalInventorySectionProps, StatCardProps, LowNitrogenTank (+1 more)

### Community 31 - "Canister & Fill Forms"
Cohesion: 0.21
Nodes (9): getFieldClassName(), BasicSireFieldsProps, BasicSireFields(), FillFormData, FillFormProps, FillForm(), CanisterFormData, CanisterFormProps (+1 more)

### Community 47 - "Category Mutations"
Cohesion: 0.25
Nodes (6): ConfirmModalState, CategoryFormData, CategoryFormOptions, initialFormData, createCategory(), updateCategory()

### Community 43 - "Activity Page"
Cohesion: 0.31
Nodes (5): useActivityLogList(), useActivityLog(), Activity(), ActivityFiltersData, ActivityFiltersProps

### Community 75 - "Inventory Type Fields"
Cohesion: 0.50
Nodes (3): searchSires(), InventoryTypeFieldsProps, InventoryTypeFields()

### Community 54 - "Owner Fields"
Cohesion: 0.29
Nodes (3): searchCustomers(), SireOwnerFieldsProps, OwnerFieldsProps

### Community 30 - "Landing Showcase"
Cohesion: 0.17
Nodes (5): inventoryRows, canisters, supplies, activity, FEATURES

### Community 65 - "Inventory Form"
Cohesion: 0.40
Nodes (4): InventoryFormData, CategoryOption, InventoryFormProps, InventoryForm()

### Community 48 - "Stock Status Utils"
Cohesion: 0.39
Nodes (7): MedicalItem, formatDate(), getExpirationStatus(), getStockStatus(), getStockPercentage(), InventoryCardProps, InventoryCard()

### Community 66 - "Category Form"
Cohesion: 0.40
Nodes (4): CategoryFormData, CategoryOption, CategoryFormProps, CategoryForm()

### Community 57 - "Category Tree UI"
Cohesion: 0.29
Nodes (4): CategoryData, CategoryCounts, CategoryNodeProps, CategoryTreeProps

### Community 50 - "Usage Log Modal"
Cohesion: 0.25
Nodes (5): UsageItem, UsageFormData, UsageHistoryEntry, UsageLogModalProps, QUICK_AMOUNTS

### Community 62 - "Restock Modal"
Cohesion: 0.33
Nodes (4): RestockItem, RestockFormData, RestockModalProps, QUICK_AMOUNTS

### Community 41 - "Activity Items"
Cohesion: 0.28
Nodes (8): ACTION_ICONS, ACTION_COLORS, ActivityMetadata, formatTime(), formatMetadata(), ActivityData, ActivityItemProps, ActivityItem()

### Community 42 - "Location & Sex Fields"
Cohesion: 0.22
Nodes (3): InventoryFormProps, LocationFieldsProps, SexTypeFieldsProps

### Community 73 - "Tank Form"
Cohesion: 0.50
Nodes (3): TankFormData, TankFormProps, TankForm()

### Community 82 - "Migration Rehearsal"
Cohesion: 0.83
Nodes (3): rehearse-migration.sh script, log(), fail()

### Community 59 - "Prod Migration Script"
Cohesion: 0.57
Nodes (6): prod-migration.sh script, log(), warn(), fail(), confirm(), restore_deferred()

### Community 29 - "Terraform Ops Scripts"
Cohesion: 0.26
Nodes (11): _common.sh script, TF_VAR_environment, AWS_REGION, log(), warn(), die(), preflight(), ensure_backend() (+3 more)

### Community 25 - "Tenant Branding Config"
Cohesion: 0.18
Nodes (14): frontend index.html (PWA shell), PWA manifest and icons, src/main.tsx entry point, Per-tenant branding and get_tenant_branding() RPC, src/config/tenant.ts, Tenants and hostnames locally (slug.dev.localhost), tenantSlugFromHostname(), frontend/src/config/tenant.ts (+6 more)

### Community 17 - "Project Docs Hub"
Cohesion: 0.20
Nodes (16): Migrating production from 000 to 020, Rehearsal against restored production copy, Backup via supabase db dump, migration repair to mark 000 applied, db push --include-all requirement, Edge functions (billing), send-invitation function, AWS Migration Plan (+8 more)

### Community 64 - "Key Migrations"
Cohesion: 0.40
Nodes (5): preflight_prod.sql pre-flight checks, Migration 002 tenants (dangerous), Migration 005 composite FKs, Migration 010 invitations and owner promotion, Migration 016 drop allowed_emails (defer)

### Community 28 - "Tenancy & AWS Decisions"
Cohesion: 0.21
Nodes (13): Migration 003 tenant RLS, Decision: keep Supabase, drop RDS/Cognito/FastAPI, Cross-workspace sign-in is signed out and told, Tenant model (one tenant per user, tenant from JWT), Row level security tenant isolation, current_tenant_id(), Composite foreign keys including tenant_id, PostgREST embedded select hints must name constraint (+5 more)

### Community 45 - "Stripe Billing Functions"
Cohesion: 0.29
Nodes (8): Migration 008 billing (revokes create_tenant_with_owner from anon), create-checkout-session function, stripe-webhook function, --no-verify-jwt deployment for billing functions, Tenant created in webhook via activate_paid_tenant, activate_paid_tenant, Comping a workspace (signup_exemptions vs billing_exempt), Stripe billing integration

### Community 80 - "App Icon 192"
Cohesion: 0.67
Nodes (4): GeneHub icon 192x192 (DNA double helix), DNA double helix motif, Multicolor palette (teal, pink/violet, blue, green), PWA / app icon purpose (192px)

### Community 63 - "RCK Genetics Logo"
Cohesion: 0.40
Nodes (6): RCK Genetics Bovine Reproduction logo (dark variant), Circular DNA double-helix emblem in dark gray, Wordmark: RCK (dark red) GENETICS (charcoal), Tagline: BOVINE REPRODUCTION, RCK Genetics brand (bovine genetics and reproduction), Dark-colored logo variant intended for light backgrounds

### Community 58 - "GeneHub Logo SVG"
Cohesion: 0.33
Nodes (7): GeneHub Logo (logo.svg), Double helix mark (two crossing backbones), Base pair rungs (five horizontal bars, 25% opacity), Teal backbone strand (#0d8f7c), Purple backbone strand (#6e59a6), Rationale: rung endpoints sampled off curves so they land on both strands, GeneHub brand (genetics / bioinformatics product)

### Community 81 - "App Icon 512"
Cohesion: 0.67
Nodes (4): GeneHub App Icon (512px DNA double helix), DNA double helix illustration, Flat multicolor palette (teal, pink, purple, blue, lime, cyan), PWA / app icon purpose

### Community 38 - "Apex vs Subdomain Hosting"
Cohesion: 0.20
Nodes (10): Current architecture (AWS serves bundle, browser talks to Supabase), AWS hosting infrastructure (VPC, ALB, ECS Fargate, ECR, CloudWatch), Wildcard DNS alias and ACM wildcard certificate, daltongorham.com stand-in domain, Apex landing page vs workspace subdomains, Signup ordering (tenant + owner invitation, then account on subdomain), Delegate genehub.app to Route 53 and validate wildcard cert, prod.tfvars (single_nat_gateway false, desired_count 2) (+2 more)

### Community 37 - "Migrations & Roles Docs"
Cohesion: 0.24
Nodes (10): Stripe checkout gated workspace creation (migration 008), Roles (owner/admin/member) and invitations, Database migrations 000-020, SECURITY DEFINER functions (set_member_role, remove_member, update_tenant_branding), Notifications not tenant-aware (remaining work), Production database migration 000 to 020, rehearse-migration.sh and prod-migration.sh, Notification edge functions (Resend) (+2 more)

### Community 60 - "SQL Tests & Backups"
Cohesion: 0.40
Nodes (6): Subscription enforcement (lapsed workspaces read-only), SQL isolation test suites (tenant_isolation, composite_fks, billing_and_roles, preflight_prod), Post-cutover verification checklist, Database migrations and SQL tests, Backup and restore scripts, SQL test suites

### Community 72 - "Environments & Deploy Ops"
Cohesion: 0.83
Nodes (4): Operations scripts (build-and-push, deploy-infra, destroy-infra, put-supabase-secrets), Environments (production on Vercel, development on AWS ECS), AWS Supabase secret baked at build time, requires rebuild, Deployment (dev on AWS, production on Vercel moving to AWS)

### Community 27 - "React Query Architecture"
Cohesion: 0.18
Nodes (13): QUERY_KEYS (queryKeys.ts), useCRUDMutation, Frontend conventions (React Query, mutations, forms, pagination, branding), React Query architecture and QueryClient config, QUERY_KEYS, useCRUDMutation, useSimpleMutation, Dynamic queries with useQueries (useTankList) (+5 more)

## Knowledge Gaps
- **405 isolated node(s):** `target`, `lib`, `module`, `skipLibCheck`, `moduleResolution` (+400 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `tenant config singleton (tenant.ts)` connect `Tenant Branding Config` to `Tenant Config & Owner Labels`, `Customer Detail & Inventory`, `Tenancy & AWS Decisions`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `Row level security tenant isolation` connect `Tenancy & AWS Decisions` to `Tenant Branding Config`, `SQL Tests & Backups`, `Migrations & Roles Docs`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `tenant` connect `Customer Detail & Inventory` to `Inventory & Canister Mutations`, `Auth & Sessions`, `Widget Settings Config`, `Inventory Display Utils`, `Tenant Config & Owner Labels`, `Customer API`, `Tenant Branding`, `Sires Page`, `Owner Fields`, `Tenant Branding Config`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `QUERY_KEYS` (e.g. with `QUERY_KEYS` and `QUERY_KEYS (queryKeys.ts)`) actually correct?**
  _`QUERY_KEYS` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `tenant` (e.g. with `src/config/tenant.ts (tenant, applyTenant)` and `tenant config singleton (tenant.ts)`) actually correct?**
  _`tenant` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `target`, `lib`, `module` to the rest of the system?**
  _408 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TS Node Config` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._