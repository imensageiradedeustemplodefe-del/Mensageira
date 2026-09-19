# Configuração do Google Apps Script para Inscrições de Eventos

Este script gerencia automaticamente as inscrições de eventos, criando planilhas organizadas em uma pasta específica do seu Google Drive.

## Passo 1: Criar o Script

1. Acesse [Google Apps Script](https://script.google.com/)
2. Clique em "Novo projeto"
3. Cole o código do arquivo `EventRegistrations.gs`
4. **IMPORTANTE**: No código, substitua o `FOLDER_ID` pelo ID da sua pasta do Google Drive
   - Abra a pasta desejada no Google Drive
   - Copie o ID da URL (a parte após `/folders/`)
   - Exemplo: `https://drive.google.com/drive/folders/1Tpu1Pv6SkQK-kr2ShiRp9OjSLRCjQRrR`
   - O ID é: `1Tpu1Pv6SkQK-kr2ShiRp9OjSLRCjQRrR`
5. Renomeie o projeto para "Gerenciador de Inscrições - Igreja"

## Passo 2: Configurar Permissões

O script precisa das seguintes permissões:
- **Google Drive**: Para acessar a pasta configurada e criar planilhas
- **Google Sheets**: Para adicionar e formatar dados nas planilhas

## Passo 3: Fazer o Deploy como Web App

1. No editor do Apps Script, clique em **Implantar** > **Nova implantação**
2. Clique no ícone de engrenagem (⚙️) e selecione **Aplicativo Web**
3. Configure:
   - **Descrição**: "API de Inscrições de Eventos"
   - **Executar como**: Eu (seu email)
   - **Quem tem acesso**: Qualquer pessoa
4. Clique em **Implantar**
5. Autorize o script quando solicitado
6. **COPIE O URL** que aparece (ex: `https://script.google.com/macros/s/ABC123.../exec`)

## Passo 4: Configurar no Lovable

1. Acesse o painel de **Admin** no seu app
2. Vá em **Configurações do Site**
3. Aba **Integrações Google**
4. Cole o URL do script no campo **"URL do Google Apps Script (Inscrições)"**
5. Clique em **Salvar Alterações**

## Passo 5: Testar

1. Crie um evento com formulário de inscrição
2. Adicione pelo menos uma inscrição de teste
3. Na aba "Inscrições Recebidas", clique em **"Sincronizar com Google Sheets"**
4. Verifique no seu Google Drive se:
   - A pasta "Inscrições_Eventos" foi criada
   - A planilha com o nome do evento foi criada dentro da pasta
   - Os dados estão formatados corretamente

## Como Funciona

### Estrutura de Arquivos

O script cria planilhas diretamente na pasta que você configurou:

```
📁 [Sua Pasta Configurada]
  ├── Inscrições - [Nome do Evento] - [Data].xlsx
  ├── Inscrições - [Outro Evento] - [Data].xlsx
  └── ...
```

### Dados Sincronizados

A planilha contém:
- **Cabeçalho formatado** (azul com texto branco)
- **Todos os campos** do formulário de inscrição
- **Data de Inscrição** (última coluna)
- **Colunas auto-ajustadas** para melhor visualização

### Quando Sincronizar

- Após receber novas inscrições
- Antes de entrar em contato com os inscritos
- Para gerar relatórios e análises
- Para compartilhar com a equipe

## Solução de Problemas

### Erro: "Apps Script URL não configurado"
- Verifique se você copiou o URL correto do script
- O URL deve terminar com `/exec`
- Certifique-se de ter salvo as configurações

### Erro: "Failed to sync"
- Verifique se o script está implantado como "Qualquer pessoa"
- Revise as permissões do script no Google
- Tente fazer um novo deploy do script

### Planilha não aparece na pasta configurada
- Verifique se o FOLDER_ID está correto no código
- Certifique-se de que você tem permissão de edição na pasta
- Verifique se autorizou as permissões do script
- Procure na lixeira do Google Drive
- Verifique se há erros no log do Apps Script

### Dados aparecem incorretos
- Verifique se os nomes dos campos correspondem
- Teste a função `test()` no editor do Apps Script
- Veja os logs de execução no Apps Script

## Recursos Avançados

### Personalizar Formatação

No arquivo `EventRegistrations.gs`, você pode modificar:

```javascript
// Cor do cabeçalho
headerRange.setBackground("#4285f4"); // Azul do Google
headerRange.setFontColor("#ffffff");  // Texto branco

// Adicionar mais formatação
sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
  .setBorder(true, true, true, true, false, false);
```

### Adicionar Validação

```javascript
// Adicionar dropdown para status
const statusRange = sheet.getRange(2, sheet.getLastColumn() + 1, sheet.getLastRow() - 1, 1);
const rule = SpreadsheetApp.newDataValidation()
  .requireValueInList(['Confirmado', 'Pendente', 'Cancelado'])
  .build();
statusRange.setDataValidation(rule);
```

## Segurança

✅ **O que é seguro:**
- O script roda na sua conta do Google
- Apenas você tem acesso completo às planilhas
- Os dados ficam no seu Google Drive

⚠️ **Importante:**
- Não compartilhe o URL do script em locais públicos
- Configure permissões adequadas nas planilhas criadas
- Revise periodicamente os acessos no Google Drive

## Suporte

Se precisar de ajuda:
1. Verifique os logs no Apps Script (Visualizar > Registros de execução)
2. Teste a função manualmente no editor
3. Verifique as permissões do Google Drive

---

**Pronto!** Agora suas inscrições de eventos serão automaticamente organizadas em planilhas no Google Drive. 🎉
