# Google Apps Script — Galeria do Drive

O site usa um único Apps Script: `GalleryDrive.gs`, que lista os álbuns (subpastas) e as fotos/vídeos
da pasta principal do Google Drive da igreja.

## Como implantar

1. Acesse [script.google.com](https://script.google.com) → **Novo projeto** e cole o código de `GalleryDrive.gs`.
2. Na linha `var FOLDER_ID = '...'`, coloque o ID da pasta principal (o trecho depois de `/folders/` na URL do Drive).
3. (Opcional, deixa bem mais rápido) Menu **Serviços (+)** → **Drive API** → Adicionar.
4. **Implantar → Nova implantação → App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Copie a URL `/exec` e cole no painel: **Conteúdo → Google Drive → URL do Apps Script**.

Ao alterar o código depois: **Implantar → Gerenciar implantações → ✏️ → Versão: Nova versão → Implantar**
(assim a URL continua a mesma).

## Inscrições de eventos

Não usam mais Google Planilhas: ficam no banco do site e são exportadas pelo painel
(**Eventos → Inscrições → Excel (CSV)** ou **PDF / Imprimir**).
