# PO Details — Related PO Items

**Status:** Planned AppSheet feature for the 2026 prototype

## Current PR Detail structure

The current PR Detail experience already provides two related-record sections:

```text
PR Details
├── PR Movement
└── Related POs
```

This allows a user to open a PR and see both its movement history and the POs associated with that PR.

## Planned PO Detail structure

The PO Detail view should provide the same relational experience:

```text
PO Details
├── Related PO Items
└── Related PO Movements
```

### Related PO Items

The PO Detail view should show the list of individual items belonging to the selected PO.

The intended user experience is that opening a PO provides its PO-level information, followed by an inline list of the items included in that PO.

### Related PO Movements

The existing PO Movement relationship should remain available in the PO Detail view. It provides the real-time operational history of the PO's inter-office movement.

## Important source-data note

The current source sheet for this prototype is **not the APP Monitoring worksheet** and should not be assumed to contain a clean, item-level source of truth. Much of the current source data was manually encoded rather than extracted from the single APP Monitoring source.

Therefore, this feature should be designed around the actual structure of the current PO/item data rather than forcing the prototype to depend on APP Monitoring.

For the future monitoring implementation, APP Monitoring is intended to become the source of PO-level monitoring data, as documented in `notes/2027-monitoring-data-model.md`.

## Intended relational model

The conceptual structure is:

```text
PR
│
├── PR Movement
│
└── PO(s)
     │
     ├── PO Item(s)
     │
     └── PO Movement(s)
```

This preserves the natural hierarchy:

**PR → PO → Items / Movements**

## Design goal

The PO Detail page should become a useful single-record view containing:

1. PO-level information
2. Related PO Items
3. Related PO Movements

The feature is intended to improve navigation and record context without changing the current source-data architecture of the 2026 prototype.
