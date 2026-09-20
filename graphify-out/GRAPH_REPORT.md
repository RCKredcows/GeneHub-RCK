# Graph Report - .  (2026-09-19)

## Corpus Check
- 245 files · ~133,793 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1103 nodes · 2115 edges · 86 communities (76 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Customer API|Customer API]]
- [[_COMMUNITY_Tenant Branding|Tenant Branding]]
- [[_COMMUNITY_Auth & Sessions|Auth & Sessions]]
- [[_COMMUNITY_Activity Log|Activity Log]]
- [[_COMMUNITY_Billing & Members|Billing & Members]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Stripe Edge Functions|Stripe Edge Functions]]
- [[_COMMUNITY_Nitrogen Tank API|Nitrogen Tank API]]
- [[_COMMUNITY_Sire Forms & Modals|Sire Forms & Modals]]
- [[_COMMUNITY_Supabase DB Types|Supabase DB Types]]
- [[_COMMUNITY_Sire & Image Services|Sire & Image Services]]
- [[_COMMUNITY_Inventory Display Utils|Inventory Display Utils]]
- [[_COMMUNITY_Medical Inventory API|Medical Inventory API]]
- [[_COMMUNITY_Genetic Inventory Page|Genetic Inventory Page]]
- [[_COMMUNITY_Usage Log & CRUD Hooks|Usage Log & CRUD Hooks]]
- [[_COMMUNITY_TS App Config|TS App Config]]
- [[_COMMUNITY_Canister & Genetic Fetch|Canister & Genetic Fetch]]
- [[_COMMUNITY_Canister Forms & Async|Canister Forms & Async]]
- [[_COMMUNITY_Genetic Inventory Mutations|Genetic Inventory Mutations]]
- [[_COMMUNITY_Form State Hooks|Form State Hooks]]
- [[_COMMUNITY_TS Node Config|TS Node Config]]
- [[_COMMUNITY_Tanks Page & Pagination|Tanks Page & Pagination]]
- [[_COMMUNITY_Tenant Isolation & RLS|Tenant Isolation & RLS]]
- [[_COMMUNITY_AWS Deploy & Cutover|AWS Deploy & Cutover]]
- [[_COMMUNITY_User Settings|User Settings]]
- [[_COMMUNITY_Dashboard Stats|Dashboard Stats]]
- [[_COMMUNITY_Terraform Ops Scripts|Terraform Ops Scripts]]
- [[_COMMUNITY_Inventory Table|Inventory Table]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_Landing Showcase|Landing Showcase]]
- [[_COMMUNITY_Canister & Fill Forms|Canister & Fill Forms]]
- [[_COMMUNITY_Dashboard Tank Status|Dashboard Tank Status]]
- [[_COMMUNITY_Tank Cards|Tank Cards]]
- [[_COMMUNITY_Medical Inventory Page|Medical Inventory Page]]
- [[_COMMUNITY_Check-in Modal|Check-in Modal]]
- [[_COMMUNITY_Widget Settings Config|Widget Settings Config]]
- [[_COMMUNITY_AWS Architecture Decisions|AWS Architecture Decisions]]
- [[_COMMUNITY_Notifications System|Notifications System]]
- [[_COMMUNITY_Category Mutations|Category Mutations]]
- [[_COMMUNITY_Inventory Form Fields|Inventory Form Fields]]
- [[_COMMUNITY_Pre-Cutover Work|Pre-Cutover Work]]
- [[_COMMUNITY_Canister Manager|Canister Manager]]
- [[_COMMUNITY_Category List & Tree|Category List & Tree]]
- [[_COMMUNITY_Medical Item Utils|Medical Item Utils]]
- [[_COMMUNITY_App Entry & PWA|App Entry & PWA]]
- [[_COMMUNITY_Item Detail View|Item Detail View]]
- [[_COMMUNITY_Category Tree UI|Category Tree UI]]
- [[_COMMUNITY_Customer Form|Customer Form]]
- [[_COMMUNITY_GeneHub Logo SVG|GeneHub Logo SVG]]
- [[_COMMUNITY_Prod Migration Script|Prod Migration Script]]
- [[_COMMUNITY_DB Restore Script|DB Restore Script]]
- [[_COMMUNITY_Per-Tenant Branding Rollout|Per-Tenant Branding Rollout]]
- [[_COMMUNITY_Workspace Creation & Stripe|Workspace Creation & Stripe]]
- [[_COMMUNITY_Tank Details|Tank Details]]
- [[_COMMUNITY_React Query Data Layer|React Query Data Layer]]
- [[_COMMUNITY_Restock Modal|Restock Modal]]
- [[_COMMUNITY_Form Validation|Form Validation]]
- [[_COMMUNITY_Settings Page Tests|Settings Page Tests]]
- [[_COMMUNITY_Test Utilities|Test Utilities]]
- [[_COMMUNITY_Server-side Pagination|Server-side Pagination]]
- [[_COMMUNITY_RCK Genetics Logo|RCK Genetics Logo]]
- [[_COMMUNITY_Inventory Form|Inventory Form]]
- [[_COMMUNITY_Category Form|Category Form]]
- [[_COMMUNITY_Notification Settings|Notification Settings]]
- [[_COMMUNITY_DB Backup Script|DB Backup Script]]
- [[_COMMUNITY_Storage Backup Script|Storage Backup Script]]
- [[_COMMUNITY_Tank Form|Tank Form]]
- [[_COMMUNITY_Details Fields|Details Fields]]
- [[_COMMUNITY_Inventory Type Fields|Inventory Type Fields]]
- [[_COMMUNITY_Alert Section|Alert Section]]
- [[_COMMUNITY_Medical Stats Section|Medical Stats Section]]
- [[_COMMUNITY_Stripe Function Helpers|Stripe Function Helpers]]
- [[_COMMUNITY_App Icon 192|App Icon 192]]
- [[_COMMUNITY_App Icon 512|App Icon 512]]
- [[_COMMUNITY_Migration Rehearsal|Migration Rehearsal]]
- [[_COMMUNITY_Storage Restore Script|Storage Restore Script]]
- [[_COMMUNITY_Build & Push Script|Build & Push Script]]
- [[_COMMUNITY_Destroy Infra Script|Destroy Infra Script]]
- [[_COMMUNITY_Deploy Infra Script|Deploy Infra Script]]
- [[_COMMUNITY_README|README]]
- [[_COMMUNITY_Lapsed Workspace Migration|Lapsed Workspace Migration]]

## God Nodes (most connected - your core abstractions)
1. `logActivity()` - 28 edges
2. `QUERY_KEYS` - 24 edges
3. `useModalState()` - 23 edges
4. `useFormState()` - 21 edges
5. `useUserSettings()` - 20 edges
6. `useFormValidation()` - 20 edges
7. `getFieldClassName()` - 20 edges
8. `tenant` - 18 edges
9. `compilerOptions` - 17 edges
10. `AuthUser` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Cutover: daltongorham.com to genehub.app` --references--> `GeneHub AWS Migration Plan`  [EXTRACTED]
  CUTOVER.md → AWS_MIGRATION_PLAN.md
- `src/main.tsx entry point` --shares_data_with--> `Per-tenant branding (tenant.ts config module)`  [INFERRED]
  frontend/index.html → AWS_MIGRATION_PLAN.md
- `Migration 003 tenant RLS` --implements--> `Tenant-scoped RLS policies`  [EXTRACTED]
  frontend/supabase/migrations/README.md → AWS_MIGRATION_PLAN.md
- `Migration 002 tenants (dangerous)` --conceptually_related_to--> `Migrations 000-007 (dev only)`  [EXTRACTED]
  frontend/supabase/migrations/README.md → AWS_MIGRATION_PLAN.md
- `Migrate production database via prod-migration.sh` --conceptually_related_to--> `Remaining work before production cutover`  [INFERRED]
  CUTOVER.md → AWS_MIGRATION_PLAN.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Multi-tenant isolation via RLS, composite FKs and current_tenant_id** — aws_migration_plan_rls_policies, aws_migration_plan_composite_foreign_keys, aws_migration_plan_current_tenant_id, aws_migration_plan_isolation_test_suites [EXTRACTED 0.95]
- **Production cutover sequence (DNS, secret, DB migration, build, infra, Stripe)** — cutover_dns_certificate, cutover_baked_supabase_secret, cutover_prod_db_migration_step, cutover_prod_tfvars, cutover_stripe_configuration, cutover_verification_checklist [EXTRACTED 0.95]
- **Stripe-gated workspace creation flow** — functions_readme_create_checkout_session, functions_readme_stripe_webhook, functions_readme_activate_paid_tenant, aws_migration_plan_create_tenant_with_owner, migrations_readme_migration_008 [EXTRACTED 0.90]
- **Logo composition: emblem, wordmark, tagline** — public_rck_logo_dark_final_2_dna_emblem, public_rck_logo_dark_final_2_wordmark, public_rck_logo_dark_final_2_tagline [EXTRACTED 1.00]
- **Logo helix composition** — public_logo_teal_strand, public_logo_purple_strand, public_logo_base_pair_rungs [EXTRACTED 1.00]

## Communities (86 total, 10 thin omitted)

### Community 0 - "Customer API"
Cohesion: 0.05
Nodes (44): createCustomer(), deleteCustomer(), fetchCustomerInventory(), fetchCustomers(), fetchCustomersPaginated(), FetchCustomersPaginatedOptions, searchCustomers(), updateCustomer() (+36 more)

### Community 1 - "Tenant Branding"
Cohesion: 0.05
Nodes (43): Branding, BrandingError, BrandingResult, fetchBranding(), LOGO_TYPES, removeOldLogos(), updateBranding(), uploadLogo() (+35 more)

### Community 2 - "Auth & Sessions"
Cohesion: 0.06
Nodes (38): checkEmailAllowed(), getSession(), onAuthStateChange(), sendPasswordResetEmail(), signIn(), SignInParams, signOut(), signUp() (+30 more)

### Community 3 - "Activity Log"
Cohesion: 0.05
Nodes (33): Activity(), ActivityProps, fetchActivityLog(), ActivityFiltersData, ActivityFiltersProps, ACTION_COLORS, ACTION_ICONS, ActivityData (+25 more)

### Community 4 - "Billing & Members"
Cohesion: 0.08
Nodes (33): Billing, BillingError, fetchBilling(), isInGoodStanding(), openBillingPortal(), SubscriptionStatus, fetchInvitations(), fetchMembers() (+25 more)

### Community 5 - "Package Dependencies"
Cohesion: 0.05
Nodes (39): dependencies, react, react-dom, react-icons, react-router-dom, recharts, @supabase/supabase-js, @tanstack/react-query (+31 more)

### Community 6 - "Stripe Edge Functions"
Cohesion: 0.11
Nodes (22): CORS, db, stripe, TRIAL_DAYS, CORS, invitationTemplate(), lowNitrogenTemplate(), lowStockTemplate() (+14 more)

### Community 7 - "Nitrogen Tank API"
Cohesion: 0.11
Nodes (22): checkTankHasInventory(), clearNitrogenFillHistory(), createTank(), deleteNitrogenFillEvent(), deleteTank(), getNitrogenConsumptionStats(), getNitrogenFillHistory(), insertTankAtPosition() (+14 more)

### Community 8 - "Sire Forms & Modals"
Cohesion: 0.11
Nodes (16): SireFormProps, ConfirmModalProps, ImageUploadFieldProps, SireDetailsFieldsProps, useSiresReport(), Sires(), createTestQueryClient(), mockedUseSireForm (+8 more)

### Community 9 - "Supabase DB Types"
Cohesion: 0.08
Nodes (26): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Tables, TablesInsert, TablesUpdate (+18 more)

### Community 10 - "Sire & Image Services"
Cohesion: 0.14
Nodes (18): FetchActivityLogOptions, logActivity(), createSire(), deleteSire(), FetchSiresPaginatedOptions, updateSire(), deleteImage(), uploadImage() (+10 more)

### Community 11 - "Inventory Display Utils"
Cohesion: 0.11
Nodes (16): getEmbryoBadgeClass(), getSemenBadgeClass(), getStorageDuration(), InventoryItemData, parseLocalDate(), CanisterData, InventoryItem, InventoryListProps (+8 more)

### Community 12 - "Medical Inventory API"
Cohesion: 0.13
Nodes (17): checkCategoryDependencies(), createInventoryItem(), deleteCategory(), deleteInventoryItem(), fetchInventory(), updateInventoryItem(), SupplyCategoryInsert, SupplyCategoryUpdate (+9 more)

### Community 13 - "Genetic Inventory Page"
Cohesion: 0.17
Nodes (18): GeneticInventory(), useCRUDMutation(), useGeneticInventoryReport(), createTestQueryClient(), mockedUseCheckinForm, mockedUseInventoryDependencies, mockedUseInventoryForm, mockedUseInventoryList (+10 more)

### Community 14 - "Usage Log & CRUD Hooks"
Cohesion: 0.11
Nodes (17): fetchUsageHistory(), logUsage(), restockItem(), CRUDMutationOptions, DeleteMutationVariables, MutationAsyncFn, QueryKeyItem, SaveMutationVariables (+9 more)

### Community 15 - "TS App Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, allowJs, isolatedModules, jsx, lib, module, moduleDetection (+10 more)

### Community 16 - "Canister & Genetic Fetch"
Cohesion: 0.14
Nodes (12): checkCanisterHasInventory(), CheckinLocationData, deleteCanister(), fetchCanistersByTank(), fetchGeneticInventoryPaginated(), FetchGeneticInventoryPaginatedOptions, fetchTanks(), InventoryReportItem (+4 more)

### Community 17 - "Canister Forms & Async"
Cohesion: 0.13
Nodes (14): createCanister(), updateCanister(), updateCanisterPosition(), AsyncOperationOptions, ExecuteOptions, ExecuteResult, formatErrorMessage(), useAsyncOperation() (+6 more)

### Community 18 - "Genetic Inventory Mutations"
Cohesion: 0.12
Nodes (14): checkinInventory(), createGeneticInventory(), deleteGeneticInventory(), updateGeneticInventory(), updateSireAvailability(), DeleteMutationVariables, InventoryItem, UpdateMutationVariables (+6 more)

### Community 19 - "Form State Hooks"
Cohesion: 0.18
Nodes (13): FormStateOptions, useFormState(), ValidationHook, useFormValidation(), useModalState(), CheckinFormData, CheckinFormOptions, CheckinItem (+5 more)

### Community 20 - "TS Node Config"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 21 - "Tanks Page & Pagination"
Cohesion: 0.36
Nodes (10): useInventoryQuantity(), usePagination(), Tanks(), createTestQueryClient(), renderWithRouter(), useCanisterForm(), useFillForm(), useTankDetails() (+2 more)

### Community 22 - "Tenant Isolation & RLS"
Cohesion: 0.19
Nodes (14): Composite foreign keys including tenant_id, current_tenant_id() SECURITY DEFINER, Prod (Vercel) vs Dev (AWS ECS) environments, tenant_isolation.sql and composite_fks.sql test suites, Migrations 000-007 (dev only), One tenant per user, no roles, Tenant-scoped RLS policies, Post-cutover verification checklist (+6 more)

### Community 23 - "AWS Deploy & Cutover"
Cohesion: 0.22
Nodes (13): Ops scripts (put-supabase-secrets, build-and-push, deploy-infra, destroy-infra), Terraform state in S3 with DynamoDB lock, Supabase secret baked into bundle at build time, Cutover: daltongorham.com to genehub.app, prod.tfvars (per-zone NAT, desired_count 2), PUBLIC_SITE_URL for invitation links, Stripe live-mode webhook, portal and function secrets, create-checkout-session function (+5 more)

### Community 24 - "User Settings"
Cohesion: 0.24
Nodes (11): createUserSettings(), fetchUserSettings(), updateUserSettings(), DashboardWidgets, SaveMutationVariables, SettingsResult, UpdateMutationVariables, UseUserSettingsOptions (+3 more)

### Community 25 - "Dashboard Stats"
Cohesion: 0.21
Nodes (11): fetchCustomerCount(), fetchInventoryCounts(), fetchMedicalInventoryStats(), fetchSireCount(), DashboardOptions, InventoryCounts, MedicalStats, createTestQueryClient() (+3 more)

### Community 26 - "Terraform Ops Scripts"
Cohesion: 0.26
Nodes (11): AWS_REGION, die(), ensure_backend(), _handle_bucket_error(), log(), preflight(), setup_var_file(), tf_init() (+3 more)

### Community 27 - "Inventory Table"
Cohesion: 0.17
Nodes (8): CategoryOption, EditValues, InventoryTable(), InventoryTableProps, MedicalItem, getPageNumbers(), Pagination(), PaginationProps

### Community 28 - "PWA Manifest"
Cohesion: 0.17
Nodes (11): background_color, categories, description, display, icons, name, orientation, screenshots (+3 more)

### Community 29 - "Landing Showcase"
Cohesion: 0.17
Nodes (5): activity, canisters, FEATURES, inventoryRows, supplies

### Community 30 - "Canister & Fill Forms"
Cohesion: 0.21
Nodes (9): CanisterForm(), CanisterFormData, CanisterFormProps, FillForm(), FillFormData, FillFormProps, BasicSireFields(), BasicSireFieldsProps (+1 more)

### Community 31 - "Dashboard Tank Status"
Cohesion: 0.20
Nodes (7): StatCardProps, DashboardTank, TankStatusSectionProps, Dashboard(), useDashboard(), useUserSettings(), Settings()

### Community 32 - "Tank Cards"
Cohesion: 0.31
Nodes (9): fetchInventoryByCanister(), getTitleSizeClass(), TankCard(), TankCardProps, CanisterWithCount, GeneticInventoryItem, TankWithCount, getNitrogenPercentage() (+1 more)

### Community 33 - "Medical Inventory Page"
Cohesion: 0.36
Nodes (8): MedicalInventory(), useMedicalInventoryReport(), createTestQueryClient(), renderWithRouter(), useCategoryForm(), useCategoryList(), useInventoryList(), useUsageLog()

### Community 34 - "Check-in Modal"
Cohesion: 0.18
Nodes (6): CheckinFormData, CheckinItem, CheckinModalProps, OptionItem, SearchableSelectProps, SyntheticChangeEvent

### Community 35 - "Widget Settings Config"
Cohesion: 0.25
Nodes (7): WidgetListItemProps, DefaultSettingsType, ITEMS_PER_PAGE_OPTIONS, SECTION_CONFIG, STAT_CARD_CONFIG, TANK_DISPLAY_COUNT_OPTIONS, WidgetConfig

### Community 36 - "AWS Architecture Decisions"
Cohesion: 0.25
Nodes (9): Abandoned RDS/Cognito/FastAPI path and revival triggers, AWS hosting architecture (Route53, ALB, ECS Fargate, nginx SPA), GeneHub AWS Migration Plan, Isolated data subnet tier (unused, reserved for RDS), Decision: keep Supabase, drop RDS/Cognito/FastAPI, What each layer protects (hostname, JWT, RLS, FKs, frontend), Subdomain-per-tenant model (apex landing page), Wildcard ACM certificate and wildcard Route 53 alias (+1 more)

### Community 37 - "Notifications System"
Cohesion: 0.28
Nodes (9): Notifications not tenant-aware (pg_cron, pg_net, Resend), check-low-nitrogen function, check-low-stock function, Alert cooldown periods, Notifications system (tables, edge functions, cron), periodic-reminder function, pg_cron scheduled jobs, Resend email service (+1 more)

### Community 38 - "Category Mutations"
Cohesion: 0.25
Nodes (7): createCategory(), updateCategory(), ConfirmModalState, useConfirmModal(), CategoryFormData, CategoryFormOptions, initialFormData

### Community 39 - "Inventory Form Fields"
Cohesion: 0.22
Nodes (3): LocationFieldsProps, SexTypeFieldsProps, InventoryFormProps

### Community 40 - "Pre-Cutover Work"
Cohesion: 0.29
Nodes (8): Remaining work before production cutover, Public sire-images bucket with no tenant isolation, Migrate production database via prod-migration.sh, Backup via supabase db dump, migration repair to mark 000 applied, db push --include-all requirement, Migrating production from 000 to 020, Rehearsal against restored production copy

### Community 41 - "Canister Manager"
Cohesion: 0.32
Nodes (6): CanisterItem, CanisterManager(), CanisterManagerProps, TankItem, DraggableItem, useDragReorder()

### Community 42 - "Category List & Tree"
Cohesion: 0.25
Nodes (5): fetchCategories(), SupplyCategory, BreadcrumbItem, CategoryOption, CategoryTreeNode

### Community 43 - "Medical Item Utils"
Cohesion: 0.39
Nodes (7): formatDate(), getExpirationStatus(), getStockPercentage(), getStockStatus(), MedicalItem, InventoryCard(), InventoryCardProps

### Community 44 - "App Entry & PWA"
Cohesion: 0.29
Nodes (3): queryClient, BeforeInstallPromptEvent, registerServiceWorker()

### Community 45 - "Item Detail View"
Cohesion: 0.43
Nodes (6): formatDate(), getExpirationStatus(), getStockStatus(), ItemDetail(), ItemDetailProps, MedicalItem

### Community 46 - "Category Tree UI"
Cohesion: 0.29
Nodes (4): CategoryCounts, CategoryData, CategoryNodeProps, CategoryTreeProps

### Community 47 - "Customer Form"
Cohesion: 0.29
Nodes (4): FieldErrorProps, CustomerForm(), CustomerFormData, CustomerFormProps

### Community 48 - "GeneHub Logo SVG"
Cohesion: 0.33
Nodes (7): Base pair rungs (five horizontal bars, 25% opacity), Double helix mark (two crossing backbones), GeneHub brand (genetics / bioinformatics product), GeneHub Logo (logo.svg), Purple backbone strand (#6e59a6), Rationale: rung endpoints sampled off curves so they land on both strands, Teal backbone strand (#0d8f7c)

### Community 49 - "Prod Migration Script"
Cohesion: 0.57
Nodes (6): confirm(), fail(), log(), restore_deferred(), warn(), prod-migration.sh script

### Community 50 - "DB Restore Script"
Cohesion: 0.33
Nodes (5): main(), NULLABLE_EMPLOYEE_FK_FIELDS, restoreTable(), supabase, TABLES

### Community 51 - "Per-Tenant Branding Rollout"
Cohesion: 0.33
Nodes (6): get_tenant_branding() anon RPC, Per-tenant branding (tenant.ts config module), Loose ends (trial days, test tenants, password rotation, SMTP, PWA icons), frontend index.html (PWA shell), src/main.tsx entry point, PWA manifest and icons

### Community 52 - "Workspace Creation & Stripe"
Cohesion: 0.40
Nodes (6): create_tenant_with_owner(), handle_new_user() trigger, activate_paid_tenant, Comping a workspace (signup_exemptions vs billing_exempt), Tenant created in webhook via activate_paid_tenant, Migration 008 billing (revokes create_tenant_with_owner from anon)

### Community 53 - "Tank Details"
Cohesion: 0.33
Nodes (4): ConsumptionStats, FillHistoryItem, TankData, TankDetailsProps

### Community 54 - "React Query Data Layer"
Cohesion: 0.33
Nodes (6): Form hook factory refactoring proposal, GeneHub Frontend notes (.claude.md), Centralized QUERY_KEYS constants, React Query data layer, useCRUDMutation helper, Dynamic useQueries pattern (canisters per tank)

### Community 55 - "Restock Modal"
Cohesion: 0.33
Nodes (4): QUICK_AMOUNTS, RestockFormData, RestockItem, RestockModalProps

### Community 56 - "Form Validation"
Cohesion: 0.33
Nodes (4): FieldRule, MinMaxRule, RequiredIfRule, ValidationRules

### Community 57 - "Settings Page Tests"
Cohesion: 0.40
Nodes (5): DEFAULT_SETTINGS, createTestQueryClient(), mockNavigate, mockSettings, renderWithRouter()

### Community 58 - "Test Utilities"
Cohesion: 0.60
Nodes (3): createQueryWrapper(), createTestQueryClient(), TestQueryWrapper()

### Community 59 - "Server-side Pagination"
Cohesion: 0.33
Nodes (6): AsyncSearchableSelect component, Client-side pagination (usePagination), Next TODO: server-side pagination for customers, medical inventory, tanks, search_genetic_inventory RPC, Server-side pagination (sires, genetic inventory), Migration 020 drop old search_genetic_inventory overload

### Community 60 - "RCK Genetics Logo"
Cohesion: 0.40
Nodes (6): RCK Genetics brand (bovine genetics and reproduction), Dark-colored logo variant intended for light backgrounds, Circular DNA double-helix emblem in dark gray, RCK Genetics Bovine Reproduction logo (dark variant), Tagline: BOVINE REPRODUCTION, Wordmark: RCK (dark red) GENETICS (charcoal)

### Community 61 - "Inventory Form"
Cohesion: 0.40
Nodes (4): CategoryOption, InventoryFormData, InventoryForm(), InventoryFormProps

### Community 62 - "Category Form"
Cohesion: 0.40
Nodes (4): CategoryForm(), CategoryFormData, CategoryFormProps, CategoryOption

### Community 64 - "DB Backup Script"
Cohesion: 0.50
Nodes (4): exportTable(), main(), supabase, TABLES

### Community 65 - "Storage Backup Script"
Cohesion: 0.60
Nodes (4): downloadFile(), listAllFiles(), main(), supabase

### Community 66 - "Tank Form"
Cohesion: 0.50
Nodes (3): TankForm(), TankFormData, TankFormProps

### Community 68 - "Inventory Type Fields"
Cohesion: 0.50
Nodes (3): searchSires(), InventoryTypeFields(), InventoryTypeFieldsProps

### Community 72 - "App Icon 192"
Cohesion: 0.67
Nodes (4): Multicolor palette (teal, pink/violet, blue, green), DNA double helix motif, GeneHub icon 192x192 (DNA double helix), PWA / app icon purpose (192px)

### Community 73 - "App Icon 512"
Cohesion: 0.67
Nodes (4): Flat multicolor palette (teal, pink, purple, blue, lime, cyan), DNA double helix illustration, GeneHub App Icon (512px DNA double helix), PWA / app icon purpose

### Community 74 - "Migration Rehearsal"
Cohesion: 0.83
Nodes (3): fail(), log(), rehearse-migration.sh script

### Community 75 - "Storage Restore Script"
Cohesion: 0.67
Nodes (3): main(), supabase, walkDir()

## Knowledge Gaps
- **404 isolated node(s):** `target`, `lib`, `module`, `skipLibCheck`, `moduleResolution` (+399 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `tenant` connect `Auth & Sessions` to `Customer API`, `Tenant Branding`, `Widget Settings Config`, `Sire Forms & Modals`, `Inventory Display Utils`, `Genetic Inventory Page`, `Canister & Genetic Fetch`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `QUERY_KEYS` connect `Customer API` to `Tank Cards`, `Activity Log`, `Category Mutations`, `Nitrogen Tank API`, `Category List & Tree`, `Sire & Image Services`, `Medical Inventory API`, `Usage Log & CRUD Hooks`, `Canister & Genetic Fetch`, `Canister Forms & Async`, `Genetic Inventory Mutations`, `Form State Hooks`, `User Settings`, `Dashboard Stats`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `supabase` connect `Sire & Image Services` to `Customer API`, `Tenant Branding`, `Auth & Sessions`, `Billing & Members`, `Nitrogen Tank API`, `Medical Inventory API`, `Canister & Genetic Fetch`, `User Settings`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `target`, `lib`, `module` to the rest of the system?**
  _408 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Customer API` be split into smaller, more focused modules?**
  _Cohesion score 0.052429667519181586 - nodes in this community are weakly interconnected._
- **Should `Tenant Branding` be split into smaller, more focused modules?**
  _Cohesion score 0.05480769230769231 - nodes in this community are weakly interconnected._
- **Should `Auth & Sessions` be split into smaller, more focused modules?**
  _Cohesion score 0.05605499735589635 - nodes in this community are weakly interconnected._