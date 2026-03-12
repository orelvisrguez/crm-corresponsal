/* eslint-disable @typescript-eslint/no-require-imports */
const xlsx = require('xlsx');
const workbook = xlsx.readFile('c:/workspace/corresponsalia-assistravel/doc/casos.xlsx', { cellDates: true });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);
console.log('Row 1:', data[0]);
