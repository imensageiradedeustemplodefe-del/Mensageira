/**
 * Galeria do Google Drive — Mensageira de Deus
 *
 * Lista os álbuns (subpastas) e as mídias (FOTOS e VÍDEOS) de uma pasta principal do Drive.
 * Formato de resposta compatível com o site (imensageiradedeus.com.br).
 *
 * Como usar:
 *   1. script.google.com → Novo projeto → cole este código no Código.gs
 *   2. Troque FOLDER_ID pelo ID da pasta principal (o trecho após /folders/ na URL do Drive)
 *   3. Implantar → Nova implantação → Tipo "App da Web"
 *        Executar como: Eu | Quem pode acessar: Qualquer pessoa
 *   4. Cole a URL /exec no painel: Conteúdo → Google Drive → URL do Apps Script
 *
 * Endpoints:
 *   ?action=albums                                   → { albums: [{ id, name, coverUrl, photoCount }] }
 *   ?album=<id>&pageSize=20&order=name&pageToken=0   → { items: [...], nextPageToken }
 *
 * Observações:
 *   - A capa do álbum é o arquivo cujo nome começa com "CAPA_" (senão, a primeira foto por nome).
 *   - A pasta principal precisa estar compartilhada como "Qualquer pessoa com o link – Leitor",
 *     para que as miniaturas e o player de vídeo funcionem para os visitantes.
 */

var FOLDER_ID = 'COLE_AQUI_O_ID_DA_PASTA_PRINCIPAL';
var ALBUMS_CACHE_SECONDS = 600; // 10 min

function doGet(e) {
  var p = (e && e.parameter) || {};
  var body;
  try {
    if (p.action === 'albums') body = listAlbums();
    else if (p.album) body = listItems(p.album, p);
    else body = { error: 'Use ?action=albums ou ?album=<id>' };
  } catch (err) {
    body = { error: String(err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- Helpers ----------

function isMedia(mime) {
  return !!mime && (mime.indexOf('image/') === 0 || mime.indexOf('video/') === 0);
}

function thumbUrl(id, width) {
  return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w' + width;
}

// Ordena "Foto_2" antes de "Foto_10" (ordem numérica natural, sem diferenciar maiúsculas)
function compareNames(a, b) {
  return a.name.localeCompare(b.name, 'pt-BR', { numeric: true, sensitivity: 'base' });
}

/** Lê todas as mídias (fotos + vídeos) de uma pasta, já no formato do site. */
function getMediaFiles(folder) {
  var files = folder.getFiles();
  var out = [];
  while (files.hasNext()) {
    var f = files.next();
    var mime = f.getMimeType();
    if (!isMedia(mime)) continue;
    var id = f.getId();
    out.push({
      id: id,
      name: f.getName(),
      createdTime: f.getDateCreated().toISOString(),
      mimeType: mime,
      thumbUrl: thumbUrl(id, 400),
      viewUrl: 'https://drive.google.com/uc?id=' + id + '&export=view',
    });
  }
  return out;
}

// ---------- Álbuns ----------

function listAlbums() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('albums');
  if (cached) return JSON.parse(cached);

  var root = DriveApp.getFolderById(FOLDER_ID);
  var folders = root.getFolders();
  var albums = [];

  while (folders.hasNext()) {
    var folder = folders.next();
    var media = getMediaFiles(folder);
    if (media.length === 0) continue;

    var cover = null;
    for (var i = 0; i < media.length; i++) {
      if (/^CAPA_/i.test(media[i].name)) { cover = media[i]; break; }
    }
    if (!cover) {
      var photos = media.filter(function (m) { return m.mimeType.indexOf('image/') === 0; }).sort(compareNames);
      cover = photos[0] || media[0];
    }

    albums.push({
      id: folder.getId(),
      name: folder.getName(),
      coverUrl: thumbUrl(cover.id, 600),
      photoCount: media.length, // fotos + vídeos (inclui a capa)
      createdTime: folder.getDateCreated().toISOString(),
    });
  }

  albums.sort(compareNames);
  var result = { albums: albums };
  try { cache.put('albums', JSON.stringify(result), ALBUMS_CACHE_SECONDS); } catch (ignore) {}
  return result;
}

// ---------- Itens de um álbum (paginado) ----------

function listItems(folderId, p) {
  var folder = DriveApp.getFolderById(folderId);
  var items = getMediaFiles(folder);

  var order = p.order || 'newest';
  if (order === 'name') items.sort(compareNames);
  else if (order === 'oldest') items.sort(function (a, b) { return a.createdTime < b.createdTime ? -1 : 1; });
  else items.sort(function (a, b) { return a.createdTime > b.createdTime ? -1 : 1; });

  var pageSize = Math.max(1, Math.min(1000, parseInt(p.pageSize, 10) || 24));
  var offset = Math.max(0, parseInt(p.pageToken, 10) || 0);
  var page = items.slice(offset, offset + pageSize);
  var next = offset + pageSize < items.length ? String(offset + pageSize) : null;

  return {
    folderId: folderId,
    order: order,
    pageSize: pageSize,
    total: items.length,
    nextPageToken: next,
    items: page,
  };
}
