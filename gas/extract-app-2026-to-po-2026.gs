/**
 * Procurement Monitoring — APP 2026 → PO 2026
 *
 * Extracts PO-level procurement data from the APP 2026 source sheet
 * into the PO 2026 sheet of the spreadsheet containing this script.
 *
 * Source spreadsheet:
 *   1xb76Hf1uV600UyCIuev1iBupolLWR9V2KVx9FffK3SU
 * Source sheet:
 *   APP 2026
 * Target sheet:
 *   PO 2026 (active/container spreadsheet)
 *
 * The script matches records using PO No. and uses header names rather
 * than fixed column positions. Existing PO records are updated; new PO
 * records are appended. Rows without a PO No. are skipped.
 *
 * Important design decision:
 *   CAF No. and other PO-level fields are sourced directly from APP 2026.
 *   PO 2026 does not depend on PR 2026 to obtain these values.
 */

function extractAPP2026ToPO2026() {
  const SOURCE_SPREADSHEET_ID =
    '1xb76Hf1uV600UyCIuev1iBupolLWR9V2KVx9FffK3SU';
  const SOURCE_SHEET_NAME = 'APP 2026';
  const TARGET_SHEET_NAME = 'PO 2026';

  // Source APP 2026 header → Target PO 2026 header
  const columnMapping = {
    'DATE PREPARED': 'DATE PREPARED (PO)',
    'CAF NO.': 'CAF NO.',
    'PO. NO.': 'PO NO.',
    'ITEM DESCIRPTION': 'ITEM DESCRIPTION',
    'PROJECT TITLE': 'PROJECT TITLE',
    'AMOUNT': 'PO TOTAL COST',
    'PR NO.': 'PR NO.',
    'END-USER': 'END-USER',
    'SUPPLIER': 'SUPPLIER',
    'METHOD': 'PROCUREMENT METHOD PO',
    'PROJECT ID': 'PROJECT ID',
    'PHILGEPS REFERENCE NO.': 'PHILGEPS REFERENCE NO.',
    'FUND SOURCE': 'SOURCE OF FUNDS'
  };

  const sourceSS = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
  const sourceSheet = sourceSS.getSheetByName(SOURCE_SHEET_NAME);
  if (!sourceSheet) {
    throw new Error(`Source sheet "${SOURCE_SHEET_NAME}" was not found.`);
  }

  const targetSS = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = targetSS.getSheetByName(TARGET_SHEET_NAME);
  if (!targetSheet) {
    throw new Error(`Target sheet "${TARGET_SHEET_NAME}" was not found.`);
  }

  const sourceData = sourceSheet.getDataRange().getValues();
  const targetData = targetSheet.getDataRange().getValues();

  if (sourceData.length < 2) {
    Logger.log('APP 2026 contains no data rows.');
    return;
  }
  if (targetData.length < 1) {
    throw new Error('PO 2026 must contain a header row.');
  }

  const sourceHeaders = sourceData[0];
  const targetHeaders = targetData[0];

  const sourceHeaderMap = createHeaderMap_(sourceHeaders);
  const targetHeaderMap = createHeaderMap_(targetHeaders);

  // Validate every mapped source and target header before changing data.
  Object.entries(columnMapping).forEach(([sourceHeader, targetHeader]) => {
    if (!(sourceHeader in sourceHeaderMap)) {
      throw new Error(`Source column not found in APP 2026: "${sourceHeader}"`);
    }
    if (!(targetHeader in targetHeaderMap)) {
      throw new Error(`Target column not found in PO 2026: "${targetHeader}"`);
    }
  });

  const sourceKeyIndex = sourceHeaderMap['PO. NO.'];
  const targetKeyIndex = targetHeaderMap['PO NO.'];

  // Index existing PO 2026 records by PO No.
  const targetRowMap = {};
  for (let row = 1; row < targetData.length; row++) {
    const poNo = normalizeKey_(targetData[row][targetKeyIndex]);
    if (poNo !== '') {
      targetRowMap[poNo] = row;
    }
  }

  let updatedCount = 0;
  let addedCount = 0;
  let skippedCount = 0;
  const newRows = [];

  // Process APP 2026 rows.
  for (let sourceRow = 1; sourceRow < sourceData.length; sourceRow++) {
    const sourceRecord = sourceData[sourceRow];
    const poNo = normalizeKey_(sourceRecord[sourceKeyIndex]);

    if (poNo === '') {
      skippedCount++;
      continue;
    }

    if (poNo in targetRowMap) {
      const targetRowNumber = targetRowMap[poNo];
      const targetRow = targetData[targetRowNumber];

      copyMappedValues_(
        sourceRecord,
        targetRow,
        columnMapping,
        sourceHeaderMap,
        targetHeaderMap
      );

      updatedCount++;
    } else {
      const newRow = new Array(targetHeaders.length).fill('');

      copyMappedValues_(
        sourceRecord,
        newRow,
        columnMapping,
        sourceHeaderMap,
        targetHeaderMap
      );

      newRows.push(newRow);
      addedCount++;
    }
  }

  // Write updated existing records in one operation.
  if (targetData.length > 1) {
    targetSheet
      .getRange(2, 1, targetData.length - 1, targetHeaders.length)
      .setValues(targetData.slice(1));
  }

  // Append new PO records in one operation.
  if (newRows.length > 0) {
    targetSheet
      .getRange(
        targetSheet.getLastRow() + 1,
        1,
        newRows.length,
        targetHeaders.length
      )
      .setValues(newRows);
  }

  const summary =
    `APP 2026 → PO 2026 extraction complete. ` +
    `Updated: ${updatedCount}; ` +
    `Added: ${addedCount}; ` +
    `Skipped (no PO No.): ${skippedCount}.`;

  Logger.log(summary);
  return summary;
}

/**
 * Creates a normalized header → zero-based column index map.
 */
function createHeaderMap_(headers) {
  const map = {};

  headers.forEach((header, index) => {
    const normalizedHeader = String(header).trim();
    if (normalizedHeader !== '') {
      map[normalizedHeader] = index;
    }
  });

  return map;
}

/**
 * Normalizes a key used to match PO records.
 */
function normalizeKey_(value) {
  return String(value == null ? '' : value).trim();
}

/**
 * Copies only the fields explicitly included in columnMapping.
 * Other PO 2026 columns are left untouched.
 */
function copyMappedValues_(
  sourceRecord,
  targetRow,
  columnMapping,
  sourceHeaderMap,
  targetHeaderMap
) {
  Object.entries(columnMapping).forEach(([sourceHeader, targetHeader]) => {
    const sourceIndex = sourceHeaderMap[sourceHeader];
    const targetIndex = targetHeaderMap[targetHeader];
    targetRow[targetIndex] = sourceRecord[sourceIndex];
  });
}
