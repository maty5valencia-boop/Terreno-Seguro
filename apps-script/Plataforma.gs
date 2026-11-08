/**
 * ==================================================================
 *  TERRENO SEGURO · PLATAFORMA (un solo proyecto, muchas empresas)
 * ==================================================================
 *  Instalación (una sola vez, con la cuenta Google de Terreno Seguro):
 *   1. Pega Code, Rubros, Plataforma (secuencias de comandos) y
 *      Tecnico, Admin, Alta, Consola (HTML) en un proyecto nuevo.
 *   2. Revisa URL_WEB (abajo): la dirección de la página de GitHub.
 *   3. Elige la función instalarPlataforma y presiona Ejecutar.
 *      Acepta los permisos. En el registro de ejecución aparece el
 *      PIN de la consola: guárdalo.
 *   4. Implementar > Nueva implementación > Aplicación web
 *        Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario
 *   5. Pon la URL /exec en empresas.json como "_plataforma".
 *   6. Consola: URL /exec?p=consola (PIN del paso 3). Ahí se crean
 *      las empresas modelo de cada rubro (plantillas editables).
 *
 *  Cómo se separan las empresas:
 *   - Registro EMPRESAS (planilla de la plataforma): código, estado y
 *     dónde están su planilla y su carpeta.
 *   - Cada llamada llega con el código de empresa (?e=codigo, o "e" en
 *     el cuerpo, o rpcGs(codigo, …) desde las páginas de Apps Script).
 *   - Propiedades y caché llevan el código como prefijo: las sesiones,
 *     el logo y la planilla de una empresa nunca se ven desde otra.
 *   - Las tareas automáticas (correos, respaldos, Mikrowisp) recorren
 *     todas las empresas activas.
 * ==================================================================
 */

var URL_WEB = 'https://maty5valencia-boop.github.io/Terreno-Seguro/';   // página pública (portada, app y panel)
var DIAS_PRUEBA = 30;
var ALTAS_POR_HORA = 10;     // límite de empresas nuevas por hora (anti abuso)
var CODIGOS_RESERVADOS = ['admin', 'consola', 'plataforma', 'terrenoseguro', 'soporte', 'demo', 'test', 'prueba', 'api', 'www'];
var PUBLICAS_PLATAFORMA = ['apiCrearEmpresa', 'apiCodigoLibre', 'apiPlataformaInfo'];
var REG_COLS = ['codigo', 'nombre', 'rubro', 'estado', 'vence', 'modelo', 'creado', 'contacto', 'telefono', 'correo', 'trabajadores', 'admin_rut', 'ss_url', 'drive_url', 'notas'];

var EMP = null;   // empresa de la llamada en curso {codigo, nombre, rubro, estado, …}

/* ---------- modo y contexto ---------- */

function propsRaw_() { return PropertiesService.getScriptProperties(); }
function modoPlataforma_() { return propsRaw_().getProperty('MODO') === 'PLATAFORMA'; }

/** Propiedades de la empresa actual (clave con prefijo). */
function propsEmp_() {
  var raw = propsRaw_(), pre = 'E_' + EMP.codigo + '_';
  return {
    getProperty: function (k) { return raw.getProperty(pre + k); },
    setProperty: function (k, v) { raw.setProperty(pre + k, v); return this; },
    deleteProperty: function (k) { raw.deleteProperty(pre + k); return this; }
  };
}
/** Caché de la empresa actual (o global si no hay empresa). Mismos métodos que CacheService. */
function cache_() {
  var c = CacheService.getScriptCache();
  if (!EMP) return c;
  var pre = 'E' + EMP.codigo + '_', P = function (k) { return pre + k; };
  return {
    get: function (k) { return c.get(P(k)); },
    put: function (k, v, t) { return t === undefined ? c.put(P(k), v) : c.put(P(k), v, t); },
    remove: function (k) { return c.remove(P(k)); },
    removeAll: function (ks) { return c.removeAll(ks.map(P)); },
    getAll: function (ks) { var r = c.getAll(ks.map(P)), o = {}; ks.forEach(function (k) { if (r[P(k)] !== undefined) o[k] = r[P(k)]; }); return o; },
    putAll: function (o, t) { var x = {}; Object.keys(o).forEach(function (k) { x[P(k)] = o[k]; }); return t === undefined ? c.putAll(x) : c.putAll(x, t); }
  };
}
/** Carpeta donde se crean las carpetas de las empresas. */
function carpetaPadre_() {
  var id = modoPlataforma_() ? propsRaw_().getProperty('PLAT_ROOT') : '';
  return id ? DriveApp.getFolderById(id) : DriveApp.getRootFolder();
}
/** URL del sistema con el código de empresa: urlSis_('p=admin') → …/exec?e=codigo&p=admin */
function urlSis_(q) {
  var base = ScriptApp.getService().getUrl(), partes = [];
  if (EMP && modoPlataforma_()) partes.push('e=' + encodeURIComponent(EMP.codigo));
  if (q) partes.push(q);
  return base + (partes.length ? '?' + partes.join('&') : '');
}

/* ---------- registro de empresas ---------- */

function reg_() {
  var ss = SpreadsheetApp.openById(propsRaw_().getProperty('PLAT_REG'));
  return ss.getSheetByName('EMPRESAS');
}
function regFilas_() {
  var v = reg_().getDataRange().getValues(); v.shift();
  return v.map(function (r, i) { var o = { _row: i + 2 }; REG_COLS.forEach(function (k, j) { var x = r[j]; o[k] = x instanceof Date ? fmt_(x, 'yyyy-MM-dd') : String(x === undefined || x === null ? '' : x); }); return o; })
    .filter(function (o) { return o.codigo; });
}
function regActualizar_(codigo, cambios) {
  var f = regFilas_().filter(function (x) { return x.codigo === codigo; })[0];
  if (!f) return;
  var sh = reg_(), vals = sh.getRange(f._row, 1, 1, REG_COLS.length).getValues()[0];
  REG_COLS.forEach(function (k, j) { if (cambios.hasOwnProperty(k)) vals[j] = cambios[k]; });
  sh.getRange(f._row, 1, 1, REG_COLS.length).setValues([vals]);
  CacheService.getScriptCache().remove('reg_' + codigo);
}
function empresaDe_(codigo) {
  codigo = String(codigo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!codigo) return null;
  var c = CacheService.getScriptCache(), hit = c.get('reg_' + codigo);
  if (hit) return JSON.parse(hit);
  var f = regFilas_().filter(function (x) { return x.codigo === codigo; })[0] || null;
  if (f) c.put('reg_' + codigo, JSON.stringify(f), 600);
  return f;
}
/** Activa la empresa para esta llamada. Bloquea las suspendidas y las pruebas vencidas. */
function usarEmpresa_(codigo, sinBloqueo) {
  var f = empresaDe_(codigo);
  if (!f || f.estado === 'CREANDO' || f.estado === 'ERROR') throw new Error('No encontramos la empresa "' + codigo + '".');
  if (!sinBloqueo) {
    if (f.estado === 'SUSPENDIDA') throw new Error('La cuenta de ' + f.nombre + ' está suspendida. Contacta a Terreno Seguro.');
    if (f.estado === 'PRUEBA' && f.vence && f.vence < fmt_(new Date(), 'yyyy-MM-dd')) throw new Error('Terminó el periodo de prueba de ' + f.nombre + '. Contacta a Terreno Seguro para continuar.');
  }
  EMP = f;
  _M = { ss: null, hojas: {}, filas: {} };
  return f;
}
function dejarEmpresa_() { EMP = null; _M = { ss: null, hojas: {}, filas: {} }; }

/** Desde las páginas servidas por Apps Script: google.script.run.rpcGs(codigo, 'apiX', [args]) */
function rpcGs(codigo, fn, args) {
  if (!/^api[A-Z][A-Za-z0-9]*$/.test(String(fn)) || typeof globalThis[fn] !== 'function') throw new Error('Función no permitida: ' + fn);
  if (modoPlataforma_()) {
    if (codigo) usarEmpresa_(codigo);
    else if (PUBLICAS_PLATAFORMA.indexOf(fn) < 0) throw new Error('Falta el código de empresa.');
  }
  return globalThis[fn].apply(null, Array.isArray(args) ? args : []);
}

/** En la plataforma, una tarea automática sin empresa se repite para cada empresa activa. */
function porEmpresas_(nombre, args) {
  if (!modoPlataforma_() || EMP) return false;
  regFilas_().filter(function (f) { return f.estado === 'ACTIVA' || f.estado === 'PRUEBA'; }).forEach(function (f) {
    try { usarEmpresa_(f.codigo); globalThis[nombre].apply(null, Array.prototype.slice.call(args || [])); }
    catch (e) { console.warn(nombre + ' · ' + f.codigo + ': ' + e); }
    finally { dejarEmpresa_(); }
  });
  return true;
}

/* ---------- páginas de la plataforma ---------- */

function getPlataforma_(e, p) {
  var q = (e && e.parameter) || {};
  var json = function (o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); };
  if (p === 'consola') return HtmlService.createHtmlOutputFromFile('Consola').setTitle('Consola · Terreno Seguro')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  if (p === 'plataforma') return json({ ok: true, plataforma: true, rubros: listaRubros_() });
  if (!q.e) {
    if (p === 'info') return json({ ok: false, error: 'Falta el código de empresa.' });
    return HtmlService.createHtmlOutput('<meta http-equiv="refresh" content="0;url=' + URL_WEB + 'empresa.html">Abriendo Terreno Seguro…');
  }
  try { usarEmpresa_(q.e); }
  catch (err) {
    if (p === 'info') return json({ ok: false, error: err.message });
    return HtmlService.createHtmlOutput('<div style="font:16px system-ui;padding:40px;text-align:center">' + esc_(err.message) + '<p><a href="' + URL_WEB + 'empresa.html">Volver</a></p></div>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return null;   // sigue el doGet normal, ya con la empresa activa
}

/* ---------- alta automática desde la portada ---------- */

function apiCodigoLibre(codigo) {
  codigo = String(codigo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return { codigo: codigo, libre: codigo.length >= 3 && CODIGOS_RESERVADOS.indexOf(codigo) < 0 && !empresaDe_(codigo) };
}
function apiPlataformaInfo() { return { rubros: listaRubros_(), modulos: MODULOS, apagadosRubro: apagadosRubro_() }; }

/**
 * Crea una empresa nueva en prueba. d = datos del alta (como apiAlta) + {contacto, telefono, trabajadores, web (trampa anti robots)}
 */
function apiCrearEmpresa(d) {
  if (!modoPlataforma_()) throw new Error('La plataforma no está instalada.');
  d = d || {};
  if (d.web) throw new Error('Solicitud no válida.');                         // campo trampa: las personas no lo ven
  var c = CacheService.getScriptCache(), hora = 'altas_' + fmt_(new Date(), 'yyyyMMddHH'), n = Number(c.get(hora) || 0);
  if (n >= ALTAS_POR_HORA) throw new Error('Hay muchas empresas creándose en este momento. Intenta en una hora o escríbenos.');
  var v = validarAlta_(d);
  if (CODIGOS_RESERVADOS.indexOf(v.codigo) >= 0) throw new Error('Ese código no está disponible. Prueba otro.');

  var lock = LockService.getScriptLock(), filaCreada = false;
  if (!lock.tryLock(30000)) throw new Error('Estamos creando otra empresa. Intenta en un minuto.');
  try {
    var previa = empresaDe_(v.codigo);
    if (previa && previa.estado === 'ERROR') { reg_().deleteRow(previa._row); CacheService.getScriptCache().remove('reg_' + v.codigo); previa = null; }
    if (previa) throw new Error('El código "' + v.codigo + '" ya está en uso. Prueba otro.');
    c.put(hora, String(n + 1), 3600);
    filaCreada = true;
    var vence = fmt_(new Date(Date.now() + DIAS_PRUEBA * 864e5), 'yyyy-MM-dd');
    reg_().appendRow([v.codigo, v.empresa, v.rubro, 'CREANDO', vence, d.modelo ? 'SI' : '', new Date(), String(d.contacto || (d.admin || {}).nombre || ''),
      String(d.telefono || ''), String(d.correo || ''), String(d.trabajadores || ''), v.rutAdm, '', '', '']);
    CacheService.getScriptCache().remove('reg_' + v.codigo);

    EMP = { codigo: v.codigo, nombre: v.empresa, rubro: v.rubro, estado: 'CREANDO' };
    _M = { ss: null, hojas: {}, filas: {} };
    d.url_app = URL_WEB + '?c=' + v.codigo;
    d.url_panel = URL_WEB + 'panel/?c=' + v.codigo;
    var r = altaCore_(d);
    if (!d.modelo) copiarModelo_(v.rubro);
    regActualizar_(v.codigo, { estado: d.modelo ? 'MODELO' : 'PRUEBA', ss_url: ss_().getUrl(), drive_url: raiz_().getUrl() });
    if (!d.modelo) avisarAltaDueno_(v, d, vence);
    r.urlApp = d.url_app; r.urlPanel = d.url_panel; r.vence = vence;
    delete r.planilla; delete r.drive;   // la planilla y la carpeta son de Terreno Seguro: no se muestran en la portada
    return r;
  } catch (err) {
    if (filaCreada) { try { regActualizar_(v.codigo, { estado: 'ERROR', notas: String(err.message || err).slice(0, 300) }); } catch (e2) {} }
    throw err;
  } finally { lock.releaseLock(); dejarEmpresa_(); }
}

/** Copia formularios, cursos, matriz y plantillas de tickets de la empresa modelo del rubro (si existe). */
var HOJAS_MODELO = ['FORMULARIOS', 'CURSOS', 'MATRIZ', 'PLANTILLAS'];
var CONFIG_MODELO = ['vocabulario', 'modulos_apagados', 'jornada_obligatoria', 'ast_opcional', 'pestanas_ocultas'];
function copiarModelo_(rubro) {
  var m = regFilas_().filter(function (f) { return f.modelo === 'SI' && f.rubro === rubro && f.estado === 'MODELO'; })[0];
  if (!m) return false;
  var destino = ss_(), actual = EMP;
  var pre = 'E_' + m.codigo + '_', ssModelo = SpreadsheetApp.openById(propsRaw_().getProperty(pre + 'SS_ID'));
  HOJAS_MODELO.forEach(function (n) {
    var o = ssModelo.getSheetByName(n), dsh = destino.getSheetByName(n);
    if (!o || !dsh) return;
    var vals = o.getDataRange().getValues();
    if (vals.length < 2) return;   // el modelo no tiene filas: se deja lo del rubro
    if (dsh.getLastRow() > 1) dsh.getRange(2, 1, dsh.getLastRow() - 1, dsh.getLastColumn()).clearContent();
    dsh.getRange(2, 1, vals.length - 1, vals[0].length).setValues(vals.slice(1));
  });
  var cfgM = {}; ssModelo.getSheetByName('CONFIG').getDataRange().getValues().forEach(function (r) { cfgM[r[0]] = r[1]; });
  EMP = actual; fresco_();
  CONFIG_MODELO.forEach(function (k) { if (cfgM[k] !== undefined && cfgM[k] !== '') setCfg_(k, cfgM[k]); });
  fresco_();
  return true;
}
function avisarAltaDueno_(v, d, vence) {
  try {
    var to = propsRaw_().getProperty('PLAT_CORREO') || Session.getEffectiveUser().getEmail();
    MailApp.sendEmail(to, 'Nueva empresa en Terreno Seguro: ' + v.empresa,
      'Se creó una empresa en prueba hasta el ' + vence + '.\n\nEmpresa: ' + v.empresa + '\nCódigo: ' + v.codigo + '\nRubro: ' + v.rubro +
      '\nTrabajadores: ' + (d.trabajadores || '') + '\nContacto: ' + (d.contacto || (d.admin || {}).nombre || '') + '\nTeléfono: ' + (d.telefono || '') + '\nCorreo: ' + (d.correo || '') +
      '\n\nConsola: ' + ScriptApp.getService().getUrl() + '?p=consola');
  } catch (e) { console.warn('Aviso de alta: ' + e); }
}

/* ---------- consola del dueño ---------- */

function consolaAuth_(t) {
  var s = t ? CacheService.getScriptCache().get('cs_' + t) : null;
  if (!s) throw new Error('SESION_EXPIRADA');
  CacheService.getScriptCache().put('cs_' + t, s, 21600);
  return true;
}
function hashConsola_(pin) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, (propsRaw_().getProperty('PLAT_SALT') || '') + String(pin));
  return b.map(function (x) { return ('0' + (x & 255).toString(16)).slice(-2); }).join('');
}
function apiConsolaLogin(pin) {
  var c = CacheService.getScriptCache(), n = Number(c.get('cs_int') || 0);
  if (n >= 5) throw new Error('Demasiados intentos. Espera 5 minutos.');
  if (!pin || hashConsola_(pin) !== propsRaw_().getProperty('PLAT_PIN')) { c.put('cs_int', String(n + 1), 300); throw new Error('PIN incorrecto.'); }
  c.remove('cs_int');
  var t = Utilities.getUuid(); c.put('cs_' + t, '1', 21600);
  return { token: t };
}
function apiConsola(t) {
  consolaAuth_(t);
  return { empresas: regFilas_().map(function (f) { delete f._row; return f; }), rubros: listaRubros_(), hoy: fmt_(new Date(), 'yyyy-MM-dd'),
    registro: SpreadsheetApp.openById(propsRaw_().getProperty('PLAT_REG')).getUrl(), web: URL_WEB };
}
function apiConsolaEstado(t, codigo, estado, vence) {
  consolaAuth_(t);
  if (['ACTIVA', 'PRUEBA', 'SUSPENDIDA'].indexOf(estado) < 0) throw new Error('Estado no válido.');
  var f = empresaDe_(codigo); if (!f) throw new Error('No existe.');
  if (f.modelo === 'SI') throw new Error('Las empresas modelo no cambian de estado.');
  var ch = { estado: estado }; if (vence) ch.vence = vence;
  regActualizar_(codigo, ch);
  return apiConsola(t);
}
/** Abre el panel de cualquier empresa como "Soporte Terreno Seguro" (administrador). */
function apiConsolaEntrar(t, codigo) {
  consolaAuth_(t);
  usarEmpresa_(codigo, true);
  try {
    var ses = { rut: 'SOPORTE', nombre: 'Soporte Terreno Seguro', cargo: 'Soporte', rol: 'admin', email: '', area: 'Oficina' };
    var code = Utilities.getUuid().replace(/-/g, '');
    cache_().put('pc_' + code, JSON.stringify(ses), 120);
    return { url: urlSis_('p=admin&k=' + code) };
  } finally { dejarEmpresa_(); }
}
/** Crea (si faltan) las empresas modelo: una por rubro. Se editan desde su panel y las empresas nuevas copian su contenido. */
function apiConsolaCrearModelos(t) {
  consolaAuth_(t);
  var hechos = [];
  listaRubros_().forEach(function (r) {
    var cod = 'modelo' + r[0].toLowerCase();
    if (empresaDe_(cod)) return;
    var pin = String(100000 + Math.floor(Math.random() * 899999));
    apiCrearEmpresa({ modelo: true, empresa: 'Modelo · ' + r[1], marca: 'Modelo ' + r[1], codigo: cod, rubro: r[0],
      admin: { rut: '11.111.111-1', nombre: 'Plantilla', pin: pin } });
    hechos.push(cod);
  });
  var res = apiConsola(t); res.creados = hechos; return res;
}

/* ---------- instalación ---------- */

/** Las funciones de mantenimiento solo se ejecutan desde el editor (no desde la web). */
function soloEditor_() {
  var activo = '', dueno = '';
  try { activo = Session.getActiveUser().getEmail(); dueno = Session.getEffectiveUser().getEmail(); } catch (e) {}
  if (!activo || activo !== dueno) throw new Error('Esta función se ejecuta solo desde el editor de Apps Script.');
}

/** Ejecútala una vez en el editor. Crea la carpeta y el registro de la plataforma y el PIN de la consola. */
function instalarPlataforma() {
  soloEditor_();
  var pr = propsRaw_();
  if (!pr.getProperty('PLAT_SALT')) pr.setProperty('PLAT_SALT', Utilities.getUuid());
  if (!pr.getProperty('PLAT_ROOT')) pr.setProperty('PLAT_ROOT', DriveApp.createFolder('TERRENO SEGURO · PLATAFORMA').getId());
  var root = DriveApp.getFolderById(pr.getProperty('PLAT_ROOT'));
  if (!pr.getProperty('PLAT_REG')) {
    var ss = SpreadsheetApp.create('TERRENO SEGURO · Registro de empresas');
    ss.setSpreadsheetTimeZone(TZ);
    var sh = ss.getSheets()[0]; sh.setName('EMPRESAS');
    sh.getRange(1, 1, 1, REG_COLS.length).setValues([REG_COLS]).setFontWeight('bold').setBackground('#0E1F45').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    DriveApp.getFileById(ss.getId()).moveTo(root);
    pr.setProperty('PLAT_REG', ss.getId());
  }
  var pin = '';
  if (!pr.getProperty('PLAT_PIN')) {
    pin = String(100000 + Math.floor(Math.random() * 899999));
    pr.setProperty('PLAT_PIN', hashConsola_(pin));
  }
  pr.setProperty('MODO', 'PLATAFORMA');
  // Tareas automáticas únicas (recorren todas las empresas)
  var ya = ScriptApp.getProjectTriggers().map(function (x) { return x.getHandlerFunction(); });
  if (ya.indexOf('avisoDiario') < 0) ScriptApp.newTrigger('avisoDiario').timeBased().everyDays(1).atHour(9).nearMinute(0).inTimezone(TZ).create();
  if (ya.indexOf('resumenSemanal') < 0) ScriptApp.newTrigger('resumenSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).nearMinute(0).inTimezone(TZ).create();
  if (ya.indexOf('respaldoSemanal') < 0) ScriptApp.newTrigger('respaldoSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(23).nearMinute(0).inTimezone(TZ).create();
  Logger.log('Plataforma lista. Carpeta: ' + root.getUrl());
  Logger.log('Registro de empresas: ' + SpreadsheetApp.openById(pr.getProperty('PLAT_REG')).getUrl());
  Logger.log(pin ? 'PIN de la consola: ' + pin + '  (guárdalo; para cambiarlo ejecuta nuevoPinConsola)' : 'El PIN de la consola ya existía.');
  Logger.log('Ahora: Implementar > Nueva implementación > Aplicación web (Ejecutar como: Yo · Cualquier usuario).');
}
function nuevoPinConsola() {
  soloEditor_();
  var pin = String(100000 + Math.floor(Math.random() * 899999));
  propsRaw_().setProperty('PLAT_PIN', hashConsola_(pin));
  Logger.log('Nuevo PIN de la consola: ' + pin);
}
/**
 * Actualiza todas las empresas después de pegar una versión nueva del código
 * (formularios nuevos, columnas nuevas, rubros). Ejecútala desde el editor.
 */
function actualizarTodas() {
  soloEditor_();
  regFilas_().forEach(function (f) {
    if (['ACTIVA', 'PRUEBA', 'MODELO', 'SUSPENDIDA'].indexOf(f.estado) < 0) return;
    try { usarEmpresa_(f.codigo, true); actualizarSistema(); Logger.log('OK ' + f.codigo); }
    catch (e) { Logger.log('ERROR ' + f.codigo + ': ' + e); }
    finally { dejarEmpresa_(); }
  });
}
