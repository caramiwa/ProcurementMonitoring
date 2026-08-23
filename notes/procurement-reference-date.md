# Procurement Reference Date for Split or Changed Procurement Modes

**Status:** Design decision / future implementation consideration

## Background

The `PR 2026` table currently records the **initial Mode** used when a PR was originally submitted. However, a single PR may subsequently be pursued through a different procurement mode, either for the entire requirement or for only a portion of it.

Examples include:

- A PR originally submitted for Competitive Bidding (CB) later being pursued through Small Value Procurement (SVP).
- Only part of the original PR requirement being transferred to another procurement mode while the remaining portion continues under the original mode.

Therefore, the initial PR Mode must not be treated as the authoritative mode for every PO generated from the PR.

## The date problem

`PR Date Received` remains an important historical fact: it records when the original PR was received by Procurement.

However, it is not always the correct starting date for measuring the processing time of every PO or procurement stream arising from that PR.

If a portion of a PR is later pursued through another mode after a new requirement, endorsement, or actionable instruction is received, the processing clock for that portion should begin from the date that newer requirement became actionable—not necessarily from the original PR receipt date.

### Example

```text
PR-001
Original PR received: January 10
Initial Mode: Competitive Bidding

├── Portion A
│   Mode: CB
│   Reference Date: January 10
│   └── PO-001
│
└── Portion B
    Mode: SVP
    New requirement/endorsement received: March 15
    Reference Date: March 15
    └── PO-002
```

If PO-002 were measured from January 10, its apparent processing duration would include time before the SVP procurement stream actually began. That would distort the performance metric.

## Design principle

Separate two concepts:

### PR-level historical fields

- **PR Date Received** — date the original PR entered Procurement.
- **Initial Mode** — procurement mode at the time of the original PR submission.

These remain useful and should not be removed merely because subsequent procurement streams may differ.

### PO/procurement-stream fields

For future monitoring, each procurement stream or PO should have a **Procurement Reference Date** (working name) representing the date from which that particular requirement should be measured.

The reference date may be the original PR receipt date when the PO follows the original procurement stream, but it may be a later date when a new or revised requirement/endorsement initiates a different procurement stream.

## Future processing metrics

Future processing-time calculations should preferentially use the applicable **Procurement Reference Date** rather than automatically using `PR Date Received`.

Examples:

- Procurement Reference Date → PO Prepared
- Procurement Reference Date → Initial Release
- Procurement Reference Date → PO Approved

This allows different POs under the same PR to have different valid starting dates.

## Relationship to the 2027+ data model

This reinforces the design documented in `notes/2027-monitoring-data-model.md`:

**PR → PO → Movement**

The PR remains the parent record, but PO-level monitoring information must be capable of representing differences in:

- procurement mode;
- project/requirement;
- processing reference date; and
- movement history.

The future monitoring source should therefore preserve enough information to identify the procurement stream represented by each PO.

## 2026 prototype

Do not immediately redesign the 2026 prototype solely because of this discovery.

The current virtual columns and 146-day formatting rule may continue to use `PR Date Received` where appropriate until the data model for procurement reference dates is established.

Before implementing a generalized reference-date calculation, determine exactly what event/date constitutes the start of each procurement stream and where that information should be captured in the source data.

## Key takeaway

> **PR Date Received tells us when the original PR was received. It does not necessarily tell us when every subsequent procurement stream arising from that PR began.**

This distinction is essential for accurate procurement processing-time measurement when requirements are split or moved between procurement modes.
