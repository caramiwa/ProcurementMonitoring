# Procurement-Time Metrics — Prototype Record

**Project:** Procurement Monitoring  
**App:** Procurement PO/PR AppSheet app  
**Status:** Prototype milestone reached; calculation work parked for now

## Purpose

Create procurement-time metrics for the initial release using the existing PR 2026 and PO 2026 data plus the PO movement log.

The current planned metrics are:

1. PR Receipt → PO Approval
2. PR Receipt → PO Preparation
3. PO Preparation → Initial Release

For the prototype, elapsed time is measured in **calendar time** rather than working days.

## Related POs — PR 2026 → PO 2026

A key data-model issue was identified: the PR 2026 sheet can contain several PO numbers in one cell, while the PO 2026 monitoring structure has one row per PO. Rather than parsing a multi-value PO cell, the AppSheet model now uses the common PR number to establish a relational connection.

### Relationship

- `PR 2026[PR. NO.]` is the parent key.
- `PO 2026[PR. NO.]` was changed from **Text** to **Ref**.
- `PO 2026[PR. NO.]` references the `PR 2026` table.
- `Is a part of?` remains **OFF**.
- AppSheet automatically creates a related-record collection in PR 2026 (e.g. **Related PO 2026**).

This establishes a one-to-many relationship:

**One PR → many POs**

This allows the PR record to display its related POs and provides the basis for a future PO count such as `COUNT([Related PO 2026])` without duplicating or parsing PO data in the PR sheet.

The resulting conceptual hierarchy is:

**PR → PO → Movement**

This is preferable to keeping several PO numbers in a single PR cell for the AppSheet relational model.

## APP USER — role-based access control

An `APP USER` table was added to the existing source spreadsheet and registered in AppSheet.

Fields:

- `EMAIL`
- `DEPARTMENT`
- `ROLE`
- `ACTIVE`

Configuration:

- `EMAIL` → Type **Email**, **Key = ON**
- `DEPARTMENT` → Text
- `ROLE` → Enum, currently using `Procurement` and `End-user`
- `ACTIVE` → Yes/No
- Duplicate email addresses were checked and removed.
- AppSheet's automatically generated `_ComputedKey` is not used as the key.

The table may generate a sensitive-data warning for `EMAIL` and `DEPARTMENT`; this is expected because the table contains user/organizational information.

### Role lookup

The current user's role is obtained with:

```appsheet
LOOKUP(
  USEREMAIL(),
  "APP USER",
  "EMAIL",
  "ROLE"
)
```

This was tested successfully. When signed in as an End-user, the lookup returned `End-user` for every row; when signed in as a Procurement user, it returned `Procurement` for every row. This is expected because `USEREMAIL()` refers to the currently signed-in app user, not the email in the current APP USER row.

### Table permissions

Role-based expressions were used so that:

- Procurement users can update `PO 2026` and `PR 2026`.
- Procurement users can add records to `PO 2026 Movement` and `PR 2026 Movement`.
- End-users are read-only for the operational tables.
- End-users cannot add movements.
- Procurement-only actions such as Update and Record Movement are hidden from End-users using the same role lookup.

App access itself remains controlled by AppSheet's allowed-user/share list. `APP USER` determines what an authorized user can do after entering the app; it does not replace the AppSheet access list.

The app-owner account also had to be added to `APP USER` with `ROLE = Procurement` and `ACTIVE = TRUE` so that the role-based permission expressions would grant the creator the same operational permissions.

## PO 2026 Movement — live operational trail

The PO movement log was configured as a real-time operational audit trail.

Key configuration:

- `Movement ID` → Key = ON
- `PO. NO.` → Ref to `PO 2026`
- `PO 2026` key remains `PO. NO.`
- `Is a part of?` is enabled for the PO-to-movement relationship where used, producing the inline **Related PO 2026 Movements** section.
- `Movement DateTime` remains a **DateTime** using `NOW()` and is not intended to be manually edited.
- Movement records are added by Procurement at the time the document actually moves.
- End-users can view movement history but cannot add movements.

The same movement approach was also established for `PR 2026 Movement`, with `PR 2026 Movement[PR. NO.]` configured as a Ref to `PR 2026`.

### OMCC milestone

`OMCC` is included in the `MovementFrom` and `MovementTo` values.

The actual lifecycle is understood as originating with Procurement and eventually returning to Procurement after approval, followed by final release to OMCC. The relevant milestones are therefore:

- Procurement → Budget = initial release into circulation
- OMCC → Procurement = approved PO returned to Procurement / final receipt
- Procurement → OMCC = final release to OMCC

The movement log is intentionally not being expanded to reconstruct every possible office dwell time. For example, detailed Budget → Accounting → OMCC timing may remain available in the manual tracker rather than forcing historical reconstruction into the real-time AppSheet log.

## Data model / milestone chain

The working PO-level timeline is:

**PR Date Received** → **PO DATE PREPARED** → **Initial Release** → **PO Approved**

### PR Date Received

- Source: PR 2026.
- For this prototype, the PR 2026 column labelled `DATE PREPARED MM-DD` is being treated as **PR Date Received**, based on the user's clarification.
- The value is brought into PO 2026 so that each PO can use its parent PR's received date.
- `PR Date Received` is configured as **Date**.

### PO DATE PREPARED

- Existing date field in PO 2026.
- This is the PO preparation milestone used in the duration calculations.

### Initially Released

- Virtual column in PO 2026.
- Derived from the earliest PO Movement record matching the PO number and a `Procurement → Budget` movement.

Formula:

```appsheet
MIN(
  SELECT(
    PO 2026 Movement[Movement DateTime],
    AND(
      [PO. NO.] = [_THISROW].[PO NO.],
      [MovementFrom] = "Procurement",
      [MovementTo] = "Budget"
    )
  )
)
```

### PO Approved

- Virtual column in PO 2026.
- Derived from the latest PO Movement record matching the PO number and an `OMCC → Procurement` movement.
- `PO Approved` is currently configured as **Date**, intentionally reducing the movement timestamp to a calendar date for the current duration metric.

Formula:

```appsheet
MAX(
  SELECT(
    PO 2026 Movement[Movement DateTime],
    AND(
      [PO. NO.] = [_THISROW].[PO NO.],
      [MovementFrom] = "OMCC",
      [MovementTo] = "Procurement"
    )
  )
)
```

## Three duration metrics

### PR Receipt to PO Approved

Current formula:

```appsheet
IF(
  AND(
    ISNOTBLANK([PR Date Received]),
    ISNOTBLANK([PO Approved])
  ),
  DATE([PO Approved]) - DATE([PR Date Received]),
  ""
)
```

The result column was initially set to **Duration**, which displayed elapsed time as hours. Changing it to **Number** caused AppSheet to report that the formula was still typed as Duration. The issue is therefore parked for later correction.

A proposed explicit conversion was:

```appsheet
IF(
  AND(
    ISNOTBLANK([PR Date Received]),
    ISNOTBLANK([PO Approved])
  ),
  TOTALHOURS(
    [PO Approved] - [PR Date Received]
  ) / 24,
  ""
)
```

This has **not yet been confirmed as the final working formula**. Do not treat the calculation layer as finished until this expression is tested and the result column type is validated.

### PR Receipt to PO Preparation

Uses the current PO 2026 row's `DATE PREPARED`.

Original formula:

```appsheet
IF(
  AND(
    ISNOTBLANK([PR Date Received]),
    ISNOTBLANK([DATE PREPARED])
  ),
  [DATE PREPARED] - [PR Date Received],
  ""
)
```

The original result displays as hours because AppSheet treats Date/DateTime subtraction as a Duration. The same explicit conversion approach will be tested later if a numeric calendar-day result is required.

### PO Preparation to Initial Release

Uses the virtual milestone column **`Initially Released`**.

```appsheet
IF(
  AND(
    ISNOTBLANK([DATE PREPARED]),
    ISNOTBLANK([Initially Released])
  ),
  [Initially Released] - [DATE PREPARED],
  ""
)
```

`[_THISROW]` was removed from this formula because the expression is already being evaluated in the PO 2026 row context, so `[DATE PREPARED]` is sufficient.

## Why the detailed manual tracker remains useful

The AppSheet movement log is intentionally a **real-time operational trail**, not a complete reconstruction of every historical office movement.

The detailed manual tracker may contain a fuller sequence such as:

**Procurement → Budget → Accounting → OMCC → Procurement**

while the current digital log records the operational movements entered by Procurement, for example:

**Procurement → Budget**

**Accounting → Procurement → Accounting**

**OMCC → Procurement**

The manual tracker can therefore remain a supporting historical/detail source without making `Movement DateTime` editable or compromising the real-time nature of the AppSheet log.

## Design decision: do not make Movement DateTime editable

`Movement DateTime` remains automatically generated with `NOW()`.

Reason:

- It records when the movement was actually entered.
- It preserves a stronger contemporaneous audit trail.
- Making the timestamp manually editable would allow retrospective reconstruction and weaken the integrity of the digital logbook.
- Detailed historical timing analysis can instead use the manual tracker where necessary.

## Current stopping point

### 🛑 PARK HERE — return later to duration calculations and Summary/Dashboard

The relational PR → PO connection, role-based access, live movement trail, OMCC milestone logic, and initial procurement-time calculation structure have been established.

The next task is to finish the duration formulas so that the metrics display as **calendar-day numbers** rather than raw AppSheet `HH:MM:SS` durations.

After that:

1. Finish **PR Receipt → PO Preparation**.
2. Finish **PR Receipt → PO Approval**.
3. Finish **PO Preparation → Initial Release**.
4. Add a useful **PO count per PR** using the related PO records.
5. Build **PO 2026 Summary** around the validated PO-level metrics.
6. Add the selected metrics to the **Dashboard**.
7. Decide how much of the detailed manual tracker should be attached/referenced in the app.
8. Refine the user-facing UX only after the data and permissions are stable.

The current prototype intentionally favors making the 2026 data work with the existing structure. A cleaner normalized data model can be introduced for 2027 onward where appropriate.
