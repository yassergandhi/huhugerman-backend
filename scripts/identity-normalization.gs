/**
 * huhuGERMAN-CSE — V7 (Identity & Validation Shield - Strict Mode)
 */

function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  normalizeRow(sheet, row);
}

function testLatestRow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Formularantworten 1");
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) normalizeRow(sheet, lastRow);
}

function normalizeRow(sheet, row) {
  // Rango B(2) a E(5): Nombre, Apellido, Email, Matrícula
  const range = sheet.getRange(row, 2, 1, 4);
  const data = range.getValues()[0];

  let firstName = sanitizeName(data[0]);
  let lastName  = sanitizeName(data[1]);
  let email     = sanitizeEmail(data[2]);
  let matricula = sanitizeMatricula(data[3]);

  // Si los nombres fallan la sanitización
  if (!firstName) firstName = "⚠️ REVISAR NOMBRE";
  if (!lastName) lastName = "⚠️ REVISAR APELLIDO";

  // Escribir datos limpios en B, C, D, E
  sheet.getRange(row, 2).setValue(firstName);
  sheet.getRange(row, 3).setValue(lastName);
  sheet.getRange(row, 4).setValue(email);
  sheet.getRange(row, 5).setValue(matricula);

  // Metadatos de Sistema (J=10, K=11)
  const fullName = `${firstName} ${lastName}`.trim();
  const uuidCell = sheet.getRange(row, 10); 
  if (!uuidCell.getValue()) uuidCell.setValue(Utilities.getUuid());

  const identityHash = generateIdentityHash(email, matricula, fullName);
  sheet.getRange(row, 11).setValue(identityHash);

  // Auto-reparación de Columna G (7) si tiene restos de Hashes anteriores
  const cellG = sheet.getRange(row, 7);
  if (/^[a-f0-9]{64}$/i.test(cellG.getValue().toString())) {
    cellG.clearContent();
    console.info("Columna G limpiada de hash residual.");
  }
}

/**
 * SANITIZACIÓN DE MATRÍCULA (Lógica de Negocio: 5-10 dígitos)
 */
function sanitizeMatricula(raw) {
  if (!raw) return "EXTERNO";
  let value = raw.toString().trim().toUpperCase();
  
  if (value.includes("EXTERNO")) return "EXTERNO";
  
  // Extraer solo dígitos
  let numeric = value.replace(/\D/g, "");
  
  if (numeric === "") return "⚠️ REVISAR (VACÍO)";
  
  // Validación de longitud (Regla CSE: 5 a 10 dígitos)
  if (numeric.length < 5 || numeric.length > 10) {
    return "⚠️ LONGITUD INVÁLIDA (" + numeric + ")";
  }
  
  return numeric;
}

/**
 * SANITIZACIÓN DE NOMBRES (Spanish & German Ready)
 */
function sanitizeName(str) {
  if (!str) return "";
  let cleanStr = str.toString()
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑÄäÖöÜüß\s]/g, '')
    .replace(/\s+/g, ' ');
  
  return cleanStr.trim().toLowerCase().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
}

/**
 * SANITIZACIÓN DE EMAIL (Heurística de dominios)
 */
function sanitizeEmail(email) {
  if (!email || !email.includes("@")) return "";
  let [user, domain] = email.toString().trim().toLowerCase().split("@");
  const commonFixes = {
    "gmaia.lcom": "gmail.com", "gnail.com": "gmail.com", "gmai.com": "gmail.com",
    "gamil.com": "gmail.com", "gmal.com": "gmail.com", "hotml.com": "hotmail.com",
    "outlok.com": "outlook.com", "uam.mx": "azc.uam.mx"
  };
  if (commonFixes[domain]) domain = commonFixes[domain];
  return `${user}@${domain}`;
}

function generateIdentityHash(email, matricula, fullName) {
  const identityString = [email, matricula, fullName].join("|").toLowerCase();
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, identityString, Utilities.Charset.UTF_8);
  return digest.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join("");
}

function cleanExistingData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Formularantworten 1");
  const lastRow = sheet.getLastRow();
  for (let i = 2; i <= lastRow; i++) {
    normalizeRow(sheet, i);
  }
}