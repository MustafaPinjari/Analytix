# User Stories: Analytix BI Platform

This document outlines 60 detailed user stories (20 for each key user persona: **Power BI Developers**, **Data Analysts**, and **Business Customers**) as the platform scales to 1,000+ active users.

---

## 1. Power BI Developers (Advanced Creators)

Power BI developers focus on data modeling, pixel-perfect UI/UX layouts, complex calculations, and governance.

### Story PBI-1: Pixel-Perfect Grid Alignment & Snapping
* **As a** Power BI Developer  
  **I want** a high-precision grid system with pixel-level alignment, snapping, alignment guides, and aspect-ratio locks  
  **So that** I can design highly structured, clean, and professional corporate dashboards that match our design standards.
* **Acceptance Criteria**:
  - Ability to toggle "Snap to Grid" on/off.
  - Horizontal and vertical alignment lines (guides) show up when dragging/resizing widgets.
  - Ability to group multiple widgets together and resize/move them as a single group.

### Story PBI-2: Theme Builder & Custom Styling Templates (CSS/JSON)
* **As a** Power BI Developer  
  **I want** to upload custom JSON theme files or use a visual Theme Builder to define brand colors, fonts, margins, and borders globally  
  **So that** I can instantly apply the company's branding guidelines across all dashboards in a single click.
* **Acceptance Criteria**:
  - Theme editor UI where users can edit color palettes (primary, secondary, semantic colors).
  - Ability to export/import the current dashboard theme as a `.json` file.

### Story PBI-3: Dynamic Calculated Fields & DAX-like Formula Editor
* **As a** Power BI Developer  
  **I want** a formula editor with auto-completion, syntax highlighting, and basic helper functions (e.g., `SUM`, `AVERAGE`, `COUNT`, `DATEDIFF`)  
  **So that** I can build advanced calculated columns and custom measures without modifying the source SQL database.
* **Acceptance Criteria**:
  - Integrate a code editor (like Monaco editor) for calculated measures.
  - Support basic arithmetic, logical operators (`AND`, `OR`, `IF`), and standard aggregations.

### Story PBI-4: Row-Level Security (RLS) & Workspace Governance
* **As a** Power BI Developer  
  **I want** to define filters/roles (e.g., `Region = 'North America'`) and assign them to specific user groups  
  **So that** users only see the data they are authorized to access when viewing the same shared dashboard.
* **Acceptance Criteria**:
  - Admin view to create Roles (e.g., "NA Sales Team", "EU Sales Team").
  - Define filter expressions on database queries based on user metadata.

### Story PBI-5: Version Control & Git Integration
* **As a** Power BI Developer  
  **I want** to connect my dashboard workspaces to a git repository and commit version changes of dashboard JSON schemas  
  **So that** I can track layout history, review team changes, and rollback to previous version checkpoints.
* **Acceptance Criteria**:
  - Workspace Git Integration configuration panel.
  - "Commit Changes" button that commits schema updates.
  - Rollback interface list displaying git commit hashes.

### Story PBI-6: Custom Visualization SDK Support
* **As a** Power BI Developer  
  **I want** to register custom visualization widgets by writing React/TypeScript or loading a custom JS bundle (e.g., D3.js or ECharts)  
  **So that** I can present highly specialized visualizations not supported by default libraries.
* **Acceptance Criteria**:
  - Developer portal to upload custom Javascript files or input iframe HTML code.
  - Sandboxed rendering mode to prevent security exploits from custom code.

### Story PBI-7: Visual Data Relationship Designer
* **As a** Power BI Developer  
  **I want** a drag-and-drop relationship mapping UI to establish connections (One-to-Many, Many-to-Many) between different datasets  
  **So that** I can execute queries across multiple tables without writing complex SQL JOIN clauses manually.
* **Acceptance Criteria**:
  - Interactive database schema visualization chart showing table columns.
  - Drag lines from one table column to another to establish foreign-key relationships.

### Story PBI-8: Parameterized Queries & Input Controls
* **As a** Power BI Developer  
  **I want** to declare global variables/parameters in my dataset queries and bind them to interactive dropdowns on the dashboard UI  
  **So that** viewers can dynamically adjust values to re-run database-level queries.
* **Acceptance Criteria**:
  - Declare syntax parameters (`{{start_date}}`, `{{target_value}}`) in database query builders.
  - Map variables to user inputs (dates, sliders, text inputs).

### Story PBI-9: Dashboard Performance Profiler & Diagnostic tools
* **As a** Power BI Developer  
  **I want** to review a diagnostic trace window showing the query execution times and UI rendering performance of each widget  
  **So that** I can detect bottleneck queries and optimize slow dashboards.
* **Acceptance Criteria**:
  - "Performance Analyzer" sidebar.
  - Lists times for: Query Database, Network Transfer, Canvas Render.

### Story PBI-10: Visual Data Transformation & Cleaning UI (Data Prep)
* **As a** Power BI Developer  
  **I want** a step-by-step visual data cleaning interface (similar to Power Query) to filter nulls, split columns, convert data types, and replace values  
  **So that** raw data is cleaned before building visualizations.
* **Acceptance Criteria**:
  - A sequence of transformations that can be reordered, deleted, or edited.
  - Live data preview showing effects of the transformation steps.

### Story PBI-11: Incremental Refresh Configuration
* **As a** Power BI Developer  
  **I want** to configure incremental caching rules (e.g., only refresh data matching current day, cache previous months indefinitely)  
  **So that** the system limits query loading times and server database wear.
* **Acceptance Criteria**:
  - Incremental refresh panel setting date columns and lookback windows.
  - Option to trigger cache invalidation via Webhook.

### Story PBI-12: Interactive Widget Action Bindings
* **As a** Power BI Developer  
  **I want** to define custom click behaviors on widgets (e.g., navigate to a specific page, open a popup modal, run a webhook)  
  **So that** dashboards behave like interactive portals instead of static reports.
* **Acceptance Criteria**:
  - "Actions" section in the widget settings panel.
  - Trigger types: On Click, On Double Click, On Hover.

### Story PBI-13: Customized Rich-Text Hover Tooltips
* **As a** Power BI Developer  
  **I want** to design custom mini-templates for tooltips (e.g., showing a miniature sparkline or formatted key-value pairs)  
  **So that** users get maximum context when hovering over charts.
* **Acceptance Criteria**:
  - Layout editor inside widget configurations specifically for tooltips.
  - Bind secondary data variables to the tooltip rendering context.

### Story PBI-14: Conditional Formatting & Visual Alerts Rule Manager
* **As a** Power BI Developer  
  **I want** to set complex conditional formatting rules (e.g., color cells red if percentage change < -5% and text bold if target is met)  
  **So that** critical metrics stand out instantly to business users.
* **Acceptance Criteria**:
  - "Rules Manager" mapping metrics to colors, text styles, and icon highlights.
  - Multiple rules priority sorting.

### Story PBI-15: Navigation Builder & Custom Dashboard Tabs
* **As a** Power BI Developer  
  **I want** to build custom navigation menus (tabs, dropdown lists, next/back buttons) and embed them in reports  
  **So that** multi-page reports look like cohesive apps.
* **Acceptance Criteria**:
  - Drag-and-drop tab navigation strip builder.
  - Page link buttons that can be placed anywhere on the canvas.

### Story PBI-16: Query Caching Control Panel
* **As a** Power BI Developer  
  **I want** to define cache timeouts for specific queries/widgets (e.g., 5-minute cache for real-time sales, 24-hour cache for target reports)  
  **So that** dashboard performance is balanced against data freshness.
* **Acceptance Criteria**:
  - Custom cache duration input (in minutes/hours/days) per widget query block.
  - Force refresh button visible to developers to clear specific query caches.

### Story PBI-17: Detailed Audit Log of Query Generations
* **As a** Power BI Developer  
  **I want** to inspect a query log tracking all database queries executed by the frontend application  
  **So that** I can debug syntax discrepancies and optimize index usage on database engines.
* **Acceptance Criteria**:
  - Dev console listing database queries, variables passed, execution status, and query response codes.

### Story PBI-18: Widget Z-Index & Layout Layer Panel
* **As a** Power BI Developer  
  **I want** an interactive Layer Panel (similar to Figma or Photoshop) displaying all widgets, titles, and backgrounds  
  **So that** I can easily toggle visibility, lock placements, and rearrange overlapping elements.
* **Acceptance Criteria**:
  - Layer panel showing z-index layers from front to back.
  - Layer lock, hide/show, rename actions.

### Story PBI-19: Save Widget as Template Preset
* **As a** Power BI Developer  
  **I want** to save a heavily customized widget configuration as a reusable template preset  
  **So that** my teammates can reuse the style and query structure across other reports.
* **Acceptance Criteria**:
  - "Save to Shared Library" button inside the widget editor.
  - "Shared Templates" tab in the widget insertion sidebar.

### Story PBI-20: Bulk Replace Data Connections
* **As a** Power BI Developer  
  **I want** a tool to swap out the data source reference (e.g., swap Staging DB to Production DB) across all queries in a dashboard simultaneously  
  **So that** I can migrate dashboards from development environments to staging and production safely.
* **Acceptance Criteria**:
  - Connection Mapping UI showing current sources and drop-downs to select target configurations.
  - Dry-run validation check verifying queries succeed on the new target.

---

## 2. Data Analysts (Insight Explorers)

Data Analysts are responsible for deep data exploration, statistical analysis, preparing reports, and sharing automated insights.

### Story ANA-1: Interactive Cross-Filtering & Drills
* **As a** Data Analyst  
  **I want** clicking a slice of a pie chart or a bar in a chart to automatically filter all other visualizations on the canvas  
  **So that** I can perform interactive discovery and root-cause analysis without writing custom SQL queries.
* **Acceptance Criteria**:
  - Selecting a data point emits a filter event that recalculates other widgets.
  - Visual indicator showing active cross-filters, with a "Clear Filters" action.

### Story ANA-2: Automated KPI Alerting & Thresholds
* **As a** Data Analyst  
  **I want** to set custom threshold alerts (e.g., "Alert me if daily orders drop below 15,000") with notifications sent to Email, Slack, or Microsoft Teams  
  **So that** key business stakeholders can respond instantly to critical anomalies.
* **Acceptance Criteria**:
  - Alert creation UI: select widget, select metric, define condition (`>`, `<`, `=`), and trigger value.
  - Periodic evaluation integration running in background tasks.

### Story ANA-3: Fast Raw Data Preview & Advanced Export
* **As a** Data Analyst  
  **I want** a "View Raw Data" toggle on every chart to expand a clean tabular spreadsheet view  
  **So that** I can verify underlying data points and export them to `.xlsx`, `.csv`, or `.parquet` formats.
* **Acceptance Criteria**:
  - Hover action / context menu on widgets showing "View Data Table".
  - Dynamic export generator that streams data to prevent memory crashes on large tables.

### Story ANA-4: AI-Powered Anomaly Detection
* **As a** Data Analyst  
  **I want** the system to scan datasets automatically and flag unexpected drops, spikes, or structural shifts on trend lines with text explanations  
  **So that** I don't miss critical underlying changes in complex data.
* **Acceptance Criteria**:
  - Dynamic highlight marker on time-series charts where statistical anomalies are detected.
  - Explanatory tooltip detailing the variance percentage from baseline projections.

### Story ANA-5: Automated Textual Insight Summarization (AI NLG)
* **As a** Data Analyst  
  **I want** an AI summary widget that scans the dashboard values and outputs a concise bulleted summary of key insights (e.g., "Revenue increased by 12% led by region X")  
  **So that** I can instantly copy it into my executive summaries.
* **Acceptance Criteria**:
  - Dynamic narrative widget option.
  - Auto-regenerates narrative based on applied dashboard filters.

### Story ANA-6: Interactive Time-Series Forecasting
* **As a** Data Analyst  
  **I want** to toggle a "Forecasting" option on line charts and visually configure projection parameters (e.g., confidence interval, seasonality)  
  **So that** I can project future performance trends instantly.
* **Acceptance Criteria**:
  - Toggle switch under chart properties to display future projections.
  - Shaded confidence bands showing upper and lower bounds.

### Story ANA-7: Personal Pinboard & Data Scratchpad
* **As a** Data Analyst  
  **I want** a private workspace where I can "pin" individual widgets from different team dashboards  
  **So that** I can monitor cross-department KPIs in a single customized view without cluttering shared company reports.
* **Acceptance Criteria**:
  - "Pin to Scratchpad" button on all dashboard widgets.
  - Private dashboard builder screen displaying pinned charts.

### Story ANA-8: Pivot Table Matrix & Hierarchy Grouping
* **As a** Data Analyst  
  **I want** to build multi-dimensional Pivot Tables directly on the dashboard where users can expand/collapse row and column hierarchies  
  **So that** we can perform detailed structural financial calculations.
* **Acceptance Criteria**:
  - Drag and drop columns into rows, columns, and value containers.
  - Expand/collapse toggle buttons next to hierarchical categories.

### Story ANA-9: Embedded SQL Query Playground
* **As a** Data Analyst  
  **I want** an SQL query workbench inside the web platform where I can run custom queries, visualize outputs on a chart, and save results as viewable datasets  
  **So that** I don't need external SQL clients to prepare dashboards.
* **Acceptance Criteria**:
  - Web console supporting syntax highlighting, auto-completion, and database schema explorer.
  - "Export to Widget" action that directly loads the query schema into the dashboard builder.

### Story ANA-10: Collaborative Annotations & Data Comments
* **As a** Data Analyst  
  **I want** to attach comment threads to specific data points or charts on the dashboard and tag colleagues using `@mentions`  
  **So that** we can document explanation notes for outliers directly in context.
* **Acceptance Criteria**:
  - Click on a chart element to select "Add Comment".
  - Notification sent to tagged users.
  - Comment marker icons rendered next to annotated points.

### Story ANA-11: Advanced Statistical Analysis Controls
* **As a** Data Analyst  
  **I want** to generate linear regression lines, distribution histograms, and box plots on datasets  
  **So that** I can run advanced descriptive and diagnostic statistics on our analytics.
* **Acceptance Criteria**:
  - Dropdown options to compute and draw Trendlines, Median lines, and Standard Deviation bands.
  - Histogram and Boxplot widget options in dashboard builder.

### Story ANA-12: Visual Dataset Merge & Join Wizard
* **As a** Data Analyst  
  **I want** a visual wizard to merge two different uploaded tables (e.g. merging a Salesforce export CSV and an active database table)  
  **So that** I can enrich metrics without relying on backend developers to rebuild database tables.
* **Acceptance Criteria**:
  - Select two tables, match columns, choose merge type (Inner, Left, Right, Outer).
  - Preview combined dataset output.

### Story ANA-13: Scheduled Report Automation
* **As a** Data Analyst  
  **I want** to configure scheduled report runs that export the dashboard to PDF or Excel and dispatch them to custom user email lists  
  **So that** reporting is fully automated.
* **Acceptance Criteria**:
  - Scheduling setup UI specifying cron-like frequencies (daily, weekly, monthly), recipients, and file formats.

### Story ANA-14: Searchable Dashboard Global Filters
* **As a** Data Analyst  
  **I want** dashboard filter boxes to support fuzzy search autocomplete matching dimension lists (e.g. typing "Lon" suggests "London" and "Longview")  
  **So that** filtering through large dimensional datasets (like millions of clients) is fast.
* **Acceptance Criteria**:
  - Auto-filtering and fetching suggestion results as user types inside the dashboard filter input.

### Story ANA-15: Historical Snapshots Comparison
* **As a** Data Analyst  
  **I want** to compare the current state of a dashboard to a snapshot from a previous point in time (e.g. comparing current sales pipeline with last month's forecast)  
  **So that** I can perform delta analysis and identify trends.
* **Acceptance Criteria**:
  - Comparison mode picker where user selects "Baseline Date".
  - Renders delta markers (▲/▼ with percentages) on KPI cards relative to baseline metrics.

### Story ANA-16: Columns Profile Metrics Explorer
* **As a** Data Analyst  
  **I want** to view data profiling statistics (null count, unique values count, average, min, max, standard deviation) for any dataset  
  **So that** I can evaluate data quality before drawing conclusions.
* **Acceptance Criteria**:
  - "Data Quality" tab inside the dataset viewer.
  - Summary metrics and distribution charts shown for each column.

### Story ANA-17: Chart Type Switcher UI
* **As a** Data Analyst  
  **I want** to switch a rendered widget between Line, Bar, Scatter, or Table views directly while viewing a dashboard  
  **So that** I can explore the same dataset from different visual angles without editing the report.
* **Acceptance Criteria**:
  - Mini toolbar on widgets containing chart icon buttons.
  - Instantly toggles chart representation without resetting active query filters.

### Story ANA-18: Dynamic Date Slicer Presets
* **As a** Data Analyst  
  **I want** date filters to support dynamic relative definitions (e.g., "Last 14 days", "Year-to-Date", "Previous Fiscal Quarter")  
  **So that** dashboards remain continuously updated relative to the calendar date.
* **Acceptance Criteria**:
  - Quick-preset select list on Date Slicers.
  - Custom relative range input options.

### Story ANA-19: Drag-and-Select Clustering
* **As a** Data Analyst  
  **I want** to drag a selection box over multiple points in a scatter plot to group them and isolate their performance across other metrics  
  **So that** I can study visual clusters dynamically.
* **Acceptance Criteria**:
  - Lasso/Rectangle selection tool in chart controls.
  - Emits filtered dataset matching selected scatter coordinate ranges.

### Story ANA-20: Python Code Snippet Generator
* **As a** Data Analyst  
  **I want** the dataset editor to generate a Python Pandas code snippet that duplicates my visual transformation steps  
  **So that** I can easily move my data prep work to Jupyter notebooks.
* **Acceptance Criteria**:
  - "Show Pandas Code" modal displaying the sequence of dataset manipulations translated to Python code.

---

## 3. Business Customers (Decision Makers / Consumers)

Customers consume the insights to drive decisions, present results to stakeholders, and keep track of business performance.

### Story CUST-1: Subscription-Based Email PDF Digests
* **As a** Business Customer  
  **I want** to subscribe to a dashboard and receive a clean PDF layout attachment in my inbox every Monday morning at 8:00 AM  
  **So that** I can review performance metrics before starting my weekly planning meetings.
* **Acceptance Criteria**:
  - Dashboard subscription toggle with daily/weekly calendar schedule settings.
  - Clean layout containing PDF snapshot attachment generated via headless browsers.

### Story CUST-2: Mobile-First Responsive View Mode
* **As a** Business Customer  
  **I want** dashboards to dynamically stack into a single column with optimized font sizes and touch-friendly chart interactions on mobile web browsers  
  **So that** I can monitor business performance on the go.
* **Acceptance Criteria**:
  - Screen width detection below 768px organizes grid items vertically.
  - Smooth mobile gestures to swipe tabs and scroll charts.

### Story CUST-3: Secure Public Sharing & Embed Links
* **As a** Business Customer  
  **I want** to generate temporary, secure, passcode-protected share links or embed codes for specific dashboards  
  **So that** I can share insights with external clients and partners.
* **Acceptance Criteria**:
  - Secure link generation with expiration date options and passcode restrictions.
  - Clickjacking protection (X-Frame-Options configured) on embed codes.

### Story CUST-4: Custom Dashboard Bookmarks
* **As a** Business Customer  
  **I want** to save my current set of filtered selections as a personal "Bookmark" that I can set as my default view  
  **So that** I do not have to re-select region, country, and product categories every time I open the dashboard.
* **Acceptance Criteria**:
  - "Save Current Filters as Bookmark" UI modal.
  - Private bookmark list dropdown; one-click execution sets stored filter states.

### Story CUST-5: Searchable Unified Hub
* **As a** Business Customer  
  **I want** a unified search bar on the homepage that searches across dashboard titles, description text, tags, and owners  
  **So that** I can find the report I need in seconds.
* **Acceptance Criteria**:
  - Global search field with instantaneous autocomplete suggestions.
  - Categories: Dashboard, Report, Owner, Dataset.

### Story CUST-6: Natural Language Q&A Search (Ask AI)
* **As a** Business Customer  
  **I want** to type questions in plain English (e.g. "What was our top selling product in France last quarter?") and get an instant chart answer  
  **So that** I can extract data without learning how to build charts.
* **Acceptance Criteria**:
  - Conversational input bar on dashboards.
  - Returns appropriate visual chart and structured text answers.

### Story CUST-7: Dynamic PDF Export Headers & Footers
* **As a** Business Customer  
  **I want** exported PDF reports to display the active filters, export timestamp, and author details in the footer  
  **So that** the document is properly cataloged when printed or shared.
* **Acceptance Criteria**:
  - PDF generation parameters append current filter selections, time, and user email on page layout footers.

### Story CUST-8: Dark Mode Theme Switcher
* **As a** Business Customer  
  **I want** a simple theme toggle to transition the application between high-contrast light mode and a warm dark mode  
  **So that** I can view dashboards comfortably in dark environments.
* **Acceptance Criteria**:
  - Quick-switch toggle button in user settings and main header.
  - Saves theme preference to user profile.

### Story CUST-9: Personal Activity Metrics Tracker
* **As a** Business Customer  
  **I want** to view a personal "Recently Viewed" dashboard showing my most visited reports and the metrics I interact with most  
  **So that** I can access my active documents instantly.
* **Acceptance Criteria**:
  - Home dashboard page displaying: Recently Viewed, Most Visited, and Bookmarks.

### Story CUST-10: In-App Feedback & Feature Submission
* **As a** Business Customer  
  **I want** a direct "Provide Feedback" option on every dashboard to send requests or flag questions directly to the author  
  **So that** we can improve data models collaboratively.
* **Acceptance Criteria**:
  - Dashboard menu button "Submit Feedback" opens an email/ticket input.
  - Forwards issue, link, and current filter state to the dashboard creator.

### Story CUST-11: Single Sign-On (SSO) Support
* **As a** Business Customer  
  **I want** to log in to the Analytix platform using my company identity provider (Okta, Azure AD, or Google Workspace)  
  **So that** I don't have to manage another set of credentials.
* **Acceptance Criteria**:
  - "Continue with Company Identity Provider" action on the login screen.
  - Supports SAML / OIDC provider routing.

### Story CUST-12: Auto-Reload Dashboard for Smart Displays
* **As a** Business Customer  
  **I want** to enable a "Presentation Mode" with auto-reload (every 1 to 60 minutes) to keep dashboard numbers fresh on office monitoring displays  
  **So that** our teams can track live metrics throughout the day.
* **Acceptance Criteria**:
  - Presentation Mode toolbar action toggles full-screen mode.
  - Refresh timer dropdown configures periodic background update queries.

### Story CUST-13: Customized KPI Header Strip
* **As a** Business Customer  
  **I want** to select up to 5 critical KPI cards to pin at the very top of my homepage  
  **So that** I immediately see our baseline statistics without opening multiple folders.
* **Acceptance Criteria**:
  - Select "Pin to Home KPI Strip" from any metric card.
  - Displays pinned metrics on login homepage with positive/negative trend symbols.

### Story CUST-14: Inline Tooltip Glossary & Outlier Documentation
* **As a** Business Customer  
  **I want** to hover over dashboard terms (e.g. "Churn Rate", "MRR") and see their official corporate definition  
  **So that** I interpret metrics accurately according to company vocabulary.
* **Acceptance Criteria**:
  - Dynamic terminology database.
  - Renders dashed underlines under registered terms; hovering displays tooltips with explanations.

### Story CUST-15: Individual Chart PDF Download Action
* **As a** Business Customer  
  **I want** to download a single chart directly as a high-quality vector image or a mini-PDF document  
  **So that** I can insert it directly into my slides and documents.
* **Acceptance Criteria**:
  - "Export Chart" option in the context menu of each widget.
  - Generates PNG or PDF vector downloads of the selected visual block only.

### Story CUST-16: Quick Workspace Collaboration Share Links
* **As a** Business Customer  
  **I want** a "Copy App Link" button that copies a link preserving my exact dashboard configuration and tabs  
  **So that** when I send the link to a teammate, they see the exact view I am looking at.
* **Acceptance Criteria**:
  - "Copy Link" copies URL with query parameters encoding current filters and page tab.

### Story CUST-17: Slack App KPI Fetching Command
* **As a** Business Customer  
  **I want** a Slack slash command (e.g., `/analytix get revenue`) that posts the KPI card details back into our channels  
  **So that** our team can review targets during conversation.
* **Acceptance Criteria**:
  - Slack Bot OAuth application mapping chat commands to system API metrics and returning formatted message attachments.

### Story CUST-18: Offline Mode Document View
* **As a** Business Customer  
  **I want** the app to cache dashboard pages locally when I'm active  
  **So that** I can view report figures even when offline or in transit.
* **Acceptance Criteria**:
  - Progressive Web App (PWA) cache implementation showing a banner alert: "Viewing offline data snapshot."

### Story CUST-19: Multi-Client Organization Switcher
* **As a** Business Customer  
  **I want** to switch between different company workspaces using a simple dropdown in the header  
  **So that** I can review metrics for multiple subsidiary companies.
* **Acceptance Criteria**:
  - Top header displays "Active Workspace" switcher dropdown containing authorized tenant groups.

### Story CUST-20: Data Privacy & Export Portal
* **As a** Business Customer  
  **I want** a privacy settings panel where I can request account deletion or export my dashboard actions logs  
  **So that** my data is managed in compliance with GDPR standards.
* **Acceptance Criteria**:
  - Self-service portal in user profile to trigger account archive exports and deletion workflows.
