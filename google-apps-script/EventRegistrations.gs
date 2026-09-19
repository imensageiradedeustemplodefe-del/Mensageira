// Google Apps Script para gerenciar Inscrições de Eventos
// Deploy este script como Web App e use o URL no Lovable

/**
 * CONFIGURAÇÃO OBRIGATÓRIA:
 * Substitua o FOLDER_ID abaixo pelo ID da sua pasta do Google Drive
 * 
 * Como obter o ID da pasta:
 * 1. Abra a pasta no Google Drive
 * 2. Copie o ID da URL (a parte após /folders/)
 * 3. Exemplo: https://drive.google.com/drive/folders/1Tpu1Pv6SkQK-kr2ShiRp9OjSLRCjQRrR
 *    O ID é: 1Tpu1Pv6SkQK-kr2ShiRp9OjSLRCjQRrR
 */

// ⬇️ CONFIGURE O ID DA SUA PASTA AQUI ⬇️
const FOLDER_ID = '1Tpu1Pv6SkQK-kr2ShiRp9OjSLRCjQRrR';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { eventTitle, registrations, fields } = data;
    
    // Obtém a pasta configurada pelo ID
    let mainFolder;
    try {
      mainFolder = DriveApp.getFolderById(FOLDER_ID);
    } catch (error) {
      throw new Error('Erro ao acessar a pasta: ' + error.message + 
        '. Verifique se o FOLDER_ID está correto e se você tem permissão de acesso.');
    }
    
    // Nome da planilha baseado no evento
    const spreadsheetName = `Inscrições - ${eventTitle} - ${new Date().toLocaleDateString('pt-BR')}`;
    
    // Buscar ou criar a planilha
    let spreadsheet = getOrCreateSpreadsheet(spreadsheetName, mainFolder);
    let sheet = spreadsheet.getActiveSheet();
    
    // Se a planilha está vazia, adicionar cabeçalhos
    if (sheet.getLastRow() === 0) {
      const headers = fields.map(f => f.field_label);
      headers.push("Data de Inscrição");
      sheet.appendRow(headers);
      
      // Formatar cabeçalho
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#4285f4");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    
    // Adicionar as inscrições
    registrations.forEach(reg => {
      const row = fields.map(field => reg.registration_data[field.field_name] || "");
      row.push(new Date(reg.created_at).toLocaleString("pt-BR"));
      sheet.appendRow(row);
    });
    
    // Auto-ajustar colunas
    sheet.autoResizeColumns(1, sheet.getLastColumn());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        spreadsheetId: spreadsheet.getId(),
        spreadsheetUrl: spreadsheet.getUrl(),
        syncedCount: registrations.length
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSpreadsheet(name, folder) {
  // Buscar planilhas existentes com o mesmo nome na pasta
  const files = folder.getFilesByName(name);
  
  if (files.hasNext()) {
    const file = files.next();
    return SpreadsheetApp.openById(file.getId());
  } else {
    // Criar nova planilha
    const spreadsheet = SpreadsheetApp.create(name);
    const file = DriveApp.getFileById(spreadsheet.getId());
    
    // Mover para a pasta correta
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    
    return spreadsheet;
  }
}

// Função para testar (executar manualmente no editor)
function test() {
  const testData = {
    eventTitle: "Teste de Evento",
    fields: [
      { field_name: "nome", field_label: "Nome Completo" },
      { field_name: "email", field_label: "Email" }
    ],
    registrations: [
      {
        registration_data: {
          nome: "João Silva",
          email: "joao@example.com"
        },
        created_at: new Date().toISOString()
      }
    ]
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(e);
  Logger.log(result.getContent());
}
