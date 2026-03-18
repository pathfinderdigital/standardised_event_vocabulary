# Pathfinder Digital: Data Architecture & Event Dictionary
## Project Codename: Alidade / Signal Lock

Core Tech Stack: Ubuntu, Python, BigQuery, Gemini API

## Overview

This document outlines the standard event vocabulary required for the Pathfinder AI analysis engine. To ensure the AI generates high-value, accurate "Fixes" without failing on messy client data, events are categorized into a 4-Tier architecture.

This architecture allows for zero-friction onboarding by calculating critical metrics natively in SQL, while using AI to map messy client nomenclature to our standard definitions.

## The 4-Tier Event Architecture
### Tier 1: The "Always There" Events (Baseline)

These events are automatically collected by GA4 (via Enhanced Measurement). The AI relies on these being present natively. If they are missing, the client's GA4 implementation is fundamentally broken.

| Event Name | Required Parameter | Parameter Description |
| ---- | ---- | ---- |
| page_view | page_location | The full URL of the page viewed. Crucial for SEO and flow analysis. |
| | page_referrer | The previous URL the user came from. |
| session_start | ga_session_id | The unique identifier for the user's session. Required for all aggregation. |
| user_engagement | engagement_time_msec | The time (in milliseconds) the page was actively in focus. Used to calculate virtual timers. |
| scroll | percent_scrolled | The vertical depth the user reached (defaults to 90). Indicates content consumption. |
| click | link_url | The destination URL of an outbound click. |
| | link_classes | CSS classes to identify the specific button/link clicked. |
| file_download | file_extension | Identifies the type of the asset downloaded (e.g., pdf). |
| | file_name | The name of the asset downloaded (e.g., whitepaper.pdf). |
| | link_url | The full URL path to the downloaded file. |
| search | search_term | The actual text the user typed into the website's internal search bar. Note that this can aslo be used to capture product filters, in which case filter parameters should be captured as well.|
| form_start | form_name | |
| | form_id | |
| form_submit | form_name | |
| | form_id | |
| form_input_change | input_name | |
| | form_name | |
| | form_id | |


### Tier 2: The "Standard Conversion" Events (AI-Mapped)

These are Google's recommended conversion events, as well as Enhanced Replacements for basic Tier 1 events. Because clients often use custom naming conventions (e.g., submit_contact_v2 or btn_click), the Pathfinder backend uses a Gemini "Pre-Processing" prompt to map the client's raw event names to these standard definitions before analysis.

### Enhanced Tier 1 Replacements

These events require upgraded GTM tracking to replace the basic functionality of standard GA4 Enhanced Measurement, giving the AI significantly more UI context and performance data.

| Event Name | Required Parameter | Parameter Description |
| ---- | ---- | ---- |
| page_view (Enhanced) | fcp | First Contentful Paint (ms) - Time until the first text/image is painted on screen. |
| | lcp | Largest Contentful Paint (ms) - Time until the largest element is fully rendered. |
| | cls | Cumulative Layout Shift - Score representing visual stability and unexpected layout shifts. |
| | inp | Interaction to Next Paint (ms) - Measures overall page responsiveness to user clicks/taps. |
| | dom_load_time | Time (ms) until the initial HTML document has been completely loaded and parsed. |
| | ttfb | Time to First Byte (ms) - Time waiting for the server's initial response. |
| | dns_time | DNS Resolution Time (ms) - Time taken to resolve the domain name. |
| | tcp_time | TCP Connection Time (ms) - Time taken to establish the connection to the server. |
| | redirect_time | Redirect Time (ms) - Time spent on any HTTP redirects before reaching the page. |
| click (Enhanced) | link_url | The destination URL. Upgraded GTM tracking captures all clicks (internal/UI), not just outbound. |
| | link_classes | CSS classes of the clicked element. |
| | link_id | The CSS ID of the clicked element (highly reliable for UI troubleshooting). |
| | link_text | The actual visible text of the button/link clicked. |
| scroll (Enhanced) | percent_scrolled | Upgraded GTM tracking captures milestone depths (e.g., 25, 50, 75, 100), rather than just the default 90. |

### Core Conversion Events

The standard milestones of the user journey that dictate revenue and lead generation.

| Event Name | Required Parameter | Parameter Description |
| ---- | ---- | ---- |
| generate_lead | value | Quantifies the lead value (if applicable). |
| | currency | The currency code for the value. |
| | form_id | Identifies exactly which form generated the lead. |
| sign_up | method | How the user signed up (e.g., "Google", "Email", "SSO"). |
| login | method | How the user logged into their account/portal (e.g., "Google", "Email"). |
| search | search_term | The manual GA4 recommended search event. Maps internal intent for lead-gen content. |
| share | method | The method used to share the content (e.g., "Twitter", "Email", "Copy Link"). |
| | content_type | The type of content shared (e.g., "article", "whitepaper"). |
| | item_id | The specific ID or name of the content being shared. |
| view_item | items[].item_id | Identifies the specific SKU viewed. Critical for spotting Ad waste. |
| | items[].item_name | The name of the specific product viewed. |
| add_to_cart | items | Array showing the specific products added. |
| | value | The potential cart value, showing high intent. |
| | currency | The currency code for the cart value. |
| begin_checkout | items | Array showing the products moving to checkout. |
| | value | Total value moving to checkout. Used to calculate abandonment rates. |
| | currency | The currency code for the checkout value. |
| purchase | transaction_id | A unique ID to prevent duplicate counting. |
| | value | The ultimate ROI metric value. |
| | currency | The currency code for the transaction. |
| | items | Array of the actual products purchased. |

### CRM & Offline Lead Lifecycle Events

Advanced B2B tracking. These events are rarely triggered on-site and usually require backend integrations (e.g., GA4 Measurement Protocol) to pass data from external CRM systems like Salesforce, HubSpot, or offline sales teams.

| Event Name | Required Parameter | Parameter Description |
| ---- | ---- | ---- |
| qualify_lead | value | Expected value when the lead is marked as fitting criteria to become a qualified lead. |
| | currency | The currency code for the expected value. |
| disqualify_lead | reason | The reason the lead was disqualified (e.g., "Budget", "Bad Fit", "Competitor"). |
| working_lead | value | Estimated value as the lead contacts or is contacted by a sales representative. |
| | currency | The currency code for the value. |
| close_convert_lead | value | The final revenue value when the lead successfully converts into a paying customer. |
| | currency | The currency code for the value. |
| close_unconvert_lead | reason | The reason the lead is marked as not converting (closed-lost reason). |

### Tier 3: The "Friction & Consulting" Events (Custom)

These events reveal technical health and UX roadblocks. Most clients will not have these installed by default. Strategic Use: If the Pathfinder engine detects these are missing, it automatically generates a "Data Health 
Warning" suggesting the client implement them (serving as a lead-gen mechanism for Pathfinder Digital's GTM consulting services).

| Event Name | Required Parameter | Parameter Description |
| ---- | ---- | ---- |
| form_validation_error | form_id | Identifies the specific form that failed. |
| | error_message | The exact validation error (e.g., "Invalid Email") causing the friction. |
| javascript_error | error_message | Captures frontend JavaScript crash details. |
| | error_url | The exact page URL where the crash occurred. |
| out_of_stock_view | item_id | Identifies the specific sold-out product ID. |
| | item_name | Identifies the name of the sold-out product users are viewing. |
| 404_error | page_location | Captures the broken URL the user attempted to visit. |
| | page_referrer | Where the user clicked from to get to the 404 page. |
| rage_click | click_id | The CSS ID or selector of the element experiencing rapid, repeated clicks. |
| | click_url | The link href of the element where the user frustration occurred. |
| | click_text | The inner text of the element where the user frustration occurred. |


### Tier 4: The "Virtual" Events (SQL-Calculated)

To reduce onboarding friction, we do not ask the client to install custom GTM timers. Instead, the Pathfinder backend generates these events dynamically during the BigQuery SQL execution by summing the engagement_time_msec parameter.

| Event Name | Required Parameter (SQL Base) | Parameter Description |
| ---- | ---- | ---- |
| virtual_timer_15s | ga_session_id | Session identifier used for grouping calculations. |
| | engagement_time_msec | Summed across the session. If >= 15,000, indicates "True Bounce / Ad Waste". |
| virtual_timer_30s | ga_session_id | Session identifier used for grouping calculations. |
| | engagement_time_msec | Summed across the session. If >= 30,000, indicates "Content Intent". |

# The Pathfinder Data Pipeline

When a new client connects their BigQuery dataset, the backend executes the following pipeline:

* Schema Extraction: Python queries BigQuery for a list of all DISTINCT event_name strings from the last 30 days.
* AI Semantic Mapping: Gemini 1.5 Flash evaluates the messy client list and maps their custom events to our Tier 2 and Tier 3 dictionaries (saving the result as a JSON map in our database).
* Distillation Query: Python executes the master BigQuery SQL script. This script:
* Aggregates the physical events based on the AI mapping.
* Dynamically calculates virtual_timer_15s and virtual_timer_30s.
* Joins the data with Google Ads and Search Console datasets.
* The Signal Audit: The resulting, perfectly structured data table is fed to Gemini 1.5 Pro to write the actionable "Signal Fixes" for the client dashboard.
