# User Stories: Analytix BI Platform

This document outlines 60 detailed, user-experience (UX) focused user stories (20 for each key user persona: **Power BI Developers**, **Data Analysts**, and **Business Customers**) as the platform scales to 1,000+ active users.

---

## 1. Power BI Developers (Advanced Creators)

Power BI developers focus on data modeling, pixel-perfect UI/UX layouts, complex calculations, and governance.

### Story PBI-1: Pixel-Perfect Grid Snap & Snapping Guides
* **As a** Power BI Developer  
  **I want** a canvas with snapping rules, align-lines, and adjustable row-height or margin metrics  
  **So that** I can design highly structured, professional dashboards matching strict brand grids.
* **Acceptance Criteria**:
  - Horizontal/vertical alignment lines display dynamically when dragging widgets.
  - Controls to adjust row heights (40px to 150px) and margins (0px to 30px).
  - High-precision Snap-to-Grid toggle matches 12-column layouts.

### Story PBI-2: Theme Builder & Custom Styling Templates (JSON)
* **As a** Power BI Developer  
  **I want** to upload custom JSON themes or customize branding elements in a Theme panel  
  **So that** I can instantly apply the company's styles across all widgets.
* **Acceptance Criteria**:
  - Interactive selection of pre-made themes (Slate & Gold, Emerald Forest, Royal Indigo).
  - Ability to export/import the current dashboard theme as a `.json` configuration file.
  - Visual theme builder controls for primary/secondary colors and border-radius.

### Story PBI-3: Dynamic Calculated Fields & Formula Editor
* **As a** Power BI Developer  
  **I want** a formula editor with auto-completion and basic functions (e.g. `SUM`, `AVG`, math arithmetic)  
  **So that** I can create new fields directly on the frontend.
* **Acceptance Criteria**:
  - Auto-complete dropdown suggests available columns and mathematical operators.
  - Syntax highlighting for formulas in the widget editor.
  - Ability to specify a custom label/alias for the calculated field.

### Story PBI-4: Row-Level Security (RLS) & Group Governance
* **As a** Power BI Developer  
  **I want** to specify conditional filters associated with specific roles (e.g., `Region = 'Europe'`)  
  **So that** viewers only see metrics they are authorized to access.
* **Acceptance Criteria**:
  - User role dropdown selector ("North America Sales", "EU Sales") in preview mode.
  - Injects RLS filter arguments into the backend query payload.
  - Prevents data leakage by validating role contexts on server endpoints.

### Story PBI-5: Version Control & Git Integration Checkpoints
* **As a** Power BI Developer  
  **I want** to save checkpoint versions of the dashboard configuration schemas  
  **So that** I can track design changes and roll back to previous layouts.
* **Acceptance Criteria**:
  - Checkpoint manager list displaying timestamp, author, and commit message.
  - Single-click restore action that updates the active canvas layout structure.
  - Visual indicator showing differences between the current workspace and the selected checkpoint.

### Story PBI-6: Custom Visualization SDK Support
* **As a** Power BI Developer  
  **I want** to write custom HTML/JS code inside widgets to render customized graphics  
  **So that** I can design specialized visualizations not available in standard libraries.
* **Acceptance Criteria**:
  - HTML/JS code editor panel inside the widget settings.
  - Sandboxed iframe rendering to isolate scripts from the parent app frame.
  - Exposes the widget's query results directly to the custom execution scope.

### Story PBI-7: Visual Schema Relationship Builder
* **As a** Power BI Developer  
  **I want** to view table dependencies and drag links between columns to join datasets  
  **So that** I can design dashboards across multiple source schemas without writing SQL joins.
* **Acceptance Criteria**:
  - Interactive graph displaying tables, fields, and connections.
  - Dragging from one column to another creates a link (One-to-Many, Many-to-Many).
  - Auto-generates the corresponding join query rules when rendering dashboard widgets.

### Story PBI-8: Parameterized Query Bindings & Input Controls
* **As a** Power BI Developer  
  **I want** to specify parameters in SQL queries (e.g. `{{start_date}}`) and link them to input boxes  
  **So that** dashboard viewers can run custom parameters against the database.
* **Acceptance Criteria**:
  - Define custom parameter keys in the query editor.
  - Bind parameters to text inputs, date range selectors, or slider inputs on the canvas.
  - Dynamically runs queries on parameter changes.

### Story PBI-9: Dashboard Performance Diagnostics Profiler
* **As a** Power BI Developer  
  **I want** to inspect execution durations and payload sizes for all queries on the canvas  
  **So that** I can identify bottlenecks and optimize widget layouts.
* **Acceptance Criteria**:
  - Side diagnostics panel listing query time, rendering time, and API response sizes.
  - Flags widgets with red/orange indicators if execution time exceeds 2 seconds.
  - Details URL payloads and SQL commands run.

### Story PBI-10: Interactive Action Trigger Builder
* **As a** Power BI Developer  
  **I want** to bind custom click actions to widgets (e.g. navigation, alerts, custom URLs)  
  **So that** viewers can navigate through report sections by interacting with the charts.
* **Acceptance Criteria**:
  - Action selector dropdown inside widget properties: URL, Toast, Alert, Page Navigation.
  - Input field to define targets (e.g., target page tab or target external URL).
  - Executed on cell/slice clicks.

### Story PBI-11: Calculated Columns Data Cleanse Wizard
* **As a** Power BI Developer  
  **I want** a step-by-step visual data cleaning wizard to filter nulls and modify data types  
  **So that** raw data is cleaned before building charts.
* **Acceptance Criteria**:
  - Pipeline UI showing applied transformation steps (e.g. "Replace Nulls", "Multiply Column").
  - Live data preview showing effects of the transformation steps.
  - Generates Python Pandas script snippets representing the visual steps.

### Story PBI-12: Cache Expiration Time-to-Live (TTL)
* **As a** Power BI Developer  
  **I want** to set custom cache expiration durations per widget (e.g. 5m for sales, 24h for summaries)  
  **So that** dashboard performance is balanced against data freshness.
* **Acceptance Criteria**:
  - Cache TTL slider (0 to 1440 minutes) in widget configuration.
  - Displays "Cached (Xm)" indicator on the widget when viewing cached data.
  - Developers can force cache invalidation per widget.

### Story PBI-13: Layer Tree Z-Index Panel
* **As a** Power BI Developer  
  **I want** a layer panel displaying all widgets in the workspace (similar to Figma layers)  
  **So that** I can easily toggle visibility, lock positions, and adjust z-index layering.
* **Acceptance Criteria**:
  - Interactive layer tree showing list items from top to bottom.
  - Toggle visibility and edit-locks directly on layer rows.
  - Drag items up/down to adjust z-index arrangement.

### Story PBI-14: Custom Interactive Tooltip Layouts
* **As a** Power BI Developer  
  **I want** to build custom mini-templates for tooltips (e.g., showing a miniature sparkline or key-value pairs)  
  **So that** users get maximum context when hovering over charts.
* **Acceptance Criteria**:
  - Tooltip designer panel supporting text formatting and secondary measure selection.
  - Option to embed miniature sparklines inside the tooltip container.
  - Renders tooltips on chart segment hover.

### Story PBI-15: Conditional Rule Color Highlighter
* **As a** Power BI Developer  
  **I want** to set complex conditional formatting rules (e.g. color cells red if percentage change < -5%)  
  **So that** critical metrics stand out instantly to business users.
* **Acceptance Criteria**:
  - Rules manager panel in widget settings to add multiple conditional rules.
  - Supports operators: `greater_than`, `less_than`, `equals`.
  - Dynamically updates text or background color in cards and tables.

### Story PBI-16: Navigation Builder & Report Tabs
* **As a** Power BI Developer  
  **I want** to build custom navigation menus (tabs, dropdown lists, next/back buttons)  
  **So that** multi-page reports look like cohesive apps.
* **Acceptance Criteria**:
  - Tab navigator at the bottom of the canvas to switch active pages.
  - Page links can be placed anywhere on the canvas.
  - Supports naming and rearranging pages.

### Story PBI-17: Reusable Widget Library Presets
* **As a** Power BI Developer  
  **I want** to save customized widget styles as presets  
  **So that** other developers can reuse the styles and configurations across different reports.
* **Acceptance Criteria**:
  - "Save to Shared Library" button in widget settings.
  - Preset library manager accessible from the dashboard builder sidebar.
  - Applying presets copies visualization settings while retaining dataset queries.

### Story PBI-18: Bulk Connection Relinker
* **As a** Power BI Developer  
  **I want** to switch the data source reference across all widgets in a dashboard simultaneously  
  **So that** I can migrate dashboards from development environments to staging and production safely.
* **Acceptance Criteria**:
  - Bulk remapper panel displaying source dataset and a dropdown selector for target datasets.
  - Runs validation tests to verify compatibility of columns and schemas.
  - Updates all widget datasets in the active dashboard in a single click.

### Story PBI-19: Canvas Responsive Layout Designer
* **As a** Power BI Developer  
  **I want** to customize layouts for mobile, tablet, and desktop screens separately  
  **So that** I can ensure optimal layout configurations across all screen sizes.
* **Acceptance Criteria**:
  - Responsive breakpoint toggles in the builder header.
  - Editing layout at one breakpoint does not break arrangements at other breakpoints.
  - Viewports automatically match the active device simulation size.

### Story PBI-20: Audit Logs for Widget Configs
* **As a** Power BI Developer  
  **I want** to inspect a change log detailing who edited widget configurations  
  **So that** I can coordinate design updates with other workspace collaborators.
* **Acceptance Criteria**:
  - History panel displaying list of configurations, user identity, and change summaries.
  - Tracks visual updates, queries modified, and deletions.
  - Supports rollbacks to specific configuration revisions.

---

## 2. Data Analysts (Insight Explorers)

Data Analysts are responsible for deep data exploration, statistical analysis, preparing reports, and sharing automated insights.

### Story ANA-1: Interactive Cross-Filtering & Drills
* **As a** Data Analyst  
  **I want** clicking a segment of a chart to filter all other visualizations on the canvas  
  **So that** I can perform root-cause analysis without writing custom SQL queries.
* **Acceptance Criteria**:
  - Selecting a chart data segment emits a filter event that recalculates other widgets.
  - Visual indicator showing active cross-filters, with a "Clear Filters" action.
  - Preserves user filter selections during dashboard navigation.

### Story ANA-2: Automated Threshold Alerts & Webhook integrations
* **As a** Data Analyst  
  **I want** to set custom threshold alerts with notifications sent to Email, Slack, or Teams  
  **So that** key business stakeholders can respond instantly to critical anomalies.
* **Acceptance Criteria**:
  - Alert creation UI: select widget, select metric, define condition (`>`, `<`, `=`), and trigger value.
  - Supports Slack webhook configurations.
  - Periodic background evaluation scans database targets and alerts users.

### Story ANA-3: Tabular Raw Data Inspect Panel
* **As a** Data Analyst  
  **I want** to toggle a clean raw data preview underneath any visual widget  
  **So that** I can inspect row-level metrics and export data to CSV.
* **Acceptance Criteria**:
  - "Inspect Raw Data" modal button on the widget toolbar.
  - Table preview matching column definitions.
  - Export action downloads data in `.csv` format.

### Story ANA-4: AI-Powered Trend Projection (Forecasting)
* **As a** Data Analyst  
  **I want** to toggle a "Forecasting" option on line charts and visually configure projection parameters  
  **So that** I can project future performance trends instantly.
* **Acceptance Criteria**:
  - Shaded projection bands showing upper/lower bounds on line charts.
  - Future dates are plotted dynamically past the active dataset's terminal date.
  - Configurations to specify the prediction interval and season cycles.

### Story ANA-5: Statistical Distribution Analyzer
* **As a** Data Analyst  
  **I want** to generate linear regression lines, distribution histograms, and box plots on datasets  
  **So that** I can run advanced descriptive and diagnostic statistics on our analytics.
* **Acceptance Criteria**:
  - Toggle switch in settings to render median, average, and regression reference lines.
  - Histogram and Boxplot widgets support.
  - Computes and displays statistical metadata (variance, standard deviations).

### Story ANA-6: Visual Table Joins (Merge Wizard)
* **As a** Data Analyst  
  **I want** to combine separate datasets visually (e.g. blending CSV files with live SQL queries)  
  **So that** I can construct unified records without writing backend code.
* **Acceptance Criteria**:
  - Interactive join selector: select left table, right table, keys, and join type (Inner, Left, Right, Full).
  - Preview window displaying combined columns.
  - Combined dataset can be used to feed standard widgets.

### Story ANA-7: Python Notebook Script Generator
* **As a** Data Analyst  
  **I want** to export visual data prep sequences directly into a Python Pandas script  
  **So that** I can run my transformations in external Jupyter notebooks.
* **Acceptance Criteria**:
  - "Generate Python Snippet" button inside the dataset transformation panel.
  - Formats data prep steps (null replacement, calculations) to syntax-correct pandas statements.
  - Simple copy-to-clipboard action.

### Story ANA-8: Fuzzy Search Autocomplete Filters
* **As a** Data Analyst  
  **I want** dashboard filter dropdowns to support typing and fuzzy autocomplete search matching  
  **So that** filtering through large dimensional datasets (like millions of client names) is fast.
* **Acceptance Criteria**:
  - Search input box in filters loads suggestions asynchronously as user types.
  - Multi-select support with search refinement checks.
  - Handles lists of up to 100,000 distinct values without lagging.

### Story ANA-9: Historical Period Comparison (Delta Analytics)
* **As a** Data Analyst  
  **I want** to compare dashboard metrics to a historical point in time  
  **So that** I can perform delta analysis and identify trends.
* **Acceptance Criteria**:
  - Date baseline picker to define comparison points (e.g., Prior Year, Custom Date).
  - Automatically calculates percentage differences.
  - Renders red/green indicator symbols (▲/▼) beside metrics.

### Story ANA-10: Column Health Profiler
* **As a** Data Analyst  
  **I want** to view data profiling statistics (null count, unique values, averages, standard deviation) for any dataset  
  **So that** I can evaluate data quality before drawing conclusions.
* **Acceptance Criteria**:
  - Profiling pane displaying data quality statistics in a spreadsheet grid.
  - Highlights empty values, outliers, and type conflicts.
  - Displays mini frequency histograms per column.

### Story ANA-11: Interactive Chart Type Switcher
* **As a** Data Analyst  
  **I want** to switch a rendered widget between Line, Bar, Scatter, or Table views directly while viewing  
  **So that** I can explore the same dataset from different visual angles without editing the report.
* **Acceptance Criteria**:
  - Mini toolbar on widgets containing chart icon buttons (visible to users).
  - Instantly toggles chart type without resetting active query filters.
  - Retains visual styles like palettes and labels where possible.

### Story ANA-12: Relative Date Slicer Presets
* **As a** Data Analyst  
  **I want** date filters to support dynamic relative definitions (e.g., "Last 14 days", "Year-to-Date")  
  **So that** dashboards remain continuously updated relative to the calendar date.
* **Acceptance Criteria**:
  - Preset select list: Last 30 days, YTD, MTD, Custom range.
  - Computes exact dates relative to system time.
  - Preserves selections inside share links.

### Story ANA-13: Scatter Plot Lasso Clustering
* **As a** Data Analyst  
  **I want** to drag a selection box over multiple points in a scatter plot to group them  
  **So that** I can study visual clusters dynamically.
* **Acceptance Criteria**:
  - Drag-select tool (Rectangle, Lasso) in scatter plots.
  - Highlights selected points and generates a filter query matching the selected boundaries.
  - Updates other widgets to only show data for the selected clusters.

### Story ANA-14: Collaborative Data Comment Threads
* **As a** Data Analyst  
  **I want** to attach comment threads to specific data points or charts on the dashboard  
  **So that** we can document explanation notes for outliers directly in context.
* **Acceptance Criteria**:
  - Select "Add Annotation" on hover context menus.
  - Notification sent to tagged users using `@mentions`.
  - Comment marker icons rendered next to annotated points.

### Story ANA-15: Weighted Metric Builder
* **As a** Data Analyst  
  **I want** a wizard to define weights for multiple indicators to compile a single score  
  **So that** I can create complex indexes like "Customer Health Index".
* **Acceptance Criteria**:
  - Weighted metrics setup panel: select metrics, assign percentage weights (totaling 100%), and input mathematical limits.
  - Outputs a calculated field containing the compound score.
  - Visual gauge widget displays the result.

### Story ANA-16: Dataset Schema Evolution Alert
* **As a** Data Analyst  
  **I want** to receive alerts if source database tables or file schemas change  
  **So that** I can correct broken widget configurations before they disrupt business dashboards.
* **Acceptance Criteria**:
  - System checks source table definitions on data refresh.
  - Displays alert banner if columns are deleted, renamed, or mismatch type formats.
  - Lists affected widgets and query items.

### Story ANA-17: Export Scheduler & Email Dispatcher
* **As a** Data Analyst  
  **I want** to schedule PDF exports of reports and email them to target user lists automatically  
  **So that** reporting schedules are automated.
* **Acceptance Criteria**:
  - Scheduling UI: define frequency (daily, weekly, monthly), delivery time, and emails list.
  - Exports correct layout matching active parameter selections.
  - Delivers reports via backend email dispatchers.

### Story ANA-18: Cohort Analysis Grid Builder
* **As a** Data Analyst  
  **I want** to build cohort grids that track customer retention rate over time  
  **So that** I can study business retention cycles.
* **Acceptance Criteria**:
  - Cohort table widget that groups users by registration date and tracks activity periods.
  - Renders heatmaps showing high/low retention zones.
  - Supports customization of grouping intervals (days, weeks, months).

### Story ANA-19: Smart KPI Outlier Alerts
* **As a** Data Analyst  
  **I want** the system to alert me if metrics change significantly compared to preceding periods  
  **So that** I can quickly investigate unexpected market drops or spikes.
* **Acceptance Criteria**:
  - Automatically compares current values against baseline averages.
  - Generates alert cards if values deviate by more than 2 standard deviations.
  - Links notifications directly to the source anomaly.

### Story ANA-20: Cross-Database Data Union Wizard
* **As a** Data Analyst  
  **I want** to combine datasets from separate adapters (e.g. SQLite and PostgreSQL)  
  **So that** I can perform cross-system reporting in a single view.
* **Acceptance Criteria**:
  - Schema mapping wizard to align target columns.
  - Executes queries across active database adapters.
  - Outputs unified records compatible with all chart widgets.

---

## 3. Business Customers (Decision Makers / Consumers)

Customers consume the insights to drive decisions, present results to stakeholders, and keep track of business performance.

### Story CUST-1: Mobile-First App Layout Stacking
* **As a** Business Customer  
  **I want** dashboards to dynamically stack into a single column on mobile browsers  
  **So that** I can monitor business performance on the go.
* **Acceptance Criteria**:
  - Screen viewport widths below 768px stack widgets vertically in a single-column layout.
  - Tooltips and filter select lists are optimized for touch interaction.
  - Swiping gestures navigation to flip tabs.

### Story CUST-2: Headless PDF Report Subscriptions
* **As a** Business Customer  
  **I want** to subscribe to a dashboard and receive a PDF version in my inbox every Monday morning  
  **So that** I can review performance metrics before starting my weekly planning meetings.
* **Acceptance Criteria**:
  - Subscription toggle option in the dashboard header.
  - Backend task renders the dashboard PDF using a headless browser engine at the scheduled time.
  - Emails the PDF report to the user list.

### Story CUST-3: Passcode Secure Share URLs
* **As a** Business Customer  
  **I want** to generate secure, passcode-protected share links or embed codes for dashboards  
  **So that** I can share insights with external clients and partners safely.
* **Acceptance Criteria**:
  - Share modal: generate secure link, specify expiration date, and set access passcode.
  - Redirects viewers to a login validation page if passcode restrictions are active.
  - Prevents clickjacking by configuring secure frame parameters.

### Story CUST-4: Custom View Filters Bookmarking
* **As a** Business Customer  
  **I want** to save my current set of filtered selections as a personal "Bookmark"  
  **So that** I do not have to re-select region, country, and product categories every time I open the dashboard.
* **Acceptance Criteria**:
  - "Save Bookmark" modal option in widget headers.
  - Bookmark lists are private and accessible via dropdown selectors.
  - Sets bookmark values as the default dashboard view on launch.

### Story CUST-5: Fuzzy Search Unified Dashboard Hub
* **As a** Business Customer  
  **I want** a unified search bar on the homepage that searches across dashboard titles and descriptions  
  **So that** I can find the report I need in seconds.
* **Acceptance Criteria**:
  - Auto-suggest search field on the homepage dashboard list.
  - Filters matching titles, tags, owners, and descriptions.
  - Instant navigation to target report page on selection.

### Story CUST-6: Natural Language Ask AI Bar (NLG)
* **As a** Business Customer  
  **I want** to type questions in plain English (e.g. "show sales by category") and get an instant chart answer  
  **So that** I can extract data without learning how to build charts.
* **Acceptance Criteria**:
  - AI prompt bar in the dashboard header.
  - Generates text answers along with appropriate bar/line/pie charts.
  - Handles parsing queries without requiring complex technical parameters.

### Story CUST-7: Headless Vector Image Exports
* **As a** Business Customer  
  **I want** exported PDF reports to display the active filters and export timestamp in the footer  
  **So that** the document is properly cataloged when printed or shared.
* **Acceptance Criteria**:
  - Vector PDF engine captures the exact canvas state.
  - Appends active filter names, export times, and user identifiers to PDF page footers.
  - Optimized file layout sizing for standard printing.

### Story CUST-8: Dark Mode Premium Switcher
* **As a** Business Customer  
  **I want** a simple theme toggle to transition the application between light and dark modes  
  **So that** I can view dashboards comfortably in dark environments.
* **Acceptance Criteria**:
  - Header switcher button (Sun/Moon icons) with instant transition animations.
  - Updates CSS styling parameters globally.
  - Saves theme preferences to the user profile.

### Story CUST-9: Interactive Glossary Highlights
* **As a** Business Customer  
  **I want** to hover over dashboard terms (e.g. "Churn Rate", "MRR") and see their official corporate definition  
  **So that** I interpret metrics accurately according to company vocabulary.
* **Acceptance Criteria**:
  - Renders dashed underlines under registered terms in widget titles.
  - Hovering displays tooltips with details from the official terminology database.
  - Glossary editor allows admins to configure definitions.

### Story CUST-10: Personal Workspace Strip
* **As a** Business Customer  
  **I want** to select up to 5 critical KPI cards to pin at the very top of my homepage  
  **So that** I immediately see our baseline statistics without opening multiple folders.
* **Acceptance Criteria**:
  - Select "Pin to Homepage" in KPI card settings.
  - Displays pinned metrics on login homepage.
  - Shows positive/negative trend colors and percentage deltas.

### Story CUST-11: Offline Snapshots Viewer (PWA)
* **As a** Business Customer  
  **I want** the app to cache dashboard pages locally when I'm active  
  **So that** I can view report figures even when offline or in transit.
* **Acceptance Criteria**:
  - Service worker caching mechanism.
  - Renders offline banner: "Viewing offline data snapshot."
  - Displays cached layout snapshots if internet access is offline.

### Story CUST-12: Presentation Mode Auto-Refresh
* **As a** Business Customer  
  **I want** to enable a "Presentation Mode" with auto-reload (every 1 to 60 minutes)  
  **So that** our teams can track live metrics throughout the day on smart TV displays.
* **Acceptance Criteria**:
  - Presentation mode action hides browser and navigation bars.
  - Auto-refresh timer triggers query calls in the background.
  - Ensures seamless transitions without flashing loading pages.

### Story CUST-13: Multi-Tenant Org Workspace Switcher
* **As a** Business Customer  
  **I want** to switch between different company workspaces using a simple dropdown in the header  
  **So that** I can review metrics for multiple subsidiary companies.
* **Acceptance Criteria**:
  - Workspace dropdown menu in the header lists all tenant groups.
  - Swapping workspaces reloads permissions and dashboard lists.
  - Prevents data leakage between tenant groups.

### Story CUST-14: Collaborative Feedback Inbox
* **As a** Business Customer  
  **I want** a direct "Provide Feedback" option on every dashboard to send requests or flag questions directly to the author  
  **So that** we can improve data models collaboratively.
* **Acceptance Criteria**:
  - "Submit Feedback" button opens a message modal.
  - Forwards comments, dashboard URL, and active filter selections to the author.
  - Notifies authors via email and visual notifications stream.

### Story CUST-15: Single Sign-On Authentication (OIDC/SAML)
* **As a** Business Customer  
  **I want** to log in to the Analytix platform using my company identity provider (Okta, Azure AD, or Google Workspace)  
  **So that** I don't have to manage another set of credentials.
* **Acceptance Criteria**:
  - "Continue with SSO" buttons on the login screen.
  - Integrates authentication with Okta, Google Workspace, and Azure AD.
  - Auto-creates accounts mapped to corresponding tenant organizations.

### Story CUST-16: Self-Service Privacy Export Portal
* **As a** Business Customer  
  **I want** a privacy settings panel where I can request account deletion or export my dashboard actions logs  
  **So that** my data is managed in compliance with GDPR standards.
* **Acceptance Criteria**:
  - Self-service portal in user profile to trigger account archive exports.
  - Deletion request button logs ticket actions and purges records in database.
  - Logs user activities for privacy validation tracking.

### Story CUST-17: Slack App Chatbot Search
* **As a** Business Customer  
  **I want** a Slack slash command (e.g., `/analytix get revenue`) that posts the KPI card details back into our channels  
  **So that** our team can review targets during conversation.
* **Acceptance Criteria**:
  - Slack bot endpoint configures Slack commands.
  - Validates user identity and returns structured metrics.
  - Direct links in Slack messages point back to the Analytix platform.

### Story CUST-18: Custom Executive Insight Narrator
* **As a** Business Customer  
  **I want** to click a button on any chart or dashboard and instantly receive a human-readable business story  
  **So that** I can quickly understand key findings and trends.
* **Acceptance Criteria**:
  - Sparkles icon button on charts and dashboard navbar.
  - Right-side sliding drawer lists Executive Summary, Key Insights cards, Trends, Anomalies, and Business Recommendations.
  - Provides a global health score for the dashboard wide summary.

### Story CUST-19: Visual Notification Stream
* **As a** Business Customer  
  **I want** to view real-time alert notifications of dashboard edits, comments, and metric anomalies  
  **So that** I remain updated on business adjustments.
* **Acceptance Criteria**:
  - Notification icon bell in the main header displaying counts of unread items.
  - Lists info, success, warning, and error events.
  - Clicking items redirects users to the corresponding dashboard.

### Story CUST-20: System Latency Status Indicator
* **As a** Business Customer  
  **I want** a visual indicator showing when dashboard data was last synced  
  **So that** I can verify that my decisions are based on recent information.
* **Acceptance Criteria**:
  - Displays "Last updated: X minutes ago" in dashboard header.
  - Shows green/yellow status light depending on database adapter latency.
  - Displays description metadata of recent sync pipelines.
