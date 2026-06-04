# Graph Report - GenAI_Capstone-nikhil_3jun  (2026-06-03)

## Corpus Check
- 283 files · ~101,343 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2217 nodes · 8678 edges · 131 communities (114 shown, 17 thin omitted)
- Extraction: 63% EXTRACTED · 37% INFERRED · 0% AMBIGUOUS · INFERRED: 3246 edges (avg confidence: 0.51)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 102|Community 102]]

## God Nodes (most connected - your core abstractions)
1. `User` - 260 edges
2. `UserRole` - 220 edges
3. `Product` - 157 edges
4. `ApiResponse` - 143 edges
5. `Tenant` - 118 edges
6. `PurchaseOrderStatus` - 103 edges
7. `InventoryTransaction` - 91 edges
8. `PurchaseOrder` - 91 edges
9. `cn()` - 87 edges
10. `Warehouse` - 79 edges

## Surprising Connections (you probably didn't know these)
- `ChatRequest` --uses--> `ApiResponse`  [INFERRED]
  backend/app/ai/router.py → /Users/as-mac-1218/Desktop/capston/ims/backend/app/schemas/common.py
- `Request` --uses--> `ApiResponse`  [INFERRED]
  backend/app/ai/router.py → /Users/as-mac-1218/Desktop/capston/ims/backend/app/schemas/common.py
- `Session` --uses--> `ApiResponse`  [INFERRED]
  backend/app/ai/router.py → /Users/as-mac-1218/Desktop/capston/ims/backend/app/schemas/common.py
- `User` --uses--> `ApiResponse`  [INFERRED]
  backend/app/ai/router.py → /Users/as-mac-1218/Desktop/capston/ims/backend/app/schemas/common.py
- `ToolResult` --uses--> `Supplier`  [INFERRED]
  backend/app/ai/tools.py → /Users/as-mac-1218/Desktop/capston/ims/backend/app/models/supplier.py

## Import Cycles
- 1-file cycle: `backend/app/ai/memory.py -> backend/app/ai/memory.py`
- 1-file cycle: `backend/app/main.py -> backend/app/main.py`
- 1-file cycle: `backend/app/ai/service.py -> backend/app/ai/service.py`
- 1-file cycle: `backend/app/ai/tools.py -> backend/app/ai/tools.py`
- 1-file cycle: `backend/app/api/deps.py -> backend/app/api/deps.py`
- 1-file cycle: `/Users/as-mac-1218/Desktop/capston/ims/backend/app/api/v1/routes/__init__.py -> /Users/as-mac-1218/Desktop/capston/ims/backend/app/api/v1/routes/__init__.py`
- 1-file cycle: `backend/app/api/v1/routes/audit.py -> backend/app/api/v1/routes/audit.py`
- 1-file cycle: `backend/app/api/v1/routes/dashboard.py -> backend/app/api/v1/routes/dashboard.py`
- 1-file cycle: `backend/app/api/v1/routes/inventory.py -> backend/app/api/v1/routes/inventory.py`
- 1-file cycle: `backend/app/api/v1/routes/notifications.py -> backend/app/api/v1/routes/notifications.py`
- 1-file cycle: `backend/app/api/v1/routes/procurement.py -> backend/app/api/v1/routes/procurement.py`
- 1-file cycle: `backend/app/api/v1/routes/products.py -> backend/app/api/v1/routes/products.py`
- 1-file cycle: `backend/app/api/v1/routes/super_admin.py -> backend/app/api/v1/routes/super_admin.py`
- 1-file cycle: `backend/app/api/v1/routes/users.py -> backend/app/api/v1/routes/users.py`
- 1-file cycle: `backend/app/api/v1/routes/warehouses.py -> backend/app/api/v1/routes/warehouses.py`
- 1-file cycle: `backend/app/services/dashboard_service.py -> backend/app/services/dashboard_service.py`
- 1-file cycle: `backend/app/services/procurement_service.py -> backend/app/services/procurement_service.py`
- 1-file cycle: `backend/app/services/product_service.py -> backend/app/services/product_service.py`
- 1-file cycle: `backend/app/services/user_service.py -> backend/app/services/user_service.py`
- 1-file cycle: `backend/app/services/audit_service.py -> backend/app/services/audit_service.py`

## Communities (131 total, 17 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (134): AuditLog, str, UUID, ApiResponse, DbSession, LimitQuery, PageQuery, PurchaseOrder (+126 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (85): AuthResponse, ApiResponse, LoginRequest, RegisterRequest, Session, User, bool, str (+77 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (42): ImportType, bool, float, int, Product, Session, str, UUID (+34 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (59): AdminDashboard, AdminTenantDrilldown, AuditorDashboard, Session, UUID, BaseModel, ProcurementDashboard, RetailerDashboard (+51 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (32): ProductBarcode(), ProductBarcodeProps, ProductQrCode(), ProductQrCodeProps, DashboardToggle(), benefits, BenefitsSection(), CtaSection() (+24 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (40): ApiResponse, int, InventoryAdjustmentCreate, InventoryTransactionCreate, Session, str, User, UUID (+32 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (11): int, str, UUID, int, str, UUID, str, ProductScanLog (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (28): Input, listSuppliers(), Supplier, CreatePurchaseOrderModal(), formatCurrency(), getErrorMessage(), PurchaseOrdersPage(), statusLabels (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (37): AuthField, AuthFieldProps, AuthShell(), AuthShellProps, operationCards, progressRows, PasswordField, PasswordFieldProps (+29 more)

### Community 9 - "Community 9"
Cohesion: 0.16
Nodes (43): DbSession, int, Session, str, Tenant, UUID, Session, str (+35 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (47): dependencies, axios, clsx, framer-motion, @hookform/resolvers, jsbarcode, lucide-react, qrcode.react (+39 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (25): productQrPayload(), Button(), TransactionsFilters(), TransactionsFiltersProps, TransactionSortOption, csvEscape(), formatDate(), productLabel() (+17 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (24): FloatingChatButton(), AppShell(), ThemeToggle(), AppLayout(), ContentLayout(), ScrollableContent(), SidebarLayout(), SidebarLayoutProps (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (33): load_recent_history(), save_conversation(), ai_chat(), ChatRequest, ChatResponse, ToolResult, _build_prompt(), chat() (+25 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (31): GuestRoute(), ProtectedLoadingState(), ProtectedRoute(), ProtectedRouteProps, RoleProtectedRoute(), RoleProtectedRouteProps, fetchCurrentUser(), useAuthStore (+23 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (23): ensure_tenant_access(), get_current_user(), require_feature(), require_operational_user(), require_roles(), require_tenant_roles(), Depends, Session (+15 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (25): getLabelSizeOption(), LABEL_SIZE_OPTIONS, LabelSize, LabelSizeOption, PrintableLabels(), PrintableLabelsProps, ProductLabelSheetProps, api (+17 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (22): auditLabel(), formatAuditDate(), logSearchText(), metadataPreview(), statusFromLog(), statusTone(), AuditDetailsDrawer(), AuditFilters() (+14 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (31): approvePurchaseOrder(), cancelPurchaseOrder(), createPurchaseOrder(), createSupplier(), deleteSupplier(), getPurchaseOrder(), getPurchaseOrderAnalytics(), getSupplierProfile() (+23 more)

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (31): bool, ApiResponse, DbSession, StockTransfer, StockTransferCreate, str, UUID, Warehouse (+23 more)

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (30): DialogContext, DialogContextType, DialogOptions, DialogProvider(), useDialog(), AuditLogItem, deleteSupportRequest(), deleteTenant() (+22 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (19): ApiResponse, DbSession, bool, datetime, str, Session, str, Tenant (+11 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (14): ApiResponse, int, Session, User, UUID, int, User, UUID (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (23): UserRole, createUser(), deleteUser(), listUsersPage(), ManagedUser, updateUser(), UserCreate, UserQuery (+15 more)

### Community 24 - "Community 24"
Cohesion: 0.07
Nodes (29): Audit and Approvals, Auditor, Authentication and Account Management, Backend, Backend API Areas, Core Features, Current Product Positioning, Dashboard (+21 more)

### Community 25 - "Community 25"
Cohesion: 0.17
Nodes (11): UUID, bool, int, Session, str, User, UserCreate, UserRole (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.35
Nodes (25): can_use_tool(), permissions_for_role(), _denied(), _ensure_tenant(), get_absolute_minimum_stock(), get_dashboard_metrics(), get_inventory_summary(), get_inventory_transactions() (+17 more)

### Community 27 - "Community 27"
Cohesion: 0.09
Nodes (20): AIDashboard(), AlertItem, badgeClass, buildRecommendations(), cardVariants, ChartPoint, clamp(), distributionColors (+12 more)

### Community 28 - "Community 28"
Cohesion: 0.08
Nodes (25): 1. Backend Code, 2. Configuration Files, 3. Documentation, AI Assistant button not responding, "AI is not configured: GEMINI_API_KEY is missing", Cost Savings, Files Modified, Frontend Changes (+17 more)

### Community 29 - "Community 29"
Cohesion: 0.28
Nodes (21): AUDITOR, ApiResponse, DbSession, Depends, User, UUID, UserRole, get_current_user (+13 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (23): AdminTenantDrilldown, AuditorActiveUser, AuditorDashboard, AuditorFlag, AuditorWarehouseActivity, CategoryStat, getAdminDashboard(), getProcurementDashboard() (+15 more)

### Community 31 - "Community 31"
Cohesion: 0.13
Nodes (14): ChatDrawer(), ChatSessionSummary, createEmptySession(), newId(), ChatHeader(), ChatInput(), ChatMessage, MessageBubble() (+6 more)

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (20): bool, DbSession, float, int, ProductCreate, ProductUpdate, str, User (+12 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (18): ClassicDashboard(), AdminDashboard, getAuditorDashboard(), SupplierActivity, AdminDashboardView(), buildInventoryValueData(), buildLowStockData(), buildMovementTrend() (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (19): ActiveQuery, ApiResponse, DbSession, LimitQuery, PageQuery, SearchQuery, User, UserCreate (+11 more)

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (19): ApiResponse, bool, DbSession, int, str, SubscriptionPayment, Response, RetailerAdmin (+11 more)

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (15): DashboardSkeleton(), DashboardPage(), panelVariants, rowVariants, sparklineData, useAIBrief(), DemandTrendItem, useDemandTrends() (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (17): adjustInventory(), InventoryHistoryQuery, InventoryMovementPayload, InventoryTransaction, InventoryTransactionType, listInventoryHistory(), ProductScan, scanProduct() (+9 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+10 more)

### Community 39 - "Community 39"
Cohesion: 0.10
Nodes (19): 1. Get Gemini API Key, 2. Update Your .env File, 3. Install New Dependencies, 4. Restart Backend, 5. Test AI Assistant, API Differences, Available Gemini Models, Backend Changes (+11 more)

### Community 40 - "Community 40"
Cohesion: 0.25
Nodes (17): DashboardPage(), canAccessRoute(), canManageApprovals(), canManageInventory(), canManageProcurement(), canManageProducts(), canManageTenants(), canManageUsers() (+9 more)

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (16): apiErrorMessage(), approveStockTransfer(), assignWarehouseInventory(), cancelStockTransfer(), completeStockTransfer(), createStockTransfer(), createWarehouse(), listStockTransfers() (+8 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (7): bool, str, BaseSettings, backend_cors_origins(), get_settings(), Settings, smtp_configured()

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (16): Approver, AuditReader, ApiResponse, DbSession, int, StockAdjustmentRequestCreate, User, UUID (+8 more)

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (15): datetime, Product, Session, str, Tenant, User, UserRole, add_log() (+7 more)

### Community 45 - "Community 45"
Cohesion: 0.12
Nodes (15): code:text (inventory-management-system/), code:bash (cd frontend), code:bash (createdb ims), code:bash (cp backend/.env.example backend/.env), code:bash (cp frontend/.env.example frontend/.env), code:bash (cd backend), code:bash (cd frontend), code:bash (cp .env.example .env) (+7 more)

### Community 46 - "Community 46"
Cohesion: 0.20
Nodes (13): applyImport(), csvForm(), DuplicateStrategy, ImportApplyResult, ImportErrorItem, ImportPreview, ImportTemplate, ImportType (+5 more)

### Community 47 - "Community 47"
Cohesion: 0.17
Nodes (10): ActivityFeedItem, deleteNotification(), listActivityFeed(), listNotifications(), markNotificationRead(), NotificationItem, ActivityFeedPanel(), iconByGroup (+2 more)

### Community 48 - "Community 48"
Cohesion: 0.18
Nodes (3): create_app(), seed_subscription_plans(), FastAPI

### Community 49 - "Community 49"
Cohesion: 0.20
Nodes (11): loadRazorpayCheckout(), Window, createRazorpayOrder(), getPlans(), PlanCode, RazorpayOrderResponse, SubscriptionPlanItem, verifyRazorpayPayment() (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.14
Nodes (13): 1️⃣ Get API Key, 2️⃣ Add to .env, 3️⃣ Install & Run, 4️⃣ Test, Cost, Files Created for You, Files You Need to Check, Or Use Automated Setup (+5 more)

### Community 51 - "Community 51"
Cohesion: 0.29
Nodes (9): CHART_COLORS, ChartDatum, ChartShell(), ChartTooltip(), DonutChartCard(), HorizontalBarChartCard(), LineChartCard(), MovementTrendChart() (+1 more)

### Community 52 - "Community 52"
Cohesion: 0.33
Nodes (9): Any, int, Session, str, Tenant, build_generated_products(), get_or_create_tenant(), main() (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.24
Nodes (6): tabs, InventoryOverviewChart(), Props, mock, MonthlyMovementChart(), Props

### Community 54 - "Community 54"
Cohesion: 0.20
Nodes (9): Docker Setup, GENAI_CAPstone, GENAI_CAPstone, gensai_codebackeup, gensai_codebackeup, Local Setup, Manual Development Commands, Multi-Tenant Inventory Management System (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (8): emit(), messages, Subscriber, subscribers, toast, ToastMessage, ToastTone, toneClass

### Community 56 - "Community 56"
Cohesion: 0.31
Nodes (7): AIAssistantWidget(), ChatResponse, FormValues, schema, ChatMessage, DashboardStore, useDashboardStore

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 58 - "Community 58"
Cohesion: 0.36
Nodes (6): Session, str, database_health_check(), health_check(), Session, str

### Community 59 - "Community 59"
Cohesion: 0.54
Nodes (5): applyTheme(), getStoredTheme(), initializeTheme(), ThemeMode, toggleTheme()

### Community 60 - "Community 60"
Cohesion: 0.46
Nodes (6): ActivityTrend, getAdminTenantDrilldown(), ActivityTrendBars(), formatDate(), StatCard(), TenantDrilldownPage()

### Community 61 - "Community 61"
Cohesion: 0.25
Nodes (6): check_dependencies(), check_env(), Check if .env file has required variables., Check if google-generativeai is installed., Test Gemini API connection., test_api_connection()

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (6): AIPrioritiesPanel(), itemVariants, listVariants, priorities, PriorityItem, priorityStyles

### Community 63 - "Community 63"
Cohesion: 0.40
Nodes (3): Session, get_db(), Session

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (4): ActionItem, actions, badgeStyles, RecommendedActions()

### Community 67 - "Community 67"
Cohesion: 0.40
Nodes (4): badgeStyles, RecommendationItem, recommendations, SmartReorderPanel()

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (4): riskStyles, SupplierHealthItem, SupplierHealthPanel(), suppliers

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (4): KPIItem, KPIResponse, SparklineDatum, useKPIs()

### Community 75 - "Community 75"
Cohesion: 0.50
Nodes (3): AIBriefItem, AIDailyBrief(), insights

### Community 76 - "Community 76"
Cohesion: 0.50
Nodes (3): DemandTrendItem, DemandTrendsPanel(), trends

### Community 77 - "Community 77"
Cohesion: 0.50
Nodes (3): data, InventoryRiskChart(), RiskSegment

### Community 78 - "Community 78"
Cohesion: 0.50
Nodes (3): KPICard(), KPICardProps, trendMeta

## Knowledge Gaps
- **280 isolated node(s):** `Session`, `bool`, `bool`, `Any`, `Session` (+275 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Community 21` to `Community 0`, `Community 1`, `Community 34`, `Community 2`, `Community 32`, `Community 5`, `Community 35`, `Community 6`, `Community 9`, `Community 43`, `Community 44`, `Community 13`, `Community 15`, `Community 19`, `Community 22`, `Community 25`, `Community 26`, `Community 29`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `Product` connect `Community 0` to `Community 32`, `Community 2`, `Community 5`, `Community 6`, `Community 9`, `Community 43`, `Community 44`, `Community 52`, `Community 22`, `Community 26`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `UserRole` connect `Community 29` to `Community 0`, `Community 32`, `Community 34`, `Community 2`, `Community 35`, `Community 5`, `Community 1`, `Community 3`, `Community 9`, `Community 43`, `Community 44`, `Community 15`, `Community 19`, `Community 21`, `Community 22`, `Community 25`, `Community 26`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 249 inferred relationships involving `User` (e.g. with `ActiveQuery` and `Approver`) actually correct?**
  _`User` has 249 INFERRED edges - model-reasoned connections that need verification._
- **Are the 217 inferred relationships involving `UserRole` (e.g. with `ActiveQuery` and `Approver`) actually correct?**
  _`UserRole` has 217 INFERRED edges - model-reasoned connections that need verification._
- **Are the 155 inferred relationships involving `Product` (e.g. with `AuditLog` and `Session`) actually correct?**
  _`Product` has 155 INFERRED edges - model-reasoned connections that need verification._
- **Are the 140 inferred relationships involving `ApiResponse` (e.g. with `ActiveQuery` and `Approver`) actually correct?**
  _`ApiResponse` has 140 INFERRED edges - model-reasoned connections that need verification._