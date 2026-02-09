Marsana Fleet Management System - Complete Specification Version: 1.0
Last Updated: February 5, 2026 Purpose: Full specification for
AI-assisted development

Project Overview What is Marsana Fleet? A web-based fleet management
system for Marsana Rent a Car to manage vehicles across multiple
branches in Saudi Arabia. The system handles vehicle transfers between
branches, inspections, rentals, maintenance, and real-time tracking.
Technology Stack Frontend: Next.js 14 App Router, TypeScript, Tailwind
CSS Backend: Supabase (PostgreSQL database, Authentication, Row Level
Security, Storage) Deployment: Vercel Testing: Playwright for E2E tests

1.  Organization Structure Branches The system has 5 branches organized
    in a hierarchy: Jeddah HQ (Code: JED-HQ, Type: HQ) Main headquarters
    with full oversight Riyadh Corporate (Code: RYD-CORP, Type: B2B)
    Serves corporate clients Dammam Corporate (Code: DAM-CORP, Type:
    B2B) Serves corporate clients Al Sulaimaniyyah (Code: RYD-SUL, Type:
    B2C) Individual customer rentals Garnatha (Code: RYD-GRN, Type: B2C)
    Individual customer rentals User Roles Six user roles with different
    permissions: super_admin - Full system access, can do anything hq -
    Headquarters staff, oversight of all branches branch_admin - Manages
    one specific branch driver - Limited access, handles vehicle
    movements tech - Maintenance technician corporate_admin - Manages
    corporate client accounts

2.  Vehicle Status System Status Values (Exact Strings Required) Every
    vehicle must have exactly one of these statuses: AVAILABLE - Vehicle
    is ready to rent (green color) ON_RENT - Vehicle is currently rented
    to a customer (blue color) IN_TRANSIT - Vehicle is being transferred
    between branches (orange color) PENDING_INSPECTION - Vehicle needs
    inspection before use (purple color) MAINTENANCE - Vehicle is under
    maintenance (red color) ACCIDENT - Vehicle has been in an accident
    (dark red color) Allowed Status Changes (State Machine) The system
    must enforce these rules - not all status changes are allowed: From
    AVAILABLE: Can go to: ON_RENT, MAINTENANCE, IN_TRANSIT From ON_RENT:
    Can go to: PENDING_INSPECTION, ACCIDENT From IN_TRANSIT: Can go to:
    PENDING_INSPECTION, AVAILABLE From PENDING_INSPECTION: Can go to:
    AVAILABLE, MAINTENANCE, ACCIDENT From MAINTENANCE: Can go to:
    AVAILABLE, PENDING_INSPECTION From ACCIDENT: Can go to: MAINTENANCE,
    PENDING_INSPECTION

3.  Complete Page-by-Page Specification 3.1 Global Layout (All Pages)
    Every page in the system shares this layout: Top Bar (Header) Left
    side: Marsana logo Right side: Notifications bell icon (shows red
    badge if unread alerts) User avatar with name and role badge Logout
    button Logout Flow: User clicks Logout button System shows modal:
    "Are you sure you want to logout?" Two buttons: "Cancel" and
    "Logout" If Logout clicked: Call Supabase signOut() Clear all client
    state Redirect to /login Show success toast "Logged out
    successfully" Sidebar (Navigation) Show different menu items based
    on role: For super_admin and hq: Dashboard (HQ) Vehicles Handshakes
    Inspections Rentals Corporates Alerts For branch_admin: Dashboard
    (Branch) Branch selector dropdown (if manages multiple branches)
    Vehicles Handshakes Inspections Rentals Alerts For driver: Driver
    Portal Branch selector dropdown Breadcrumb Navigation Every page
    shows: Home \> Current Section \> Current Page

3.2 Login Page (/login) URL: /login Purpose: Authenticate users Layout:
Centered card on plain background Marsana logo at top Login form below
Form Fields: Email Type: email Required: Yes Validation: Must be valid
email format Placeholder: "you@example.com" Password Type: password
Required: Yes Minimum length: 8 characters Show/hide password toggle
icon Remember me Type: checkbox Optional Buttons: Sign In (primary
button, full width) Forgot Password? (text link below) Login Process:
User enters email and password Click "Sign In" System calls Supabase
signInWithPassword() On success: Update users.last_login_at to current
timestamp Redirect based on role: super_admin or hq → /dashboard/hq
branch_admin → /dashboard/branch driver → /driver corporate_admin →
/corporates On error: Show error message below form: "Invalid email or
password" Keep email field filled Clear password field Validation Rules:
Show inline error if email is not valid format Show inline error if
password is empty Disable Sign In button while request is in progress

3.3 HQ Dashboard (/dashboard/hq) URL: /dashboard/hq Who can access:
super_admin, hq Purpose: Overview of entire fleet across all branches
Page Header: Title: "HQ Dashboard" Subtitle: "Fleet overview across all
branches" Action buttons (top-right): "Export CSV" button "Create Alert"
button Widget Cards (in a 2x2 grid): 1. Total Vehicles Card Big number
showing total vehicle count Small text: "Across all branches"
Clickable - goes to /vehicles 2. Active Alerts Card Big number showing
unresolved alerts count Breakdown by severity: CRITICAL: X alerts (red)
HIGH: X alerts (orange) MEDIUM: X alerts (yellow) Clickable - goes to
/alerts with filter 3. Maintenance Pending Card Number of vehicles in
MAINTENANCE status Number of open maintenance tickets Clickable - goes
to /vehicles?status=MAINTENANCE 4. SLA Overdue List Shows items overdue:
Inspections overdue (more than 24 hours) Handshakes overdue (past ETA +
2 hours) Maintenance tickets overdue (past due date) Each item clickable
to details Real-time Updates: Subscribe to Supabase Realtime on alerts
table Subscribe to Supabase Realtime on handshakes table When new alert
or handshake created, update widgets automatically "Export CSV" Button:
User clicks "Export CSV" Generate CSV file with current dashboard data
Download file: marsana-hq-dashboard-YYYY-MM-DD.csv "Create Alert"
Button: User clicks button Open modal (see "Create Alert Modal" below)
Create Alert Modal Fields: Alert Type (dropdown, required)
VEHICLE_ACCIDENT MAINTENANCE_DUE INSPECTION_OVERDUE HANDSHAKE_OVERDUE
RENTAL_OVERDUE MSA_EXPIRY SLA_BREACH SYSTEM Severity (dropdown,
required) LOW MEDIUM HIGH CRITICAL Title (text input, required) Max 200
characters Message (textarea, required) Max 1000 characters Reference
Type (dropdown, optional) Vehicle Handshake Rental Maintenance Ticket
Reference ID (text input, optional) If Reference Type selected, this
becomes required Buttons: "Cancel" (secondary) "Create Alert" (primary)
On Submit: Validate all required fields Insert into alerts table Set
created_by to current user ID Close modal Show success toast: "Alert
created successfully" Refresh dashboard widgets

3.4 Branch Dashboard (/dashboard/branch) URL: /dashboard/branch Who can
access: branch_admin Purpose: Overview of current branch only Branch
Selector: Dropdown at top showing current branch name If user manages
multiple branches, can switch between them Page Header: Title: "\[Branch
Name\] Dashboard" Subtitle: "Branch code: \[CODE\]" Action buttons:
"Accept All Pending" button "Create Task" button Widget Cards: 1.
Vehicles in Branch Card Total vehicles assigned to this branch Breakdown
by status with colored chips 2. Available Vehicles Card Number of
vehicles with status = AVAILABLE List of vehicle plates (clickable) 3.
Pending Inspections Card Number of vehicles with status =
PENDING_INSPECTION Oldest inspection due first Each vehicle clickable to
detail page 4. Incoming Handshakes Card Number of handshakes where:
to_branch_id = current branch status = PENDING or IN_TRANSIT List with
ETA countdown Each handshake clickable "Accept All Pending" Button: User
clicks button Show confirmation modal: Title: "Accept All Pending
Handshakes?" Message: "This will accept \[X\] incoming handshakes. Are
you sure?" Buttons: "Cancel", "Accept All" If "Accept All" clicked: For
each pending handshake to this branch: Set status = ACCEPTED Set
accepted_by = current user ID Set accepted_at = now Update vehicle
current_status = IN_TRANSIT Create audit log entry Show success toast:
"Accepted X handshakes" Refresh dashboard

3.5 Vehicles Page (/vehicles) URL: /vehicles Who can access: All roles
(with different permissions) Purpose: List and manage all vehicles Page
Header: Title: "Vehicles" "Add Vehicle" button (visible only to
super_admin, hq) Filter & Search Section: Search Bar: Placeholder:
"Search by plate number..." Real-time search as user types Filter
Dropdowns: Status Filter (multi-select) Can select multiple statuses
Options: AVAILABLE, ON_RENT, IN_TRANSIT, PENDING_INSPECTION,
MAINTENANCE, ACCIDENT Default: All selected Branch Filter
(single-select) Options: All branches If branch_admin, only shows their
branch Make Filter (single-select) Dynamically populated from existing
vehicles Options: Toyota, Honda, Hyundai, etc. Model Filter
(single-select) Dynamically populated based on selected make Mileage
Range Two number inputs: Min and Max Filters vehicles between these
mileage values Last Inspection Date Date range picker: From date, To
date "Clear Filters" Button: Resets all filters to default Clears search
Reloads full vehicle list Vehicles Table: Columns: Plate Number
(clickable link) Links to: /vehicles/\[id\] Bold text Status (colored
chip) AVAILABLE = green background ON_RENT = blue background IN_TRANSIT
= orange background PENDING_INSPECTION = purple background MAINTENANCE =
red background ACCIDENT = dark red background Make/Model Format: "Toyota
Camry 2022" Mileage Format: "45,320 km" Current Branch Shows branch name
and code Last Inspection Date in format: "Jan 15, 2026" Shows "Never" if
no inspection Actions (dropdown menu) View (eye icon) Edit (pencil icon)
Change Status (status icon) Delete (trash icon, red) Bulk Actions:
Checkbox in table header to select all Checkbox in each row to select
individual When 1+ rows selected, show action bar: "Bulk Change Status"
button "Export Selected" button "X vehicles selected" text Pagination:
25 vehicles per page Previous/Next buttons Page numbers: 1, 2, 3... with
current page highlighted Add Vehicle Modal Triggered by: Clicking "Add
Vehicle" button Form Fields: Plate Number (required) Text input Unique
validation Format: Capital letters and numbers Example: "ABC1234" VIN
(optional) Text input 17 characters Unique validation Make (required)
Dropdown or text input Examples: Toyota, Honda, Hyundai, Nissan, Ford
Model (required) Text input Example: Camry, Accord, Elantra Year
(required) Number input Range: 2015-2026 Color (optional) Text input
Example: White, Black, Silver Fuel Type (optional) Dropdown: Gasoline,
Diesel, Hybrid, Electric Current Branch (required) Dropdown showing all
branches Default: User's branch if branch_admin Current Status
(required) Dropdown Default: AVAILABLE All status values available
Mileage (required) Number input Default: 0 Unit: kilometers Purchase
Date (optional) Date picker Purchase Price (optional) Number input
Currency: SAR Insurance Expiry (optional) Date picker Registration
Expiry (optional) Date picker Next Service Due (optional) Date picker
Notes (optional) Textarea Max 500 characters Buttons: "Cancel"
(secondary) "Add Vehicle" (primary) On Submit: Validate all required
fields Check plate number is unique Insert into vehicles table Set
created_by = current user ID Set created_at = now Create audit log entry
Close modal Refresh vehicles table Show success toast: "Vehicle
\[PLATE\] added successfully" On Error: If plate exists: Show error
"Plate number already exists" If VIN exists: Show error "VIN already
exists" Keep modal open with filled data Edit Vehicle Modal Triggered
by: Clicking "Edit" in vehicle actions menu Same fields as Add Vehicle
Modal but pre-filled with current data Changes: Modal title: "Edit
Vehicle: \[PLATE\]" Button text: "Save Changes" On Submit: Validate all
fields Update vehicles table WHERE id = vehicle ID Set updated_by =
current user ID Set updated_at = now Increment version by 1 (for
optimistic locking) Create audit log entry with old_data and new_data
Close modal Refresh vehicle row in table Show success toast: "Vehicle
updated successfully" Change Status Modal Triggered by: Clicking "Change
Status" in actions menu Purpose: Change vehicle status with validation
and side effects Form Fields: Current Status (read-only, displayed as
colored chip) New Status (dropdown, required) Shows ONLY allowed next
statuses based on state machine rules Example: If current is AVAILABLE,
show only: ON_RENT, MAINTENANCE, IN_TRANSIT Reason (textarea) Required
if new status is ACCIDENT or MAINTENANCE Optional for other status
changes Placeholder: "Explain the reason for this status change..." Max
500 characters Upload Document (file upload, optional) Accepts: PDF,
JPG, PNG Max size: 10MB Shows preview after selection Buttons: "Cancel"
"Change Status" (primary) On Submit: Validate: Check new status is
allowed based on state machine Update vehicle: Set current_status = new
status Set updated_by = current user Set updated_at = now Side effects
based on new status: If new status = ACCIDENT: Create alert with type
VEHICLE_ACCIDENT Set severity = CRITICAL Create maintenance ticket If
new status = MAINTENANCE: Create maintenance ticket if reason provided
Set priority based on urgency keywords in reason If new status =
PENDING_INSPECTION: Create inspection task Upload document if provided:
Upload to Supabase Storage bucket: vehicle-docs Path:
{vehicle_id}/status-change-{timestamp}.{ext} Store URL in vehicle
documents JSONB Create audit log entry Close modal Refresh page or
update row with optimistic UI Show success toast: "Vehicle status
changed to \[NEW STATUS\]" On Error: If status change not allowed:
"Cannot change from \[OLD\] to \[NEW\]" If server validation fails: Show
server error message Keep modal open Delete Vehicle Modal Triggered by:
Clicking "Delete" in actions menu Confirmation Modal: Title: "Delete
Vehicle?" Message: "Are you sure you want to delete vehicle \[PLATE\]?
This will perform a soft delete and the vehicle can be restored later."
Warning (if vehicle has related records): "This vehicle has:" X active
rentals X handshakes X maintenance tickets "Deleting will not remove
these records." Buttons: "Cancel" (secondary) "Delete Vehicle"
(destructive, red) On Confirm: Update vehicles table Set deleted_at =
now (soft delete) Set updated_by = current user Create audit log entry
Remove vehicle from table UI immediately Show success toast: "Vehicle
deleted successfully" Note: Vehicles are soft-deleted (not permanently
removed from database) Bulk Change Status Modal Triggered by: Selecting
multiple vehicles and clicking "Bulk Change Status" Form: Selected
Vehicles: Shows count "Changing status for X vehicles" New Status
(dropdown, required) All status options available Warning shown if some
vehicles cannot transition to selected status Reason (textarea,
required) Required for bulk changes Applied to all vehicles Buttons:
"Cancel" "Change All Statuses" (primary) On Submit: For each selected
vehicle: Check if status change is allowed If allowed: Update status
with same reason If not allowed: Skip and add to failed list Create
audit log for each successful change Close modal Show result toast:
Success: "X vehicles updated successfully" If some failed: "X vehicles
updated, Y vehicles skipped (invalid transition)" Refresh table

3.6 Vehicle Detail Page (/vehicles/\[id\]) URL: /vehicles/{vehicle-id}
Who can access: All authenticated users (read-only for drivers) Purpose:
View and manage single vehicle details Page Header: Breadcrumb: Vehicles
\> \[PLATE NUMBER\] Title: Large plate number display Status chip:
Current status with color Action buttons (right side): "Change Status"
button "Print" button (print vehicle info sheet) "Create Handshake"
button "Upload Document" button Tab Navigation: Five tabs shown
horizontally below header: Overview (default) Documents Service History
Telemetry (if GPS tracking enabled) Movement History Tab 1: Overview
Vehicle Information Card: Display these fields in a grid layout (label:
value format): Plate Number VIN Make / Model / Year Color Fuel Type
Current Mileage Current Branch Assigned Driver (if any) Purchase Date
Purchase Price Insurance Expiry (show red warning if \< 30 days)
Registration Expiry (show red warning if \< 30 days) Next Service Due
(show orange warning if \< 7 days) Created At / By Last Updated At / By
Status History Card: Timeline showing all status changes Each entry
shows: Date/time Old status → New status Changed by (user name) Reason
(if provided) Most recent at top Notes Section: Editable textarea "Save
Notes" button Shows last updated timestamp Tab 2: Documents Purpose:
Manage vehicle-related documents Upload Section: Drag-and-drop area
"Choose File" button Accepts: PDF, JPG, PNG, Excel Max size: 25MB
Documents Table: Columns: Thumbnail (for images) or file icon File Name
(clickable to view/download) Type (Insurance, Registration, Service,
Other) Upload Date Uploaded By Actions View (open in new tab) Download
Replace (upload new version) Delete (with confirmation) On Upload:
Validate file type and size Upload to Supabase Storage bucket:
vehicle-docs Path: {vehicle_id}/{timestamp}-{filename} Get signed URL
with 1 year expiry Store metadata in vehicle_documents table or vehicle
JSONB field Create audit log Show in documents list immediately Show
success toast On Delete: Show confirmation: "Delete \[filename\]?" If
confirmed: Remove file from Storage Remove metadata record Create audit
log Remove from list Show success toast Tab 3: Service History Purpose:
View all maintenance tickets and inspections for this vehicle
Maintenance Tickets Section: Filter buttons: All Open Completed
Cancelled Tickets List: Each ticket card shows: Ticket reference (e.g.,
MT-2024-001) Title Priority badge (color-coded) Status badge Created
date Due date (if overdue, show in red) Assigned to (technician name)
Estimated cost / Actual cost Actions on each ticket: "View Details"
button → opens ticket detail modal "Open Ticket" button (if status =
OPEN) "Close Ticket" button (if status = IN_PROGRESS) Inspections
Section: List of past inspections: Each inspection card shows:
Inspection date Mileage at inspection Result badge (CLEAN=green,
DAMAGE=red, SERVICE_DUE=orange) Performed by (user name) Photos count
(if any) Notes preview Click on inspection: Opens inspection detail
modal Shows full checklist Shows all photos in gallery Shows complete
notes Tab 4: Telemetry Purpose: View GPS tracking data (if available)
Map View: Embedded map showing current vehicle location Last updated
timestamp Real-time updates if vehicle is moving Telemetry Data Cards:
Current Location GPS coordinates Address (reverse geocoded) Last update
time Trip Data Current speed (if moving) Heading/direction Odometer
reading Telemetry History Table: Columns: Timestamp Location Speed
Heading Odometer Export button: Download telemetry data as CSV Tab 5:
Movement History Purpose: Complete timeline of vehicle movements between
branches Timeline View: Shows chronological list of: Handshake Events
Handshake reference From branch → To branch Requested by / date Accepted
by / date Completed by / date Status at each stage Transfer Events
Direct transfers (if any) Admin who moved vehicle Timestamp Filter: Date
range picker Branch filter (show only movements involving specific
branch)

3.7 Handshakes Page (/handshakes) URL: /handshakes Who can access:
super_admin, hq, branch_admin Purpose: Manage vehicle transfers between
branches Page Header: Title: "Handshakes" "Create Handshake" button
Filter Tabs: All Pending (red badge with count) Accepted In Transit
Completed Rejected Handshakes List: Display as cards or table rows: Each
handshake shows: Handshake Reference (e.g., HS-2024-001) Vehicle (plate
number, make/model) From Branch → To Branch (with arrow icon) Status
badge (color-coded) ETA (Expected Time of Arrival) If overdue, show in
red with "OVERDUE" label Requested by (user name + date) Progress bar
(visual showing: Pending → Accepted → In Transit → Completed) Actions
(dropdown) on each handshake: View Details Accept (only if to_branch =
current user's branch AND status = PENDING) Reject (same conditions as
Accept) Mark In Transit (if status = ACCEPTED) Complete Handshake (if
status = IN_TRANSIT and vehicle physically at destination) Cancel (if
status = PENDING and requested by current user) Create Handshake
Form/Modal Triggered by: "Create Handshake" button Form Fields: Vehicle
(required) Searchable dropdown Shows only vehicles in current user's
branch (if branch_admin) Shows vehicle plate, make/model, current status
Filter: Only show vehicles NOT currently in handshake From Branch
(auto-filled, read-only) Current user's branch If HQ user, can select
any branch To Branch (required) Dropdown of all branches Cannot be same
as From Branch Expected Time of Arrival (ETA) (required) Date and time
picker Must be in future Suggested default: Current time + 3 hours
Transporter/Driver (optional) Dropdown of users with role = driver Can
leave blank Notes (optional) Textarea Max 500 characters Example:
"Vehicle needs fuel before departure" Upload Documents (optional)
Multiple file upload Accepts: PDF, images Examples: Transfer
authorization, gate pass Buttons: "Cancel" "Create Handshake" (primary)
On Submit: Validate all fields Check vehicle is not already in active
handshake Generate handshake reference: HS-{YEAR}-{INCREMENT} Insert
into handshakes table: vehicle_id from_branch_id = current user's branch
to_branch_id status = PENDING requested_by = current user ID eta notes
created_at = now Upload documents to Storage bucket: handshake-docs
Store document URLs in handshake documents JSONB field Create audit log
entry Close modal Show success toast: "Handshake \[REF\] created"
Refresh handshakes list Accept Handshake Flow Who can accept: Only users
from the to_branch Triggered by: Clicking "Accept" on a pending
handshake Confirmation Modal: Title: "Accept Handshake \[REF\]?"
Message: "You are accepting the transfer of vehicle \[PLATE\] from
\[FROM BRANCH\] to your branch. Confirm?" Information shown: Vehicle
details From branch Expected arrival time Any notes Buttons: "Cancel"
"Accept Handshake" (primary) On Confirm: Transaction (must be atomic):
Update handshake: status = ACCEPTED accepted_by = current user ID
accepted_at = now Update vehicle: current_status = IN_TRANSIT Create
audit log entries (for both updates) Create notification/alert for
sender branch Send real-time event via Supabase Realtime After
transaction: Close modal Refresh handshake (status changes to ACCEPTED)
Show success toast: "Handshake accepted" Reject Handshake Flow Triggered
by: Clicking "Reject" on pending handshake Confirmation Modal: Title:
"Reject Handshake \[REF\]?" Form: Reason (required, textarea) Min 10
characters Placeholder: "Explain why you are rejecting this transfer..."
Buttons: "Cancel" "Reject" (destructive, red) On Confirm: Update
handshake: status = REJECTED rejection_reason = entered reason
accepted_by = current user (who rejected) accepted_at = now Keep vehicle
status unchanged (stays in from_branch) Create audit log Notify sender
branch Close modal Show success toast: "Handshake rejected" Refresh list
Complete Handshake Flow Who can complete: Only users from to_branch when
vehicle physically arrives Triggered by: Clicking "Complete" on
handshake with status = IN_TRANSIT Confirmation Modal: Title: "Complete
Handshake \[REF\]?" Form: Actual Arrival Time (auto-filled to now, can
edit) Date time picker Arrival Notes (optional) Textarea Any issues upon
arrival Inspection Required? (checkbox) If checked: Vehicle status
becomes PENDING_INSPECTION If unchecked: Vehicle status becomes
AVAILABLE Buttons: "Cancel" "Complete Handshake" (primary) On Confirm:
Transaction: Update handshake: status = COMPLETED completed_by = current
user ID actual_arrival_at = entered time Update vehicle:
current_branch_id = handshake to_branch_id current_status =
PENDING_INSPECTION (if checked) OR AVAILABLE If inspection required:
Create inspection task Create audit logs Notify all involved parties
After transaction: Close modal Show success toast: "Handshake completed.
Vehicle now at \[BRANCH\]" Redirect to vehicle detail page or refresh
handshakes list

3.8 Inspections Page (/inspections) URL: /inspections Who can access:
All roles (view), branch_admin, tech (create) Purpose: Record vehicle
inspections Page Header: Title: "Inspections" "New Inspection" button
Filter Options: Date range picker Vehicle search Result filter: All /
Clean / Damage / Service Due Branch filter (if HQ or super_admin)
Inspections List: Display as table or cards: Columns/Fields: Inspection
date/time Vehicle (plate, make/model) Mileage at inspection Result badge
(color-coded) Performed by (user name) Branch Photos count Actions: View
Details Create Inspection Form Triggered by: "New Inspection" button
Form Fields: Vehicle (required) Searchable dropdown Shows vehicles in
current branch Can search by plate number Inspection Type (required)
Dropdown: Return Inspection, Scheduled Inspection, Damage Inspection,
Pre-Rental Current Mileage (required) Number input Must be \>= last
recorded mileage Shows warning if much higher than expected Inspection
Checklist Pre-defined checklist items with Pass/Fail/NA radio buttons:
Exterior: Body condition (no dents or scratches) Paint condition
Windshield condition All lights working (headlights, brake lights,
signals) Mirrors intact Tire condition (tread depth OK) Tire pressure
License plates secure Interior: Seats condition (no tears or stains)
Dashboard condition Steering wheel condition Seat belts functional Air
conditioning working All controls working Cleanliness No smoking smell
Mechanical: Engine starts smoothly No unusual noises Brakes responsive
Steering responsive No fluid leaks Transmission shifts smoothly Safety:
Spare tire present and inflated Jack and tools present Fire extinguisher
present First aid kit present Warning triangle present Overall Notes
(optional) Textarea Any additional observations Photos (optional, up to
10) Multiple file upload Camera button to take photo directly Shows
thumbnails after upload Overall Result (required) Radio buttons: CLEAN -
Vehicle passed all checks, ready for use DAMAGE - Vehicle has damage
requiring attention SERVICE_DUE - Vehicle needs scheduled service
Buttons: "Cancel" "Save Inspection" (primary) On Submit: Validate all
required fields Count failed checklist items Insert into inspections
table Upload photos to Storage bucket: inspection-photos Path:
{vehicle_id}/{inspection_id}/{timestamp}-{filename} Store photo URLs in
inspection photos JSONB field Update vehicle: mileage = entered mileage
last_inspection_date = now Side effects based on result: If result =
DAMAGE: Create alert with type VEHICLE_ACCIDENT or INSPECTION_OVERDUE
Set severity = HIGH Create maintenance ticket automatically Set vehicle
current_status = MAINTENANCE If result = SERVICE_DUE: Create maintenance
ticket Set priority = MEDIUM Set vehicle current_status = MAINTENANCE or
PENDING_INSPECTION If result = CLEAN: Set vehicle current_status =
AVAILABLE Create audit log Close modal Show success toast: "Inspection
saved. Result: \[RESULT\]" If maintenance ticket created: Show
additional message "Maintenance ticket \[REF\] created" View Inspection
Details Modal Triggered by: Clicking "View Details" on any inspection
Display (read-only): Inspection date and time Vehicle details Mileage at
inspection Performed by (user name and role) Inspection type Complete
checklist with Pass/Fail/NA results Failed items highlighted in red
Overall notes Result badge Photo gallery (click to view full size)
Buttons: "Close" "Print Report" (generates PDF)

3.9 Rentals Page (/rentals) URL: /rentals Who can access: super_admin,
hq, branch_admin Purpose: Manage customer vehicle rentals Page Header:
Title: "Rentals" "New Rental" button Filter Tabs: Active (rentals
currently ongoing) Completed (returned vehicles) Overdue (past end date
but not returned) Additional Filters: Date range picker (rental start
date) Vehicle search Customer name search Branch filter Rentals List:
Columns: Contract number Customer name Vehicle (plate, make/model) Start
date End date Status badge (Active=blue, Completed=green, Overdue=red)
Total amount Branch Actions Actions dropdown: View Details Return
Vehicle (if status = Active) Edit (if status = Active) Upload Contract
(if contract_url is null) Print Contract Create Rental Form/Modal
Triggered by: "New Rental" button Form Fields: Customer Information:
Customer Name (required) Text input Full name Customer Email (optional)
Email input Customer Phone (required) Phone input Format: +966XXXXXXXXX
Customer ID Number (optional) Text input National ID or Iqama number
Rental Details: Vehicle (required) Searchable dropdown Filter: Only
vehicles with status = AVAILABLE in current branch Shows: Plate,
Make/Model, Current mileage Contract Number (required) Text input
Auto-generated suggestion shown Format: RC-\[YEAR\]-\[INCREMENT\] Unique
validation Start Date & Time (required) Date time picker Default: Now
Cannot be in past End Date & Time (required) Date time picker Must be
after start date Shows duration calculation (X days) Start Mileage
(required) Number input Pre-filled with vehicle's current mileage
Read-only Start Fuel Level (required) Slider or dropdown: 1/8, 1/4, 1/2,
3/4, Full Default: Full Payment: Total Rental Amount (required) Number
input Currency: SAR Deposit Amount (optional) Number input Currency: SAR
Documents: Upload Rental Contract (optional) PDF file upload Max size:
10MB Can be added later Notes (optional) Textarea Buttons: "Cancel"
"Create Rental" (primary) On Submit: Transaction: Validate all fields
Check vehicle is still AVAILABLE Insert into rentals table: All customer
info Contract number Vehicle ID Start/end dates Mileage and fuel Amounts
status = ACTIVE created_by = current user Update vehicle: current_status
= ON_RENT If contract uploaded: Upload to Storage bucket: contracts
Path: {rental_id}/{contract_no}.pdf Store URL in rental contract_url
Create audit logs Close modal Show success toast: "Rental
\[CONTRACT_NO\] created" Redirect to rental details or refresh list
Return Vehicle Flow Triggered by: Clicking "Return Vehicle" on active
rental Return Vehicle Modal: Title: "Return Vehicle - Contract \[NO\]"
Display (read-only): Customer name Vehicle details Rental period Start
mileage and fuel level Form Fields: Actual Return Date & Time (required)
Pre-filled with now Can be edited if returned earlier End Mileage
(required) Number input Must be \>= start mileage Shows distance
traveled: (end - start) km End Fuel Level (required) Dropdown: 1/8, 1/4,
1/2, 3/4, Full If less than start fuel level, show warning: "Customer
should refuel" Vehicle Condition Photos (optional, up to 10) Multiple
upload Camera option Return Notes (optional) Textarea Any damage or
issues noted Requires Inspection? (checkbox, default: checked) If
checked: Vehicle goes to PENDING_INSPECTION If unchecked: Vehicle goes
to AVAILABLE Buttons: "Cancel" "Complete Return" (primary) On Submit:
Transaction: Update rental: status = CLOSED actual_return_at = entered
time end_mileage = entered mileage end_fuel_level = selected level
Update vehicle: current_status = PENDING_INSPECTION or AVAILABLE mileage
= end mileage Upload photos if provided: Bucket: rental-returns Link to
rental record If "Requires Inspection" checked: Create inspection task
for this vehicle Assign to current branch Create audit logs Close modal
Show success toast: "Vehicle returned successfully" If inspection task
created: "Inspection task created"

3.10 Corporates Page (/corporates) URL: /corporates Who can access:
super_admin, hq, corporate_admin Purpose: Manage corporate client
accounts Page Header: Title: "Corporate Clients" "Add Corporate" button
Corporates List: Columns: Corporate name Key contact person Contact
email Contact phone MSA (Master Service Agreement) expiry date If \< 30
days: Red badge "Expiring Soon" If \< 7 days: Red badge "Urgent" If
expired: Red badge "EXPIRED" Active contracts count Total fleet size
(vehicles rented to this corporate) Actions Actions dropdown: View
Details Edit Upload MSA Document View Rental History Deactivate Add
Corporate Modal Form Fields: Corporate Name (required) Text input Key
Contact Person (required) Text input Full name of primary contact
Contact Email (required) Email input Contact Phone (required) Phone
input Corporate Address (optional) Textarea MSA Start Date (optional)
Date picker MSA Expiry Date (required if MSA Start Date filled) Date
picker Must be after start date Triggers alerts at 30/7/3 days before
expiry Upload MSA Document (optional) PDF upload Credit Limit (optional)
Number input Currency: SAR Payment Terms (optional) Dropdown: Net 15,
Net 30, Net 45, Net 60 Notes (optional) Textarea Buttons: "Cancel" "Add
Corporate" (primary) On Submit: Validate fields Insert into corporates
table Upload MSA if provided to Storage: msa-documents Create audit log
If MSA expiry \< 30 days: Create alert Close modal Show success toast
MSA Expiry Alerts System Automatic Alert Creation: The system should
check daily (via cron job or scheduled function): 30 days before expiry:
Create alert type MSA_EXPIRY, severity MEDIUM Title: "MSA expiring in 30
days" Assign to HQ team 7 days before expiry: Create alert type
MSA_EXPIRY, severity HIGH Title: "MSA expiring in 7 days - urgent
renewal needed" 3 days before expiry: Create alert type MSA_EXPIRY,
severity CRITICAL Title: "MSA expiring in 3 days - immediate action
required" On expiry date: Update corporate record: is_active = false
Create alert: "MSA EXPIRED - cannot create new rentals"

3.11 Alerts Page (/alerts) URL: /alerts Who can access: All
authenticated users Purpose: View and manage system alerts Page Header:
Title: "Alerts" Subtitle showing unresolved count Filter Options:
Severity Filter (multi-select) Critical (red) High (orange) Medium
(yellow) Low (gray) Type Filter (dropdown) All Types Vehicle Accident
Maintenance Due Inspection Overdue Handshake Overdue Rental Overdue MSA
Expiry SLA Breach System Status Filter (tabs) Unresolved (default)
Acknowledged Resolved Date Range Alerts List: Display as cards or table:
Each alert shows: Severity icon (color-coded, left side) Title (bold)
Type badge Message (preview, truncated) Reference (clickable link to
related entity) Example: Vehicle ABC123 (links to vehicle page) Created
date/time Acknowledged by (if acknowledged) Status badge Actions
dropdown Actions: View Details Acknowledge (if unacknowledged) Assign to
User Escalate to HQ Mark as Resolved (if acknowledged) Alert Detail
Modal Triggered by: Clicking "View Details" or clicking on alert card
Display: Full alert title Severity badge (large) Type badge Complete
message text Reference information with link Branch involved (if
applicable) Vehicle involved (if applicable) Created by / Created at
Acknowledged by / Acknowledged at (if acknowledged) Escalated to /
Escalated at (if escalated) Resolution notes (if resolved) Actions
(buttons at bottom): "Acknowledge" (if not yet acknowledged) "Assign to
User" (dropdown of users) "Escalate to HQ" "Mark as Resolved" (with
resolution notes textarea) "Close" Acknowledge Flow: User clicks
"Acknowledge" System updates alert: acknowledged_by = current user ID
acknowledged_at = now Alert status changes to "Acknowledged" Show
success toast: "Alert acknowledged" Refresh alert in list Escalate Flow:
User clicks "Escalate to HQ" Show confirmation modal On confirm:
escalated_to = HQ admin or specific user escalated_at = now Create
notification for HQ team Show success toast Resolve Flow: User clicks
"Mark as Resolved" Show modal with textarea: "Resolution Notes"
(required) On submit: is_resolved = true resolved_by = current user
resolved_at = now Store resolution notes Alert moves to Resolved tab
Show success toast

3.12 Driver Portal (/driver) URL: /driver Who can access: Users with
role = driver Purpose: Mobile-friendly interface for drivers Design:
Mobile-first, simple UI Page Layout: Header: Marsana logo Driver name
Current branch Logout button Main Section: Active Task Card (if driver
has task assigned): Shows large card with: Task title Vehicle details
(plate, make/model) Task type (Handshake delivery, Inspection, etc.)
Start location → Destination Expected completion time Countdown timer if
overdue Checklist Section: Simple checklist items with checkboxes:
Vehicle picked up Documents verified Pre-trip inspection done Fuel
checked Arrived at destination Vehicle handed over Documents submitted
Photo Upload Section: Camera button (large, centered) "Take Photo" text
Shows thumbnails of uploaded photos Can take multiple photos Photos
tagged with GPS location and timestamp Notes Field: Simple textarea
Placeholder: "Add any notes about this task..." Action Button (large,
full-width): "Mark Task Completed" button Disabled until required
checklist items checked On Task Complete: Show confirmation modal:
"Complete this task?" If confirmed: Upload all photos to Storage Save
checklist results Save notes Update task status to COMPLETED Update
related handshake/inspection/rental Create audit log Show success
message Clear task from screen Show "No active tasks" state No Active
Tasks State: Message: "No tasks assigned" "Check for new tasks" button
Shows list of recently completed tasks Offline Support (Optional): If
network unavailable: Allow photo capture and storage locally Queue
checklist updates Show "Offline" badge Sync when connection restored

4.  Database Schema (Complete) 4.1 Tables Table: branches Purpose: Store
    branch information Columns: id UUID PRIMARY KEY DEFAULT
    uuid_generate_v4() code VARCHAR(20) UNIQUE NOT NULL name
    VARCHAR(100) NOT NULL type ENUM('HQ', 'B2B', 'B2C') NOT NULL address
    TEXT city VARCHAR(50) phone VARCHAR(20) email VARCHAR(100)
    parent_branch_id UUID REFERENCES branches(id) is_active BOOLEAN
    DEFAULT true created_at TIMESTAMPTZ DEFAULT NOW() updated_at
    TIMESTAMPTZ DEFAULT NOW() Indexes: Primary key on id Unique index on
    code Initial Data: INSERT INTO branches (code, name, type, city)
    VALUES ('JED-HQ', 'Jeddah HQ', 'HQ', 'Jeddah'), ('RYD-CORP', 'Riyadh
    Corporate', 'B2B', 'Riyadh'), ('DAM-CORP', 'Dammam Corporate',
    'B2B', 'Dammam'), ('RYD-SUL', 'Al Sulaimaniyyah', 'B2C', 'Riyadh'),
    ('RYD-GRN', 'Garnatha', 'B2C', 'Riyadh'); Table: users Purpose:
    Store user accounts (extends Supabase auth.users) Columns: id UUID
    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE email
    VARCHAR(255) NOT NULL UNIQUE full_name VARCHAR(100) NOT NULL role
    ENUM('super_admin', 'hq', 'branch_admin', 'driver', 'tech',
    'corporate_admin') NOT NULL DEFAULT 'driver' branch_id UUID
    REFERENCES branches(id) phone VARCHAR(20) avatar_url TEXT is_active
    BOOLEAN DEFAULT true last_login_at TIMESTAMPTZ created_at
    TIMESTAMPTZ DEFAULT NOW() updated_at TIMESTAMPTZ DEFAULT NOW()
    Indexes: Primary key on id Index on branch_id Index on role Unique
    index on email Table: vehicles Purpose: Store vehicle information
    Columns: id UUID PRIMARY KEY DEFAULT uuid_generate_v4() plate_no
    VARCHAR(20) NOT NULL UNIQUE vin VARCHAR(17) UNIQUE make VARCHAR(50)
    NOT NULL model VARCHAR(50) NOT NULL year INTEGER color VARCHAR(30)
    mileage INTEGER DEFAULT 0 fuel_type VARCHAR(20) current_status
    ENUM('AVAILABLE', 'ON_RENT', 'IN_TRANSIT', 'PENDING_INSPECTION',
    'MAINTENANCE', 'ACCIDENT') DEFAULT 'AVAILABLE' current_branch_id
    UUID REFERENCES branches(id) assigned_driver_id UUID REFERENCES
    users(id) purchase_date DATE purchase_price DECIMAL(12, 2)
    insurance_expiry DATE registration_expiry DATE next_service_due DATE
    next_service_mileage INTEGER notes TEXT deleted_at TIMESTAMPTZ
    created_at TIMESTAMPTZ DEFAULT NOW() updated_at TIMESTAMPTZ DEFAULT
    NOW() created_by UUID REFERENCES users(id) updated_by UUID
    REFERENCES users(id) version INTEGER DEFAULT 1 Indexes: Primary key
    on id Unique index on plate_no Unique index on vin Index on
    current_status Index on current_branch_id Index on deleted_at (for
    soft delete queries) Table: handshakes Purpose: Track vehicle
    transfers between branches Columns: id UUID PRIMARY KEY DEFAULT
    uuid_generate_v4() handshake_ref VARCHAR(20) UNIQUE NOT NULL
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) from_branch_id UUID
    NOT NULL REFERENCES branches(id) to_branch_id UUID NOT NULL
    REFERENCES branches(id) status ENUM('PENDING', 'ACCEPTED',
    'REJECTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED') DEFAULT
    'PENDING' requested_by UUID NOT NULL REFERENCES users(id)
    accepted_by UUID REFERENCES users(id) completed_by UUID REFERENCES
    users(id) eta TIMESTAMPTZ actual_departure_at TIMESTAMPTZ
    actual_arrival_at TIMESTAMPTZ rejection_reason TEXT notes TEXT
    documents JSONB DEFAULT '\[\]' created_at TIMESTAMPTZ DEFAULT NOW()
    updated_at TIMESTAMPTZ DEFAULT NOW() Indexes: Primary key on id
    Unique index on handshake_ref Index on vehicle_id Index on
    from_branch_id Index on to_branch_id Index on status Table:
    inspections Purpose: Record vehicle inspections Columns: id UUID
    PRIMARY KEY DEFAULT uuid_generate_v4() vehicle_id UUID NOT NULL
    REFERENCES vehicles(id) inspection_type VARCHAR(30) DEFAULT 'RETURN'
    mileage INTEGER NOT NULL result ENUM('CLEAN', 'DAMAGE',
    'SERVICE_DUE') NOT NULL checklist JSONB DEFAULT '{}' notes TEXT
    photos JSONB DEFAULT '\[\]' performed_by UUID NOT NULL REFERENCES
    users(id) performed_at TIMESTAMPTZ DEFAULT NOW() created_at
    TIMESTAMPTZ DEFAULT NOW() Indexes: Primary key on id Index on
    vehicle_id Index on performed_at Index on result Table: rentals
    Purpose: Track customer rentals Columns: id UUID PRIMARY KEY DEFAULT
    uuid_generate_v4() contract_no VARCHAR(50) UNIQUE NOT NULL
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) customer_name
    VARCHAR(100) NOT NULL customer_email VARCHAR(100) customer_phone
    VARCHAR(20) customer_id_number VARCHAR(50) start_at TIMESTAMPTZ NOT
    NULL end_at TIMESTAMPTZ NOT NULL actual_return_at TIMESTAMPTZ
    start_mileage INTEGER end_mileage INTEGER start_fuel_level
    VARCHAR(10) end_fuel_level VARCHAR(10) status VARCHAR(20) DEFAULT
    'ACTIVE' total_amount DECIMAL(12, 2) deposit_amount DECIMAL(12, 2)
    notes TEXT contract_url TEXT created_at TIMESTAMPTZ DEFAULT NOW()
    updated_at TIMESTAMPTZ DEFAULT NOW() created_by UUID REFERENCES
    users(id) Indexes: Primary key on id Unique index on contract_no
    Index on vehicle_id Index on status Index on start_at, end_at Table:
    maintenance_tickets Purpose: Track maintenance work Columns: id UUID
    PRIMARY KEY DEFAULT uuid_generate_v4() ticket_ref VARCHAR(20) UNIQUE
    NOT NULL vehicle_id UUID NOT NULL REFERENCES vehicles(id) title
    VARCHAR(200) NOT NULL description TEXT priority ENUM('LOW',
    'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM' status VARCHAR(20)
    DEFAULT 'OPEN' assigned_to UUID REFERENCES users(id) estimated_cost
    DECIMAL(12, 2) actual_cost DECIMAL(12, 2) started_at TIMESTAMPTZ
    completed_at TIMESTAMPTZ due_date DATE related_inspection_id UUID
    REFERENCES inspections(id) notes TEXT deleted_at TIMESTAMPTZ
    created_at TIMESTAMPTZ DEFAULT NOW() updated_at TIMESTAMPTZ DEFAULT
    NOW() Indexes: Primary key on id Index on vehicle_id Index on status
    Index on assigned_to Index on due_date Table: alerts Purpose:
    System-wide notifications and alerts Columns: id UUID PRIMARY KEY
    DEFAULT uuid_generate_v4() type ENUM('VEHICLE_ACCIDENT',
    'MAINTENANCE_DUE', 'INSPECTION_OVERDUE', 'HANDSHAKE_OVERDUE',
    'RENTAL_OVERDUE', 'MSA_EXPIRY', 'SLA_BREACH', 'SYSTEM') NOT NULL
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL title
    VARCHAR(200) NOT NULL message TEXT NOT NULL reference_type
    VARCHAR(30) reference_id UUID branch_id UUID REFERENCES branches(id)
    vehicle_id UUID REFERENCES vehicles(id) assigned_to UUID REFERENCES
    users(id) acknowledged_by UUID REFERENCES users(id) acknowledged_at
    TIMESTAMPTZ escalated_to UUID REFERENCES users(id) escalated_at
    TIMESTAMPTZ is_resolved BOOLEAN DEFAULT false resolved_at
    TIMESTAMPTZ resolved_by UUID REFERENCES users(id) metadata JSONB
    DEFAULT '{}' created_at TIMESTAMPTZ DEFAULT NOW() updated_at
    TIMESTAMPTZ DEFAULT NOW() Indexes: Primary key on id Index on type
    Index on severity Index on is_resolved Index on branch_id Index on
    created_at Table: audit_logs Purpose: Track all important changes
    Columns: id UUID PRIMARY KEY DEFAULT uuid_generate_v4() table_name
    VARCHAR(50) NOT NULL record_id UUID NOT NULL action VARCHAR(20) NOT
    NULL (INSERT, UPDATE, DELETE) old_data JSONB new_data JSONB
    changed_by UUID NOT NULL REFERENCES users(id) changed_at TIMESTAMPTZ
    DEFAULT NOW() ip_address INET user_agent TEXT Indexes: Primary key
    on id Index on table_name, record_id Index on changed_by Index on
    changed_at Table: telemetry (optional) Purpose: GPS tracking data
    Columns: id UUID PRIMARY KEY DEFAULT uuid_generate_v4() vehicle_id
    UUID NOT NULL REFERENCES vehicles(id) timestamp TIMESTAMPTZ DEFAULT
    NOW() latitude DECIMAL(10, 8) longitude DECIMAL(11, 8) speed INTEGER
    heading INTEGER odometer INTEGER Indexes: Primary key on id Index on
    vehicle_id, timestamp Table: corporates Purpose: Corporate client
    information Columns: id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
    name VARCHAR(100) NOT NULL contact_person VARCHAR(100) contact_email
    VARCHAR(100) contact_phone VARCHAR(20) address TEXT msa_start_date
    DATE msa_expiry_date DATE msa_document_url TEXT credit_limit
    DECIMAL(12, 2) payment_terms VARCHAR(20) is_active BOOLEAN DEFAULT
    true notes TEXT created_at TIMESTAMPTZ DEFAULT NOW() updated_at
    TIMESTAMPTZ DEFAULT NOW() Indexes: Primary key on id Index on
    msa_expiry_date Index on is_active

5.  Row Level Security (RLS) Policies 5.1 Helper Functions Create these
    PostgreSQL functions first: -- Get current user's role CREATE OR
    REPLACE FUNCTION current_user_role() RETURNS TEXT AS LANGUAGE
    plpgsql SECURITY DEFINER; -- Get current user's branch CREATE OR
    REPLACE FUNCTION current_user_branch() RETURNS UUID AS LANGUAGE
    plpgsql SECURITY DEFINER; 5.2 RLS Policies by Table Branches Table
    Enable RLS: ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
    Policies: Read (SELECT): Everyone can view all branches CREATE
    POLICY "branches_select_all" ON branches FOR SELECT USING (true);
    Create (INSERT): Only HQ and super_admin CREATE POLICY
    "branches_insert_hq" ON branches FOR INSERT WITH CHECK (
    current_user_role() IN ('super_admin', 'hq') ); Update: Only HQ and
    super_admin CREATE POLICY "branches_update_hq" ON branches FOR
    UPDATE USING ( current_user_role() IN ('super_admin', 'hq') );
    Vehicles Table Enable RLS: ALTER TABLE vehicles ENABLE ROW LEVEL
    SECURITY; Policies: Read: Everyone can see non-deleted vehicles
    CREATE POLICY "vehicles_select_all" ON vehicles FOR SELECT USING
    (deleted_at IS NULL); Create: Only HQ and super_admin CREATE POLICY
    "vehicles_insert_hq" ON vehicles FOR INSERT WITH CHECK (
    current_user_role() IN ('super_admin', 'hq') ); Update (HQ): HQ can
    update any vehicle CREATE POLICY "vehicles_update_hq" ON vehicles
    FOR UPDATE USING ( current_user_role() IN ('super_admin', 'hq') );
    Update (Branch Admin): Can update vehicles in their branch CREATE
    POLICY "vehicles_update_branch" ON vehicles FOR UPDATE USING (
    current_user_role() = 'branch_admin' AND current_branch_id =
    current_user_branch() ); Handshakes Table Enable RLS: ALTER TABLE
    handshakes ENABLE ROW LEVEL SECURITY; Policies: Read: Everyone can
    view all handshakes CREATE POLICY "handshakes_select_all" ON
    handshakes FOR SELECT USING (true); Create: Can create if from your
    branch OR you're HQ CREATE POLICY "handshakes_insert" ON handshakes
    FOR INSERT WITH CHECK ( from_branch_id = current_user_branch() OR
    current_user_role() IN ('super_admin', 'hq') ); Update: Can update
    if you're sender, receiver, or HQ CREATE POLICY "handshakes_update"
    ON handshakes FOR UPDATE USING ( to_branch_id =
    current_user_branch() OR from_branch_id = current_user_branch() OR
    current_user_role() IN ('super_admin', 'hq') ); Rentals Table Enable
    RLS: ALTER TABLE rentals ENABLE ROW LEVEL SECURITY; Policies: Read:
    Everyone authenticated can view CREATE POLICY "rentals_select_all"
    ON rentals FOR SELECT USING (true); Create: Only HQ and branch_admin
    CREATE POLICY "rentals_insert" ON rentals FOR INSERT WITH CHECK (
    current_user_role() IN ('super_admin', 'hq', 'branch_admin') );
    Update: Same as create CREATE POLICY "rentals_update" ON rentals FOR
    UPDATE USING ( current_user_role() IN ('super_admin', 'hq',
    'branch_admin') ); Alerts Table Enable RLS: ALTER TABLE alerts
    ENABLE ROW LEVEL SECURITY; Policies: Read: Everyone can view alerts
    CREATE POLICY "alerts_select_all" ON alerts FOR SELECT USING (true);
    Create: Anyone authenticated (system can create alerts) CREATE
    POLICY "alerts_insert_all" ON alerts FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL ); Update: Can update if alert in your branch
    or you're HQ CREATE POLICY "alerts_update" ON alerts FOR UPDATE
    USING ( branch_id = current_user_branch() OR current_user_role() IN
    ('super_admin', 'hq') ); Inspections Table Enable RLS: ALTER TABLE
    inspections ENABLE ROW LEVEL SECURITY; Policies: Read: Everyone
    CREATE POLICY "inspections_select_all" ON inspections FOR SELECT
    USING (true); Create: Anyone authenticated can create inspections
    CREATE POLICY "inspections_insert_all" ON inspections FOR INSERT
    WITH CHECK ( auth.uid() IS NOT NULL );

6.  Supabase Storage Buckets 6.1 Required Buckets Create these storage
    buckets in Supabase dashboard: vehicle-docs Purpose: Vehicle-related
    documents (insurance, registration, etc.) Public: No File size
    limit: 25MB Allowed MIME types: PDF, images inspection-photos
    Purpose: Photos from vehicle inspections Public: No File size limit:
    10MB per file Allowed MIME types: JPEG, PNG handshake-docs Purpose:
    Transfer authorization documents Public: No File size limit: 10MB
    Allowed MIME types: PDF, images contracts Purpose: Rental contract
    PDFs Public: No File size limit: 10MB Allowed MIME types: PDF
    msa-documents Purpose: Corporate MSA agreements Public: No File size
    limit: 25MB Allowed MIME types: PDF rental-returns Purpose: Photos
    taken when vehicle is returned Public: No File size limit: 10MB
    Allowed MIME types: JPEG, PNG 6.2 Storage Policies For all buckets:
    Upload Policy: -- Allow authenticated users to upload to their
    related records CREATE POLICY "Allow authenticated upload" ON
    storage.objects FOR INSERT WITH CHECK ( auth.uid() IS NOT NULL );
    Read Policy: -- Allow authenticated users to view CREATE POLICY
    "Allow authenticated read" ON storage.objects FOR SELECT USING (
    auth.uid() IS NOT NULL ); Delete Policy: -- Only HQ and super_admin
    can delete CREATE POLICY "Allow HQ delete" ON storage.objects FOR
    DELETE USING ( EXISTS ( SELECT 1 FROM users WHERE id = auth.uid()
    AND role IN ('super_admin', 'hq') ) );

7.  Business Logic & State Machine 7.1 Vehicle Status State Machine
    Implementation Notes: When changing vehicle status, the system MUST:
    Validate transition is allowed (see Section 2) Execute side effects:
    Side Effects by New Status: To ACCIDENT: Create alert (type:
    VEHICLE_ACCIDENT, severity: CRITICAL) Create maintenance ticket
    Notify HQ immediately To MAINTENANCE: Create or link maintenance
    ticket If reason mentions "urgent" or "brake" → priority = URGENT
    Otherwise priority = MEDIUM To PENDING_INSPECTION: Create inspection
    task Assign to current branch admin To ON_RENT: Must have active
    rental record Rental must be in ACTIVE status To IN_TRANSIT: Must
    have active handshake Handshake status must be ACCEPTED Create audit
    log with old status → new status 7.2 Handshake Lifecycle States:
    PENDING → ACCEPTED → IN_TRANSIT → COMPLETED Transactional
    Requirements: On CREATE: Vehicle must be in sender's branch Vehicle
    must NOT be in another active handshake Vehicle status changes to
    IN_TRANSIT only after acceptance On ACCEPT: Must be atomic
    transaction: BEGIN; UPDATE handshakes SET status = 'ACCEPTED',
    accepted_by = ?, accepted_at = NOW(); UPDATE vehicles SET
    current_status = 'IN_TRANSIT'; INSERT INTO audit_logs (...); COMMIT;
    On COMPLETE: Must be atomic transaction: BEGIN; UPDATE handshakes
    SET status = 'COMPLETED', completed_by = ?, actual_arrival_at =
    NOW(); UPDATE vehicles SET current_branch_id = to_branch_id,
    current_status = 'PENDING_INSPECTION'; INSERT INTO audit_logs (...);
    COMMIT; 7.3 Rental Lifecycle States: Create → ACTIVE → Return →
    CLOSED On CREATE: Vehicle must be AVAILABLE Start date must not
    conflict with other rentals Transaction: BEGIN; INSERT INTO rentals
    (...); UPDATE vehicles SET current_status = 'ON_RENT'; COMMIT; On
    RETURN: Transaction: BEGIN; UPDATE rentals SET status = 'CLOSED',
    actual_return_at = NOW(), end_mileage = ?, end_fuel = ?; UPDATE
    vehicles SET current_status = 'PENDING_INSPECTION', mileage = ?; --
    If inspection required: INSERT INTO inspection_tasks (...); COMMIT;
    7.4 Inspection Side Effects Based on result: CLEAN: Update vehicle:
    status = AVAILABLE No additional actions DAMAGE: Create alert (type:
    VEHICLE_ACCIDENT) Create maintenance ticket (priority: HIGH) Update
    vehicle: status = MAINTENANCE Notify branch admin SERVICE_DUE:
    Create maintenance ticket (priority: MEDIUM) Update vehicle: status
    = MAINTENANCE Schedule service appointment

8.  UI/UX Specifications 8.1 Confirmation Modals All destructive or
    state-changing actions must have confirmation modals. Standard Modal
    Structure: Title clearly states action Body explains consequences
    Two buttons: Cancel (left, secondary) and Confirm (right, primary or
    destructive) Examples: Logout Delete vehicle Reject handshake
    Complete handshake Change vehicle status Mark task complete 8.2
    Optimistic UI For status changes and quick updates: Show change
    immediately in UI Send request to server If success: Keep change If
    error: Revert change, show error toast Example: Changing vehicle
    status in table Immediately update status chip color Show loading
    spinner On success: Remove spinner On error: Revert color, show
    "Failed to update" toast 8.3 Concurrency Handling Use version field
    in vehicles table for optimistic locking: When loading vehicle for
    edit, note current version When updating, include version in WHERE
    clause: UPDATE vehicles SET status = ?, version = version + 1, ...
    WHERE id = ? AND version = ? If no rows updated (version mismatch):
    Show conflict modal: "This vehicle was updated by another user.
    Please refresh and try again." Buttons: "Refresh" or "Cancel" 8.4
    File Upload Progress All file uploads should show: Progress bar
    (0-100%) File name File size Cancel button (while uploading) Success
    checkmark or error icon when done 8.5 Accessibility Required
    accessibility features: Modals: Focus trap (tab cycles within modal)
    Close on Escape key Focus on first input when opened Return focus to
    trigger button when closed Forms: All inputs have labels Required
    fields marked with \* Error messages announced to screen readers
    Disabled state clearly visible Buttons: Clear hover states Focus
    indicators (outline) Disabled state distinguishable Tables: Sortable
    columns announced Row selection state clear Color: Status colors
    meet WCAG AA contrast requirements Don't rely only on color (use
    icons/text too) 8.6 Toast Notifications Show toast for: Success
    actions ("Vehicle added successfully") Errors ("Failed to save
    changes") Warnings ("Vehicle insurance expires in 7 days") Info
    ("Background export completed") Toast properties: Duration: 3
    seconds (success), 5 seconds (error) Position: Top-right Dismissable
    with X button Max 3 toasts stacked

9.  Testing Requirements 9.1 End-to-End Tests (Playwright) Required test
    scenarios: Login Flow Valid login redirects correctly by role
    Invalid credentials show error Remember me persists session Create
    and Accept Handshake Login as branch_admin in Riyadh Create
    handshake to Dammam Login as Dammam branch_admin Accept handshake
    Verify vehicle status changes to IN_TRANSIT Complete handshake
    Verify vehicle moves to Dammam branch Create Rental and Return Login
    as branch_admin Create rental for available vehicle Verify vehicle
    status = ON_RENT Return vehicle Verify status = PENDING_INSPECTION
    Verify inspection task created Create Inspection → Maintenance
    Ticket Login as tech Create inspection with result = DAMAGE Verify
    maintenance ticket auto-created Verify alert created Verify vehicle
    status = MAINTENANCE Alert Acknowledgement Login as hq View alerts
    page Acknowledge critical alert Verify alert status updated Vehicle
    Status Change Validation Try invalid status change (e.g., ON_RENT →
    AVAILABLE) Verify error message shown Try valid status change Verify
    success

10. Deployment Checklist 10.1 Supabase Setup \[ \] Create Supabase
    project \[ \] Run all SQL migrations in order \[ \] Create storage
    buckets \[ \] Configure storage policies \[ \] Enable Realtime on
    required tables \[ \] Set up cron job for MSA expiry checks \[ \]
    Add custom domain (if needed) 10.2 Vercel Setup \[ \] Connect GitHub
    repository to Vercel \[ \] Add environment variables:
    NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY NEXT_PUBLIC_APP_URL \[ \] Set Node.js
    version to 20.x \[ \] Enable automatic deployments \[ \] Configure
    production domain \[ \] Set up preview deployments for PRs 10.3
    GitHub Actions Create workflow files: .github/workflows/test.yml -
    Run tests on PR .github/workflows/deploy.yml - Deploy to Vercel on
    push to main 10.4 Pre-Production Checklist \[ \] All RLS policies
    tested and working \[ \] All storage buckets have correct policies
    \[ \] No hardcoded secrets in code \[ \] Error logging configured \[
    \] Performance monitoring set up \[ \] Backup strategy defined \[ \]
    All E2E tests passing \[ \] Mobile responsiveness tested \[ \]
    Accessibility audit passed \[ \] Load testing completed

11. Development Phases (Suggested Order) Phase 1: Foundation (Week 1)
    Database schema and migrations Supabase setup Basic authentication
    User management Branch management Phase 2: Core Features (Week 2-3)
    Vehicles CRUD Vehicle status management Basic dashboards Handshake
    create/accept/complete Phase 3: Operations (Week 4) Inspections
    Rentals Maintenance tickets Alerts system Phase 4: Advanced (Week 5)
    Corporates management Driver portal Telemetry (if needed) Real-time
    updates Phase 5: Polish (Week 6) E2E tests Mobile optimization
    Accessibility improvements Performance optimization Documentation

12. Key Implementation Notes for AI Builder When building this app: Use
    exact status strings - Don't change AVAILABLE to Available Always
    use transactions for related updates (handshake + vehicle) Create
    audit logs for all important changes Validate on both client and
    server - Never trust client Use Supabase RLS instead of API
    middleware where possible Status changes must follow state machine
    rules exactly All modals need confirmation for destructive actions
    File uploads must show progress and handle errors Toast
    notifications for all user actions Real-time updates for dashboards
    via Supabase Realtime Soft delete vehicles (deleted_at) not hard
    delete Version field for optimistic locking on vehicles Form
    validation on both client (instant) and server (security)
    Mobile-first design for Driver Portal Accessibility is not
    optional - implement properly

## End of Specification Document

# 13. Production Readiness Enhancements (Additive)

> This entire section is **additive** and does not remove or change any
> prior requirements. It exists to ensure the system is
> **production-ready**, secure, observable, and deployable with minimal
> ambiguity.

## 13.1 Non-Functional Requirements (NFRs)

### Performance

-   **P95 page load** (authenticated pages): ≤ 2.5s on 4G-class network
-   **P95 API read**: ≤ 300ms for common list queries (vehicles,
    handshakes, rentals)
-   Pagination required for all list endpoints (already specified) and
    **must be enforced server-side**
-   Default page size: 25 (already specified). Allow 25/50/100 for HQ
    users.

### Reliability

-   Target availability: **99.5%** monthly for production
-   Graceful degradation: if Realtime is unavailable, dashboards still
    load via polling fallback (60s).

### Security

-   All tables: RLS enabled (some already listed). **No table may be
    accessible without RLS** unless explicitly justified.
-   Storage: buckets are private; access via **signed URLs** and/or
    authenticated download endpoint.
-   Secrets: never in client bundle; service role key only on server
    routes / Edge Functions.

### Usability

-   Mobile-first for driver portal (already specified)
-   Arabic/English ready (see i18n section)

### Compliance (Saudi Arabia)

-   Store timestamps as TIMESTAMPTZ; show in **Asia/Riyadh** local time
    in UI
-   Currency displayed as **SAR** everywhere; formatting: 1,234.00 SAR

## 13.2 Roles & Permissions Matrix (Clarifies Existing Rules)

  ------------------------------------------------------------------------------------------------------------------------
  Feature / Area             super_admin     hq    branch_admin         driver                      tech   corporate_admin
  ------------------------ ------------- ------ --------------- -------------- ------------------------- -----------------
  View Vehicles                       ✅     ✅ ✅ (own branch) ✅ (read-only)                        ✅    ✅ (read-only)

  Add/Edit/Delete Vehicle             ✅     ✅ ✅ (own branch,             ❌                        ❌                ❌
                                                      no delete                                          
                                                unless allowed)                                          

  Change Vehicle Status               ✅     ✅ ✅ (own branch)   ✅ (only via                   ✅ (via                ❌
                                                                 assigned task   inspections/maintenance 
                                                                        flows)                    flows) 

  Handshakes                          ✅     ✅              ✅             ✅                        ❌                ❌
  create/accept/complete                                          (task-based)                           

  Inspections create                  ✅     ✅              ✅             ❌                        ✅                ❌

  Rentals create/return               ✅     ✅              ✅             ❌                        ❌   ✅ (view only /
                                                                                                                manage own
                                                                                                               corporates)

  Corporates CRUD                     ✅     ✅              ❌             ❌                        ❌      ✅ (limited)

  Alerts                              ✅     ✅      ✅ (branch      ✅ (view)                 ✅ (view)         ✅ (view)
  acknowledge/resolve                                   scoped)                                          

  User Management                     ✅     ✅         Limited             ❌                        ❌                ❌
                                                  (drivers/tech                                          
                                                 in own branch)                                          
  ------------------------------------------------------------------------------------------------------------------------

**Implementation requirement:** enforce this matrix in **both** UI and
RLS (and server routes if used).

## 13.3 Local Development Standard (No-Experience Friendly)

### Required tools

-   Node.js **20.x**
-   GitHub account
-   Supabase account
-   Vercel account

### Local run (frontend)

1.  Install dependencies: `npm install`
2.  Copy env: `.env.example` → `.env.local`
3.  Run: `npm run dev`
4.  Open: `http://localhost:3000`

### Local run (Supabase)

Use Supabase CLI optional: - `supabase init` - `supabase start` -
`supabase db reset` (runs migrations + seed)

## 13.4 Repository & Folder Structure (Recommended)

    /apps/web
      /app
      /components
      /lib
      /styles
      /tests (Playwright)
      middleware.ts
    /supabase
      /migrations
      /seed
      /functions (optional Edge Functions)
    /.github/workflows
      test.yml
      deploy.yml

## 13.5 Environment Variables (Production Minimum)

Client-safe: - `NEXT_PUBLIC_SUPABASE_URL` -
`NEXT_PUBLIC_SUPABASE_ANON_KEY` - `NEXT_PUBLIC_APP_URL`

Server-only (never exposed to browser): - `SUPABASE_SERVICE_ROLE_KEY`
(only if server routes or admin scripts require it) - `SENTRY_DSN`
(optional) - `RESEND_API_KEY` / email provider key (optional) -
`CRON_SECRET` (if you secure scheduled endpoints)

## 13.6 Migrations & Seeding (Critical for "Deploy and Use Immediately")

### Migration ordering

-   `001_extensions.sql` (uuid-ossp, pgcrypto)
-   `010_enums.sql`
-   `020_tables.sql`
-   `030_indexes.sql`
-   `040_functions.sql` (helper functions, reference generators)
-   `050_rls.sql`
-   `060_storage_policies.sql`

### Seed requirements (must exist in production)

-   Branch records (already listed)
-   **Default admin** user record in `users` table after auth user is
    created
-   Optional demo vehicles for testing

### One-time bootstrap

Provide an Admin-only action to: - Create initial branches (if not
present) - Create initial role assignments - Confirm RLS is active

**Safety rule:** bootstrap must run **only once** (use a Firestore-like
flag equivalent: a `settings` table row or `app_config` table).

## 13.7 Notifications & Background Jobs (Production Pattern)

### Required scheduled jobs

-   Daily MSA expiry checker (already specified)
-   Daily: inspection overdue (if you adopt "24h overdue" as a rule)
-   Hourly: handshake overdue (ETA + 2 hours)
-   Hourly: rental overdue (end_at passed and not closed)

### Implementation options

-   **Supabase Scheduled Functions** (recommended)
-   Or Vercel Cron hitting a secured API route

**All scheduled endpoints must be authenticated** (shared secret
header).

## 13.8 Observability (Logging, Monitoring, Error Handling)

### Error tracking

-   Add Sentry (or equivalent) to capture:
    -   Frontend runtime errors
    -   Server/Edge function errors

### Structured logs

-   Log critical actions:
    -   status changes
    -   handshake transitions
    -   rental create/return
    -   inspection create
    -   corporate MSA updates
-   Always include: `user_id`, `branch_id`, `entity_id`, `action`,
    `timestamp`

### Audit logs

Already specified: `audit_logs`. Ensure you write audit logs: - On every
INSERT/UPDATE/DELETE of core tables - Include `ip_address` and
`user_agent` when possible (from request headers in server routes)

## 13.9 Backups & Data Retention

-   Enable Supabase automated backups (daily) + point-in-time recovery
    if available
-   Export critical tables weekly to object storage (optional)
-   Retain audit logs for **at least 24 months**
-   Soft deletes: keep deleted records accessible to HQ for restore

## 13.10 Security Hardening Checklist (Additive)

-   Confirm RLS enabled on **all** tables (including `users`,
    `maintenance_tickets`, `corporates`, `audit_logs`)
-   Add RLS policies for missing tables:
    -   `users`: users can read self; HQ can read all; branch_admin can
        read branch users
    -   `maintenance_tickets`: branch scope + HQ override
    -   `corporates`: HQ/corporate_admin scope
    -   `audit_logs`: HQ/super_admin only
-   Storage policies must enforce:
    -   path-based access (vehicle_id based folders)
    -   delete restricted to HQ/super_admin (already specified but
        refine to bucket scope)
-   Rate limit auth endpoints at edge (Vercel protections) if possible
-   Enforce password policies via Supabase Auth settings (min length,
    etc.)

## 13.11 Data Validation Rules (Server-Side Must)

Client validation is UX only. Server must enforce: - Unique constraints
(plate_no, vin, contract_no, handshake_ref, ticket_ref) - State machine
transition validity for vehicle status changes - Atomic transactions for
handshake accept/complete and rental create/return (already specified) -
Mileage monotonicity (cannot decrease) - Dates: ETA must be future;
rental end \> start; MSA expiry \> start (if start exists)

## 13.12 Release Workflow (Safe Deployments)

-   Branching: `main` (production), `dev` (staging)
-   Preview deployments for PRs (already referenced)
-   Mandatory checks before merge:
    -   Typecheck
    -   Lint
    -   Playwright E2E smoke tests
-   Tag releases: `v1.0.0`, `v1.1.0` etc.
-   Maintain `CHANGELOG.md`

## 13.13 Internationalization (i18n) & Localization (Optional but Recommended)

-   Default language: English
-   Second language: Arabic
-   Use `next-intl` or similar; store language in user profile
-   All dates shown in locale-friendly format; time zone fixed to
    Asia/Riyadh
-   RTL layout support for Arabic (at least Driver Portal + key
    dashboards)

## 13.14 Acceptance Criteria (Production Ready Definition)

The app is considered production-ready when: - A new Supabase project
can be created and fully initialized by running migrations + seed - A
default admin can log in and create: - Branch users - Vehicles -
Handshake, inspection, rental end-to-end flows - RLS prevents
cross-branch data leaks (verified with tests) - Storage access is
private and authenticated - E2E tests pass in CI - Monitoring is enabled
and captures errors - Backups are configured

------------------------------------------------------------------------

# 14. Recommended "Fastest + Most Powerful" Build Platform (Beginner-Friendly)

This project spec already targets **Next.js + Supabase + Vercel**. The
fastest "advanced" way to build it with AI help:

## Option A (Best overall): Cursor IDE + GitHub + Vercel + Supabase

Why: strongest AI coding, works on Windows, full control,
production-grade.

## Option B (Easiest for beginners): Replit + GitHub + Vercel + Supabase

Why: zero local setup; slightly less control but very fast to start.

## Option C (UI-first speed): Vercel v0 for UI + Cursor for integration

Why: v0 generates screens quickly; Cursor completes business logic and
RLS.

------------------------------------------------------------------------

# 15. Step-by-Step Build Guide (No Prior Experience)

## Step 1 --- Create accounts

1.  Create/confirm accounts: GitHub, Supabase, Vercel

## Step 2 --- Create Supabase project

1.  In Supabase, create project: `marsana-fleet-prod`
2.  Save: Project URL + anon key + service role key (keep service key
    private)

## Step 3 --- Initialize database

1.  Create a `/supabase/migrations` folder in your repo
2.  Paste SQL migrations (schema + RLS + functions) in order
3.  Run them in Supabase SQL Editor (or via CLI)

## Step 4 --- Create Storage buckets

Create buckets listed in the spec (already defined) and apply policies.

## Step 5 --- Create the Next.js app

1.  Run:
    `npx create-next-app@latest marsana-fleet --ts --tailwind --eslint --app`
2.  Install: `@supabase/supabase-js`, `zod`, `react-hook-form`,
    `@hookform/resolvers`, `lucide-react`, `sonner` (toast)

## Step 6 --- Add authentication

1.  Implement `/login`
2.  Add middleware to protect routes
3.  Create `users` profile table mapping auth → role

## Step 7 --- Build core modules in this order

1.  Vehicles (list + detail + status change)
2.  Handshakes (create + accept + complete)
3.  Inspections (create + view)
4.  Rentals (create + return)
5.  Alerts (view + acknowledge + resolve)
6.  Dashboards (HQ + Branch)
7.  Driver Portal

## Step 8 --- Testing

1.  Add Playwright tests from section 9
2.  Ensure CI runs them on every PR

## Step 9 --- Deploy to Vercel

1.  Push code to GitHub
2.  Import repo in Vercel
3.  Add env vars
4.  Deploy

## Step 10 --- Production hardening

1.  Enable backups
2.  Configure monitoring (Sentry)
3.  Set up scheduled jobs (MSA + overdue checks)
4.  Create first real users and start operations

------------------------------------------------------------------------

# Version 1.2 -- Super Admin, Dynamic Permissions, and Complete CRUD Coverage

## 16. Super Admin Capabilities

The **Super Admin** is the highest authority in the system and is
created only once by the system builder during initial deployment.

### Super Admin Permissions

-   Create, edit, and delete **branches**
-   Create, edit, disable, and delete **users**
-   Assign each user to a **specific branch**
-   Define **granular permissions per feature**:
    -   View
    -   Create
    -   Edit
    -   Delete
-   Access **all modules and reports** without restriction
-   Configure system‑wide settings

> There are **no fixed predefined roles**.\
> Permissions are **fully controlled by Super Admin per user**.

------------------------------------------------------------------------

## 17. Dynamic User Permission Model (No Fixed Roles)

### Key Principles

-   The system **does not rely on traditional role tables**.
-   Each user has:
    -   **Designation label** (text field for job title)
    -   **Branch assignment**
    -   **Custom permission matrix** defined by Super Admin.

### Permission Structure

For every module: - can_view - can_create - can_edit - can_delete

Stored as: - JSON permission map **OR** - Relational permission table
(recommended for auditability).

------------------------------------------------------------------------

## 18. Branch Management Workflow

### Create Branch

**Form Fields** - Branch Name (required, unique) - Address - Contact
Number - Status (Active/Inactive)

**Validation** - Branch name must be unique. - Cannot delete branch with
active users or data.

### Edit Branch

-   Only Super Admin allowed.
-   Changes logged in audit trail.

### Delete Branch

-   Soft delete only.
-   Blocked if:
    -   Users exist
    -   Transactions exist

------------------------------------------------------------------------

## 19. User Management Workflow

### Create User (Super Admin Only)

**Form Fields** - Full Name (required) - Email (required, unique) -
Phone - Password (min security rules) - Branch (required) - Designation
(free‑text label) - Permission Matrix (checkbox grid per module)

### Validation Rules

-   Email must be unique.
-   Password strength enforced.
-   Must select at least **one view permission**.

### Edit User

-   Super Admin can:
    -   Change branch
    -   Change permissions
    -   Reset password
    -   Disable account

### Delete User

-   Soft delete only.
-   Historical records preserved.

------------------------------------------------------------------------

## 20. Complete CRUD Coverage Requirement

For **every module in the system**, the following must exist:

### Pages Required

1.  List Page\
2.  Create Form Page\
3.  Edit Form Page\
4.  Delete Confirmation\
5.  View Details Page

### Form Requirements

-   Field‑level validation
-   Error messages
-   Required indicators
-   Permission‑based visibility
-   Audit logging

------------------------------------------------------------------------

## 21. Workflow & Validation Standards

### Global Validation Rules

-   Required field enforcement
-   Data type validation
-   Branch‑level data isolation
-   Permission checks before every action

### Audit Trail

Every important action must record: - User ID - Branch ID - Action
type - Timestamp - Before/after values

------------------------------------------------------------------------

## 22. Production‑Readiness Confirmation Checklist

The system is considered **100% production ready** only if:

-   Super Admin dynamic permission system implemented
-   All modules have full CRUD pages
-   Branch isolation enforced in database (RLS)
-   Audit logging enabled
-   Error handling + validation complete
-   Backup & monitoring configured
-   Deployment pipeline working

------------------------------------------------------------------------

**End of Version 1.2 Enhancements**

------------------------------------------------------------------------

# Version 1.3 -- Builder Self‑Verification & Step Validation Framework

## 23. Mandatory Builder Self‑Testing Before Next Step

To ensure **real‑world production reliability**, the builder must
**automatically verify** that every implemented feature is fully working
**before moving to the next development step**.

This rule is **mandatory for the entire build lifecycle**.

------------------------------------------------------------------------

## 24. Step Completion Verification Protocol

For **each development step**, the builder must confirm:

### Functional Verification

-   Page loads without errors
-   Create / Edit / Delete actions work correctly
-   Validation messages display properly
-   Permissions restrict access correctly
-   Branch data isolation works
-   No console or server errors

### Data Verification

-   Records saved correctly in database
-   Edit updates reflect immediately
-   Soft delete behaves correctly
-   Audit logs are created

### Security Verification

-   Unauthorized users blocked
-   Direct URL access prevented
-   RLS policies enforced in database

➡️ **Builder cannot continue** until all checks pass.

------------------------------------------------------------------------

## 25. Automated Testing Requirement

Each module must include:

### Minimum Tests

-   Form validation test
-   CRUD operation test
-   Permission restriction test
-   Branch isolation test

### Recommended Tools

-   Unit testing: Jest / Vitest
-   E2E testing: Playwright
-   API testing: Supertest

Tests must **run successfully before deployment**.

------------------------------------------------------------------------

## 26. Step‑by‑Step Builder Practice Workflow

For **every feature built**, the builder must follow:

1.  Implement feature\
2.  Run application locally\
3.  Perform manual functional test\
4.  Run automated test suite\
5.  Fix any errors found\
6.  Re‑test until 100% success\
7.  Only then proceed to next feature

This creates **disciplined production‑grade development practice**.

------------------------------------------------------------------------

## 27. Definition of "Step Completed"

A build step is considered **COMPLETED** only when:

-   Feature works without errors
-   Validation rules enforced
-   Permissions verified
-   Database integrity confirmed
-   Tests passing 100%
-   No console warnings
-   Ready for real user usage

If any condition fails → **step is NOT complete**.

------------------------------------------------------------------------

## 28. Production Reliability Impact

This self‑verification framework ensures:

-   Zero broken workflows in production
-   Higher security and stability
-   Faster debugging
-   Enterprise‑level software quality
-   Builder gains real professional development discipline

------------------------------------------------------------------------

## 29. Final Production Guarantee Rule

The application can be declared **REAL‑WORLD PRODUCTION READY** only if:

-   All previous Version 1.2 production checklist items pass
-   Every build step followed the **self‑verification protocol**
-   Automated tests succeed across all modules

------------------------------------------------------------------------

**End of Version 1.3 Enhancements**
