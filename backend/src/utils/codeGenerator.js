'use strict';

const { v4: uuidv4 } = require('uuid');

const pad = (n, len = 5) => String(n).padStart(len, '0');

const datePart = () => {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
};

// Generate sequential-style codes with date prefix
const genLoanCode = () => `PM${datePart()}${pad(Math.floor(Math.random() * 99999), 5)}`;
const genReservationCode = () => `DT${datePart()}${pad(Math.floor(Math.random() * 99999), 5)}`;
const genFineCode = () => `PP${datePart()}${pad(Math.floor(Math.random() * 99999), 5)}`;
const genMemberCode = (seq) => `BD${new Date().getFullYear()}${pad(seq, 4)}`;
const genCopyCode = (seq) => `BS${pad(seq, 6)}`;
const genBookCode = (seq) => `TL${pad(seq, 5)}`;
const genOrderCode = () => `DDH${datePart()}${pad(Math.floor(Math.random() * 9999), 4)}`;
const genInventoryCode = () => `KK${datePart()}`;

module.exports = {
  genLoanCode, genReservationCode, genFineCode, genMemberCode,
  genCopyCode, genBookCode, genOrderCode, genInventoryCode,
};
