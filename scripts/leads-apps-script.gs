// Recebe o formulário de contato do site e grava uma linha na aba "Contatos" da planilha.
// Publicar em Implantar → Nova implantação → App da Web (executar como: Eu; acesso: Qualquer pessoa).
var HEADER = ['Data e hora', 'Nome', 'WhatsApp', 'Fazenda', 'Rebanho', 'Plano', 'Período', 'Página de origem'];

// Texto que começa com = + - @ viraria fórmula na planilha; o apóstrofo guarda como texto.
function asText(value) {
  var text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  var lead = JSON.parse(e.postData.contents);
  // Campo isca: só robôs preenchem.
  if (lead.site) return ContentService.createTextOutput('ok');
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName('Contatos') || spreadsheet.insertSheet('Contatos');
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);
  sheet.appendRow([new Date()].concat(
    [lead.nome, lead.whatsapp, lead.fazenda, lead.rebanho, lead.plano, lead.periodo, (e.parameter || {}).origem].map(asText)
  ));
  return ContentService.createTextOutput('ok');
}
