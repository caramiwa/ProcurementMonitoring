# 2027+ Procurement Monitoring Data Model

**Project:** Procurement Monitoring  
**Status:** Design decision based on lessons from the 2026 AppSheet prototype

## Purpose

Define a cleaner data model for the future procurement monitoring sheet and AppSheet application. The 2026 prototype is intentionally retained as-is where practical; this design is for the future monitoring implementation.

## Core design decision

The future monitoring data should be based primarily on the **APP Monitoring worksheet**, rather than treating the PR monitoring sheet as the source for PO-level information.

The key principle is:

> **One APP Monitoring row represents one PO issued.**

This avoids placing multiple PO numbers, modes, or PO-specific project information into a single PR row.

## Data hierarchy

The intended relationship is:

**PR → PO → Movement**

### PR level

The PR record should contain information that belongs to the procurement request as a whole, such as:

- PR No.
- PR description
- PR amount
- PR date received
- Initial Mode
- PR remarks
- PR Trail

For the future AppSheet application, the Procurement user should primarily be able to maintain the manually entered **PR Remarks** and **PR Trail**. Other fields should be populated from the monitoring source where appropriate.

### PO level

PO-specific information should be represented separately for every PO issued under a PR, including:

- PO No.
- PR No. (Ref to PR)
- Mode
- Project ID
- PO preparation information
- Other PO-specific monitoring fields

This allows one PR to legitimately have multiple POs with different modes and project IDs.

Example:

```text
PR-2027-0001
│
├── PO-001 — SVP — Project A
├── PO-002 — Competitive Bidding — Project B
└── PO-003 — SVP — Project C
```

## PR-to-PO relationship

The common **PR No.** is the relationship between the two tables.

In AppSheet:

- `PO 2027[PR NO.]` should be configured as a **Ref** to `PR 2027`.
- The PR record can therefore display its related POs automatically.
- The number of POs for a PR can be derived from the related PO records rather than parsing a cell containing multiple PO numbers.

This is preferable to storing a comma-separated or otherwise multi-valued PO field in the PR table.

## Mode handling

The **PR table** may display the **initial Mode** as a PR-level reference/summary value.

The authoritative mode for each issued PO belongs in the **PO table** because different POs under the same PR may use different procurement modes.

Example:

```text
PR-2027-0001 — Initial Mode: SVP

Related POs:
PO-001 — SVP
PO-002 — Competitive Bidding
```

This prevents the PR record from incorrectly implying that one procurement mode applies to every PO issued under it.

## Project ID handling

`Project ID` is PO-level information and should therefore be maintained/displayed in the PO table, one value per PO.

It should not be forced into the PR record when a PR may result in multiple POs/projects.

## Source-of-truth principle

For the future monitoring implementation:

**APP Monitoring**  
→ source for PO-level monitoring data

**PR table**  
→ PR-level information and controlled manual fields such as Remarks and PR Trail

**PO table**  
→ one record per PO, including Mode and Project ID

**Movement table**  
→ real-time event history for document movement

This keeps each table responsible for information at its natural level.

## 2026 prototype vs future design

The existing **PR 2026** structure may contain multiple PO numbers and other information that is not strictly PR-level. This is acceptable because 2026 is being used as a working prototype and learning environment.

The prototype should not be unnecessarily rebuilt solely to achieve the future structure.

For 2027 onward, the monitoring source should be designed around the APP Monitoring worksheet so that each PO is represented as its own record.

## AppSheet user workflow — future

The intended future workflow is:

1. APP Monitoring supplies PO-level source data.
2. AppSheet relates each PO to its parent PR through PR No.
3. PR users see the PR-level record and its related POs.
4. Procurement users maintain PR Remarks and PR Trail as needed.
5. PO-specific Mode and Project ID are shown at the PO level.
6. Movement records provide the live operational trail for each PO.

## Design rationale

This structure follows relational data principles and avoids duplicating or packing multiple values into a single field. It also makes future calculations, related-record views, counts of POs per PR, and PO-level reporting substantially easier.

The 2026 prototype demonstrated why this separation matters: a single PR can generate multiple POs, and those POs may have different procurement modes and project IDs.
