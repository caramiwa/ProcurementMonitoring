# Procurement-Time Metrics — Prototype Record

**Project:** Procurement Monitoring  
**App:** Procurement PO/PR AppSheet app  
**Status:** Prototype milestone reached  

## Purpose

Create three procurement-time metrics for the initial release, using the existing PR 2026 and PO 2026 data plus the PO movement log.

The initial dashboard metrics are intended to measure:

1. PR Receipt → PO Approval
2. PR Receipt → PO Preparation
3. PO Preparation → Initial Release to Budget

For the prototype, elapsed time is measured in **calendar time** rather than working days.

## Data model / milestone chain

The working timeline is:

**PR Date Received** → **PO DATE PREPARED** → **Initially Released** → **PO Approved**

### PR Date Received

- Source: PR 2026.
- For this prototype, the PR 2026 column labelled `DATE PREPARED MM-DD` is actually being treated as **PR Date Received**, based on the user's clarification.
- The value is brought into PO 2026 so that each PO can use its parent PR's received date.

### PO DATE PREPARED

- Existing date field in PO 2026.
- This is the PO preparation milestone used in the duration calculations.

### Initially Released

- Virtual column in PO 2026.
- Derived from the earliest PO Movement record matching the PO number and a `Procurement → Budget` movement.
- Formula used:

```appsheet
MIN(
  SELECT(
    PO 2026 Movement[Movement DateTime],
    AND(
      [PO No.] = [_THISROW].[PO NO.],
      [MovementFrom] = "Procurement",
      [MovementTo] = "Budget"
    )
  )
)
```

### PO Approved

- Virtual column in PO 2026.
- Derived from the latest PO Movement record matching the PO number and an `OMCC → Procurement` movement.
- Formula used:

```appsheet
MAX(
  SELECT(
    PO 2026 Movement[Movement DateTime],
    AND(
      [PO No.] = [_THISROW].[PO NO.],
      [MovementFrom] = "OMCC",
      [MovementTo] = "Procurement"
    )
  )
)
```

## Three duration metrics

All three are Virtual Columns in **PO 2026** with type **Duration**.

### PR Receipt to PO Approved

```appsheet
IF(
  AND(
    ISNOTBLANK([PR Date Received]),
    ISNOTBLANK([PO Approved])
  ),
  [PO Approved] - [PR Date Received],
  ""
)
```

### PR Receipt to PO Preparation

Uses the current PO 2026 row's `DATE PREPARED`.

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

### PO Preparation to Initial Release

The actual virtual column for the milestone is named **`Initially Released`**.

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

## One PR → multiple POs

A key prototype issue was verified successfully: one PR can contain multiple PO numbers. The PR 2026 `PO NO.` field may therefore contain multiple entries.

The current approach connects each PO to its PR and brings the corresponding **PR Date Received** into PO 2026. This was tested successfully and is behaving as expected.

This is acceptable for the 2026 prototype. A cleaner relational structure can be prepared for 2027 onward.

## Validation sample

Sample PO:

- **PO No.:** 26-01-0002
- **PR No.:** 25-12-0499
- **PO DATE PREPARED:** 1/9/2026
- **PR Date Received:** 12/10/2025
- **Initial Release:** 1/12/2026 after correcting a temporary movement entry
- **PO Approved:** 8/16/2026 9:15:14 PM

Validated results:

- **PR Receipt → PO Preparation:** `720:00:00` = **30 days**
- **PO Preparation → Initial Release:** expected **72:00:00** = **3 days** after correcting the temporary Initial Release movement date from August 15 to January 12
- **PR Receipt → PO Approved:** `5997:15:14`, approximately **249 days, 15 hours, 14 minutes**

The original `5232:00:00` result for PO Preparation → Initial Release was not a formula error. It resulted from the temporary test movement date of **August 15, 2026** while PO DATE PREPARED was **January 9, 2026**. Once the movement was corrected to **January 12, 2026**, the expected interval is three days.

## AppSheet visibility note

Virtual columns must have an App Formula in AppSheet.

When `Show?` is turned off for a column, it disappears not only from the Table view but also from the automatically generated PO Details presentation. The underlying calculation continues to work.

For prototype testing, the milestone virtual columns can therefore be temporarily shown so their values can be inspected. Once validated, they can be hidden from user-facing views while remaining available for calculations and summaries.

## Current stopping point

### 🛑 STOP HERE FOR NOW — Prototype calculation layer is working

At this point, the three procurement-time calculations have been created and tested against sample data. The underlying milestone chain is working.

**Do not yet proceed to aggregation, dashboard presentation, or UX refinement unless we explicitly decide to continue.**

## Planned next stage (not yet implemented)

If/when we continue:

1. Build **PO 2026 Summary** around the three procurement-time metrics.
2. Aggregate the PO-level durations into useful summary statistics.
3. Add the three summary metrics to the **Dashboard**.
4. Decide whether the Dashboard should show whole calendar days, decimal days, or another human-readable duration format rather than AppSheet's raw `HH:MM:SS` Duration display.
5. Keep the underlying milestone/helper columns available for calculation even if they are hidden from the operational PO views.

## Design decision

For the initial release, the three procurement-time metrics will be surfaced in the Dashboard. `PO 2026 Summary` can remain a supporting summary view rather than a primary navigation item unless that changes later.

The current prototype intentionally favors making the 2026 data work with the existing structure. A cleaner data model can be introduced for 2027 onward.
