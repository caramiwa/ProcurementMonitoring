# Procurement-Time Metric 4 — Proposal

**Project:** Procurement Monitoring  
**App:** Procurement PO/PR AppSheet app  
**Status:** Proposed — not yet implemented

## Proposed metric

### Initial Release → PO Approval

Measure the elapsed time between the **Initial Release to Budget** and the **PO Approval** milestone.

This would become the fourth procurement-time metric alongside the three metrics already implemented in the 2026 prototype:

1. PR Receipt → PO Approval
2. PR Receipt → PO Preparation
3. PO Preparation → Initial Release
4. **Initial Release → PO Approval** *(proposed)*

## Milestone chain

The complete procurement timeline would therefore be represented as:

**PR Date Received** → **PO DATE PREPARED** → **Initially Released** → **PO Approved**

The proposed fourth metric measures the final segment of this chain:

**Initially Released** → **PO Approved**

## Proposed AppSheet calculation

The metric can be implemented as a Virtual Column in **PO 2026**, using the existing `Initially Released` and `PO Approved` milestone columns:

```appsheet
IF(
  AND(
    ISNOTBLANK([Initially Released]),
    ISNOTBLANK([PO Approved])
  ),
  [PO Approved] - [Initially Released],
  ""
)
```

The resulting value would initially use AppSheet's **Duration** type, consistent with the other three prototype metrics.

## Why this metric is useful

The first three metrics describe the major portions of the procurement timeline. This fourth metric isolates the time between the PO's initial release to Budget and its subsequent approval.

It can help distinguish delays occurring **before the PO reaches Budget** from delays occurring **after initial release but before approval**.

Taken together, the four interval metrics provide a more complete view of the movement of a PO through the recorded procurement milestones.

## Relationship to the existing metrics

The four intervals are not intended to replace the overall **PR Receipt → PO Approval** measure. Rather, they provide progressively more granular views of the same timeline.

Conceptually:

**PR Receipt → PO Approval**

can be examined through the component intervals:

- PR Receipt → PO Preparation
- PO Preparation → Initial Release
- Initial Release → PO Approval

The existing overall metric therefore remains useful as a headline measure, while the three component intervals provide diagnostic detail.

## 2026 prototype vs. 2027 implementation

This metric is recorded as a **proposal only** at this stage. The current 2026 prototype has already reached the point where the three existing metrics are working and have been surfaced on the Dashboard.

The fourth metric should not be added to the current prototype unless we explicitly decide to continue the prototype work.

For **2027**, the complete four-interval model can be incorporated into the cleaner data structure planned for the next version of the procurement monitoring system.

## Future presentation

The underlying calculation should continue to use the actual milestone DateTime values. For user-facing presentation, the duration can later be converted into **days** or another human-readable format rather than exposing the raw `HH:MM:SS` Duration value.

## Current status

**PROPOSAL ONLY — NOT YET IMPLEMENTED.**

The purpose of this note is to preserve the design decision so the fourth metric is not lost while work proceeds on the current prototype and the planned 2027 procurement monitoring system.
