/**
 * ==================================================================
 *  TERRENO SEGURO · Prevención de riesgos y trabajo en terreno
 *  Backend Google Apps Script · versión multiempresa (una copia por empresa)
 * ==================================================================
 *  1. Con el correo dedicado, crea un proyecto en script.google.com
 *  2. Pega este archivo como "Code.gs" y crea dos archivos HTML
 *     llamados exactamente "Tecnico" y "Admin" con su contenido.
 *     (y "Alta" para el asistente de alta de empresas).
 *  3. Elige la función autorizar() y presiona Ejecutar (acepta permisos).
 *  4. Implementar > Nueva implementación > Aplicación web
 *       Ejecutar como: Yo     ·   Quién tiene acceso: Cualquier usuario
 *  5. Abre la URL de la implementación: aparece el asistente
 *     "Crear mi empresa". Ahí se ponen los datos, el logo, los colores,
 *     los módulos y el usuario administrador. Al terminar, el sistema
 *     queda instalado (planilla y carpetas en el Drive de esta cuenta).
 *  App técnicos:  URL de la implementación (o la app con código de empresa)
 *  Panel:         URL de la implementación + ?p=admin
 *  NO instales la copia "Plantilla": siempre se copia y se instala la copia.
 * ==================================================================
 */

var TZ = 'America/Santiago';
var URL_APP = '';     // se define por empresa en CONFIG (url_app / url_panel)
var URL_PANEL = '';
/** Enlaces de la app y del panel: los de la página propia (GitHub) o, si no hay, los del script. */
function cfgUrl_(k) { try { return String(cfg_()[k] || '').trim(); } catch (e) { return ''; } }
function urlApp_() { return cfgUrl_('url_app') || URL_APP || urlSis_(''); }
function urlPanel_() { return cfgUrl_('url_panel') || URL_PANEL || urlSis_('p=admin'); }
function comunas_() { var c = {}; try { c = cfg_(); } catch (e) {} return String(c.comunas || '').split(',').map(function (x) { return x.trim(); }).filter(String); }
// Logo de la empresa para la app, el panel y los PDF.
// Es el archivo "logo.png" o "logo.jpg" de la carpeta raíz de la empresa (lo sube el alta o Configuración).
function logo_() {
  if (_M.logo) return _M.logo;
  var c = cache_(), b = c.get('logo_b64'), mime = c.get('logo_mime') || 'image/png';
  if (b === null) {
    b = '';
    try {
      if (props_().getProperty('ROOT_ID')) {
        var it = raiz_().searchFiles("title contains 'logo' and trashed = false");
        while (it.hasNext()) {
          var f = it.next();
          if (/^logo\.(png|jpe?g)$/i.test(f.getName())) { var bl = f.getBlob(); mime = bl.getContentType(); b = Utilities.base64Encode(bl.getBytes()); break; }
        }
      }
    } catch (e) {}
    if (b.length < 95000) { c.put('logo_b64', b, 21600); c.put('logo_mime', mime, 21600); }
  }
  return (_M.logo = { b64: b || '', mime: mime });
}
function logoSrc_() { var l = logo_(); return l.b64 ? 'data:' + l.mime + ';base64,' + l.b64 : LOGO_GENERICO; }
function logoImg_(h) { return '<img src="' + logoSrc_() + '" style="height:' + (h || 70) + 'px">'; }
/** Logo neutro (escudo) para empresas sin logo cargado. */
var LOGO_GENERICO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMxMzMwNkIiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwQTE4MzUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIyMiIgZmlsbD0idXJsKCNnKSIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMuNjAwMDAwMDAwMDAwMDAxNCAxNi45NDAwMDAwMDAwMDAwMDUpIHNjYWxlKDAuNTgpIj4KICA8cGF0aCBkPSJNMiA5NCBMNDAgNTIgTDU0IDY3IEw5NCAxOCBMMTM0IDY2IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMTEiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIvPgogIDxwYXRoIGQ9Ik02NCA4MCBMOTQgNDggTDExNCA3MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjgiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIvPgogIDxwYXRoIGQ9Ik0xMTAgNDAgTDEzNCAzMSBMMTU4IDQwIFY2MCBDMTU4IDc3IDE0NyA4OCAxMzQgOTUgQzEyMSA4OCAxMTAgNzcgMTEwIDYwIFoiIGZpbGw9IiMwRjI3NTYiIHN0cm9rZT0iIzFFOUJGRiIgc3Ryb2tlLXdpZHRoPSI2LjUiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KICA8cGF0aCBkPSJNMTIyIDYxIEwxMzEgNzAgTDE0NyA1MiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU5QkZGIiBzdHJva2Utd2lkdGg9IjciIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L2c+PC9zdmc+';
var ROLES_PANEL = ['admin', 'editor', 'soporte', 'prevencionista'];
var ROLES_EDITOR = ['admin', 'editor', 'prevencionista'];
var ROLES_GESTION = ['admin', 'editor'];   // gastos, fondos y usuarios (no prevencionista)
var ESTADOS_TICKET = ['Asignado', 'En camino', 'En terreno', 'Pendiente', 'Cerrado', 'Anulado'];
var ROLES_TICKETS = ['admin', 'editor', 'soporte'];
var ROLES_INSPECCION = ['admin', 'editor', 'soporte', 'prevencionista'];   // inspección y observación planeada: prevención y jefaturas (no técnicos)
var PLANTILLAS_INICIALES = [
  ['Instalación nueva', 'Instalación', 'Normal', 3, 'Instalación de servicio de internet. Llevar equipo (router/ONT), cable y conectores. Verificar señal y velocidad junto al cliente y dejar la red WiFi configurada.'],
  ['Cliente sin servicio', 'Visita técnica / falla', 'Urgente', 0, 'Cliente sin servicio. Revisar alimentación del equipo, conexiones y señal. Indicar la causa en la OT al cerrar.'],
  ['Servicio lento o intermitente', 'Visita técnica / falla', 'Normal', 2, 'Cliente reporta lentitud o cortes. Medir velocidad y señal, revisar cableado, posición del router y canal WiFi.'],
  ['Cambio de equipo', 'Cambio de equipo', 'Normal', 2, 'Reemplazar equipo del cliente. Registrar números de serie del equipo retirado y del instalado.'],
  ['Traslado de servicio', 'Traslado', 'Normal', 5, 'Trasladar el servicio a la nueva dirección del cliente. Retirar en origen e instalar en destino.'],
  ['Retiro de equipo', 'Retiro de equipo', 'Baja', 5, 'Retirar equipos en comodato (router/ONT/antena) con sus fuentes. Registrar números de serie.'],
  ['Mantención', 'Mantención', 'Baja', 7, 'Mantención preventiva: revisar conexiones, cableado, fijaciones y estado del equipo.']
];

var HOJAS = {
  CONFIG: ['clave', 'valor', 'descripcion'],
  USUARIOS: ['rut', 'nombre', 'cargo', 'rol', 'pin_hash', 'email', 'telefono', 'activo', 'creado', 'area'],
  FORMULARIOS: ['id', 'nombre', 'codigo', 'ambito', 'activo', 'orden', 'definicion'],
  TICKETS: ['id', 'creado', 'creado_por', 'cliente', 'direccion', 'comuna', 'telefono', 'tipo', 'prioridad',
            'descripcion', 'tecnico_rut', 'tecnico_nombre', 'estado', 'lat', 'lng', 'actualizado',
            'carpeta_id', 'carpeta_url', 'notas', 'fecha_programada', 'fecha_limite', 'cliente_id', 'cerrado', 'cliente_rut', 'mw_ticket', 'mw_fecha', 'apoyo_rut', 'apoyo_nombre', 'servicio_id', 'servicio'],
  CLIENTES: ['id', 'nombre', 'rut', 'telefono', 'direccion', 'comuna', 'obs', 'lat', 'lng', 'creado', 'activo', 'plan', 'estado_servicio', 'usuario_ppp', 'precinto', 'mapa_url', 'mw_id', 'email', 'servicios'],
  PLANTILLAS: ['id', 'nombre', 'tipo', 'prioridad', 'plazo_dias', 'descripcion', 'activo', 'orden'],
  EQUIPOS: ['serie', 'tipo', 'marca', 'modelo', 'mac', 'estado', 'tecnico_rut', 'tecnico_nombre', 'cliente_id', 'cliente_nombre', 'ticket_id', 'actualizado', 'obs', 'creado'],
  MOVIMIENTOS_EQ: ['id', 'fecha', 'serie', 'accion', 'detalle', 'tecnico_nombre', 'cliente_id', 'cliente_nombre', 'ticket_id', 'usuario'],
  REGISTROS: ['id', 'fecha', 'form_id', 'form_nombre', 'ticket_id', 'tecnico_rut', 'tecnico_nombre',
              'lat', 'lng', 'precision', 'direccion_gps', 'n_alertas', 'alertas', 'riesgos', 'total',
              'pdf_url', 'carpeta_url', 'client_id', 'datos'],
  DOCUMENTOS: ['id', 'fecha', 'rut', 'nombre', 'categoria', 'tipo', 'curso_id', 'descripcion', 'fecha_emision', 'fecha_vence',
               'horas', 'url', 'subido_por', 'estado', 'obs'],
  CURSOS: ['id', 'nombre', 'horas', 'vigencia_meses', 'aplica', 'base', 'activo', 'orden'],
  CAPACITACIONES: ['id', 'fecha', 'curso_id', 'curso_nombre', 'horas', 'relator', 'relator_rut', 'lugar', 'temario', 'evaluacion',
                   'asistentes', 'acta_url', 'creado_por', 'creado'],
  ENTREGAS: ['id', 'fecha', 'rut', 'nombre', 'motivo', 'items', 'obs', 'entregado_por', 'estado', 'firma_url', 'fecha_firma', 'pdf_url', 'creado',
             'firma_empleador_url', 'firmado_empleador_por'],
  BIBLIOTECA: ['id', 'fecha', 'categoria', 'titulo', 'version', 'fecha_doc', 'fecha_vence', 'url', 'mime', 'publico', 'requiere_firma',
               'asistentes', 'subido_por', 'activo', 'obs'],
  FONDOS: ['id', 'fecha', 'rut', 'nombre', 'monto', 'medio', 'obs', 'entregado_por', 'creado'],
  VEHICULOS: ['patente', 'marca', 'modelo', 'anio', 'activo', 'obs', 'creado'],
  ACTIVIDADES: ['id', 'fecha', 'tipo', 'hora_inicio', 'hora_fin', 'lugar', 'realizada_por', 'asistentes', 'acuerdos', 'obs', 'acta_url', 'creado_por', 'creado',
                'indice_uv', 'prevencion', 'firma_realizador', 'charla_id'],
  INVENTARIO: ['codigo', 'nombre', 'categoria', 'unidad', 'minimo', 'activo', 'obs', 'creado', 'serializado'],
  MOV_INV: ['id', 'fecha', 'tipo', 'codigo', 'nombre', 'cantidad', 'rut', 'tecnico', 'ref', 'ticket_id', 'factura_id', 'usuario', 'obs'],
  FACTURAS: ['id', 'fecha', 'numero', 'tipo_doc', 'proveedor', 'rut_proveedor', 'monto', 'items', 'archivo_url', 'recibido_por', 'firma_url', 'pdf_url', 'usuario', 'obs', 'creado'],
  ACTIVOS: ['id', 'nombre', 'tipo', 'marca', 'modelo', 'serie', 'estado', 'rut', 'nombre_tecnico', 'desde', 'obs', 'activo', 'creado'],
  PRESTAMOS: ['id', 'activo_id', 'activo', 'rut', 'nombre', 'fecha_entrega', 'entregado_por', 'estado_salida', 'obs_salida', 'firma_url', 'fecha_firma',
              'fecha_devolucion', 'recibido_por', 'estado_devolucion', 'obs_devolucion', 'pdf_url', 'creado'],
  FALLAS: ['id', 'creado', 'reportado_por', 'reportado_rut', 'tipo', 'alcance', 'sector', 'comuna', 'descripcion', 'inicio', 'fin', 'horas', 'clientes', 'tickets',
           'causa', 'solucion', 'estado', 'fotos', 'fotos_cierre', 'lat', 'lng', 'carpeta_url', 'materiales', 'cerrado_por', 'actualizado'],
  PAPELERA: ['fecha', 'hoja', 'id', 'usuario', 'motivo', 'datos'],
  SOLICITUDES: ['id', 'fecha', 'registro_id', 'form_id', 'patente', 'rut', 'nombre', 'item', 'motivo', 'estado', 'revisado_por', 'fecha_revision', 'obs', 'pdf_url'],
  CAJA: ['id', 'fecha', 'tipo', 'medio', 'monto', 'concepto', 'proveedor', 'documento', 'responsable', 'comprobante_url', 'registrado_por', 'creado'],
  INFRA: ['id', 'tipo', 'nombre', 'ubicacion', 'marca', 'modelo', 'serie', 'capacidad', 'cada_dias', 'activo', 'obs', 'creado'],
  MANTENCIONES: ['id', 'equipo_id', 'fecha', 'tipo', 'realizada_por', 'horometro', 'detalle', 'costo', 'archivo_url', 'registrado_por', 'creado'],
  MW_COLA: ['id', 'fecha', 'mw_ticket', 'accion', 'texto', 'estado'],
  MATRIZ: ['id', 'orden', 'proceso', 'tarea', 'puesto', 'rutinaria', 'peligro', 'riesgo', 'consecuencia', 'p', 'c', 'medidas', 'jerarquia', 'p_res', 'c_res',
            'responsable', 'plazo', 'estado', 'ast_tipos', 'actualizado', 'actualizado_por'],
  PAUTA_CHARLAS: ['id', 'n', 'fecha', 'bloque', 'tema', 'referencia', 'objetivo', 'puntos', 'pregunta', 'op_a', 'op_b', 'op_c', 'correcta', 'mensaje', 'actividad_id', 'realizada'],
  RESP_CHARLAS: ['id', 'fecha', 'charla_id', 'actividad_id', 'rut', 'nombre', 'respuesta', 'correcta'],
  AUSENCIAS: ['id', 'rut', 'nombre', 'tipo', 'desde', 'hasta', 'obs', 'registrado_por', 'creado'],
  SABADOS: ['fecha', 'ruts', 'actualizado', 'por'],
  FIRMAS_OT: ['id', 'creado', 'registro_id', 'ticket_id', 'cliente', 'telefono', 'clave', 'estado', 'firmado', 'nombre', 'rut', 'firma_url', 'pdf_url', 'vence'],
  ONUS: ['sn', 'external_id', 'nombre', 'olt', 'tarjeta', 'puerto', 'zona', 'estado', 'senal', 'actualizado'],
  RED: ['id', 'tipo', 'nombre', 'lat', 'lng', 'olt', 'pon', 'splitter', 'capacidad', 'ocupados', 'cupos', 'potencia', 'estado', 'obs', 'origen', 'actualizado', 'precinto', 'precintos', 'reservas']
};

var CURSOS_INICIALES = [
  // id, nombre, horas, vigencia (meses, 0 = no vence), aplica (todos/opcional), base
  ['IRL', 'Información de riesgos laborales (IRL)', '', 0, 'todos', 'DS 44 art. 15: al ingresar y cada vez que cambie la tarea o sus riesgos. Acta firmada.'],
  ['SST', 'Capacitación en seguridad y salud en el trabajo', 8, 24, 'todos', 'DS 44: mínimo 8 horas, al menos cada 2 años.'],
  ['EPP', 'Uso y mantención de EPP', 1, 12, 'todos', 'DS 44: mínimo 1 hora, reforzar anualmente y al cambiar el tipo de EPP.'],
  ['MAQ', 'Uso seguro de máquinas, equipos y herramientas', '', 12, 'todos', 'DS 44: según manual del fabricante; repaso anual recomendado.'],
  ['ALTURA', 'Trabajo en altura física', '', 24, 'todos', 'Exigencia interna de la empresa (ajustar horas y vigencia).'],
  ['ELECT', 'Riesgo eléctrico en redes', '', 24, 'todos', 'Exigencia interna de la empresa (ajustar horas y vigencia).'],
  ['EXTINTOR', 'Uso y manejo de extintores', '', 12, 'todos', 'Prevención y control de incendios; práctica con extintor. Repaso anual recomendado (ajustar).'],
  ['MANEJO', 'Manejo defensivo', '', 24, 'opcional', 'Exigencia interna para conductores (ajustar).'],
  ['DSST', 'Delegado(a) de seguridad y salud en el trabajo', 8, 0, 'opcional', 'DS 44: 8 horas, idealmente en el primer semestre del mandato.'],
  ['ENCARGADO', 'Encargado(a) de prevención de riesgos', 24, 0, 'opcional', 'DS 44 (empresas hasta 100 personas): 24 horas.']
];
var TIPOS_DOCUMENTO = ['Licencia de conducir', 'Examen psicosensotécnico', 'Examen ocupacional / preocupacional', 'Cédula de identidad',
  'Contrato / anexo', 'Certificado de curso', 'Otro'];
var ROPA_SUGERIDA = ['Polera piqué manga larga', 'Camisa', 'Polar', 'Chaquetilla', 'Chaqueta softshell', 'Parka', 'Pantalón de trabajo', 'Jeans',
  'Overol', 'Jockey', 'Chaleco reflectante', 'Zapatos de seguridad'];
var EPP_EXTRA = ['Guante de tacto fino', 'Guante anticorte', 'Bloqueador solar', 'Lentes antiparras'];
// Respuestas que disparan correo URGENTE inmediato
/* Formularios confidenciales (Ley Karin): solo los ve el administrador; el correo de aviso no lleva detalles. */
var FORMS_CONFIDENCIALES = ['DENUNCIA'];
function esConfidencial_(fid) { return FORMS_CONFIDENCIALES.indexOf(fid) >= 0; }
/* Color de la anilla de extintores de polvo químico según el año (D.S. 44, art. 13°). */
var ANILLAS_EXT = { 2020: 'café claro', 2021: 'negro', 2022: 'amarillo', 2023: 'celeste', 2024: 'verde oscuro', 2025: 'azul', 2026: 'lila', 2027: 'blanco', 2028: 'verde claro', 2029: 'naranjo' };
function anillaTxt_() { var y = Number(fmt_(new Date(), 'yyyy')); return y + ': ' + String(ANILLAS_EXT[y] || '—').toUpperCase() + (ANILLAS_EXT[y - 1] ? ', o ' + (y - 1) + ': ' + String(ANILLAS_EXT[y - 1]).toUpperCase() + ' si aún está vigente' : ''); }
var CRITICOS = { SOMNOLENCIA: ['s2', 's3', 's4', 's7'], AST: ['g_estado', 'optimas'], BITACORA: ['tipo_reg'], INCIDENTE: ['*'], DENUNCIA: ['*'] };

var CONFIG_INICIAL = [
  ['empresa', '', 'Razón social que aparece en los PDF'],
  ['marca', '', 'Nombre que aparece en la app'],
  ['codigo_empresa', '', 'Código corto de la empresa (lo escribe el técnico en la app la primera vez)'],
  ['rubro', '', 'Rubro de la empresa (ISP, MINERIA, CONSTRUCCION, ALIMENTOS, BODEGA u OTRO): define formularios, cursos, matriz y nombres'],
  ['vocabulario', '', 'Nombres propios de la empresa en JSON, ej. {"tickets":"Órdenes de trabajo","clientes":"Mandantes"} (vacío = los del rubro)'],
  ['color_primario', '#13306B', 'Color principal de la app y el panel'],
  ['color_acento', '#1E9BFF', 'Color de acento (botones y marcas)'],
  ['modulos_apagados', '[]', 'Pestañas del panel que esta empresa no usa (nadie las ve, ni el admin)'],
  ['dias_prestamo', '7', 'Días de préstamo de un equipo de medición antes de avisar en el correo diario'],
  ['correo_notificaciones', '', 'Correo(s) que reciben los registros, separados por coma'],
  ['notificar', 'TODOS', 'TODOS · SOLO_ALERTAS · NO'],
  ['correo_urgencias', '', 'Correo(s) para alertas URGENTES (vacío = el de notificaciones)'],
  ['correo_denuncias', '', 'Correo para denuncias confidenciales Ley Karin (vacío = el de notificaciones)'],
  ['razon_social', '', 'Razón social del empleador (documentos de entrega)'],
  ['rut_empresa', '', 'RUT del empleador'],
  ['ciudad', '', 'Ciudad que aparece en los documentos'],
  ['comunas', '', 'Comunas donde opera la empresa, separadas por coma (la primera es la principal)'],
  ['representante', '', 'Nombre de quien firma por el empleador'],
  ['jornada_obligatoria', 'SOMNOLENCIA', 'Formularios que cada técnico debe llenar a diario (IDs separados por coma)'],
  ['contador_tickets', '0', 'Correlativo de tickets (no editar)']
];

// <<FORMS  (este bloque también lo usa la vista previa)
var PATENTES_EMPRESA = [];   // las patentes se cargan por empresa en Vehículos
var MEDIOS_PAGO = ['Tarjeta empresa', 'Transferencia empresa', 'Caja chica', 'Fondo por rendir', 'Cuenta propia del colaborador'];

function L_(pre, textos, extra) {
  return textos.map(function (t, i) {
    var o = { id: pre + (i + 1), tipo: 'sino', texto: t, req: true };
    for (var k in (extra || {})) o[k] = extra[k];
    return o;
  });
}

var CINTA_ITEMS = [
  { id: 'cinta_mes', tipo: 'sino', texto: '¿Tus herramientas y equipos tienen la cinta del color del mes ({COLOR_MES})?', alerta: 'NO' },
  { id: 'herr_roja', tipo: 'sino', texto: '¿Tienes alguna herramienta o equipo dañado? (márcalo con cinta ROJA y no lo uses)', alerta: 'SI' },
  { id: 'herr_roja_cual', tipo: 'texto', texto: 'Si hay alguno dañado: ¿cuál? (se entrega para reparación o baja)' }
];
var GRAVE_ITEMS = [
  { id: 'grave', tipo: 'multiple', texto: 'Marca si el accidente cumple alguno de estos criterios (si marcas uno, es accidente GRAVE o FATAL)', alertaSiMarca: true, opciones: [
    'Fatal: el trabajador falleció', 'Amputación o pérdida de cualquier parte del cuerpo', 'Obligó a maniobras de reanimación (RCP)', 'Obligó a maniobras de rescate',
    'Caída de altura de más de 1,8 metros (aunque el arnés la haya detenido)', 'Ocurrió en condiciones hiperbáricas (buceo, cámara hiperbárica)', 'Afectó a tantos trabajadores que alteró la faena'] },
  { id: 'grave_info', tipo: 'info', texto: 'Si es GRAVE o FATAL: 1) Suspender de inmediato la faena afectada y evacuar si hay riesgo. 2) Avisar de inmediato a la Inspección del Trabajo y a la SEREMI de Salud al 600 42 000 22 (avisar a la SUSESO NO cuenta). 3) Dar nombre y RUN del trabajador, empresa y RUT, dirección, tipo (grave o fatal) y qué pasó. 4) Hacer la DIAT en la mutualidad indicando que es grave o fatal. 5) No reanudar hasta que la Inspección o la SEREMI lo autorice. Aunque no se vea lesión (caída de más de 1,8 m, rescate o muchos afectados), igual se suspende, se avisa y se envía al trabajador a la mutualidad. No aplica la suspensión en accidentes de trayecto ni en la vía pública.' },
  { id: 'grave_susp', tipo: 'sino', texto: 'Si es grave o fatal: ¿se suspendió la faena afectada?', na: true, alerta: 'NO' },
  { id: 'grave_aviso', tipo: 'sino', texto: 'Si es grave o fatal: ¿se avisó a la Inspección del Trabajo y SEREMI (600 42 000 22)?', na: true, alerta: 'NO' },
  { id: 'grave_mutual', tipo: 'sino', texto: 'Si es grave o fatal: ¿se envió al trabajador a la mutualidad (aunque no tenga lesión visible)?', na: true, alerta: 'NO' },
  { id: 'grave_diat', tipo: 'sino', texto: 'Si es grave o fatal: ¿se hizo la DIAT indicando que es grave o fatal?', na: true, alerta: 'NO' }
];
var EXTINTOR_ITEMS = [
  ['ex1', 'El extintor está completamente rojo, sin otro color semejante'], ['ex2', 'Está debidamente rotulado'], ['ex3', 'Tiene rótulo con las características del extintor'],
  ['ex4', 'Tiene rótulo con instrucciones de uso'], ['ex5', 'Las características están en la parte posterior o lateral, sin adulteración'],
  ['ex6', 'Las instrucciones de uso son claras y visibles en la posición normal del extintor'], ['ex7', 'Tiene visible y legible la etiqueta del último servicio técnico / mantención']
].map(function (x) { return { id: x[0], tipo: 'sino', texto: x[1], alerta: 'NO', req: true }; });
var EXTINTOR_ACC = [
  ['ex8', 'Manguera en buen estado'], ['ex9', 'Boquilla de descarga en buenas condiciones'], ['ex10', 'Manómetro en buen estado'], ['ex11', 'Válvula de descarga en buen estado'],
  ['ex12', 'Cintillo en buen estado'], ['ex13', 'Presión adecuada (aguja en verde)'], ['ex14', 'Seguro anti-percusión (pasador) puesto'], ['ex15', 'El extintor está limpio (sin suciedad)']
].map(function (x) { return { id: x[0], tipo: 'sino', texto: x[1], alerta: 'NO', req: true }; });
var DEFAULT_FORMS = [
  {
    id: 'EXTINTOR', nombre: 'Inspección de extintores', codigo: 'SIG-FO-30', ambito: 'libre',
    icono: '🧯', descripcion: 'Revisión del extintor (vehículo, oficina o bodega).', requiereGeo: false,
    secciones: [
      { titulo: 'Extintor', items: [
        { id: 'ext_ubic', tipo: 'texto', texto: 'Extintor inspeccionado: ubicación, patente o N°', req: true },
        { id: 'ext_tipo', tipo: 'opciones', texto: 'Tipo', opciones: ['Polvo químico seco (PQS)', 'CO2', 'Agua', 'Otro'] },
        { id: 'ext_kg', tipo: 'texto', texto: 'Capacidad (kg)' }
      ]},
      { titulo: 'Check list extintores', nota: 'SÍ = cumple · NO = no cumple (queda como alerta)', items: EXTINTOR_ITEMS },
      { titulo: 'Accesorios del extintor', items: EXTINTOR_ACC.concat([
        { id: 'ex16', tipo: 'sino', texto: 'Polvo químico: el color de la anilla corresponde al año ({ANILLA}). Decreto 44, art. 13°', alerta: 'NO', na: true, req: true }]) },
      { titulo: 'Cierre', items: [
        { id: 'obs', tipo: 'parrafo', texto: 'Observaciones (indica el N° del ítem que no cumple)' },
        { id: 'fotos', tipo: 'foto', texto: 'Fotos del extintor' },
        { id: 'auditado', tipo: 'texto', texto: 'Auditado por (opcional)' },
        { id: 'firma', tipo: 'firma', texto: 'Firma de quien inspecciona', req: true },
        { id: 'firma_auditor', tipo: 'firma', texto: 'Firma de quien audita (opcional)' }
      ]}
    ]
  },
  {
    id: 'DENUNCIA', nombre: 'Denuncia de acoso o violencia (Ley Karin)', codigo: 'SIG-FO-50', ambito: 'libre',
    icono: '🛡️', descripcion: 'Acoso sexual, acoso laboral o violencia en el trabajo. Es confidencial: solo la recibe la gerencia.', requiereGeo: false,
    secciones: [
      { titulo: 'Confidencial', items: [
        { id: 'conf', tipo: 'info', texto: 'Esta denuncia es confidencial. Solo la ve la gerencia (administrador del sistema); no aparece para jefaturas ni compañeros. También puedes hacerla directamente en la Inspección del Trabajo.' }
      ]},
      { titulo: '1. Denunciante', items: [
        { id: 'denunciante', tipo: 'texto', texto: 'Nombre del denunciante', auto: 'tecnico', req: true },
        { id: 'quien', tipo: 'opciones', texto: '¿Quién es la persona afectada?', req: true, opciones: ['Yo soy la persona afectada', 'Denuncio por otra persona'] },
        { id: 'afectado', tipo: 'texto', texto: 'Si denuncias por otra persona: nombre de la persona afectada' }
      ]},
      { titulo: '2. Tipo de denuncia', items: [
        { id: 'tipo_den', tipo: 'multiple', texto: 'Marca uno o más', req: true, opciones: ['Acoso sexual', 'Acoso laboral', 'Violencia en el trabajo'] }
      ]},
      { titulo: '3. Descripción de los hechos', items: [
        { id: 'hechos', tipo: 'parrafo', texto: 'Qué pasó, cuándo, dónde y cuántas veces', req: true }
      ]},
      { titulo: '4. Identificación del denunciado', items: [
        { id: 'denunciado', tipo: 'parrafo', texto: 'Nombre, cargo y relación con la persona afectada', req: true }
      ]},
      { titulo: '5. Medios de prueba y testigos', items: [
        { id: 'pruebas', tipo: 'parrafo', texto: 'Testigos (nombres) y otras pruebas: mensajes, correos, etc.' },
        { id: 'adjuntos', tipo: 'foto', texto: 'Adjuntar pruebas (fotos o capturas, opcional)' }
      ]},
      { titulo: 'Firma', items: [
        { id: 'firma', tipo: 'firma', texto: 'Firma del denunciante', req: true }
      ]}
    ]
  },
  {
    id: 'INSPECCION', nombre: 'Inspección planeada', codigo: 'SIG-FO-19', ambito: 'libre', roles: ROLES_INSPECCION,
    icono: '🔎', descripcion: 'Condiciones subestándar en un lugar, equipo o faena. La hace prevención o jefatura.', requiereGeo: true,
    secciones: [
      { titulo: '1. Identificación', items: [
        { id: 'direccion', tipo: 'texto', texto: 'Dirección', req: true },
        { id: 'area', tipo: 'opciones', texto: 'Área', req: true, opciones: ['Operativa / Espacios públicos', 'Operativa / Domicilio de cliente', 'Oficina', 'Bodega', 'Vehículos', 'Otra'] },
        { id: 'tipo_insp', tipo: 'opciones', texto: 'Tipo de inspección', req: true, opciones: ['Inspección general', 'Inspección parcial', 'Inspección a partes críticas'] },
        { id: 'equipo', tipo: 'texto', texto: 'Equipo o elemento crítico (si aplica)' }
      ]},
      { titulo: '2. Detección', nota: 'Anota cada condición subestándar con su riesgo. Clasificación ALTA queda como alerta.', items: [1, 2, 3].reduce(function (a, n) {
        return a.concat([
          { id: 'cond' + n, tipo: 'parrafo', texto: 'Condición subestándar ' + n, req: n === 1 },
          { id: 'riesgo' + n, tipo: 'texto', texto: 'Riesgo asociado ' + n + ' (qué puede pasar)', req: n === 1 },
          { id: 'clas' + n, tipo: 'opciones', texto: 'Clasificación del riesgo ' + n, req: n === 1, alerta: 'Alta', opciones: ['Alta', 'Mediana', 'Baja'] },
          { id: 'prob' + n, tipo: 'opciones', texto: 'Probabilidad de ocurrencia ' + n, req: n === 1, opciones: ['Alta', 'Mediana', 'Baja'] }
        ]); }, []).concat([{ id: 'fotos', tipo: 'foto', texto: 'Fotos de lo detectado' }]) },
      { titulo: '3. Recomendación', items: [
        { id: 'medidas', tipo: 'parrafo', texto: 'Medidas tomadas o que se deben tomar', req: true }
      ]},
      { titulo: '4. Aplicación', items: [
        { id: 'responsable', tipo: 'texto', texto: 'Responsable de aplicar las medidas', req: true },
        { id: 'plazo', tipo: 'fecha', texto: 'Plazo', req: true }
      ]},
      { titulo: 'Firma', items: [
        { id: 'realizado', tipo: 'texto', texto: 'Realizado por', auto: 'tecnico', req: true },
        { id: 'firma', tipo: 'firma', texto: 'Firma de quien inspecciona', req: true }
      ]}
    ]
  },
  {
    id: 'OBSERVACION', nombre: 'Observación planeada', codigo: 'SIG-FO-20', ambito: 'libre', roles: ROLES_INSPECCION,
    icono: '👁️', descripcion: 'Observar a un trabajador haciendo su tarea (actos inseguros). La hace prevención o jefatura.', requiereGeo: true,
    secciones: [
      { titulo: '1. Datos', items: [
        { id: 'administracion', tipo: 'texto', texto: 'Administración', req: true },
        { id: 'area', tipo: 'texto', texto: 'Área / sección', req: true },
        { id: 'trabajo', tipo: 'texto', texto: 'Trabajo observado (ej: instalación de fibra óptica)', req: true },
        { id: 'hora', tipo: 'hora', texto: 'Hora', req: true },
        { id: 'direccion', tipo: 'texto', texto: 'Dirección del trabajo' },
        { id: 'observado', tipo: 'persona', texto: 'Trabajador observado', req: true },
        { id: 'observado2', tipo: 'persona', texto: 'Segundo trabajador observado (si eran dos)' },
        { id: 'descripcion', tipo: 'parrafo', texto: 'Breve descripción del trabajo observado', req: true },
        { id: 'obs_generales', tipo: 'parrafo', texto: 'Observaciones generales' }
      ]},
      { titulo: '2. Actos y procedimientos observados', items: [
        { id: 'p21', tipo: 'sino', texto: '2.1 La práctica observada podría provocar un accidente o incidente', alerta: 'SI', req: true },
        { id: 'p21_pq', tipo: 'parrafo', texto: 'Si es SÍ, ¿por qué?' },
        { id: 'p22', tipo: 'sino', texto: '2.2 La práctica observada se ajusta a las normas y procedimientos establecidos', alerta: 'NO', req: true },
        { id: 'p22_pq', tipo: 'parrafo', texto: 'Si es NO, ¿por qué?' },
        { id: 'p23', tipo: 'sino', texto: '2.3 Los procedimientos observados son los más eficientes', req: true },
        { id: 'p23_pq', tipo: 'parrafo', texto: 'Si es NO, ¿por qué?' },
        { id: 'p24', tipo: 'sino', texto: '2.4 Se observó algún acto o procedimiento mejor que los ya establecidos', req: true },
        { id: 'p24_pq', tipo: 'parrafo', texto: 'Si es SÍ, ¿cuál?' }
      ]},
      { titulo: '3. Sobre el lugar y las personas', nota: 'DEFICIENTE queda como alerta.', items: [
        ['l1', '3.1 Orden y limpieza'], ['l2', '3.2 Protección personal adecuada'], ['l3', '3.3 Presentación personal'], ['l4', '3.4 Elementos de apoyo adecuados'],
        ['l5', '3.5 Estado de las herramientas'], ['l6', '3.6 Estado del vehículo'], ['l7', '3.7 Uso de elementos de señalización'], ['l8', '3.8 Cuidado de instrumentos']
      ].map(function (x) { return { id: x[0], tipo: 'opciones', texto: x[1], req: true, alerta: 'Deficiente', opciones: ['Bien', 'Regular', 'Deficiente', 'No aplica'] }; }) },
      { titulo: '4. Recomendaciones y observaciones', items: [
        { id: 'recomendaciones', tipo: 'parrafo', texto: '4. Recomendaciones realizadas', req: true },
        { id: 'observaciones', tipo: 'parrafo', texto: '5. Observaciones' },
        { id: 'fotos', tipo: 'foto', texto: 'Fotos (opcional)' }
      ]},
      { titulo: '6. Firmas', items: [
        { id: 'realizado', tipo: 'texto', texto: 'Realizado por', auto: 'tecnico', req: true },
        { id: 'firma', tipo: 'firma', texto: 'Firma de quien observa', req: true },
        { id: 'firma_obs', tipo: 'firma', texto: 'Firma del trabajador observado (toma conocimiento, opcional)' },
        { id: 'revisado', tipo: 'texto', texto: 'Revisada por (opcional)' },
        { id: 'firma_rev', tipo: 'firma', texto: 'Firma de quien revisa (opcional)' }
      ]}
    ]
  },
  {
    id: 'SOMNOLENCIA', nombre: 'Declaración de salud y somnolencia', codigo: 'SIG-FO-41', ambito: 'jornada',
    icono: '😴', descripcion: 'Antes de conducir, una vez por jornada.', requiereGeo: true,
    secciones: [
      { titulo: 'Conductor', items: [
        { id: 'conductor', tipo: 'texto', texto: 'Conductor', auto: 'tecnico', req: true },
        { id: 'rut', tipo: 'texto', texto: 'RUT', auto: 'rut', req: true },
        { id: 'trayecto', tipo: 'parrafo', texto: 'Trayecto planificado', req: true }
      ]},
      { titulo: 'Declaración', items: [
        { id: 's1', tipo: 'sino', texto: '¿Planifiqué mi desplazamiento antes de iniciar el traslado? (caminos, clima, etc.)', alerta: 'NO', req: true },
        { id: 's2', tipo: 'sino', texto: '¿Están presentes en mí la fatiga y somnolencia?', alerta: 'SI', req: true },
        { id: 's3', tipo: 'sino', texto: '¿Están presentes en mí el alcohol y/o drogas?', alerta: 'SI', req: true },
        { id: 's4', tipo: 'sino', texto: '¿Estoy libre de estupefacientes y/o medicamentos que causan somnolencia o reducen reflejos?', alerta: 'NO', req: true },
        { id: 's5', tipo: 'sino', texto: '¿Estoy consciente de que ante cansancio o sueño debo detener la conducción?', alerta: 'NO', req: true },
        { id: 's6', tipo: 'sino', texto: '¿El trayecto considera menos de 5 horas de conducción?', alerta: 'NO', req: true },
        { id: 's7', tipo: 'sino', texto: '¿Tengo patologías físicas y/o psicológicas que me impidan conducir?', alerta: 'SI', req: true },
        { id: 'obs', tipo: 'parrafo', texto: 'Observaciones' }
      ]},
      { titulo: 'Acompañantes y firma', items: [
        { id: 'acomp', tipo: 'participantes', texto: 'Acompañantes (si van)' },
        { id: 'firma', tipo: 'firma', texto: 'Firma del conductor', req: true }
      ]}
    ]
  },
  {
    id: 'VEHICULO', nombre: 'Checklist de vehículo', codigo: 'CHK-VEH', ambito: 'jornada',
    icono: '🚐', descripcion: 'Revisión del vehículo antes de usarlo.', requiereGeo: true,
    secciones: [
      { titulo: 'Vehículo', items: [
        { id: 'patente', tipo: 'opciones', texto: 'Patente', opciones: PATENTES_EMPRESA, req: true },
        { id: 'km', tipo: 'numero', texto: 'Kilometraje inicial', req: true },
        { id: 'combustible', tipo: 'opciones', texto: 'Nivel de combustible', opciones: ['Reserva', '1/4', '1/2', '3/4', 'Lleno'], req: true }
      ]},
      { titulo: 'Documentos vigentes', items: L_('d', ['Permiso de circulación', 'Revisión técnica y gases', 'SOAP', 'Licencia de conducir'], { alerta: 'NO' }) },
      { titulo: 'Estado del vehículo', nota: 'SI = en buen estado', items: L_('e', [
        'Luces (altas, bajas, freno, intermitentes)', 'Frenos y freno de mano', 'Neumáticos (presión y desgaste)',
        'Rueda de repuesto, gata y llave', 'Espejos y parabrisas', 'Plumillas y limpiaparabrisas',
        'Cinturones de seguridad', 'Bocina y alarma de retroceso', 'Niveles de aceite, agua y líquido de frenos',
        'Carrocería sin daños nuevos'], { alerta: 'NO' }) },
      { titulo: 'Elementos de seguridad', items: L_('k', [
        'Extintor con carga vigente', 'Botiquín', 'Triángulos y chaleco reflectante',
        'Escalera y carga bien amarradas'], { alerta: 'NO' }) },
      { titulo: 'Evidencia', items: [
        { id: 'fotos', tipo: 'foto', texto: 'Fotos del vehículo o daños' },
        { id: 'obs', tipo: 'parrafo', texto: 'Observaciones' },
        { id: 'firma', tipo: 'firma', texto: 'Firma del conductor', req: true }
      ]}
    ]
  },
  {
    id: 'EPP', nombre: 'Checklist elementos de protección personal', codigo: 'CHK-EPP', ambito: 'jornada',
    icono: '⛑️', descripcion: '¿Tengo mi EPP completo y en buen estado?', requiereGeo: false,
    secciones: [
      { titulo: 'EPP', nota: 'SI = lo tengo y está en buen estado', items: L_('p', [
        'Casco con barbiquejo', 'Calzado de seguridad', 'Guantes de cabritilla', 'Guantes dieléctricos',
        'Lentes de seguridad', 'Arnés de seguridad', 'Estrobo / cola con amortiguador de impacto',
        'Línea de vida y deslizador', 'Ropa de trabajo', 'Chaleco reflectante', 'Protector solar',
        'Cubrenuca legionario', 'Protector auditivo', 'Anilla', 'Mosquetón'], { alerta: 'NO', na: true }) },
      { titulo: 'Evidencia', items: [
        { id: 'fotos', tipo: 'foto', texto: 'Foto del EPP' },
        { id: 'obs', tipo: 'parrafo', texto: 'Observaciones / elementos a reponer' },
        { id: 'firma', tipo: 'firma', texto: 'Firma del trabajador', req: true }
      ]}
    ]
  },
  {
    id: 'HERRAMIENTAS', nombre: 'Checklist herramientas personales', codigo: 'CHK-HER', ambito: 'jornada',
    icono: '🧰', descripcion: 'Elementos de trabajo asignados al técnico.', requiereGeo: false,
    secciones: [
      { titulo: 'Elementos de trabajo', nota: 'SI = lo tengo y está en buen estado · NO = falta o está dañado', items: L_('h', [
        'Alicate', 'Broca de cemento', 'Broca de madera', 'Broca de metal', 'Cartonero',
        'Cortadora', 'Alicate cortante', 'Crimpadora', 'Destornillador de cruz', 'Destornillador de paleta',
        'Llave francesa', 'Puntero láser', 'Martillo', 'Medidor', 'Peladora amarilla',
        'Linterna minera', 'Cartuchera de cuero', 'Peladora verde', 'Caja de herramientas', 'USB',
        'Candado'], { alerta: 'NO', na: true }) },
      { titulo: 'Código de colores del mes (SIG-PT-01)', nota: 'Las herramientas y equipos revisados llevan cinta del color del mes. Rojo = no conformidad: no se usa y se entrega para reparación o baja.', items: CINTA_ITEMS },
      { titulo: 'Cierre', items: [
        { id: 'obs', tipo: 'parrafo', texto: 'Observaciones (qué falta o está dañado)' },
        { id: 'fotos', tipo: 'foto', texto: 'Foto de herramientas dañadas' },
        { id: 'firma', tipo: 'firma', texto: 'Firma del trabajador', req: true }
      ]}
    ]
  },
  {
    id: 'COVID', nombre: 'Declaración jurada estado de salud (COVID-19)', codigo: 'SIG-FO-40', ambito: 'jornada',
    icono: '🩺', descripcion: 'Declaración de salud del colaborador.', requiereGeo: false,
    secciones: [
      { titulo: 'Declaración', items: [
        { id: 'c1', tipo: 'sino', texto: '¿Tuvo contacto con una persona enferma de COVID-19?', alerta: 'SI', req: true },
        { id: 'c2', tipo: 'sino', texto: '¿Ha estado en contacto con personal de salud que atiende la emergencia?', alerta: 'SI', req: true },
        { id: 'c3', tipo: 'sino', texto: '¿Se encuentra con las vacunas al día?', req: true },
        { id: 'c4', tipo: 'sino', texto: '¿En los últimos 14 días ha estado enfermo?', alerta: 'SI', req: true },
        { id: 'c5', tipo: 'texto', texto: '¿Qué enfermedad? / fecha primeros síntomas' },
        { id: 'c6', tipo: 'numero', texto: 'Temperatura (°C)' },
        { id: 'c7', tipo: 'multiple', texto: '¿Presenta actualmente alguno de estos síntomas?', alertaSiMarca: true,
          opciones: ['Tos', 'Fiebre', 'Dolor de garganta', 'Dolor muscular', 'Secreciones nasales', 'Manchas en la piel',
                     'Dificultad respiratoria', 'Dolor de cabeza', 'Náuseas / vómitos', 'Dolor articular'] },
        { id: 'firma', tipo: 'firma', texto: 'Firma (declaro bajo juramento que la información es fidedigna)', req: true }
      ]}
    ]
  },
  {
    id: 'AST', nombre: 'Análisis Seguro de Trabajo (AST)', codigo: 'SIG-FO-17', ambito: 'ambos',
    icono: '🦺', descripcion: 'Antes de iniciar cada trabajo.', requiereGeo: true, marcaEstado: 'En terreno',
    secciones: [
      { titulo: 'Datos del trabajo', items: [
        { id: 'lugar', tipo: 'texto', texto: 'Lugar / sector', auto: 'ticket_direccion', req: true },
        { id: 'area', tipo: 'opciones', texto: 'Área de trabajo', req: true,
          opciones: ['Instalación cliente', 'Retiro / cambio de equipo', 'Falla / soporte', 'Mantención de red', 'Tendido de fibra', 'Nodo / gabinete / NAP', 'Otro'] },
        { id: 'supervisor', tipo: 'texto', texto: 'Supervisor a cargo' },
        { id: 'tarea', tipo: 'parrafo', texto: 'Tarea(s) a realizar', req: true }
      ]},
      { titulo: 'Recursos, coordinación y permisos', nota: 'Si es NO, corrige el ítem antes de iniciar la tarea.', items: L_('r', [
        '¿Se cuenta con el personal necesario y entrenado según el procedimiento?',
        '¿Se cuenta con los equipos y herramientas necesarias y en condiciones?',
        '¿Se dispone de los materiales, repuestos e insumos necesarios?',
        '¿Se realizó planificación del trabajo?',
        '¿El personal cuenta con los permisos necesarios para realizar el trabajo?'], { alerta: 'NO', na: true }) },
      { titulo: 'Etapas del trabajo', items: [
        { id: 'etapas', tipo: 'parrafo', texto: '¿Cómo ejecutaré mi trabajo? (paso a paso)', req: true }
      ]},
      { titulo: 'Riesgos asociados', nota: '¿Qué me puede ocurrir? ¿Estoy expuesto? SI o NO', items: L_('g', [
        'Aprisionamiento — entre objetos fijos o partes móviles',
        'Atrapamiento — por objetos en movimiento, cargas, materiales',
        'Caída al mismo nivel — terreno irregular, desnivel, desorden',
        'Caída a distinto nivel — desde postes, escaleras, techos',
        'Contacto con energía eléctrica — redes energizadas',
        'Contacto con fluidos a presión — aceite, aire, gases, vapor',
        'Contacto con sustancias tóxicas — combustible, aceite',
        'Contacto con temperaturas extremas — calor o frío',
        'Exposición — radiación UV, ruido, gases, polvo, humo',
        'Golpeado con o contra — herramientas, estructuras, equipos',
        'Golpeado por objetos en movimiento — caída de materiales',
        'Atropello — por vehículo o maquinaria en movimiento',
        'Asfixia — espacios confinados, cámaras subterráneas',
        'Sobreesfuerzo — levantar carga sin ayuda',
        'Aplastamiento — bajo cargas suspendidas',
        'Choque / colisión — contra estructura o vehículos',
        'Otros — incendio, explosión, derrame, volcamiento',
        'Ataque animal o de terceros en el domicilio'], { riesgo: true, na: true }).concat([
        { id: 'g_estado', tipo: 'sino', texto: 'Estado personal: estoy en buenas condiciones físicas y psicológicas para ejecutar mi trabajo', alerta: 'NO', req: true },
        { id: 'g_estado_det', tipo: 'texto', texto: 'Detalle del estado personal (opcional; si marcaste NO, explica qué pasa)' }
      ]) },
      { titulo: 'Medidas preventivas', items: [
        { id: 'medidas', tipo: 'parrafo', texto: '¿Cómo me puedo cuidar? Medidas preventivas / correctivas', req: true }
      ]},
      { titulo: 'Medidas de seguridad', items: L_('m', [
        'El área de trabajo está limpia, ordenada y con accesos expeditos',
        'El área tiene la iluminación requerida (natural o de apoyo)',
        'El área tiene la ventilación requerida',
        'Las instalaciones eléctricas portátiles están en buen estado',
        'Las superficies de trabajo están en buenas condiciones',
        'Está delimitada la zona de trabajo y movimiento de equipos',
        'Se verificó el estado del vehículo (checklist)',
        'Hay barreras físicas para segregar el lugar (conos)',
        'Los trabajadores cuentan con el EPP necesario',
        'Se usa arnés y/o línea de vida en altura (sobre 1,8 m)',
        'Las escaleras tienen línea de vida vertical',
        'El propietario o un encargado mayor de 18 años está presente (riesgos domiciliarios)',
        'El personal tiene examen ocupacional / psicosensotécnico vigente',
        'Hay elementos para emergencias (primeros auxilios, extintor)'], { alerta: 'NO', na: true }).concat([
        { id: 'encargado', tipo: 'texto', texto: 'Nombre de quien está presente en el domicilio (propietario o encargado mayor de 18 años)' }]) },
      { titulo: 'EPP y elementos requeridos', items: [
        { id: 'epp', tipo: 'multiple', texto: 'Marca los requeridos para la tarea',
          opciones: ['Casco', 'Calzado de seguridad', 'Protector solar', 'Lentes de seguridad', 'Cubrenuca legionario', 'Alcohol gel',
                     'Guantes de cabritilla', 'Arnés de seguridad', 'Amortiguador de impacto y colas', 'Ropa de trabajo',
                     'Línea de vida vertical', 'Deslizador línea de vida', 'Señalética / iluminación', 'Extintor'] },
        { id: 'epp_otro', tipo: 'texto', texto: 'Otros' }
      ]},
      { titulo: 'Evidencia del terreno', items: [
        { id: 'fotos', tipo: 'foto', texto: 'Fotos del lugar (poste, acceso, peligros)' }
      ]},
      { titulo: 'Cierre', items: [
        { id: 'comentarios', tipo: 'parrafo', texto: 'Comentarios del trabajador(es)' },
        { id: 'optimas', tipo: 'sino', texto: '¿Todos están en condiciones físicas y psicológicas óptimas para el trabajo?', alerta: 'NO', req: true },
        { id: 'participantes', tipo: 'participantes', texto: 'Participantes del trabajo', auto: 'tecnico', req: true },
        { id: 'firma', tipo: 'firma', texto: 'Firma', req: true },
        { id: 'aviso', tipo: 'info', texto: 'Si el trabajo no es seguro, detenlo e informa a tu supervisor.' }
      ]}
    ]
  },
  {
    id: 'AST_RAPIDA', nombre: 'AST rápida', codigo: 'AST-R', ambito: 'ticket',
    icono: '⚡', descripcion: 'Trabajos livianos dentro del domicilio (ej. cambio de ONT). Si marcas algún riesgo, se pide la AST completa.',
    requiereGeo: true, marcaEstado: 'En terreno',
    secciones: [
      { titulo: 'Antes de empezar', items: [
        { id: 'q1', tipo: 'sino', texto: '¿Vas a subir a poste, techo o escalera?', alerta: 'SI', req: true },
        { id: 'q2', tipo: 'sino', texto: '¿Hay riesgo eléctrico cerca (tendido, tablero, cables expuestos)?', alerta: 'SI', req: true },
        { id: 'q3', tipo: 'sino', texto: '¿Trabajarás en la vía pública o con tránsito de vehículos?', alerta: 'SI', req: true },
        { id: 'q6', tipo: 'sino', texto: '¿Hay desniveles, escalones, pozos o bordes donde puedas caer o tropezar (diferencia de nivel de piso)?', alerta: 'SI', req: true },
        { id: 'q4', tipo: 'sino', texto: '¿Hay algún otro peligro en el lugar (perro suelto, acceso difícil, piso resbaladizo)?', alerta: 'SI', req: true },
        { id: 'q5', tipo: 'sino', texto: 'Cuento con mis EPP y herramientas en buen estado', alerta: 'NO', req: true }
      ]}
    ]
  },
  {
    id: 'OT', nombre: 'Orden de trabajo (cierre)', codigo: 'OT', ambito: 'ticket',
    icono: '📋', descripcion: 'Al terminar: foto de la OT firmada y resultado.', requiereGeo: true,
    marcaEstado: 'Cerrado', requiere: ['AST'],
    secciones: [
      { titulo: 'Trabajo realizado', items: [
        { id: 'n_ot', tipo: 'texto', texto: 'N° de OT en papel' },
        { id: 'cliente', tipo: 'texto', texto: 'Cliente', auto: 'ticket_cliente' },
        { id: 'tipo', tipo: 'opciones', texto: 'Tipo de trabajo', req: true,
          opciones: ['Instalación', 'Retiro de equipo', 'Cambio de equipo', 'Visita técnica / falla', 'Mantención', 'Traslado', 'Otro'] },
        { id: 'resultado', tipo: 'opciones', texto: 'Resultado', opciones: ['Resuelto', 'Pendiente', 'No se pudo realizar'], req: true },
        { id: 'detalle', tipo: 'parrafo', texto: 'Detalle del trabajo realizado', req: true },
        { id: 'materiales', tipo: 'parrafo', texto: 'Materiales y equipos usados (series, metros de fibra, conectores)' },
        { id: 'potencia', tipo: 'texto', texto: 'Potencia óptica medida (dBm)' },
        { id: 'nap', tipo: 'nap', texto: 'NAP donde quedó conectado (instalación o traslado)' },
        { id: 'precinto', tipo: 'texto', texto: 'N° de precinto del cliente' }
      ]},
      { titulo: 'Evidencia', items: [
        { id: 'foto_ot', tipo: 'foto', texto: 'Foto de la OT firmada', req: true },
        { id: 'fotos', tipo: 'foto', texto: 'Fotos del trabajo (antes / después, equipo, NAP)' },
        { id: 'correo_cliente', tipo: 'texto', texto: 'Correo del cliente (se le envía la OT)', auto: 'ticket_email' },
        { id: 'cliente_no_firma', tipo: 'sino', texto: '¿El cliente prefiere NO firmar digitalmente?' },
        { id: 'motivo_no_firma', tipo: 'texto', texto: 'Si no firma: nombre de quien recibe y motivo' },
        { id: 'firma_cliente', tipo: 'firma', texto: 'Firma del cliente (o se le envía por WhatsApp para que firme en su teléfono)' },
        { id: 'firma', tipo: 'firma', texto: 'Firma del técnico', req: true }
      ]}
    ]
  },
  {
    id: 'COMPLETADA', nombre: 'Marcar tarea completada', codigo: 'TAR-OK', ambito: 'ticket',
    icono: '✅', descripcion: 'Fallas, revisiones o mantenciones: cierra el trabajo sin la OT completa.', requiereGeo: true,
    marcaEstado: 'Cerrado', requiere: ['AST'], noTipos: ['Instalación'],
    secciones: [
      { titulo: 'Tarea realizada', items: [
        { id: 'resultado', tipo: 'opciones', texto: 'Resultado', opciones: ['Resuelto', 'Pendiente', 'No se pudo realizar'], req: true },
        { id: 'detalle', tipo: 'parrafo', texto: '¿Qué se hizo? (causa y solución)', req: true },
        { id: 'materiales_usados', tipo: 'materiales', texto: 'Materiales usados (opcional)' },
        { id: 'fotos', tipo: 'foto', texto: 'Fotos (opcional)' }
      ]}
    ]
  },
  {
    id: 'CHK_CAMIONETA', nombre: 'Checklist mensual insumos camioneta', codigo: 'CHK-INS-CAM', ambito: 'mensual',
    icono: '🚐', descripcion: 'Una vez al mes: qué tiene la camioneta y qué hay que cambiar o reponer.', requiereGeo: false,
    secciones: [
      { titulo: 'Camioneta', items: [
        { id: 'patente', tipo: 'opciones', texto: 'Patente', req: true },
        { id: 'turno', tipo: 'opciones', texto: 'Turno', opciones: ['AM', 'PM'] }
      ]},
      { titulo: 'Insumos', nota: 'Marca "Cuento con" si lo tienes y "Solicito cambio" si está malo o falta. Si falta algo que no está en la lista, agrégalo abajo.', items: [
        { id: 'insumos', tipo: 'inventario', texto: 'Insumos de la camioneta', opciones: ['4 conos', '3 barras señalizadoras', 'Taladro', 'Botiquín', 'Escalera telescópica N°1', 'Escalera telescópica N°2',
          'Escalera interior', 'Alargador', 'Broca de metal', 'Broca de madera', 'Broca de cemento', 'Porta drop', 'Linga', 'Caja de mascarillas', 'Silicona', 'Paño de limpieza', 'Aromatizante', 'Protector solar'] }
      ]},
      { titulo: 'Código de colores del mes (SIG-PT-01)', nota: 'Las herramientas y equipos revisados llevan cinta del color del mes. Rojo = no conformidad: no se usa y se entrega para reparación o baja.', items: CINTA_ITEMS },
      { titulo: 'Cierre', items: [
        { id: 'obs', tipo: 'parrafo', texto: 'Observaciones' },
        { id: 'firma', tipo: 'firma', texto: 'Firma del colaborador', req: true }
      ]}
    ]
  },
  {
    id: 'CHK_INDIVIDUAL', nombre: 'Checklist mensual insumos individuales', codigo: 'CHK-INS-IND', ambito: 'mensual',
    icono: '🧰', descripcion: 'Una vez al mes: tus herramientas y EPP, y qué necesitas cambiar.', requiereGeo: false,
    secciones: [
      { titulo: 'Turno', items: [
        { id: 'turno', tipo: 'opciones', texto: 'Turno', opciones: ['AM', 'PM'] }
      ]},
      { titulo: 'Herramientas y EPP', nota: 'Marca "Cuento con" si lo tienes y "Solicito cambio" si está malo o falta. Si falta algo que no está en la lista, agrégalo abajo.', items: [
        { id: 'insumos', tipo: 'inventario', texto: 'Insumos individuales', opciones: ['Clivia', 'Alicate universal', 'Alicate cortante', 'Probador eléctrico', 'Arnés', 'Anilla', 'Cartonero',
          'Crimpeadora', 'Destornillador cruz', 'Destornillador paleta', 'Estrobo', 'Llave francesa', 'Puntero láser', 'Martillo', 'Power meter', 'Peladora amarilla', 'Peladora verde',
          'Linterna minera', 'Caja de herramientas', 'Guantes tacto fino', 'Guantes cabritilla', 'Antiparra', 'Zapato de seguridad', 'Cuerda de vida', 'Legionario', 'Casco con barbiquejo'] }
      ]},
      { titulo: 'Código de colores del mes (SIG-PT-01)', nota: 'Las herramientas y equipos revisados llevan cinta del color del mes. Rojo = no conformidad: no se usa y se entrega para reparación o baja.', items: CINTA_ITEMS },
      { titulo: 'Cierre', items: [
        { id: 'obs', tipo: 'parrafo', texto: 'Observaciones' },
        { id: 'firma', tipo: 'firma', texto: 'Firma del colaborador', req: true }
      ]}
    ]
  },
  {
    id: 'BITACORA', nombre: 'Bitácora de vehículo', codigo: 'BIT-VEH', ambito: 'ambos',
    icono: '📒', descripcion: 'Combustible, revisión técnica, mantención o cambio de conductor.', requiereGeo: true,
    secciones: [
      { titulo: 'Vehículo y conductor', items: [
        { id: 'patente', tipo: 'opciones', texto: 'Patente', opciones: PATENTES_EMPRESA, req: true },
        { id: 'conductor', tipo: 'persona', texto: 'Conductor', auto: 'yo', req: true },
        { id: 'tipo_reg', tipo: 'opciones', texto: 'Tipo de registro', req: true, alerta: 'Incidente / daño',
          opciones: ['Carga de combustible', 'Revisión técnica', 'SOAP / permiso de circulación', 'Mantención / taller', 'Cambio de conductor', 'Kilometraje / viaje', 'Incidente / daño', 'Otro'] },
        { id: 'km', tipo: 'numero', texto: 'Kilometraje actual (odómetro)', req: true }
      ]},
      { titulo: 'Carga de combustible', si: { campo: 'tipo_reg', valor: ['Carga de combustible'] }, items: [
        { id: 'litros', tipo: 'numero', texto: 'Litros cargados', req: true },
        { id: 'monto_comb', tipo: 'numero', texto: 'Monto ($)', req: true },
        { id: 'tipo_comb', tipo: 'opciones', texto: 'Combustible', opciones: ['Diésel', 'Bencina 93', 'Bencina 95', 'Bencina 97'] },
        { id: 'estacion', tipo: 'texto', texto: 'Estación / lugar' },
        { id: 'pago_comb', tipo: 'opciones', texto: 'Medio de pago', opciones: MEDIOS_PAGO },
        { id: 'boleta_comb', tipo: 'foto', texto: 'Foto de la boleta' }
      ]},
      { titulo: 'Revisión técnica', si: { campo: 'tipo_reg', valor: ['Revisión técnica'] }, items: [
        { id: 'rt_fecha', tipo: 'fecha', texto: 'Fecha de la revisión', req: true },
        { id: 'rt_resultado', tipo: 'opciones', texto: 'Resultado', opciones: ['Aprobada', 'Rechazada'], alerta: 'Rechazada', req: true },
        { id: 'rt_vence', tipo: 'fecha', texto: 'Próxima revisión / vence el', req: true },
        { id: 'rt_planta', tipo: 'texto', texto: 'Planta de revisión' },
        { id: 'rt_monto', tipo: 'numero', texto: 'Monto pagado ($)' },
        { id: 'rt_cert', tipo: 'foto', texto: 'Foto del certificado' }
      ]},
      { titulo: 'SOAP / permiso de circulación', si: { campo: 'tipo_reg', valor: ['SOAP / permiso de circulación'] }, items: [
        { id: 'soap_vence', tipo: 'fecha', texto: 'SOAP vence el' },
        { id: 'permiso_vence', tipo: 'fecha', texto: 'Permiso de circulación vence el' },
        { id: 'doc_monto', tipo: 'numero', texto: 'Monto pagado ($)' },
        { id: 'doc_fotos', tipo: 'foto', texto: 'Foto de los documentos' }
      ]},
      { titulo: 'Mantención / taller', si: { campo: 'tipo_reg', valor: ['Mantención / taller'] }, items: [
        { id: 'mant_detalle', tipo: 'parrafo', texto: 'Trabajo realizado', req: true },
        { id: 'mant_taller', tipo: 'texto', texto: 'Taller' },
        { id: 'mant_monto', tipo: 'numero', texto: 'Monto ($)' },
        { id: 'mant_prox_km', tipo: 'numero', texto: 'Próxima mantención (km)' }
      ]},
      { titulo: 'Cambio de conductor', si: { campo: 'tipo_reg', valor: ['Cambio de conductor'] }, items: [
        { id: 'entrega', tipo: 'persona', texto: 'Conductor que entrega el vehículo', req: true },
        { id: 'estado_entrega', tipo: 'parrafo', texto: 'Estado en que se entrega (daños, combustible, herramientas)' }
      ]},
      { titulo: 'Incidente / daño', si: { campo: 'tipo_reg', valor: ['Incidente / daño'] }, items: [
        { id: 'inc_detalle', tipo: 'parrafo', texto: '¿Qué pasó?', req: true }
      ]},
      { titulo: 'Cierre', items: [
        { id: 'fotos', tipo: 'foto', texto: 'Fotos (tablero, daños, documentos)' },
        { id: 'obs', tipo: 'parrafo', texto: 'Observaciones' },
        { id: 'firma', tipo: 'firma', texto: 'Firma del conductor', req: true }
      ]}
    ]
  },
  {
    id: 'INCIDENTE', nombre: 'Reporte de incidente / accidente', codigo: 'SIG-FO-09', ambito: 'ambos',
    icono: '🚨', descripcion: 'Casi accidente, accidente de trabajo o de trayecto, o daño a la propiedad.', requiereGeo: true,
    secciones: [
      { titulo: 'Clasificación', items: [
        { id: 'tipo_inc', tipo: 'opciones', texto: 'Tipo de evento', req: true,
          opciones: ['Incidente (casi accidente)', 'Accidente de trabajo', 'Accidente de trayecto', 'Daño a la propiedad'] },
        { id: 'aviso', tipo: 'info', texto: 'Si hay una persona lesionada: llévala a la mutualidad y avisa de inmediato a tu supervisor. La empresa debe hacer la denuncia (DIAT) dentro de 24 horas.' }
      ]},
      { titulo: '¿Accidente GRAVE o FATAL? (Circular SUSESO 3335)', si: { campo: 'tipo_inc', valor: ['Accidente de trabajo', 'Accidente de trayecto'] }, items: GRAVE_ITEMS },
      { titulo: 'Trabajador involucrado', items: [
        { id: 'involucrado', tipo: 'persona', texto: 'Nombre del trabajador', auto: 'yo', req: true },
        { id: 'edad', tipo: 'numero', texto: 'Edad' },
        { id: 'antiguedad', tipo: 'texto', texto: 'Tiempo de servicio en la empresa' },
        { id: 'cargo_inv', tipo: 'texto', texto: 'Oficio habitual (cargo)' },
        { id: 'habitual', tipo: 'sino', texto: '¿Ocurrió realizando su oficio habitual?', req: true }
      ]},
      { titulo: 'Datos del evento', items: [
        { id: 'fecha_ev', tipo: 'fecha', texto: 'Fecha de ocurrencia', req: true },
        { id: 'hora_ev', tipo: 'hora', texto: 'Hora', req: true },
        { id: 'lugar_ev', tipo: 'texto', texto: 'Lugar / sitio de ocurrencia', req: true },
        { id: 'tarea_ev', tipo: 'parrafo', texto: 'Tarea que realizaba al momento del evento', req: true },
        { id: 'descripcion', tipo: 'parrafo', texto: 'Descripción: dónde, qué y cómo ocurrió', req: true },
        { id: 'testigos', tipo: 'participantes', texto: 'Testigos' }
      ]},
      { titulo: 'Análisis', items: [
        { id: 'lesion', tipo: 'parrafo', texto: 'Lesión real o potencial sobre el trabajador' },
        { id: 'danio', tipo: 'parrafo', texto: 'Daño a la propiedad (cuando aplique)' },
        { id: 'medidas_inm', tipo: 'parrafo', texto: 'Medidas inmediatas tomadas' },
        { id: 'fotos', tipo: 'foto', texto: 'Fotos del lugar o del daño' }
      ]},
      { titulo: 'Reporte', items: [
        { id: 'reporta', tipo: 'texto', texto: 'Reportado por', auto: 'tecnico', req: true },
        { id: 'cargo_rep', tipo: 'texto', texto: 'Cargo', auto: 'cargo' },
        { id: 'firma', tipo: 'firma', texto: 'Firma de quien reporta', req: true }
      ]}
    ]
  },
  {
    id: 'GASTOS', nombre: 'Rendición de gastos', codigo: 'REN-GAS', ambito: 'ambos',
    icono: '🧾', descripcion: 'Combustible, peajes, materiales, colación.', requiereGeo: false,
    secciones: [
      { titulo: 'Gastos', items: [
        { id: 'gastos', tipo: 'gastos', texto: 'Detalle de gastos', req: true,
          opciones: ['Combustible', 'Peaje / TAG', 'Estacionamiento', 'Colación', 'Materiales', 'Herramientas', 'Alojamiento', 'Otro'] },
        { id: 'boletas', tipo: 'foto', texto: 'Fotos de boletas / facturas (obligatorio salvo documentos pendientes)' },
        { id: 'obs', tipo: 'parrafo', texto: 'Observaciones' },
        { id: 'firma', tipo: 'firma', texto: 'Firma del colaborador', req: true }
      ]}
    ]
  }
];

/** Una sección con "si" solo aplica cuando el campo indicado tiene uno de los valores. */
function seccionActiva_(s, resp) {
  if (!s.si || !resp) return true;
  return [].concat(s.si.valor).indexOf(resp[s.si.campo]) >= 0;
}
function itemsOf_(f, resp) {
  var out = [];
  (f.secciones || []).forEach(function (s) {
    if (!seccionActiva_(s, resp)) return;
    (s.items || []).forEach(function (it) { out.push(it); });
  });
  return out;
}

/** Calcula alertas, riesgos identificados y total de gastos de una respuesta. */
function evalua_(f, resp) {
  var al = [], rg = [], total = 0;
  itemsOf_(f, resp).forEach(function (it) {
    var v = resp[it.id];
    if (v === undefined || v === null || v === '') return;
    if (it.alerta && String(v) === String(it.alerta)) al.push(it.texto.split(' — ')[0] + ': ' + v);
    if (it.tipo === 'numero' && (it.min !== undefined || it.max !== undefined) && String(v).trim() !== '' && !isNaN(Number(String(v).replace(',', '.')))) {
      var n = Number(String(v).replace(',', '.'));
      if (it.negativo && n > 0) n = -n;   // dBm: si escriben 22 se entiende -22
      if ((it.min !== undefined && n < it.min) || (it.max !== undefined && n > it.max))
        al.push(it.texto.split(' — ')[0] + ': ' + n + ' (fuera de rango ' + (it.min !== undefined ? it.min : '') + ' a ' + (it.max !== undefined ? it.max : '') + ')');
    }
    if (it.alertaSiMarca && Array.isArray(v) && v.length) al.push(it.texto + ': ' + v.join(', '));
    if (it.riesgo && String(v) === 'SI') rg.push(it.texto.split(' — ')[0]);
    if (it.tipo === 'gastos' && Array.isArray(v)) v.forEach(function (g) {
      total += Number(g.monto) || 0;
      if (g.pendiente === 'Sí') al.push('Documento pendiente: ' + (g.tipo || '') + ' $' + (Number(g.monto) || 0).toLocaleString('es-CL'));
    });
  });
  return { alertas: al, riesgos: rg, total: total };
}
// FORMS>>

/**
 * Agrega la firma obligatoria del trabajador al final de todos los formularios que no la tengan.
 * Ejecútala una vez desde el editor (se puede repetir: no duplica).
 */
function agregarFirmaATodos() {
  forms_(false).forEach(function (f) {
    var tiene = itemsOf_(f).some(function (it) { return it.tipo === 'firma' && it.id === 'firma'; });
    if (tiene) { Logger.log('Ya tenía firma: ' + f.nombre); return; }
    var sec = f.secciones[f.secciones.length - 1];
    var texto = f.id === 'OT' ? 'Firma del técnico' : f.id === 'VEHICULO' ? 'Firma del conductor' : 'Firma del trabajador';
    var item = { id: 'firma', tipo: 'firma', texto: texto, req: true };
    var iInfo = sec.items.map(function (it) { return it.tipo; }).lastIndexOf('info');
    if (iInfo === sec.items.length - 1) sec.items.splice(iInfo, 0, item); else sec.items.push(item);
    var fila = rows_('FORMULARIOS').filter(function (x) { return x.id === f.id; })[0];
    sh_('FORMULARIOS').getRange(fila._row, 7).setValue(JSON.stringify(defDe_(f)));
    Logger.log('Firma agregada: ' + f.nombre);
  });
  Logger.log('Listo.');
}

/* ===================== WEB APP ===================== */

function doGet(e) {
  var p = (e && e.parameter && e.parameter.p) || 'tecnico';
  if (p === 'ping') return HtmlService.createHtmlOutput('ok').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  if (modoPlataforma_()) { var pg = getPlataforma_(e, p); if (pg) return pg; }
  if (p === 'info') return ContentService.createTextOutput(JSON.stringify(necesitaAlta_() ? { alta: true } : apiInfo())).setMimeType(ContentService.MimeType.JSON);
  if (necesitaAlta_()) return HtmlService.createHtmlOutputFromFile('Alta').setTitle('Crear mi empresa · Terreno Seguro')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  if (p === 'firmar') return paginaFirmaOT_(e.parameter.k || '');
  var admin = p === 'admin';
  return HtmlService.createHtmlOutput(marcarHtml_(HtmlService.createHtmlOutputFromFile(admin ? 'Admin' : 'Tecnico').getContent()))
    .setTitle(admin ? 'Panel Prevención' : 'Prevención en terreno')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    // permite mostrar la app dentro de la página propia (sin el aviso azul de Google y con el ícono de la empresa)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ===================== MULTIEMPRESA: ALTA, MARCA Y COLORES ===================== */

/** true si esta copia todavía no tiene empresa instalada (o es una copia de otra instalación). */
function necesitaAlta_() {
  if (modoPlataforma_()) return !EMP || !props_().getProperty('SS_ID');
  var pr = props_(), sid = pr.getProperty('SCRIPT_ID');
  if (sid && sid !== ScriptApp.getScriptId()) return true;     // copia de otro proyecto: no usar sus datos
  if (!pr.getProperty('SS_ID')) return true;
  if (!sid) pr.setProperty('SCRIPT_ID', ScriptApp.getScriptId());   // instalación anterior a la versión multiempresa
  return false;
}
function colores_(c) {
  var ok = function (x, d) { x = String(x || '').trim(); return /^#[0-9a-fA-F]{6}$/.test(x) ? x : d; };
  return { primario: ok(c.color_primario, '#13306B'), acento: ok(c.color_acento, '#1E9BFF') };
}
/** Pone los colores y el logo de la empresa en el HTML de la app y del panel. */
function marcarHtml_(html) {
  var c = {}; try { c = cfg_(); } catch (e) {}
  var col = colores_(c);
  if (col.acento.toLowerCase() !== '#f28c28') html = html.replace(/#F28C28/gi, col.acento);
  if (col.primario.toLowerCase() !== '#23306b') html = html.replace(/#23306b/gi, col.primario);
  var marca = esc_(c.marca || 'Terreno Seguro');
  return html.replace('<head>', '<head><script>window.EMPRESA_COD=' + JSON.stringify(EMP ? EMP.codigo : '') + ';window.LOGO_EMPRESA=' + JSON.stringify(logoSrc_()) + ';window.MARCA_EMPRESA=' + JSON.stringify(c.marca || 'Terreno Seguro') + ';window.VOCAB=' + JSON.stringify(vocab_(c)) + ';window.APAGADOS=' + JSON.stringify(apagados_(c)) + ';window.RUBRO_PANEL=' + JSON.stringify(rubroDef_(c).panel || null) + ';</script>')
    .replace(/__LOGO_EMPRESA__/g, logoSrc_()).replace(/__MARCA_EMPRESA__/g, marca);
}

/** Pestañas del panel que se pueden apagar por empresa, con su grupo (lo usa el asistente de alta). */
var MODULOS = [
  ['tickets', 'Tickets y órdenes de trabajo', 'Operación'], ['calendario', 'Calendario', 'Operación'], ['mapa', 'Mapa', 'Operación'],
  ['clientes', 'Clientes', 'Operación'], ['fallas', 'Fallas de red (ISP)', 'Operación'], ['mantenciones', 'Mantenciones', 'Operación'],
  ['equipos', 'Equipos con serie (routers, ONT)', 'Inventario'], ['bodega', 'Bodega', 'Inventario'], ['prestamos', 'Préstamos de herramientas', 'Inventario'],
  ['vehiculos', 'Vehículos', 'Inventario'], ['gastos', 'Gastos y rendiciones', 'Gestión']
];

/** Datos para dibujar el asistente de alta. */
function apiAltaInfo() {
  if (!necesitaAlta_()) throw new Error('Esta empresa ya está creada. Entra al panel.');
  return { modulos: MODULOS, apagadosRubro: apagadosRubro_(), rubros: listaRubros_() };
}
/**
 * Crea la empresa: planilla, carpetas, configuración, logo y usuario administrador.
 * d = {empresa, marca, rut_empresa, codigo, rubro, ciudad, comunas, representante, correo, color_primario, color_acento,
 *      apagados:[...], logo:{data, mime}, admin:{rut, nombre, pin, email, telefono}}
 */
function apiAlta(d) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Otra persona está creando la empresa. Intenta en un minuto.');
  try {
    if (modoPlataforma_()) throw new Error('En la plataforma las empresas se crean desde la portada.');
    if (!necesitaAlta_()) throw new Error('Esta empresa ya está creada. Entra al panel.');
    // Copia de otra instalación: se olvidan sus datos antes de crear los propios
    var pr = props_();
    if (pr.getProperty('SCRIPT_ID') !== ScriptApp.getScriptId()) ['ROOT_ID', 'SS_ID', 'SALT'].forEach(function (k) { pr.deleteProperty(k); });
    var r = altaCore_(d);
    pr.setProperty('ALTA_OK', fmt_(new Date()));
    return r;
  } finally { lock.releaseLock(); }
}
/** Valida los datos del alta (sirve para la copia propia y para la plataforma). */
function validarAlta_(d) {
  d = d || {};
  var req = function (v, n) { v = String(v || '').trim(); if (!v) throw new Error('Falta: ' + n); return v; };
  var o = { empresa: req(d.empresa, 'razón social'), marca: String(d.marca || d.empresa || '').trim() };
  o.codigo = req(d.codigo, 'código de empresa').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  if (o.codigo.length < 3 || o.codigo.length > 20) throw new Error('El código debe tener entre 3 y 20 letras o números.');
  var a = d.admin || {};
  o.rutAdm = normRut_(req(a.rut, 'RUT del administrador')); o.pin = req(a.pin, 'PIN del administrador');
  if (!/^\d{4,8}$/.test(o.pin)) throw new Error('El PIN debe tener de 4 a 8 números.');
  if (/^(\d)\1+$/.test(o.pin) || '0123456789'.indexOf(o.pin) >= 0 || '9876543210'.indexOf(o.pin) >= 0) throw new Error('Elige un PIN menos obvio.');
  o.rubro = RUBROS[String(d.rubro || '').toUpperCase()] ? String(d.rubro).toUpperCase() : 'OTRO';
  var validos = MODULOS.map(function (m) { return m[0]; });
  o.apagados = d.apagados ? [].concat(d.apagados).map(String).filter(function (t) { return validos.indexOf(t) >= 0; }) : (RUBROS[o.rubro].apagados || []).slice();
  return o;
}
/** Crea planilla, carpetas, configuración, rubro, logo y administrador de la empresa actual. */
function altaCore_(d) {
  var v = validarAlta_(d), a = d.admin || {};
  setup(v.marca);
  _M = { ss: null, hojas: {}, filas: {} };
  var col = colores_({ color_primario: d.color_primario, color_acento: d.color_acento });
  var valores = { empresa: v.empresa, marca: v.marca, razon_social: v.empresa, rut_empresa: String(d.rut_empresa || '').trim(), codigo_empresa: v.codigo, rubro: v.rubro,
    ciudad: String(d.ciudad || '').trim(), comunas: String(d.comunas || '').trim(), representante: String(d.representante || '').trim(),
    color_primario: col.primario, color_acento: col.acento, modulos_apagados: JSON.stringify(v.apagados) };
  if (d.correo) valores.correo_notificaciones = String(d.correo).trim();
  if (d.url_app) valores.url_app = d.url_app;
  if (d.url_panel) valores.url_panel = d.url_panel;
  Object.keys(valores).forEach(function (k) { setCfg_(k, valores[k]); });
  sembrarRubro_(v.rubro);
  if (d.logo && d.logo.data) { try { guardarLogo_(d.logo); } catch (e) { console.warn('Logo: ' + e); } }

  // Administrador: reemplaza al usuario inicial ADMIN / 1234
  var adm = { rut: v.rutAdm, nombre: String(a.nombre || 'Administrador').trim(), cargo: String(a.cargo || 'Administrador').trim(), rol: 'admin', pin_hash: hash_(v.pin),
    email: String(a.email || d.correo || '').trim(), telefono: String(a.telefono || '').trim(), activo: 'SI', creado: new Date() };
  var ini = rows_('USUARIOS').filter(function (u) { return String(u.rut).toUpperCase() === 'ADMIN'; })[0];
  if (ini) update_('USUARIOS', ini._row, adm); else append_('USUARIOS', adm);
  _M.logo = null;
  return { ok: true, codigo: v.codigo, marca: v.marca, rubro: v.rubro, url: urlSis_(''), urlPanel: urlSis_('p=admin'), planilla: ss_().getUrl(), drive: raiz_().getUrl() };
}
/** Guarda el logo como archivo logo.png / logo.jpg en la carpeta de la empresa. l = {data, mime} */
function guardarLogo_(l) {
  var b64 = String((l && l.data) || '').replace(/^data:[^,]*,/, '');
  if (!b64) throw new Error('Elige una imagen.');
  if (b64.length > 140000) throw new Error('El logo es muy pesado: usa una imagen de menos de 100 KB.');
  var mime = /^image\/(png|jpeg)$/.test(l.mime) ? l.mime : 'image/png';
  var root = raiz_(), it = root.searchFiles("title contains 'logo' and trashed = false");
  while (it.hasNext()) { var f = it.next(); if (/^logo\.(png|jpe?g)$/i.test(f.getName())) f.setTrashed(true); }
  root.createFile(Utilities.newBlob(Utilities.base64Decode(b64), mime, 'logo.' + (mime === 'image/jpeg' ? 'jpg' : 'png')));
  cache_().removeAll(['logo_b64', 'logo_mime']);
  _M.logo = null;
}
/** Panel → Configuración: cambiar el logo (admin). d = {data, mime} */
function apiSubirLogo(token, d) {
  auth_(token, ['admin']);
  guardarLogo_(d);
  return { logo: logoSrc_() };
}
/* ===================== INSTALACIÓN ===================== */

function setup(nombre) {
  var props = props_();
  var base = 'PREVENCION_' + (String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'EMPRESA');
  props.setProperty('SCRIPT_ID', ScriptApp.getScriptId());
  if (!props.getProperty('SALT')) props.setProperty('SALT', Utilities.getUuid());

  var root;
  if (props.getProperty('ROOT_ID')) root = DriveApp.getFolderById(props.getProperty('ROOT_ID'));
  else { root = carpetaPadre_().createFolder(base); props.setProperty('ROOT_ID', root.getId()); }

  var ss;
  if (props.getProperty('SS_ID')) ss = SpreadsheetApp.openById(props.getProperty('SS_ID'));
  else {
    ss = SpreadsheetApp.create(base + ' · Base de datos');
    ss.setSpreadsheetTimeZone(TZ);
    props.setProperty('SS_ID', ss.getId());
    DriveApp.getFileById(ss.getId()).moveTo(root);
  }

  Object.keys(HOJAS).forEach(function (n) {
    var sh = ss.getSheetByName(n) || ss.insertSheet(n);
    if (sh.getLastRow() === 0 || sh.getLastColumn() < HOJAS[n].length) {
      sh.getRange(1, 1, 1, HOJAS[n].length).setValues([HOJAS[n]])
        .setFontWeight('bold').setBackground('#23306b').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
  });
  ss.getSheets().forEach(function (s) {
    if (!HOJAS[s.getName()] && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s);
  });

  var me = Session.getEffectiveUser().getEmail();
  var cSh = ss.getSheetByName('CONFIG');
  var claves = cSh.getRange(1, 1, cSh.getLastRow(), 1).getValues().map(function (r) { return r[0]; });
  CONFIG_INICIAL.forEach(function (c) {
    if (claves.indexOf(c[0]) < 0) cSh.appendRow([c[0], c[0] === 'correo_notificaciones' ? me : c[1], c[2]]);
  });

  var fSh = ss.getSheetByName('FORMULARIOS');
  var ids = fSh.getLastRow() > 1 ? fSh.getRange(2, 1, fSh.getLastRow() - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
  DEFAULT_FORMS.forEach(function (f, i) {
    if (ids.indexOf(f.id) < 0) fSh.appendRow([f.id, f.nombre, f.codigo, f.ambito, 'SI', i + 1, JSON.stringify(defDe_(f))]);
  });

  var uSh = ss.getSheetByName('USUARIOS');
  if (uSh.getLastRow() < 2) uSh.appendRow(['ADMIN', 'Administrador', 'Administrador', 'admin', hash_('1234'), me, '', 'SI', new Date()]);

  Object.keys(CARPETAS).forEach(function (k) { sub_(root, CARPETAS[k]); });
  var veSh = ss.getSheetByName('VEHICULOS');
  if (veSh.getLastRow() < 2) PATENTES_EMPRESA.forEach(function (p) { veSh.appendRow([p, '', '', '', 'SI', '', new Date()]); });
  var cuSh = ss.getSheetByName('CURSOS');
  var cuIds = cuSh.getLastRow() > 1 ? cuSh.getRange(2, 1, cuSh.getLastRow() - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
  CURSOS_INICIALES.forEach(function (c, i) { if (cuIds.indexOf(c[0]) < 0) cuSh.appendRow([c[0], c[1], c[2], c[3], c[4], c[5], 'SI', i + 1]); });
  var plSh = ss.getSheetByName('PLANTILLAS');
  if (plSh.getLastRow() < 2) PLANTILLAS_INICIALES.forEach(function (x, i) { plSh.appendRow(['PL' + (i + 1), x[0], x[1], x[2], x[3], x[4], 'SI', i + 1]); });
  Logger.log('Listo. Base de datos: ' + ss.getUrl());
  Logger.log('Carpeta Drive: ' + root.getUrl());
  Logger.log('Usuario inicial: RUT ADMIN · PIN 1234');
}

/* ===================== UTILIDADES ===================== */

function props_() { return EMP ? propsEmp_() : PropertiesService.getScriptProperties(); }
/* Memoria por ejecución: la planilla y cada hoja se leen una sola vez por llamada (mucho más rápido).
   Cualquier escritura (sh_, append_, update_) o un lock limpia lo leído para no usar datos viejos. */
var _M = { ss: null, hojas: {}, filas: {} };
function ss_() {
  if (_M.ss) return _M.ss;
  var id = props_().getProperty('SS_ID');
  if (!id) throw new Error('La app no está instalada: ejecuta setup() en el editor de Apps Script.');
  return (_M.ss = SpreadsheetApp.openById(id));
}
function hoja_(n) { return _M.hojas[n] || (_M.hojas[n] = ss_().getSheetByName(n)); }
function fresco_() { _M.filas = {}; _M.onus = null; _M.eqCli = null; _M.aus = null; }
/** Hoja para escribir: invalida lo leído. Para leer usa rows_(). */
function sh_(n) { fresco_(); return hoja_(n); }
function fmt_(d, f) { return Utilities.formatDate(d, TZ, f || 'yyyy-MM-dd HH:mm:ss'); }
function sub_(parent, name) {
  var it = parent.getFoldersByName(name);
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed || !f.isTrashed()) return f; }
  return parent.createFolder(name);
}
/* Carpetas de Drive, numeradas para que siempre aparezcan en este orden */
var CARPETAS = { trabajos: '01 TRABAJOS (OT y AST)', jornada: '02 JORNADA DIARIA', incidentes: '03 INCIDENTES', gastos: '04 GASTOS Y RENDICIONES',
  vehiculos: '05 VEHÍCULOS', personal: '06 PERSONAL', capacitaciones: '07 CAPACITACIONES Y CHARLAS', biblioteca: '08 BIBLIOTECA SST',
  bodega: '09 BODEGA', fallas: '10 FALLAS DE RED', inspecciones: '11 INSPECCIONES Y OBSERVACIONES', sistema: '99 SISTEMA' };
function raiz_() { return DriveApp.getFolderById(props_().getProperty('ROOT_ID')); }
/** carpetaDe_('trabajos', '2026', '2026-10', 'TK-00001 - Cliente') */
function carpetaDe_(clave) {
  var f = sub_(raiz_(), CARPETAS[clave]);
  for (var i = 1; i < arguments.length; i++) if (arguments[i]) f = sub_(f, String(arguments[i]).replace(/[\/]/g, '-').slice(0, 100));
  return f;
}
function esc_(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function normRut_(r) {
  var x = String(r || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  return /^\d{6,9}[0-9K]$/.test(x) ? x.slice(0, -1) + '-' + x.slice(-1) : x;
}
function limpia_(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}
function hash_(pin) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, (props_().getProperty('SALT') || '') + String(pin));
  return b.map(function (x) { return ('0' + (x & 255).toString(16)).slice(-2); }).join('');
}

function rows_(n) {
  var base = _M.filas[n];
  if (!base) {
    var v = hoja_(n).getDataRange().getValues();
    var h = HOJAS[n];
    v.shift();
    base = [];
    v.forEach(function (r, i) {
      if (r[0] === '' || r[0] === null) return;
      var o = { _row: i + 2 };
      h.forEach(function (k, j) { var x = r[j]; o[k] = x instanceof Date ? fmt_(x) : (x === undefined ? '' : x); });
      base.push(o);
    });
    _M.filas[n] = base;
  }
  // copias: quien llame puede modificar los objetos sin ensuciar la memoria
  return base.map(function (o) { var c = {}; for (var k in o) c[k] = o[k]; return c; });
}
function append_(n, obj) {
  sh_(n).appendRow(HOJAS[n].map(function (k) { return obj[k] === undefined ? '' : limpia_(obj[k]); }));
  fresco_();
}
function update_(n, row, obj) {
  var sh = sh_(n);
  var vals = sh.getRange(row, 1, 1, HOJAS[n].length).getValues()[0];
  HOJAS[n].forEach(function (k, j) { if (obj.hasOwnProperty(k)) vals[j] = limpia_(obj[k]); });
  sh.getRange(row, 1, 1, vals.length).setValues([vals]);
  fresco_();
}
function cfg_() {
  var o = {};
  rows_('CONFIG').forEach(function (r) { o[r.clave] = String(r.valor); });
  return o;
}
function defDe_(f) {
  return { icono: f.icono || '', descripcion: f.descripcion || '', requiereGeo: !!f.requiereGeo,
           marcaEstado: f.marcaEstado || '', requiere: f.requiere || [], noTipos: f.noTipos || [], roles: f.roles || [], secciones: f.secciones || [] };
}
function forms_(soloActivos) {
  return rows_('FORMULARIOS').filter(function (f) {
    return !soloActivos || String(f.activo).toUpperCase() === 'SI';
  }).map(function (f) {
    var d = {};
    var defi = String(f.definicion || '{}');
    if (defi.indexOf('{ANILLA}') >= 0) defi = defi.replace(/\{ANILLA\}/g, anillaTxt_());
    if (defi.indexOf('{COLOR_MES}') >= 0) { var cm = colorMes_(); defi = defi.replace(/\{COLOR_MES\}/g, cm.emoji + ' ' + cm.nombre.toUpperCase() + ' en ' + cm.mes); }
    try { d = JSON.parse(defi); } catch (e) {}
    var o = { id: f.id, nombre: f.nombre, codigo: f.codigo, ambito: f.ambito, activo: f.activo, orden: Number(f.orden) || 99 };
    for (var k in d) o[k] = d[k];
    if (f.id === 'AST' && o.secciones) {   // línea de vida vertical: se pregunta solo cuando la empresa la tenga (Configuración)
      var lv = ''; try { lv = String(cfg_().ast_linea_vertical || ''); } catch (e) {}
      if (lv !== 'SI') o.secciones.forEach(function (sec) {
        sec.items = (sec.items || []).filter(function (it) { return !/l[ií]nea de vida vertical/i.test(it.texto || ''); });
        sec.items.forEach(function (it) { if (Array.isArray(it.opciones)) it.opciones = it.opciones.filter(function (op) { return !/l[ií]nea de vida vertical|deslizador l[ií]nea de vida/i.test(op); }); });
      });
    }
    return o;
  }).sort(function (a, b) { return a.orden - b.orden; });
}
function lite_(r) {
  return { id: r.id, fecha: r.fecha, form_id: r.form_id, form_nombre: r.form_nombre, ticket_id: r.ticket_id,
           tecnico_rut: r.tecnico_rut, tecnico_nombre: r.tecnico_nombre, lat: r.lat, lng: r.lng,
           precision: r.precision, direccion_gps: r.direccion_gps, n_alertas: Number(r.n_alertas) || 0,
           alertas: r.alertas, riesgos: r.riesgos, total: r.total, pdf_url: r.pdf_url, carpeta_url: r.carpeta_url };
}

/* ===================== SESIÓN ===================== */

function auth_(token, roles) {
  var cache = cache_();
  var s = token ? cache.get('tk_' + token) : null;
  if (!s) throw new Error('SESION_EXPIRADA');
  var u = JSON.parse(s);
  if (roles && roles.indexOf(u.rol) < 0) throw new Error('No tienes permiso para esta acción.');
  cache.put('tk_' + token, s, 21600);
  return u;
}

/** Versión del panel publicada (para que los paneles abiertos se recarguen solos al publicar una nueva). */
function apiVersionPanel() {
  var cache = cache_(), v = cache.get('ver_panel');
  if (!v) {
    try { var m = HtmlService.createHtmlOutputFromFile('Admin').getContent().match(/VERSION_PANEL='(\d+)'/); v = m ? m[1] : ''; } catch (e) { v = ''; }
    if (v) cache.put('ver_panel', v, 300);
  }
  return { version: v, url: urlSis_('p=admin') };
}
function apiInfo() {
  var c = {};
  try { c = cfg_(); } catch (e) {}
  return { empresa: c.empresa || '', marca: c.marca || 'Terreno Seguro', codigo: EMP ? EMP.codigo : (c.codigo_empresa || ''), url: urlSis_(''), urlAdmin: urlSis_('p=admin'),
           colores: colores_(c), logo: logoSrc_(), apagados: apagados_(c), vocab: vocab_(c), rubro: rubroClave_(c) };
}

function apiLogin(rut, pin, panel) {
  rut = normRut_(rut);
  var cache = cache_();
  var intentos = Number(cache.get('in_' + rut) || 0);
  if (intentos >= 5) throw new Error('Demasiados intentos. Espera 2 minutos.');
  var u = rows_('USUARIOS').filter(function (x) { return normRut_(x.rut) === rut && String(x.activo).toUpperCase() === 'SI'; })[0];
  if (!u || u.pin_hash !== hash_(pin)) {
    cache.put('in_' + rut, String(intentos + 1), 120);
    throw new Error('RUT o PIN incorrecto.');
  }
  if (panel && ROLES_PANEL.indexOf(u.rol) < 0) throw new Error('Tu usuario no tiene acceso al panel.');
  cache.remove('in_' + rut);
  var ses = { rut: normRut_(u.rut), nombre: u.nombre, cargo: u.cargo, rol: u.rol, email: u.email, area: areaDe_(u) };
  var token = Utilities.getUuid();
  cache.put('tk_' + token, JSON.stringify(ses), 21600);
  return { token: token, user: ses, pinDebil: pinDebil_(u, normRut_(u.rut), pin), ocultas: panel ? ocultasDe_(ses.rol) : [] };
}
/** PIN fácil de adivinar: 1234, 0000, repetidos o los primeros 4 dígitos del RUT (el PIN inicial). */
function pinDebil_(u, rut, pin) {
  if (!u) return false;
  var malos = ['1234', '0000', '1111', '4321', '12345', '123456', String(rut || '').replace(/\D/g, '').slice(0, 4)];
  if (pin !== undefined) return malos.indexOf(String(pin)) >= 0 || /^(\d)\1+$/.test(String(pin));
  return malos.some(function (p) { return p && u.pin_hash === hash_(p); });
}

/** Imagen de fondo (archivo HTML "Fondo" con la foto en base64). */
function apiFondo() {
  try { return HtmlService.createHtmlOutputFromFile('Fondo').getContent().replace(/\s+/g, ''); } catch (e) { return ''; }
}

/** Terreno = llena formularios diarios y recibe tickets. Oficina = no llena formularios de terreno. */
function areaDe_(u) { return u.area === 'Oficina' || u.area === 'Terreno' ? u.area : (u.rol === 'tecnico' ? 'Terreno' : 'Oficina'); }
var FORMS_OFICINA = ['GASTOS', 'INCIDENTE', 'BITACORA'];
function puedeForm_(f, u) { return !f.roles || !f.roles.length || f.roles.indexOf(u.rol) >= 0; }

/** Desde la app: código de un solo uso (2 min) para abrir el panel con el mismo usuario. */
function apiCodigoPanel(token) {
  var u = auth_(token);
  if (ROLES_PANEL.indexOf(u.rol) < 0) throw new Error('Tu usuario no tiene acceso al panel.');
  var code = Utilities.getUuid().replace(/-/g, '');
  cache_().put('pc_' + code, JSON.stringify(u), 120);
  return code;
}
/** El panel cambia el código por una sesión propia. */
function apiCanjearCodigo(code) {
  var cache = cache_(), s = code ? cache.get('pc_' + code) : null;
  if (!s) throw new Error('El enlace ya se usó o venció. Ingresa con tu RUT y PIN.');
  cache.remove('pc_' + code);
  var ses = JSON.parse(s);
  if (ROLES_PANEL.indexOf(ses.rol) < 0) throw new Error('Tu usuario no tiene acceso al panel.');
  var token = Utilities.getUuid();
  cache.put('tk_' + token, JSON.stringify(ses), 21600);
  return { token: token, user: ses, pinDebil: false, ocultas: ocultasDe_(ses.rol) };
}
function apiLogout(token) { if (token) cache_().remove('tk_' + token); return true; }

/* ===================== APP TÉCNICO ===================== */

function apiInicio(token) {
  var u = auth_(token);
  var fila = rows_('USUARIOS').filter(function (x) { return normRut_(x.rut) === u.rut; })[0];
  var area = fila ? areaDe_(fila) : (u.area || 'Terreno');
  var oficina = area === 'Oficina';
  var hoy = fmt_(new Date(), 'yyyy-MM-dd');
  var regs = rows_('REGISTROS').filter(function (r) { return normRut_(r.tecnico_rut) === u.rut; });
  var hechosHoy = [], hechosMes = [];
  regs.forEach(function (r) {
    if (String(r.fecha).slice(0, 10) === hoy && hechosHoy.indexOf(r.form_id) < 0) hechosHoy.push(r.form_id);
    if (String(r.fecha).slice(0, 7) === hoy.slice(0, 7) && hechosMes.indexOf(r.form_id) < 0) hechosMes.push(r.form_id);
  });
  var cliIdx = null, napIdx = null, regTk = null;
  var tickets = rows_('TICKETS').filter(function (t) {
    return esDelTicket_(t, u.rut) && t.estado !== 'Cerrado' && t.estado !== 'Anulado';
  }).map(function (t) {
    try {
      if (!cliIdx) { cliIdx = {}; rows_('CLIENTES').forEach(function (c) { cliIdx[c.id] = c; }); napIdx = napPorPrecinto_(); }
      var c = cliIdx[t.cliente_id];
      if (c) { t.mapa_url = c.mapa_url || ''; t.precinto = c.precinto || ''; t.email = c.email || ''; if (!t.cliente_rut && c.rut) t.cliente_rut = c.rut; if (!t.lat && c.lat) { t.lat = c.lat; t.lng = c.lng; } }
      var n = t.precinto ? napIdx[String(t.precinto)] : null;
      if (n) t.nap = { nombre: n.nombre, pon: n.pon, olt: n.olt, lat: n.lat, lng: n.lng, cupos: n.cupos, potencia: n.potencia };
      if (t.cliente_id) { var o = onuDeCliente_(t.cliente_id, c); if (o) t.onu = o; }
    } catch (e) {}
    t.formsHechos = [];
    if (!regTk) { regTk = {}; rows_('REGISTROS').forEach(function (r) { if (r.ticket_id) (regTk[r.ticket_id] = regTk[r.ticket_id] || []).push(r); }); }
    (regTk[t.id] || []).forEach(function (r) {   // lo que hizo cualquiera de los dos (técnico o apoyo) cuenta para el ticket
      var fid = r.form_id === 'AST_RAPIDA' && Number(r.n_alertas) > 0 ? 'AST_RAPIDA_RIESGO' : r.form_id;   // con riesgo: no reemplaza a la AST
      if (t.formsHechos.indexOf(fid) < 0) t.formsHechos.push(fid);
    });
    delete t._row;
    return t;
  });
  var c = cfg_();
  return {
    user: u, hoy: hoy, area: area, panel: ROLES_PANEL.indexOf(u.rol) >= 0, urlPanel: urlPanel_(),
    formularios: conEquipos_(conPatentes_(forms_(true)), u.rut).filter(function (f) { return puedeForm_(f, u) && (!oficina || f.ambito === 'libre' || FORMS_OFICINA.indexOf(f.id) >= 0 || (tickets.length && (f.ambito === 'ticket' || f.ambito === 'ambos'))); }),
    astOpcional: astOpcional_(),
    matriz: (function () { try { return matrizParaAst_(); } catch (e) { return {}; } })(),
    hechosHoy: hechosHoy, hechosMes: hechosMes, tickets: tickets,
    ultimos: regs.slice(-15).reverse().map(lite_), marca: c.marca, empresa: c.empresa,
    colorMes: colorMes_(),
    pendientesFirma: pendientesFirma_(u.rut).length, fondo: saldoFondo_(u.rut), misEquipos: equiposDeTecnico_(u.rut),
    pinDebil: pinDebil_(fila, u.rut),
    miStock: oficina ? [] : stockTecnico_(u.rut), misPrestamos: prestamosDe_(u.rut), fallas: oficina ? [] : fallasAbiertas_(),
    tiposFalla: TIPOS_FALLA, alcancesFalla: ALCANCES_FALLA, comunas: comunas_(),
    personas: usuariosLite_().filter(function (x) { return /-/.test(x.rut); }).map(function (x) { return { nombre: x.nombre, cargo: x.cargo, rut: x.rut }; })
  };
}

/**
 * Recibe un formulario completo.
 * p = { form_id, ticket_id, clientId, respuestas:{}, archivos:[{campo,nombre,mime,data,firma}], geo:{lat,lng,acc} }
 */
function apiEnviar(token, p) {
  var u = auth_(token);
  var todos = rows_('REGISTROS');
  if (p.clientId) {
    var dup = todos.filter(function (r) { return r.client_id === p.clientId; })[0];
    if (dup) return { ok: true, id: dup.id, pdf_url: dup.pdf_url, alertas: dup.alertas ? String(dup.alertas).split(' | ') : [], duplicado: true };
  }
  var f = forms_(false).filter(function (x) { return x.id === p.form_id; })[0];
  if (!f) throw new Error('El formulario no existe.');
  if (!puedeForm_(f, u)) throw new Error('Este formulario no está habilitado para tu cargo.');

  var ticket = null;
  if (p.ticket_id) {
    ticket = rows_('TICKETS').filter(function (t) { return t.id === p.ticket_id; })[0];
    if (!ticket) throw new Error('El ticket ' + p.ticket_id + ' no existe.');
  }
  var now = new Date();
  var id = 'R' + fmt_(now, 'yyMMddHHmmss') + Utilities.getUuid().replace(/-/g, '').slice(0, 5).toUpperCase();
  var carpeta = carpeta_(ticket, now, u, f, p.respuestas || {});
  var resp = p.respuestas || {};
  var firmas = {};

  (p.archivos || []).forEach(function (a, i) {
    var mime = a.mime || 'image/jpeg';
    var nombre = (a.campo || 'archivo') + '_' + fmt_(now, 'yyyyMMdd_HHmmss') + '_' + (i + 1) + (mime === 'image/png' ? '.png' : '.jpg');
    var file = carpeta.createFile(Utilities.newBlob(Utilities.base64Decode(a.data), mime, nombre));
    if (a.firma) { resp[a.campo] = file.getUrl(); firmas[a.campo] = 'data:' + mime + ';base64,' + a.data; }
    else { if (!Array.isArray(resp[a.campo])) resp[a.campo] = []; resp[a.campo].push(file.getUrl()); }
  });

  var ev = evalua_(f, resp);
  var geo = p.geo || {};
  var dir = '';
  if (geo.lat && geo.lng) {
    try {
      var g = Maps.newGeocoder().setLanguage('es').reverseGeocode(geo.lat, geo.lng);
      if (g.results && g.results[0]) dir = g.results[0].formatted_address;
    } catch (e) {}
  }
  var c = cfg_();
  var meta = { id: id, fecha: fmt_(now, 'dd-MM-yyyy HH:mm'), u: u, ticket: ticket, geo: geo, dir: dir, cfg: c, ev: ev, resp: resp };

  var pdf = Utilities.newBlob(pdfHtml_(f, resp, meta, firmas), 'text/html', 'r.html').getAs('application/pdf')
    .setName((f.codigo || f.id) + '_' + (ticket ? ticket.id + '_' : '') + u.nombre.replace(/\s+/g, '_') + '_' + fmt_(now, 'yyyyMMdd_HHmm') + '.pdf');
  var pdfFile = carpeta.createFile(pdf);

  var datos = JSON.stringify(resp);
  if (datos.length > 49000) datos = datos.slice(0, 49000);
  var reg = {
    id: id, fecha: now, form_id: f.id, form_nombre: f.nombre, ticket_id: ticket ? ticket.id : '',
    tecnico_rut: u.rut, tecnico_nombre: u.nombre, lat: geo.lat || '', lng: geo.lng || '', precision: geo.acc || '',
    direccion_gps: dir, n_alertas: ev.alertas.length, alertas: ev.alertas.join(' | '), riesgos: ev.riesgos.join(' | '),
    total: ev.total || '', pdf_url: pdfFile.getUrl(), carpeta_url: carpeta.getUrl(), client_id: p.clientId || '', datos: datos
  };
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); fresco_();
  try { append_('REGISTROS', reg); } finally { lock.releaseLock(); }

  if (ticket && f.marcaEstado) {
    var nuevo = f.marcaEstado;
    if (nuevo === 'Cerrado' && resp.resultado && resp.resultado !== 'Resuelto') nuevo = 'Pendiente';
    var cambios = { estado: nuevo, actualizado: now };
    if (nuevo === 'Cerrado') { cambios.cerrado = now; try { cerrarEnMw_(ticket, resp, u); } catch (e) { Logger.log('Cerrar en Mikrowisp: ' + e); } }
    if (!ticket.lat && geo.lat) { cambios.lat = geo.lat; cambios.lng = geo.lng; }
    update_('TICKETS', ticket._row, cambios);
    if (geo.lat && ticket.cliente_id) try {
      var cl = rows_('CLIENTES').filter(function (x) { return x.id === ticket.cliente_id; })[0];
      if (cl && !cl.lat) update_('CLIENTES', cl._row, { lat: geo.lat, lng: geo.lng });
    } catch (e) {}
  }
  try { procesarEquiposOT_(f, resp, ticket, u); } catch (e) { Logger.log('Equipos OT: ' + e); }
  try { procesarNapOT_(resp, ticket, u); } catch (e) { Logger.log('NAP OT: ' + e); }
  try {
    itemsOf_(f).forEach(function (it) {
      if (it.tipo === 'materiales' && Array.isArray(resp[it.id])) consumir_(u, resp[it.id], (ticket ? 'OT ' + ticket.id : f.nombre) + ' · ' + id, ticket ? ticket.id : '');
    });
  } catch (e) { Logger.log('Materiales OT: ' + e); }
  try { crearSolicitudes_(f, resp, reg, u); } catch (e) { Logger.log('Solicitudes: ' + e); }
  notificar_(f, meta, pdf, reg);
  var firmaCli = null, correoOT = '';
  if (f.id === 'OT' && ticket) {
    var noFirma = String(resp.cliente_no_firma || '').toUpperCase() === 'SI';
    if (noFirma) try { update_('TICKETS', rows_('TICKETS').filter(function (x) { return x.id === ticket.id; })[0]._row,
      { notas: String(ticket.notas || '') + ' · Cliente no firmó digitalmente' + (resp.motivo_no_firma ? ': ' + resp.motivo_no_firma : '') }); } catch (e) {}
    if (!firmas.firma_cliente && !noFirma && String(c.firma_remota || 'SI').toUpperCase() !== 'NO') {
      try { firmaCli = crearFirmaOT_(reg, ticket); } catch (e) { Logger.log('Firma OT: ' + e); }
    }
    try { correoOT = correoOTCliente_(reg, ticket, resp, firmas.firma_cliente || '', noFirma, firmaCli); } catch (e) { Logger.log('Correo OT: ' + e); }
  }
  return { ok: true, id: id, pdf_url: reg.pdf_url, alertas: ev.alertas, firma: firmaCli, correo: correoOT };
}

function carpetaTicket_(ticket) {
  var c = String(ticket.creado || '').slice(0, 7) || fmt_(new Date(), 'yyyy-MM');
  return carpetaDe_('trabajos', c.slice(0, 4), c, ticket.id + ' - ' + String(ticket.cliente || '').slice(0, 60));
}
function carpeta_(ticket, now, u, f, resp) {
  if (ticket) {
    if (ticket.carpeta_id) { try { var ya = DriveApp.getFolderById(ticket.carpeta_id); if (!ya.isTrashed()) return ya; } catch (e) {} }
    var fo = carpetaTicket_(ticket);
    update_('TICKETS', ticket._row, { carpeta_id: fo.getId(), carpeta_url: fo.getUrl() });
    return fo;
  }
  var id = f ? f.id : '', mes = fmt_(now, 'yyyy-MM');
  if (id === 'INCIDENTE') return carpetaDe_('incidentes', fmt_(now, 'yyyy'), fmt_(now, 'yyyy-MM-dd') + ' ' + u.nombre);
  if (esConfidencial_(id)) return carpetaDe_('sistema', 'CONFIDENCIAL - Denuncias Ley Karin', fmt_(now, 'yyyy'));
  if (id === 'GASTOS') return carpetaDe_('gastos', mes, 'Rendiciones');
  if (id === 'CHK_CAMIONETA' || id === 'CHK_INDIVIDUAL') return carpetaDe_('bodega', 'Checklists mensuales', mes);
  if (id === 'INSPECCION' || id === 'OBSERVACION') return carpetaDe_('inspecciones', id === 'INSPECCION' ? 'Inspecciones planeadas' : 'Observaciones planeadas', mes);
  if (id === 'BITACORA' || id === 'VEHICULO') return carpetaDe_('vehiculos', String((resp || {}).patente || 'Sin patente').toUpperCase(), mes);
  return carpetaDe_('jornada', mes, fmt_(now, 'yyyy-MM-dd') + ' ' + u.nombre);
}

function valorHtml_(it, v, firmas) {
  if (it.tipo === 'firma') return firmas[it.id] ? '<img src="' + firmas[it.id] + '" style="height:60px">' : (v ? '<a href="' + v + '">Ver firma</a>' : '—');
  if (it.tipo === 'foto') return Array.isArray(v) && v.length ? v.map(function (x, i) { return '<a href="' + x + '">Foto ' + (i + 1) + '</a>'; }).join(' · ') : '—';
  if (it.tipo === 'multiple') return Array.isArray(v) && v.length ? esc_(v.join(', ')) : '—';
  if (it.tipo === 'materiales') return Array.isArray(v) && v.length ? '<table><tr><th>Código</th><th>Material</th><th>Cantidad</th></tr>' + v.map(function (m) {
    return '<tr><td>' + esc_(m.codigo) + '</td><td>' + esc_(m.nombre) + '</td><td>' + esc_(m.cantidad) + ' ' + esc_(m.unidad || '') + '</td></tr>'; }).join('') + '</table>' : '—';
  if (it.tipo === 'inventario') return Array.isArray(v) && v.length ? '<table><tr><th>Ítem</th><th>Cuento con</th><th>Solicito cambio</th></tr>' + v.map(function (x) {
    return '<tr><td>' + esc_(x.item) + (x.extra ? ' <i>(agregado)</i>' : '') + '</td><td style="text-align:center">' + (x.tengo ? '✔' : '<b style="color:#c62828">✘</b>') + '</td><td style="text-align:center">' + (x.cambio ? '<b style="color:#b26a00">Sí</b>' : '') + '</td></tr>'; }).join('') + '</table>' : '—';
  if (it.tipo === 'participantes') {
    if (!Array.isArray(v) || !v.length) return '—';
    return '<table><tr><th>Nombre</th><th>Cargo</th><th>RUT</th></tr>' + v.map(function (p) {
      return '<tr><td>' + esc_(p.nombre) + '</td><td>' + esc_(p.cargo) + '</td><td>' + esc_(p.rut) + '</td></tr>';
    }).join('') + '</table>';
  }
  if (it.tipo === 'gastos') {
    if (!Array.isArray(v) || !v.length) return '—';
    var t = 0, re = 0, pe = 0, $ = function (n) { return '$' + (Number(n) || 0).toLocaleString('es-CL'); };
    var filas = v.map(function (g) {
      t += Number(g.monto) || 0;
      if (g.origen === 'Colaborador') re += Number(g.monto) || 0;
      if (g.pendiente === 'Sí') pe++;
      return '<tr' + (g.pendiente === 'Sí' ? ' class="a"' : '') + '><td>' + esc_(g.tipo) + '<br>' + esc_(g.detalle) + '</td><td>' + esc_(g.razon) + '<br>' + esc_(g.rut_prov) +
        '</td><td>' + esc_(g.tipo_doc) + ' ' + esc_(g.doc) + (g.pendiente === 'Sí' ? '<br><b>PENDIENTE</b>' : '') + '</td><td>' + esc_(g.medio) + '<br>' + esc_(g.origen) +
        '</td><td style="text-align:right">' + $(g.monto) + '</td></tr>';
    }).join('');
    return '<table><tr><th>Gasto</th><th>Proveedor (razón social / RUT)</th><th>Documento</th><th>Pago / origen</th><th>Monto</th></tr>' + filas +
      '<tr><td colspan="4"><b>Total</b></td><td style="text-align:right"><b>' + $(t) + '</b></td></tr>' +
      '<tr><td colspan="4">A reembolsar al colaborador</td><td style="text-align:right">' + $(re) + '</td></tr>' +
      (pe ? '<tr class="a"><td colspan="5">Documentos pendientes: ' + pe + '</td></tr>' : '') + '</table>';
  }
  return v === undefined || v === '' ? '—' : esc_(v).replace(/\n/g, '<br>');
}

function pdfHtml_(f, resp, m, firmas) {
  var css = 'body{font-family:Arial,sans-serif;font-size:10px;color:#111}table{width:100%;border-collapse:collapse;margin:4px 0}' +
    'td,th{border:1px solid #9aa3b5;padding:4px;vertical-align:top}th{background:#23306b;color:#fff;text-align:left}' +
    '.s td{background:#e6eaf5;font-weight:bold}.a td{background:#fde4e4;color:#9b0000}.k{width:58%}.h td{border:none}';
  var t = m.ticket;
  var h = '<html><head><meta charset="utf-8"><style>' + css + '</style></head><body>';
  h += '<table class="h"><tr><td>' + logoImg_(56) + '<br><small>' + esc_(m.cfg.razon_social || m.cfg.empresa) + '</small></td>' +
       '<td style="text-align:right"><b style="font-size:13px">' + esc_(f.nombre) + '</b>' +
       (f.id === 'OT' && t ? (resp.n_ot ? '<br><b style="font-size:15px">N° OT: ' + esc_(resp.n_ot) + '</b>' : '') + '<br><b>Ticket ' + esc_(t.id) + '</b>' + (t.mw_ticket ? ' · Mikrowisp #' + esc_(t.mw_ticket) : '') : '') +
       '<br><span style="color:#777">Código: ' + esc_(f.codigo) + ' · Registro ' + m.id + '</span></td></tr></table>';
  h += '<table><tr><td><b>Fecha</b> ' + m.fecha + '</td><td><b>Trabajador</b> ' + esc_(m.u.nombre) + ' (' + esc_(m.u.rut) + ')</td><td><b>Cargo</b> ' + esc_(m.u.cargo) + '</td></tr>';
  if (t) h += '<tr><td><b>Ticket</b> ' + esc_(t.id) + '</td><td><b>Cliente</b> ' + esc_(t.cliente) + '</td><td><b>Dirección</b> ' + esc_(t.direccion) + ' ' + esc_(t.comuna) + '</td></tr>';
  h += '<tr><td colspan="3"><b>Ubicación GPS</b> ' + (m.geo.lat ? '<a href="https://maps.google.com/?q=' + m.geo.lat + ',' + m.geo.lng + '">' +
       Number(m.geo.lat).toFixed(6) + ', ' + Number(m.geo.lng).toFixed(6) + '</a> (±' + (m.geo.acc || '?') + ' m) ' + esc_(m.dir) : 'Sin ubicación') + '</td></tr></table>';
  if (m.ev.alertas.length) h += '<table><tr class="a"><td><b>ALERTAS:</b> ' + m.ev.alertas.map(esc_).join(' · ') + '</td></tr></table>';
  (f.secciones || []).forEach(function (s) {
    if (!seccionActiva_(s, resp)) return;
    h += '<table><tr class="s"><td colspan="2">' + esc_(s.titulo) + (s.nota ? ' <span style="font-weight:normal">— ' + esc_(s.nota) + '</span>' : '') + '</td></tr>';
    (s.items || []).forEach(function (it) {
      if (it.tipo === 'info') { h += '<tr><td colspan="2"><b>' + esc_(it.texto) + '</b></td></tr>'; return; }
      var v = resp[it.id];
      var al = (it.alerta && String(v) === String(it.alerta)) || (it.alertaSiMarca && Array.isArray(v) && v.length);
      h += '<tr' + (al ? ' class="a"' : '') + '><td class="k">' + esc_(it.texto) + '</td><td>' + valorHtml_(it, v, firmas) + '</td></tr>';
    });
    h += '</table>';
  });
  return h + '</body></html>';
}

function criticos_(f, resp) {
  var ids = CRITICOS[f.id];
  if (!ids) return [];
  if (ids[0] === '*') return [f.nombre + ': ' + (resp.tipo_inc || 'reporte enviado')];
  var out = [];
  itemsOf_(f, resp).forEach(function (it) {
    if (ids.indexOf(it.id) >= 0 && it.alerta && String(resp[it.id]) === String(it.alerta)) out.push(it.texto + ': ' + resp[it.id]);
  });
  return out;
}

function notificar_(f, m, pdf, reg) {
  var c = m.cfg, modo = (c.notificar || 'TODOS').toUpperCase();
  if (esConfidencial_(f.id)) {   // sin detalles ni adjunto: se revisa en el panel con usuario administrador
    var dest = c.correo_denuncias || c.correo_notificaciones;
    if (dest) try { MailApp.sendEmail({ to: dest, name: 'Prevención ' + (c.marca || ''), subject: '🛡️ CONFIDENCIAL · Nueva denuncia ' + (f.codigo || '') + ' · ' + m.fecha,
      htmlBody: '<p>Se recibió una denuncia confidencial (' + esc_(f.nombre) + ') el ' + m.fecha + '.</p><p>Por confidencialidad este correo no incluye detalles. Revísala en el panel → <b>Registros</b>, entrando como <b>administrador</b>.</p><p>Recuerda los plazos de la Ley Karin para adoptar medidas de resguardo e iniciar la investigación.</p>' }); } catch (e) {}
    return;
  }
  var crit = criticos_(f, m.resp || {});
  var urg = c.correo_urgencias || c.correo_notificaciones;
  if (crit.length && urg) {
    try {
      MailApp.sendEmail({ to: urg, name: 'Prevención ' + (c.marca || ''), attachments: [pdf],
        subject: '🚨 URGENTE · ' + f.nombre + ' · ' + m.u.nombre + ' · ' + m.fecha,
        htmlBody: '<h2 style="color:#c62828">Alerta urgente</h2><p><b>' + esc_(m.u.nombre) + '</b> (' + esc_(m.u.rut) + ') envió ' + esc_(f.nombre) + ' el ' + m.fecha + '.</p>' +
          '<ul>' + crit.map(function (x) { return '<li><b>' + esc_(x) + '</b></li>'; }).join('') + '</ul>' +
          (m.geo.lat ? '<p>Ubicación: <a href="https://maps.google.com/?q=' + m.geo.lat + ',' + m.geo.lng + '">ver en mapa</a> ' + esc_(m.dir) + '</p>' : '') +
          '<p>Contacta al trabajador ahora. Si corresponde, detén el trabajo o la conducción.</p>' })
    } catch (e) { console.warn('No se pudo enviar urgencia: ' + e); }
    return;
  }
  if (!c.correo_notificaciones || modo === 'NO') return;
  if (modo === 'SOLO_ALERTAS' && !m.ev.alertas.length) return;
  var asunto = (m.ev.alertas.length ? '⚠ ALERTA · ' : '') + '[' + (f.codigo || f.id) + '] ' +
    (m.ticket ? m.ticket.id + ' · ' : '') + m.u.nombre + ' · ' + m.fecha;
  var body = '<p><b>' + esc_(f.nombre) + '</b><br>Trabajador: ' + esc_(m.u.nombre) + ' (' + esc_(m.u.rut) + ')<br>Fecha: ' + m.fecha +
    (m.ticket ? '<br>Ticket: ' + esc_(m.ticket.id) + ' · ' + esc_(m.ticket.cliente) : '') +
    (m.geo.lat ? '<br>Ubicación: <a href="https://maps.google.com/?q=' + m.geo.lat + ',' + m.geo.lng + '">ver en mapa</a> ' + esc_(m.dir) : '<br>Sin ubicación GPS') + '</p>' +
    (m.ev.alertas.length ? '<p style="color:#9b0000"><b>Alertas:</b><br>' + m.ev.alertas.map(esc_).join('<br>') + '</p>' : '') +
    (m.ev.riesgos.length ? '<p><b>Riesgos identificados:</b> ' + m.ev.riesgos.map(esc_).join(', ') + '</p>' : '') +
    '<p><a href="' + reg.carpeta_url + '">Abrir carpeta en Drive</a></p>';
  try {
    MailApp.sendEmail({ to: c.correo_notificaciones, subject: asunto, htmlBody: body, attachments: [pdf], name: 'Prevención ' + (c.marca || '') });
  } catch (e) { console.warn('No se pudo enviar correo: ' + e); }
}

/* ===================== PANEL: TICKETS ===================== */

function apiTickets(token) {
  auth_(token, ROLES_PANEL);
  var map = {};
  rows_('REGISTROS').forEach(function (r) {
    if (!r.ticket_id) return;
    map[r.ticket_id] = map[r.ticket_id] || [];
    if (map[r.ticket_id].indexOf(r.form_id) < 0) map[r.ticket_id].push(r.form_id);
  });
  var gt = {};
  gastosPlanos_({}).forEach(function (L) { if (L.ticket) gt[L.ticket] = (gt[L.ticket] || 0) + L.monto; });
  var T0 = rows_('TICKETS'), re = reincidencias_(T0);
  var tickets = T0.map(function (t) { t.formsHechos = map[t.id] || []; t.gastos = gt[t.id] || 0; t.reinc = re[t.id] || []; delete t._row; return t; }).reverse();
  return { tickets: tickets, tecnicos: usuariosLite_(), estados: ESTADOS_TICKET, hoy: hoy_(), marca: cfg_().marca || cfg_().empresa || '', comunas: comunas_(),
    plantillas: plantillas_(true) };
}

/** Lista liviana de clientes para autocompletar (se pide una vez por sesión). [id, nombre, rut, telefono, direccion, comuna] */
function apiClientesLite(token) {
  auth_(token, ROLES_PANEL);
  return rows_('CLIENTES').filter(function (c) { return c.activo !== 'NO'; }).map(function (c) {
    return [c.id, c.nombre, c.rut, String(c.telefono), c.direccion, c.comuna, c.plan, c.estado_servicio, c.usuario_ppp, c.mapa_url || '', c.lat || '', c.lng || '', c.precinto || ''];
  });
}

function usuariosLite_() {
  return rows_('USUARIOS').filter(function (x) { return String(x.activo).toUpperCase() === 'SI'; })
    .map(function (x) { return { rut: normRut_(x.rut), nombre: x.nombre, cargo: x.cargo, rol: x.rol, area: areaDe_(x), telefono: String(x.telefono || '') }; });
}

function apiGuardarTicket(token, t) {
  var u = auth_(token, ROLES_PANEL);
  if (!t || !t.cliente) throw new Error('Falta el cliente.');
  var tec = usuariosLite_().filter(function (x) { return x.rut === normRut_(t.tecnico_rut); })[0];
  var apo = t.apoyo_rut ? usuariosLite_().filter(function (x) { return x.rut === normRut_(t.apoyo_rut); })[0] : null;
  if (apo && tec && apo.rut === tec.rut) apo = null;
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); fresco_();
  var nuevo = !t.id, anterior = null, id = t.id;
  try {
    var obj = {
      cliente: t.cliente, direccion: t.direccion || '', comuna: t.comuna || '', telefono: t.telefono || '',
      tipo: t.tipo || '', prioridad: t.prioridad || 'Normal', descripcion: t.descripcion || '',
      tecnico_rut: tec ? tec.rut : '', tecnico_nombre: tec ? tec.nombre : '', notas: t.notas || '', actualizado: new Date(),
      apoyo_rut: apo ? apo.rut : '', apoyo_nombre: apo ? apo.nombre : '',
      fecha_programada: f10_(t.fecha_programada), fecha_limite: f10_(t.fecha_limite),
      cliente_rut: /\d/.test(t.rut || '') ? normRut_(t.rut) : '',
      servicio_id: String(t.servicio_id || '').slice(0, 30), servicio: String(t.servicio || '').slice(0, 300)
    };
    if (obj.cliente_rut && !rutValido_(obj.cliente_rut)) throw new Error('El RUT del cliente no es válido (revisa el dígito verificador).');
    obj.cliente_id = clienteUpsert_(t);
    try { ubicarDesdeCliente_(obj); } catch (e) { Logger.log('Ubicación cliente: ' + e); }
    if (nuevo) {
      var c = rows_('CONFIG').filter(function (r) { return r.clave === 'contador_tickets'; })[0];
      var cSh = sh_('CONFIG');
      var n = (Number(c ? c.valor : 0) || 0) + 1;
      if (c) cSh.getRange(c._row, 2).setValue(n); else cSh.appendRow(['contador_tickets', n, 'Correlativo de tickets']);
      id = 'TK-' + ('0000' + n).slice(-5);
      obj.id = id; obj.creado = new Date(); obj.creado_por = u.nombre; obj.estado = 'Asignado';
      append_('TICKETS', obj);
    } else {
      anterior = rows_('TICKETS').filter(function (x) { return x.id === t.id; })[0];
      if (!anterior) throw new Error('Ticket no encontrado.');
      if (t.estado && ESTADOS_TICKET.indexOf(t.estado) >= 0) obj.estado = t.estado;
      if (obj.estado === 'Cerrado' && !anterior.cerrado) obj.cerrado = new Date();
      if (obj.estado && obj.estado !== 'Cerrado') obj.cerrado = '';
      update_('TICKETS', anterior._row, obj);
    }
  } finally { lock.releaseLock(); }

  if (tec && (nuevo || normRut_(anterior.tecnico_rut) !== tec.rut)) avisarTecnico_(tec.rut, id, t);
  if (apo && (nuevo || normRut_(anterior.apoyo_rut) !== apo.rut)) avisarTecnico_(apo.rut, id, t);
  var r = apiTickets(token);
  r.guardado = id;
  return r;
}

/* ===================== CLIENTES ===================== */

function rutValido_(r) {
  var m = String(r || '').toUpperCase().replace(/[^0-9K]/g, '').match(/^(\d{7,8})([0-9K])$/);
  if (!m) return false;
  var s = 0, f = 2, d = m[1].split('').reverse();
  for (var i = 0; i < d.length; i++) { s += Number(d[i]) * f; f = f === 7 ? 2 : f + 1; }
  var v = 11 - s % 11;
  return (v === 11 ? '0' : v === 10 ? 'K' : String(v)) === m[2];
}
function normTxt_(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

/** Busca el cliente del ticket (por id, RUT o nombre+dirección); si no existe lo crea. Devuelve su id. lista = caché opcional. */
function clienteUpsert_(t, lista) {
  if (!t || !t.cliente) return '';
  lista = lista || rows_('CLIENTES');
  var rut = /\d/.test(t.rut || '') ? normRut_(t.rut) : '';
  var ex = lista.filter(function (c) { return t.cliente_id && c.id === t.cliente_id; })[0] ||
    (rut ? lista.filter(function (c) { return normRut_(c.rut) === rut && (!t.direccion || !c.direccion || normTxt_(c.direccion) === normTxt_(t.direccion)); })[0] : null) ||
    lista.filter(function (c) { return normTxt_(c.nombre) === normTxt_(t.cliente) && normTxt_(c.direccion) === normTxt_(t.direccion); })[0];
  var datos = { nombre: t.cliente, telefono: t.telefono || '', direccion: t.direccion || '', comuna: t.comuna || '' };
  if (rut) datos.rut = rut;
  if (t.obs !== undefined) datos.obs = t.obs;
  if (ex) {
    var cambia = Object.keys(datos).some(function (k) { return datos[k] && String(datos[k]) !== String(ex[k]); });
    if (cambia) { Object.keys(datos).forEach(function (k) { if (!datos[k] && k !== 'obs') delete datos[k]; }); update_('CLIENTES', ex._row, datos); Object.assign(ex, datos); }
    return ex.id;
  }
  var max = 0;
  lista.forEach(function (c) { var n = Number(String(c.id).replace(/\D/g, '')); if (n > max) max = n; });
  datos.id = 'C-' + ('0000' + (max + 1)).slice(-5); datos.creado = new Date(); datos.activo = 'SI';
  append_('CLIENTES', datos);
  datos._row = sh_('CLIENTES').getLastRow();
  lista.push(datos);
  return datos.id;
}

function apiClientes(token) {
  auth_(token, ROLES_PANEL);
  var T = rows_('TICKETS'), por = {};
  var C = rows_('CLIENTES').filter(function (c) { return c.activo !== 'NO'; });
  var porNombre = {};
  C.forEach(function (c) { porNombre[normTxt_(c.nombre)] = c.id; });
  T.forEach(function (t) {
    var k = t.cliente_id || porNombre[normTxt_(t.cliente)];
    if (!k) return;
    var p = por[k] = por[k] || { n: 0, abiertos: 0, ultimo: '' };
    p.n++; if (abierto_(t)) p.abiertos++;
    if (f10_(t.creado) > p.ultimo) p.ultimo = f10_(t.creado);
  });
  // liviano: el historial se arma en el panel con los tickets que ya tiene
  return C.map(function (c) {
    var p = por[c.id] || { n: 0, abiertos: 0, ultimo: '' };
    // compacto (arreglo) para que viaje rápido con miles de clientes
    return [c.id, c.nombre, c.rut, String(c.telefono), c.direccion, c.comuna, c.obs, c.lat, c.lng, p.n, p.abiertos, p.ultimo, c.plan, c.estado_servicio, c.usuario_ppp, c.precinto, c.mapa_url, c.email || ''];
  });
}

/** Elimina un cliente del sistema. Si viene de Mikrowisp solo se oculta (si no, la sincronización lo vuelve a crear).
 *  Sus tickets y equipos quedan con el nombre del cliente escrito, pero sin el enlace a la ficha. */
function apiEliminarCliente(token, id) {
  var u = auth_(token, ['admin', 'editor']);
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  var res;
  try {
    var c = rows_('CLIENTES').filter(function (x) { return x.id === id; })[0];
    if (!c) throw new Error('El cliente no existe.');
    if (c.mw_id) { update_('CLIENTES', c._row, { activo: 'NO', obs: String(c.obs || '') + ' · Ocultado por ' + u.nombre + ' ' + fmt_(new Date(), 'dd-MM-yyyy') }); res = 'oculto'; }
    else {
      rows_('TICKETS').forEach(function (t) { if (t.cliente_id === id) update_('TICKETS', t._row, { cliente_id: '' }); });
      if (hoja_('EQUIPOS')) rows_('EQUIPOS').forEach(function (e) { if (e.cliente_id === id) update_('EQUIPOS', e._row, { cliente_id: '' }); });
      fresco_();
      sh_('CLIENTES').deleteRow(rows_('CLIENTES').filter(function (x) { return x.id === id; })[0]._row);
      res = 'eliminado';
    }
  } finally { lock.releaseLock(); }
  fresco_();
  return { resultado: res, clientes: apiClientes(token) };
}
function apiGuardarCliente(token, c) {
  auth_(token, ROLES_TICKETS);
  if (!c || !c.nombre) throw new Error('Falta el nombre del cliente.');
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var lista = rows_('CLIENTES');
    var ex = c.id ? lista.filter(function (x) { return x.id === c.id; })[0] : null;
    var mapa = String(c.mapa_url || '').trim(), ll = mapa ? coordsDeLink_(mapa) : null;
    var extra = { precinto: String(c.precinto || '').trim(), mapa_url: mapa, email: correoValido_(c.email) };
    if (ll) { extra.lat = ll.lat; extra.lng = ll.lng; }
    if (ex) { var o = { nombre: c.nombre, rut: c.rut ? normRut_(c.rut) : '', telefono: c.telefono || '', direccion: c.direccion || '',
      comuna: c.comuna || '', obs: c.obs || '', activo: c.activo === 'NO' ? 'NO' : 'SI' }; for (var k in extra) o[k] = extra[k];
      if (!mapa && ex.mapa_url) { o.lat = ''; o.lng = ''; }
      update_('CLIENTES', ex._row, o); }
    else { var nid = clienteUpsert_({ cliente: c.nombre, rut: c.rut, telefono: c.telefono, direccion: c.direccion, comuna: c.comuna, obs: c.obs || '' }, lista);
      var nr = rows_('CLIENTES').filter(function (x) { return x.id === nid; })[0]; if (nr) update_('CLIENTES', nr._row, extra); }
  } finally { lock.releaseLock(); }
  return apiClientes(token);
}

/** filas = [{nombre, rut, telefono, direccion, comuna}] pegadas desde Excel. No duplica: actualiza los que ya existen. */
/** filas = [{nombre, rut, telefono, direccion, comuna}] pegadas desde Excel. No duplica: actualiza los que ya existen.
 *  Rápido para listas grandes: lee la hoja una vez, busca con índices y escribe todo de una sola vez. */
function apiImportarClientes(token, filas) {
  auth_(token, ROLES_TICKETS);
  var r = importarClientes_(filas); r.clientes = apiClientes(token); return r;
}
function importarClientes_(filas) {
  filas = (filas || []).filter(function (f) { return f && String(f.nombre || '').trim(); }).slice(0, 10000);
  var H = HOJAS.CLIENTES, col = {};
  H.forEach(function (k, j) { col[k] = j; });
  var creados = 0, actualizados = 0;
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var sh = sh_('CLIENTES');
    var V = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, H.length).getValues() : [];
    // una misma persona puede tener servicio en varias direcciones: se distingue por RUT + dirección
    var porRut = {}, porRutSolo = {}, porNomDir = {}, max = 0;
    var porPpp = {};
    var indexar = function (r, i) {
      var d = normTxt_(r[col.direccion]);
      if (r[col.usuario_ppp]) porPpp[String(r[col.usuario_ppp]).trim().toLowerCase()] = i;
      if (r[col.rut]) { porRut[normRut_(r[col.rut]) + '|' + d] = i; if (porRutSolo[normRut_(r[col.rut])] === undefined) porRutSolo[normRut_(r[col.rut])] = i; }
      porNomDir[normTxt_(r[col.nombre]) + '|' + d] = i;
    };
    V.forEach(function (r, i) {
      if (!r[0]) return;
      var n = Number(String(r[0]).replace(/\D/g, '')); if (n > max) max = n;
      indexar(r, i);
    });
    var hoy = new Date(), cambiadas = {}, reclamado = {}, sinPpp = {};
    V.forEach(function (r, k) { if (r[0] && r[col.rut] && !r[col.usuario_ppp]) (sinPpp[normRut_(r[col.rut])] = sinPpp[normRut_(r[col.rut])] || []).push(k); });
    filas.forEach(function (f) {
      var nombre = String(f.nombre).trim(), rut = /\d/.test(f.rut || '') ? normRut_(f.rut) : '';
      var datos = { nombre: nombre, rut: rut, telefono: String(f.telefono || '').trim(), direccion: String(f.direccion || '').trim(), comuna: String(f.comuna || '').trim(),
        plan: String(f.plan || '').trim(), estado_servicio: String(f.estado_servicio || '').trim().toUpperCase(), usuario_ppp: String(f.usuario_ppp || '').trim(),
        mw_id: String(f.mw_id || '').trim(), precinto: String(f.precinto || '').replace(/\.0$/, '').trim(), mapa_url: /^https?:\/\//.test(String(f.mapa_url || '').trim()) ? String(f.mapa_url).trim() : '',
        servicios: String(f.servicios || '') };
      var dn = normTxt_(datos.direccion);
      var ppp = datos.usuario_ppp.toLowerCase();
      // 1) mismo usuario PPP (es único por servicio en Mikrowisp)  2) RUT + dirección  3) nombre + dirección
      var i = ppp && porPpp[ppp] !== undefined ? porPpp[ppp] :
        rut && porRut[rut + '|' + dn] !== undefined ? porRut[rut + '|' + dn] : porNomDir[normTxt_(nombre) + '|' + dn];
      if (i === undefined && rut && !dn) i = porRutSolo[rut];   // sin dirección: basta el RUT
      // 4) cliente creado desde un ticket (sin usuario PPP) con el mismo RUT: es el mismo aunque la dirección esté escrita distinto
      if (i === undefined && rut) {
        var cand = (sinPpp[rut] || []).filter(function (k) { return !reclamado[k]; });
        if (cand.length === 1) i = cand[0];
      }
      if (i !== undefined && ppp) reclamado[i] = 1;
      if (i !== undefined) {
        var r = V[i], cambio = false;
        Object.keys(datos).forEach(function (k) { if (datos[k] && String(r[col[k]]).replace(/^'/, '') !== datos[k]) { r[col[k]] = limpia_(datos[k]); cambio = true; } });
        if (cambio && !cambiadas[i]) { cambiadas[i] = 1; actualizados++; }
        indexar(r, i);
      } else {
        var nr = H.map(function () { return ''; });
        Object.keys(datos).forEach(function (k) { nr[col[k]] = limpia_(datos[k]); });
        nr[col.id] = 'C-' + ('0000' + (++max)).slice(-5); nr[col.creado] = hoy; nr[col.activo] = 'SI';
        V.push(nr); indexar(nr, V.length - 1); creados++;
      }
    });
    if (V.length) sh.getRange(2, 1, V.length, H.length).setValues(V);
    fresco_();
  } finally { lock.releaseLock(); }
  return { creados: creados, actualizados: actualizados, total: filas.length };
}

/** OT: potencia como número con alerta, velocidades, foto final y equipos instalados/retirados (no duplica). */
function actualizarOT_() {
  var f = forms_(false).filter(function (x) { return x.id === 'OT'; })[0];
  if (!f) return;
  var todos = itemsOf_(f), tiene = function (id) { return todos.some(function (it) { return it.id === id; }); };
  todos.forEach(function (it) {
    if (it.id === 'potencia') { it.tipo = 'numero'; it.texto = 'Potencia óptica en el cliente (dBm) — normal entre -8 y -27'; it.min = -27; it.max = -8; it.negativo = true; }
  });
  if (!tiene('vel_bajada')) f.secciones.splice(1, 0, { titulo: 'Prueba de servicio', si: { campo: 'resultado', valor: ['Resuelto', 'Pendiente'] }, items: [
    { id: 'vel_bajada', tipo: 'numero', texto: 'Velocidad de bajada medida (Mbps)' },
    { id: 'vel_subida', tipo: 'numero', texto: 'Velocidad de subida medida (Mbps)' },
    { id: 'foto_final', tipo: 'foto', texto: 'Foto de la instalación terminada (equipo y cableado)', req: true },
    { id: 'foto_test', tipo: 'foto', texto: 'Captura del test de velocidad' }
  ] });
  if (!tiene('equipos_instalados')) f.secciones.splice(2, 0, { titulo: 'Equipos', items: [
    { id: 'equipos_instalados', tipo: 'multiple', fuente: 'equipos_tecnico', texto: 'Equipos que instalaste (de los que tienes asignados)' },
    { id: 'equipo_instalado_otro', tipo: 'texto', texto: 'Otro equipo instalado: N° de serie (si no aparece arriba)' },
    { id: 'equipos_retirados', tipo: 'texto', texto: 'Equipos retirados del cliente: N° de serie (separa con coma si son varios)' }
  ] });
  if (!tiene('materiales_usados')) f.secciones.splice(3, 0, { titulo: 'Materiales usados', items: [
    { id: 'materiales_usados', tipo: 'materiales', texto: 'Materiales que usaste en este trabajo (se descuentan de tu stock)' }
  ] });
  var fila = rows_('FORMULARIOS').filter(function (x) { return x.id === 'OT'; })[0];
  sh_('FORMULARIOS').getRange(fila._row, 7).setValue(JSON.stringify(defDe_(f)));
  Logger.log('OT actualizada: datos técnicos, equipos y materiales.');
}

/** Crea la base de clientes a partir de los tickets antiguos (no duplica). */
function vincularClientes_() {
  var lista = rows_('CLIENTES'), n = 0;
  rows_('TICKETS').forEach(function (t) {
    if (t.cliente_id || !t.cliente) return;
    update_('TICKETS', t._row, { cliente_id: clienteUpsert_(t, lista) }); n++;
  });
  if (n) Logger.log('Clientes vinculados a ' + n + ' tickets antiguos.');
}

/* ===================== PLANTILLAS DE TICKET ===================== */

function plantillas_(soloActivas) {
  return rows_('PLANTILLAS').filter(function (p) { return !soloActivas || p.activo !== 'NO'; })
    .sort(function (a, b) { return (Number(a.orden) || 99) - (Number(b.orden) || 99); })
    .map(function (p) { delete p._row; p.plazo_dias = p.plazo_dias === '' ? '' : Number(p.plazo_dias); return p; });
}
function apiGuardarPlantilla(token, p) {
  auth_(token, ROLES_TICKETS);
  if (!p || !p.nombre) throw new Error('La plantilla necesita un nombre.');
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var L = rows_('PLANTILLAS');
    var obj = { nombre: p.nombre, tipo: p.tipo || '', prioridad: p.prioridad || 'Normal', plazo_dias: p.plazo_dias === '' || p.plazo_dias === undefined ? '' : Number(p.plazo_dias),
      descripcion: p.descripcion || '', activo: p.activo === 'NO' ? 'NO' : 'SI' };
    var ex = p.id ? L.filter(function (x) { return x.id === p.id; })[0] : null;
    if (ex) update_('PLANTILLAS', ex._row, obj);
    else {
      var max = 0; L.forEach(function (x) { var n = Number(String(x.id).replace(/\D/g, '')); if (n > max) max = n; });
      obj.id = 'PL' + (max + 1); obj.orden = L.length + 1; append_('PLANTILLAS', obj);
    }
  } finally { lock.releaseLock(); }
  return plantillas_(false);
}
function apiPlantillas(token) { auth_(token, ROLES_PANEL); return plantillas_(false); }

/* ===================== INVENTARIO DE EQUIPOS ===================== */

var ESTADOS_EQUIPO = ['En bodega', 'Asignado a técnico', 'Instalado', 'Retirado (en técnico)', 'Dañado', 'Perdido', 'De baja'];
var TIPOS_EQUIPO = ['ONT', 'Router', 'Decodificador', 'Antena', 'Switch', 'Repetidor / Mesh', 'Splitter', 'Control remoto', 'Fuente de poder', 'Otro'];
function normSerie_(s) { return String(s === 0 ? '0' : s || '').toUpperCase().replace(/[^A-Z0-9:_\-]/g, ''); }
/** Series solo con números se guardan como texto: si no, Sheets las convierte en número y redondea las de más de 15 dígitos. */
function textoSerie_(s) { return /^\d+$/.test(s) ? "'" + s : s; }
/** Lista de series desde un texto ("ZTE123, ABC456 xyz789") */
function seriesDe_(txt) { return String(txt || '').split(/[\s,;\/|]+/).map(normSerie_).filter(function (x) { return x.length >= 4; }); }

/**
 * Mueve un equipo (lo crea si no existe) y deja registro del movimiento.
 * cambios = campos de EQUIPOS. m = { accion, detalle, ticket_id, usuario }. idx = caché opcional {serie: fila}.
 */
function moverEquipo_(serie, cambios, m, idx) {
  serie = normSerie_(serie);
  if (!serie) return null;
  var ex = idx ? idx[serie] : rows_('EQUIPOS').filter(function (e) { return normSerie_(e.serie) === serie; })[0];
  var obj = {}; for (var k in cambios) obj[k] = cambios[k];
  obj.actualizado = new Date();
  if (cambios.estado && cambios.estado !== 'Instalado') { if (!('cliente_id' in cambios)) { obj.cliente_id = ''; obj.cliente_nombre = ''; } }
  if (cambios.estado && ['Asignado a técnico', 'Retirado (en técnico)'].indexOf(cambios.estado) < 0 && !('tecnico_rut' in cambios)) { obj.tecnico_rut = ''; obj.tecnico_nombre = ''; }
  if (ex) { update_('EQUIPOS', ex._row, obj); for (var k2 in obj) ex[k2] = obj[k2]; }
  else {
    obj.serie = textoSerie_(serie); obj.creado = new Date(); if (!obj.tipo) obj.tipo = 'Otro';
    append_('EQUIPOS', obj);
    obj._row = hoja_('EQUIPOS').getLastRow();
    if (idx) idx[serie] = obj;
  }
  append_('MOVIMIENTOS_EQ', { id: nuevoId_('MV'), fecha: new Date(), serie: textoSerie_(serie), accion: m.accion, detalle: m.detalle || '',
    tecnico_nombre: obj.tecnico_nombre || (ex && ex.tecnico_nombre) || '', cliente_id: obj.cliente_id || '', cliente_nombre: obj.cliente_nombre || '',
    ticket_id: m.ticket_id || '', usuario: m.usuario || '' });
  return serie;
}

/** Equipos que el técnico tiene en su poder (para elegir en la OT y verlos en su perfil). */
function equiposDeTecnico_(rut) {
  return rows_('EQUIPOS').filter(function (e) { return normRut_(e.tecnico_rut) === rut && (e.estado === 'Asignado a técnico' || e.estado === 'Retirado (en técnico)'); })
    .map(function (e) { return { serie: e.serie, tipo: e.tipo, marca: e.marca, modelo: e.modelo, estado: e.estado }; });
}
function etiquetaEquipo_(e) { return e.serie + ' · ' + [e.tipo, e.marca, e.modelo].filter(String).join(' '); }

/** Al enviar la OT con NAP y precinto: descuenta un cupo al tiro, anota el precinto en la NAP y en el cliente,
 *  y deja la nota en el ticket para que oficina lo asigne en Mikrowisp. El cupo queda "reservado" hasta que Mikrowisp lo refleje. */
function procesarNapOT_(resp, ticket, u) {
  var napId = String(resp.nap || '').trim(), prec = String(resp.precinto || '').replace(/\.0$/, '').replace(/\s+/g, '').trim();
  if (!napId && !prec) return;
  var sh = sh_('RED'); if (sh.getLastColumn() < HOJAS.RED.length) sh.getRange(1, 1, 1, HOJAS.RED.length).setValues([HOJAS.RED]);
  var n = napId ? rows_('RED').filter(function (x) { return String(x.id) === napId || String(x.nombre).trim() === napId; })[0] : null, nombreNap = n ? String(n.nombre || n.id).split(' · ')[0] : napId;
  if (n) {
    var lista = String(n.precintos || '').split(/[|,;\s]+/).filter(Boolean), ya = prec && lista.indexOf(prec) >= 0;
    var res = String(n.reservas || '').split('|').filter(Boolean);
    var cambios = { actualizado: new Date() };
    if (!ya) {
      if (prec) { lista.push(prec); cambios.precintos = lista.join(' '); }
      res.push([prec || '?', ticket ? ticket.id : '', fmt_(new Date(), 'yyyy-MM-dd')].join(';'));
      cambios.reservas = res.join('|');
      if (n.cupos !== '' && !isNaN(Number(n.cupos))) cambios.cupos = Math.max(0, Number(n.cupos) - 1);
      if (n.ocupados !== '' && !isNaN(Number(n.ocupados))) cambios.ocupados = Number(n.ocupados) + 1;
    }
    update_('RED', n._row, cambios);
  }
  if (ticket) {
    if (prec && ticket.cliente_id) try {
      var cl = rows_('CLIENTES').filter(function (x) { return x.id === ticket.cliente_id; })[0];
      if (cl) update_('CLIENTES', cl._row, { precinto: prec });
    } catch (e) {}
    var t = rows_('TICKETS').filter(function (x) { return x.id === ticket.id; })[0];
    if (t) update_('TICKETS', t._row, { notas: (t.notas ? String(t.notas) + ' · ' : '') + '🔌 Conectado a ' + (nombreNap || 'NAP no indicada') + (prec ? ' con precinto ' + prec : '') + ' — asignar en Mikrowisp' });
  }
}
/** Al leer Mikrowisp: las reservas hechas desde la OT se liberan cuando Mikrowisp ya muestra el puerto ocupado, o a los 3 días. */
function aplicarReservas_(r, col, ocuNuevo, ocuAntes, cupNuevo) {
  var res = String(r[col.reservas] || '').split('|').filter(Boolean);
  if (!res.length) return cupNuevo;
  var limite = fmt_(new Date(Date.now() - 3 * 86400000), 'yyyy-MM-dd');
  res = res.filter(function (x) { return (x.split(';')[2] || '') >= limite; });
  var subio = (ocuNuevo !== '' && ocuAntes !== '' && !isNaN(ocuNuevo) && !isNaN(ocuAntes)) ? Math.max(0, Number(ocuNuevo) - Number(ocuAntes)) : 0;
  res = res.slice(Math.min(subio, res.length));
  r[col.reservas] = res.join('|');
  return cupNuevo === '' || isNaN(Number(cupNuevo)) ? cupNuevo : Math.max(0, Number(cupNuevo) - res.length);
}
/** En la OT: los equipos del técnico aparecen como opciones para marcar los que instaló. */
function conEquipos_(forms, rut) {
  var mios = null;
  forms.forEach(function (f) {
    itemsOf_(f).forEach(function (it) {
      if (it.fuente !== 'equipos_tecnico') return;
      if (!mios) mios = equiposDeTecnico_(rut).filter(function (e) { return e.estado === 'Asignado a técnico'; });
      it.tipo = 'multiple'; it.opciones = mios.map(etiquetaEquipo_);
      if (!it.opciones.length) { it.tipo = 'info'; it.texto = 'No tienes equipos asignados en el inventario. Si instalaste uno, escribe su serie abajo.'; }
    });
  });
  return forms;
}

/** Al enviar la OT: registra equipos instalados y retirados en el cliente del ticket. */
function procesarEquiposOT_(f, resp, ticket, u) {
  if (!ticket) return;
  var inst = [].concat(resp.equipos_instalados || []).map(function (x) { return String(x).split(' · ')[0]; }).concat(seriesDe_(resp.equipo_instalado_otro));
  var ret = seriesDe_(resp.equipos_retirados);
  if (!inst.length && !ret.length) return;
  var idx = {};
  rows_('EQUIPOS').forEach(function (e) { idx[normSerie_(e.serie)] = e; });
  inst.forEach(function (s) {
    moverEquipo_(s, { estado: 'Instalado', cliente_id: ticket.cliente_id || '', cliente_nombre: ticket.cliente, ticket_id: ticket.id, tecnico_rut: '', tecnico_nombre: '' },
      { accion: 'Instalado', detalle: 'OT ' + ticket.id + ' · ' + (ticket.direccion || ''), ticket_id: ticket.id, usuario: u.nombre }, idx);
  });
  ret.forEach(function (s) {
    moverEquipo_(s, { estado: 'Retirado (en técnico)', tecnico_rut: u.rut, tecnico_nombre: u.nombre, cliente_id: '', cliente_nombre: '', ticket_id: ticket.id },
      { accion: 'Retirado del cliente', detalle: 'Cliente ' + ticket.cliente + ' · OT ' + ticket.id, ticket_id: ticket.id, usuario: u.nombre }, idx);
  });
}

function apiEquipos(token) {
  auth_(token, ROLES_PANEL);
  var cli = {};
  rows_('CLIENTES').forEach(function (c) { cli[c.id] = c; });
  // compacto (arreglos) para que viaje rápido con miles de equipos; el panel lo convierte
  var E = rows_('EQUIPOS').map(function (e) {
    var c = cli[e.cliente_id] || {};
    return [e.serie, e.tipo, e.marca, e.modelo, e.mac, e.estado, normRut_(e.tecnico_rut), e.tecnico_nombre, e.cliente_id, e.cliente_nombre, f10_(e.actualizado), e.obs,
      e.estado === 'Instalado' ? (c.estado_servicio || '') : '', c.direccion || '', c.rut || '', String(c.telefono || '')];
  });
  var M = rows_('MOVIMIENTOS_EQ');
  return { equipos: E, movimientos: M.slice(-300).reverse().map(function (m) { delete m._row; return m; }),
    tecnicos: usuariosLite_(), estados: ESTADOS_EQUIPO, tipos: TIPOS_EQUIPO };
}

/** Tipo de equipo según el nombre del producto (Mikrowisp) */
function tipoDeProducto_(p) {
  var x = normTxt_(p);
  if (/decodificador|stb|mediacenter/.test(x)) return 'Decodificador';
  if (/splitter|spliter|spl/.test(x)) return 'Splitter';
  if (/controlremoto/.test(x)) return 'Control remoto';
  if (/tenda|router|n30[01]|rs120|^ac\d/.test(x)) return 'Router';
  if (/xtk|ont|onu|huawei|hg8|hs85|eg81|f6\d\d|zxhn|rx8404|wk3801/.test(x)) return 'ONT';
  return 'Otro';
}
function marcaDeProducto_(p) {
  var x = normTxt_(p);
  if (/huawei|hueawei|hg8|hs85|eg81|wk3801/.test(x)) return 'Huawei';
  if (/zxhn|f670|f673|f6600/.test(x)) return 'ZTE';
  if (/tenda|ac[568]|n30[01]/.test(x)) return 'Tenda';
  if (/xtk/.test(x)) return 'XTK';
  if (/wircom/.test(x)) return 'Wircom';
  return '';
}

/**
 * Ingreso masivo (también el Excel de Almacén → Productos de Mikrowisp).
 * filas = [{serie, tipo, marca, modelo, mac, cliente (usuario PPP, RUT o nombre), estado_mw, tecnico_rut, obs}]
 * Rápido: lee y escribe cada hoja una sola vez.
 */
function apiIngresarEquipos(token, filas, comun) {
  var u = auth_(token, ROLES_TICKETS);
  comun = comun || {};
  filas = (filas || []).slice(0, 15000);
  var H = HOJAS.EQUIPOS, col = {}; H.forEach(function (k, j) { col[k] = j; });
  var nuevos = 0, act = 0, sinSerie = 0, sinCliente = [], ambiguos = 0;
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var sh = sh_('EQUIPOS');
    var V = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, H.length).getValues() : [];
    // Series mal leídas antes (Excel las mostraba como 9.91096E+15): se borran al reimportar desde Mikrowisp
    var largoOriginal = V.length, corregidas = 0;
    V = V.filter(function (r) {
      // número de 16+ dígitos: Sheets ya lo redondeó, la serie real se vuelve a cargar desde el Excel
      var malo = (typeof r[0] === 'number' && r[0] >= 1e15) || (filas.some(function (f) { return f.estado_mw; }) && /^\d{2,6}E\d{1,2}$/.test(normSerie_(r[0])));
      if (malo) corregidas++;
      else if (typeof r[0] === 'number') r[0] = String(r[0]);
      return !malo;
    });
    var idx = {}; V.forEach(function (r, i) { if (r[0]) idx[normSerie_(r[0])] = i; });
    var porPpp = {}, porRut = {}, porNom = {};
    rows_('CLIENTES').forEach(function (c) {
      if (c.usuario_ppp) porPpp[String(c.usuario_ppp).toLowerCase()] = c;
      if (c.rut) (porRut[normRut_(c.rut)] = porRut[normRut_(c.rut)] || []).push(c);
      (porNom[normTxt_(c.nombre)] = porNom[normTxt_(c.nombre)] || []).push(c);
    });
    var buscarCli = function (t) {
      t = String(t || '').trim(); if (!t) return null;
      if (porPpp[t.toLowerCase()]) return porPpp[t.toLowerCase()];
      var r = porRut[normRut_(t)]; if (r && r.length) return r[0];
      var n = porNom[normTxt_(t)]; if (n && n.length) { if (n.length > 1) ambiguos++; return n[0]; }
      return null;
    };
    var tecs = {}; usuariosLite_().forEach(function (t) { tecs[t.rut] = t; });
    var ahora = new Date(), M = [], k = 0;
    var mov = function (serie, accion, detalle, r) {
      M.push([nuevoId_('MV') + (k++), ahora, textoSerie_(serie), accion, detalle || '', r[col.tecnico_nombre] || '', r[col.cliente_id] || '', r[col.cliente_nombre] || '', '', u.nombre]);
    };
    filas.forEach(function (f) {
      var s = normSerie_(f.serie); if (!s) { sinSerie++; return; }
      var i = idx[s], ya = i !== undefined, r = ya ? V[i] : H.map(function () { return ''; });
      var antes = ya ? String(r[col.estado]) : '';
      var prod = String(f.modelo || f.producto || '').trim();
      r[col.serie] = s;
      r[col.tipo] = f.tipo || comun.tipo || (prod ? tipoDeProducto_(prod) : '') || r[col.tipo] || 'Otro';
      r[col.marca] = f.marca || comun.marca || (prod ? marcaDeProducto_(prod) : '') || r[col.marca];
      r[col.modelo] = prod || comun.modelo || r[col.modelo];
      if (f.mac) r[col.mac] = f.mac;
      if (f.obs || comun.obs) r[col.obs] = f.obs || comun.obs;
      var emw = String(f.estado_mw || '').toUpperCase().trim(), cli = buscarCli(f.cliente), tr = normRut_(f.tecnico_rut || comun.tecnico_rut || '');
      var nuevo = null, det = '';
      if (cli && emw !== 'DISPONIBLE') { nuevo = 'Instalado'; r[col.cliente_id] = cli.id; r[col.cliente_nombre] = cli.nombre; r[col.tecnico_rut] = ''; r[col.tecnico_nombre] = ''; det = cli.nombre + ' · ' + (cli.direccion || ''); }
      else if (f.cliente && emw !== 'DISPONIBLE') { sinCliente.push(s + ' (' + f.cliente + ')'); nuevo = 'Instalado'; r[col.cliente_id] = ''; r[col.cliente_nombre] = String(f.cliente); det = String(f.cliente); }
      else if (tr && tecs[tr]) { nuevo = 'Asignado a técnico'; r[col.tecnico_rut] = tr; r[col.tecnico_nombre] = tecs[tr].nombre; r[col.cliente_id] = ''; r[col.cliente_nombre] = ''; det = tecs[tr].nombre; }
      else if (emw === 'DISPONIBLE') {
        // Mikrowisp no sabe qué equipos andan con los técnicos: esos se respetan
        if (['Asignado a técnico', 'Retirado (en técnico)'].indexOf(antes) < 0) { nuevo = 'En bodega'; r[col.cliente_id] = ''; r[col.cliente_nombre] = ''; r[col.tecnico_rut] = ''; r[col.tecnico_nombre] = ''; }
      }
      else if (emw === 'NO DISPONIBLE') nuevo = 'De baja';
      else if (!ya) nuevo = 'En bodega';
      if (nuevo) r[col.estado] = nuevo;
      r[col.actualizado] = ahora;
      if (!ya) { r[col.creado] = ahora; V.push(r); idx[s] = V.length - 1; nuevos++; mov(s, ({ 'Instalado': 'Registrado como instalado', 'Asignado a técnico': 'Asignado a técnico' })[r[col.estado]] || 'Ingreso a bodega', det, r); }
      else { act++; if (nuevo && nuevo !== antes) mov(s, nuevo === 'Instalado' ? 'Registrado como instalado' : nuevo === 'En bodega' ? 'Recibido en bodega' : nuevo, det, r); }
      for (var j = 0; j < r.length; j++) r[j] = limpia_(r[j]);
    });
    V.forEach(function (r) { var sx = String(r[0]).replace(/^'/, ''); if (/^\d+$/.test(sx)) r[0] = "'" + sx; });
    // Equipos que están en el sistema pero no en el Excel de Mikrowisp (eliminados allá, o ingresados solo aquí)
    var noEnArchivo = [];
    if (filas.some(function (f) { return f.estado_mw; })) {
      var enArchivo = {}; filas.forEach(function (f) { var s2 = normSerie_(f.serie); if (s2) enArchivo[s2] = 1; });
      V.forEach(function (r) {
        var s3 = normSerie_(r[col.serie]);
        if (s3 && !enArchivo[s3] && ['De baja', 'Perdido'].indexOf(String(r[col.estado])) < 0)
          noEnArchivo.push({ serie: s3, tipo: r[col.tipo], modelo: r[col.modelo], estado: r[col.estado], donde: r[col.cliente_nombre] || r[col.tecnico_nombre] || 'Bodega' });
      });
    }
    if (V.length) sh.getRange(2, 1, V.length, H.length).setValues(V);
    if (largoOriginal > V.length) sh.getRange(2 + V.length, 1, largoOriginal - V.length, H.length).clearContent();
    if (M.length) { var sm = sh_('MOVIMIENTOS_EQ'); sm.getRange(sm.getLastRow() + 1, 1, M.length, M[0].length).setValues(M); }
    fresco_();
  } finally { lock.releaseLock(); }
  var out = apiEquipos(token);
  out.resumen = { noEnArchivo: noEnArchivo.slice(0, 500), nNoEnArchivo: noEnArchivo.length, nuevos: nuevos, actualizados: act, corregidas: corregidas, sinSerie: sinSerie, ambiguos: ambiguos, sinCliente: sinCliente.slice(0, 30), nSinCliente: sinCliente.length };
  return out;
}

/** accion: asignar | bodega | instalar | danado | perdido | baja.  d = { tecnico_rut, cliente_id, obs } */
function apiMoverEquipos(token, series, accion, d) {
  var u = auth_(token, ROLES_TICKETS);
  d = d || {};
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var idx = {}; rows_('EQUIPOS').forEach(function (e) { idx[normSerie_(e.serie)] = e; });
    var tec = d.tecnico_rut ? usuariosLite_().filter(function (t) { return t.rut === normRut_(d.tecnico_rut); })[0] : null;
    var cli = d.cliente_id ? rows_('CLIENTES').filter(function (c) { return c.id === d.cliente_id; })[0] : null;
    (series || []).forEach(function (s) {
      if (!idx[normSerie_(s)]) return;
      var c, m = { usuario: u.nombre, detalle: d.obs || '' };
      if (accion === 'asignar') { if (!tec) throw new Error('Elige el técnico.'); c = { estado: 'Asignado a técnico', tecnico_rut: tec.rut, tecnico_nombre: tec.nombre }; m.accion = 'Entregado a técnico'; m.detalle = tec.nombre + (d.obs ? ' · ' + d.obs : ''); }
      else if (accion === 'bodega') { c = { estado: 'En bodega' }; m.accion = 'Recibido en bodega'; }
      else if (accion === 'instalar') { if (!cli) throw new Error('Elige el cliente.'); c = { estado: 'Instalado', cliente_id: cli.id, cliente_nombre: cli.nombre }; m.accion = 'Registrado como instalado'; m.detalle = cli.nombre + ' · ' + (cli.direccion || ''); }
      else if (accion === 'danado') { c = { estado: 'Dañado' }; m.accion = 'Marcado dañado'; }
      else if (accion === 'perdido') { c = { estado: 'Perdido' }; m.accion = 'Marcado perdido'; }
      else if (accion === 'baja') { c = { estado: 'De baja' }; m.accion = 'Dado de baja'; }
      else throw new Error('Acción no válida.');
      if (d.obs) c.obs = d.obs;
      moverEquipo_(s, c, m, idx);
    });
  } finally { lock.releaseLock(); }
  return apiEquipos(token);
}

function apiHistorialEquipo(token, serie) {
  auth_(token, ROLES_PANEL);
  serie = normSerie_(serie);
  return rows_('MOVIMIENTOS_EQ').filter(function (m) { return normSerie_(m.serie) === serie; }).reverse().map(function (m) { delete m._row; return m; });
}
/** Servicios del cliente (si tiene varios, el ticket se hace para uno). Si aún no están guardados, se leen de Mikrowisp. */
function apiServiciosCliente(token, cid) {
  auth_(token, ROLES_PANEL);
  var cl = rows_('CLIENTES').filter(function (x) { return x.id === cid; })[0];
  if (!cl) return [];
  var L = json_(cl.servicios, []);
  if (!L.length && cl.mw_id && mwCfg_().url) {
    try {
      var d = mwClientesPorId_([cl.mw_id]);
      if (d.length) { var mc = mapClientesMw_(d)[0]; if (mc && mc.servicios) {
        L = json_(mc.servicios, []);
        var cambios = { servicios: mc.servicios };
        if (L.length > 1) cambios.plan = L.length + ' servicios';
        if (L.length && /servicios$/.test(cambios.plan || '') && String(cl.usuario_ppp || '').length > 40) cambios.usuario_ppp = '';   // venía todo junto desde el Excel
        update_('CLIENTES', cl._row, cambios);
      } }
    } catch (e) { Logger.log('Servicios ' + cid + ': ' + e); }
  }
  return L.map(function (s) { s.texto = textoServicio_(s); return s; });
}
function apiEquiposCliente(token, cid) {
  auth_(token, ROLES_PANEL);
  var O = onusPorSn_();
  var E = rows_('EQUIPOS').filter(function (e) { return e.cliente_id === cid && e.estado === 'Instalado'; }).map(function (e) { delete e._row; var o = O[snNorm_(e.serie)]; if (o) e.onu = o; return e; });
  if (!E.some(function (e) { return e.onu; })) { var o2 = onuDeCliente_(cid); if (o2) E.push({ serie: o2.sn, tipo: 'ONU (SmartOLT)', marca: '', modelo: o2.nombre, onu: o2 }); }
  return E;
}

/* ===================== REINCIDENCIAS ===================== */

/** Para cada ticket: cuántas visitas tuvo el mismo cliente en los 30 días anteriores (sin contar anulados). */
function reincidencias_(T) {
  var porCli = {};
  T.forEach(function (t) { if (t.cliente_id && t.estado !== 'Anulado') (porCli[t.cliente_id] = porCli[t.cliente_id] || []).push(t); });
  var out = {};
  Object.keys(porCli).forEach(function (k) {
    var L = porCli[k].slice().sort(function (a, b) { return String(a.creado) < String(b.creado) ? -1 : 1; });
    L.forEach(function (t, i) {
      var d0 = new Date(f10_(t.creado) + 'T12:00:00').getTime(), prev = [];
      for (var j = 0; j < i; j++) { var dj = new Date(f10_(L[j].creado) + 'T12:00:00').getTime(); if (d0 - dj <= 30 * 864e5) prev.push(L[j].id); }
      if (prev.length) out[t.id] = prev;
    });
  });
  return out;
}

/* ===================== INDICADORES DEL MES ===================== */

function apiIndicadores(token, mes) {
  auth_(token, ROLES_PANEL);
  mes = /^\d{4}-\d{2}$/.test(mes || '') ? mes : fmt_(new Date(), 'yyyy-MM');
  var T = rows_('TICKETS'), re = reincidencias_(T);
  var cierre = function (t) { return t.estado === 'Cerrado' ? f10_(t.cerrado || t.actualizado) : ''; };
  var creados = T.filter(function (t) { return f10_(t.creado).slice(0, 7) === mes && t.estado !== 'Anulado'; });
  var cerrados = T.filter(function (t) { return cierre(t).slice(0, 7) === mes; });
  var dias = function (t) { return Math.max(0, (new Date(String(t.cerrado || t.actualizado).replace(' ', 'T')) - new Date(String(t.creado).replace(' ', 'T'))) / 864e5); };
  var conPlazo = cerrados.filter(function (t) { return t.fecha_limite; });
  var enPlazo = conPlazo.filter(function (t) { return cierre(t) <= f10_(t.fecha_limite); });
  var R = rows_('REGISTROS'), ast = {};
  R.forEach(function (r) { if (r.form_id === 'AST' && r.ticket_id) ast[r.ticket_id] = 1; });
  var prom = function (L) { return L.length ? Math.round(L.reduce(function (a, t) { return a + dias(t); }, 0) / L.length * 10) / 10 : null; };
  var pct = function (a, b) { return b ? Math.round(a / b * 100) : null; };
  var porTec = {};
  creados.concat(cerrados).forEach(function (t) {
    var k = t.tecnico_nombre || 'Sin asignar';
    porTec[k] = porTec[k] || { tecnico: k, asignados: 0, cerrados: [], };
  });
  creados.forEach(function (t) { porTec[t.tecnico_nombre || 'Sin asignar'].asignados++; });
  cerrados.forEach(function (t) { porTec[t.tecnico_nombre || 'Sin asignar'].cerrados.push(t); });
  var tecs = Object.keys(porTec).map(function (k) {
    var p = porTec[k], C = p.cerrados, cp = C.filter(function (t) { return t.fecha_limite; });
    return { tecnico: k, asignados: p.asignados, cerrados: C.length, dias: prom(C),
      plazo: pct(cp.filter(function (t) { return cierre(t) <= f10_(t.fecha_limite); }).length, cp.length),
      reinc: C.filter(function (t) { return re[t.id]; }).length, ast: pct(C.filter(function (t) { return ast[t.id]; }).length, C.length) };
  }).sort(function (a, b) { return b.cerrados - a.cerrados; });
  var porTipo = {};
  creados.forEach(function (t) { porTipo[t.tipo || 'Otro'] = (porTipo[t.tipo || 'Otro'] || 0) + 1; });
  var porZona = {};
  creados.forEach(function (t) { var z = t.comuna || '—'; porZona[z] = (porZona[z] || 0) + 1; });
  var M = rows_('MOVIMIENTOS_EQ').filter(function (m) { return f10_(m.fecha).slice(0, 7) === mes; });
  var Rm = R.filter(function (r) { return f10_(r.fecha).slice(0, 7) === mes; });
  // 6 meses hacia atrás: creados y cerrados
  var serie = [];
  for (var i = 5; i >= 0; i--) {
    var d = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1 - i, 1), mm = fmt_(d, 'yyyy-MM');
    serie.push({ mes: mm, creados: T.filter(function (t) { return f10_(t.creado).slice(0, 7) === mm && t.estado !== 'Anulado'; }).length,
      cerrados: T.filter(function (t) { return cierre(t).slice(0, 7) === mm; }).length });
  }
  return {
    mes: mes,
    kpi: { creados: creados.length, cerrados: cerrados.length, dias: prom(cerrados), plazo: pct(enPlazo.length, conPlazo.length), nPlazo: conPlazo.length,
      reinc: creados.filter(function (t) { return re[t.id]; }).length, pctReinc: pct(creados.filter(function (t) { return re[t.id]; }).length, creados.length),
      ast: pct(cerrados.filter(function (t) { return ast[t.id]; }).length, cerrados.length),
      abiertos: T.filter(abierto_).length,
      instalados: M.filter(function (m) { return /instalado/i.test(m.accion); }).length,
      retirados: M.filter(function (m) { return /retirado/i.test(m.accion); }).length,
      alertas: Rm.filter(function (r) { return Number(r.n_alertas) > 0; }).length, formularios: Rm.length },
    tecnicos: tecs,
    tipos: Object.keys(porTipo).map(function (k) { return [k, porTipo[k]]; }).sort(function (a, b) { return b[1] - a[1]; }),
    zonas: Object.keys(porZona).map(function (k) { return [k, porZona[k]]; }).sort(function (a, b) { return b[1] - a[1]; }),
    reincidentes: creados.filter(function (t) { return re[t.id]; }).map(function (t) { return { id: t.id, cliente: t.cliente, tipo: t.tipo, tecnico: t.tecnico_nombre, previos: re[t.id] }; }),
    serie: serie
  };
}

/* ===================== RESPALDO AUTOMÁTICO ===================== */

var RESPALDOS_A_GUARDAR = 8;
/** Copia la base de datos completa a la carpeta RESPALDOS (se activa los domingos con activarAvisos). */
function respaldoSemanal() {
  if (porEmpresas_('respaldoSemanal', arguments)) return;
  var root = DriveApp.getFolderById(props_().getProperty('ROOT_ID'));
  var fo = carpetaDe_('sistema', 'Respaldos');
  var copia = DriveApp.getFileById(ss_().getId()).makeCopy('Respaldo base de datos · ' + fmt_(new Date(), 'yyyy-MM-dd HH.mm'), fo);
  var L = [], it = fo.getFiles();
  while (it.hasNext()) L.push(it.next());
  L.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  L.slice(RESPALDOS_A_GUARDAR).forEach(function (f) { try { f.setTrashed(true); } catch (e) {} });
  return { nombre: copia.getName(), url: copia.getUrl() };
}
function apiRespaldo(token, accion) {
  auth_(token, ['admin']);
  var r = accion === 'ahora' ? respaldoSemanal() : null;
  var fo = carpetaDe_('sistema', 'Respaldos'), L = [], it = fo.getFiles();
  while (it.hasNext()) { var f = it.next(); L.push({ nombre: f.getName(), url: f.getUrl(), fecha: fmt_(f.getDateCreated()) }); }
  L.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
  return { hecho: r, lista: L, carpeta: fo.getUrl() };
}

/* ===================== HOY (resumen del día para oficina) ===================== */

function abierto_(t) { return t.estado !== 'Cerrado' && t.estado !== 'Anulado'; }

function apiHoy(token) {
  var u = auth_(token, ROLES_PANEL);
  var hoy = hoy_(), c = cfg_();
  var req = jornadaObligatoria_();
  var nombres = {};
  forms_(false).forEach(function (f) { nombres[f.id] = f.nombre; });
  var R = rows_('REGISTROS'), deHoy = R.filter(function (r) { return f10_(r.fecha) === hoy; });
  var T = rows_('TICKETS');
  var terreno0 = rows_('USUARIOS').filter(function (x) { return String(x.activo).toUpperCase() === 'SI' && areaDe_(x) === 'Terreno'; });
  var ausentes = [], terreno = terreno0.filter(function (x) {
    var e = estadoDia_(x.rut, hoy); if (e.trabaja) return true;
    if (e.motivo !== 'Domingo') ausentes.push({ nombre: x.nombre, motivo: e.motivo, hasta: e.hasta || '' }); return false;
  });

  var jornada = terreno.map(function (x) {
    var rut = normRut_(x.rut), mios = deHoy.filter(function (r) { return normRut_(r.tecnico_rut) === rut; });
    var hechos = [];
    mios.forEach(function (r) { if (!hechos.some(function (h) { return h.id === r.form_id; })) hechos.push({ id: r.form_id, nombre: r.form_nombre, hora: String(r.fecha).slice(11, 16), alertas: Number(r.n_alertas) || 0 }); });
    var falta = req.filter(function (id) { return !hechos.some(function (h) { return h.id === id; }); }).map(function (id) { return nombres[id] || id; });
    var ab = T.filter(function (t) { return normRut_(t.tecnico_rut) === rut && abierto_(t); });
    return { rut: rut, nombre: x.nombre, cargo: x.cargo, telefono: String(x.telefono || ''), hechos: hechos, falta: falta, ok: !falta.length,
      abiertos: ab.length, paraHoy: ab.filter(function (t) { return f10_(t.fecha_programada) === hoy; }).length,
      atrasados: ab.filter(function (t) { return t.fecha_limite && f10_(t.fecha_limite) < hoy; }).length };
  });

  var ab = T.filter(abierto_), reH = reincidencias_(T);
  var lista = [];
  ab.forEach(function (t) {
    var motivo = [];
    if (t.fecha_limite && f10_(t.fecha_limite) < hoy) motivo.push('Atrasado');
    if (t.prioridad === 'Urgente') motivo.push('Urgente');
    if (f10_(t.fecha_programada) === hoy) motivo.push('Para hoy');
    if (t.fecha_limite && f10_(t.fecha_limite) === hoy) motivo.push('Vence hoy');
    if (!t.tecnico_rut) motivo.push('Sin asignar');
    if (reH[t.id]) motivo.push('Reincidencia');
    if (motivo.length) lista.push({ id: t.id, cliente: t.cliente, direccion: t.direccion, comuna: t.comuna, tipo: t.tipo, tecnico: t.tecnico_nombre,
      estado: t.estado, prioridad: t.prioridad, fecha_limite: f10_(t.fecha_limite), fecha_programada: f10_(t.fecha_programada), motivo: motivo,
      creado: String(t.creado || '').slice(0, 16), mw_ticket: t.mw_ticket || '', mw_fecha: String(t.mw_fecha || '').slice(0, 16) });
  });
  var peso = function (x) { return (x.motivo.indexOf('Atrasado') >= 0 ? 0 : x.motivo.indexOf('Urgente') >= 0 ? 1 : x.motivo.indexOf('Sin asignar') >= 0 ? 2 : 3); };
  lista.sort(function (a, b) { return peso(a) - peso(b) || ((a.fecha_limite || '9') < (b.fecha_limite || '9') ? -1 : 1); });

  var out = {
    hoy: hoy, jornada: jornada, ausentes: ausentes, colorMes: colorMes_(), esSabado: new Date(hoy + 'T12:00:00').getDay() === 6,
    sabadoProx: (function () { var s = proximosSabados_(1)[0], A = ausenciasIdx_(); return { fecha: s, marcado: !!A.sab[s], n: (A.sab[s] || []).length }; })(),
    kpi: {
      abiertos: ab.length, sinAsignar: ab.filter(function (t) { return !t.tecnico_rut; }).length,
      atrasados: ab.filter(function (t) { return t.fecha_limite && f10_(t.fecha_limite) < hoy; }).length,
      urgentes: ab.filter(function (t) { return t.prioridad === 'Urgente'; }).length,
      paraHoy: ab.filter(function (t) { return f10_(t.fecha_programada) === hoy; }).length,
      cerradosHoy: T.filter(function (t) { return t.estado === 'Cerrado' && f10_(t.cerrado) === hoy; }).length,
      creadosHoy: T.filter(function (t) { return f10_(t.creado) === hoy; }).length,
      sinJornada: jornada.filter(function (j) { return !j.ok; }).length, terreno: jornada.length
    },
    tickets: lista.slice(0, 40),
    alertas: deHoy.filter(function (r) { return Number(r.n_alertas) > 0 && !esConfidencial_(r.form_id); }).map(function (r) {
      return { id: r.id, hora: String(r.fecha).slice(11, 16), form: r.form_nombre, tecnico: r.tecnico_nombre, alertas: r.alertas, pdf_url: r.pdf_url };
    }).reverse(),
    incidentes: R.filter(function (r) { return r.form_id === 'INCIDENTE' && (json_(r.datos, {})._seg || {}).estado !== 'Cerrado'; }).length,
    firmas: personas_().reduce(function (a, p) { return a + pendientesFirma_(p.rut).length; }, 0),
    ocultas: ocultasDe_(u.rol),
    charla: (function () { try { return charlaDelDia_(); } catch (e) { return null; } })(),
    clima: (function () { try { return climaHoy_(); } catch (e) { return null; } })(),
    mw: (function () { var raw = c.mw_dias_tickets; return (c.mw_url || c.puente_clave) ? { dias: (raw === undefined || raw === '') ? 30 : Number(raw) || 0,
      deMw: ab.filter(function (t) { return t.mw_ticket; }).length, sinAsignarMw: ab.filter(function (t) { return t.mw_ticket && !t.tecnico_rut; }).length } : null; })(),
    fallas: (function () { try { return fallasAbiertas_(); } catch (e) { return []; } })(),
    mantenciones: (function () { try { return infraEstado_().filter(function (e) { return e.alerta; }).map(function (e) { return { nombre: e.nombre, tipo: e.tipo, alerta: e.alerta, dias: e.dias }; }); } catch (e) { return []; } })(),
    bajoMinimo: (function () { try { var sb = saldos_(); return inventario_(false).filter(function (i) { return i.minimo && (sb.bodega[i.codigo] || 0) < i.minimo; }).map(function (i) { return i.nombre; }); } catch (e) { return []; } })(),
    vencimientos: vencimientos_().slice(0, 8)
  };
  if (ROLES_GESTION.indexOf(u.rol) >= 0) {
    var pr = gastosPlanos_({ estado: 'Por rendir' });
    out.porRendir = { n: pr.length, monto: pr.reduce(function (a, L) { return a + L.monto; }, 0) };
  }
  return out;
}

/** ¿Se envían correos a los trabajadores? (Configuración → correo_tecnicos; NO = solo WhatsApp y la app). */
function correoTrab_() { return String(cfg_().correo_tecnicos || 'SI').toUpperCase() !== 'NO'; }
function avisarTecnico_(rut, id, t) {
  var u = rows_('USUARIOS').filter(function (x) { return normRut_(x.rut) === rut; })[0];
  if (!u || !u.email || !correoTrab_()) return;
  try {
    MailApp.sendEmail({
      to: u.email, subject: 'Nuevo ticket asignado ' + id + ' · ' + t.cliente,
      htmlBody: '<p>Hola ' + esc_(u.nombre) + ', tienes un nuevo trabajo:</p><p><b>' + id + '</b> · ' + esc_(t.tipo) + '<br>' +
        esc_(t.cliente) + '<br>' + esc_(t.direccion) + ' ' + esc_(t.comuna) + '<br>' + esc_(t.descripcion) +
        (t.prioridad === 'Urgente' ? '<br><b style="color:#c62828">URGENTE</b>' : '') +
        (t.fecha_programada ? '<br>Programado para: <b>' + esc_(f10_(t.fecha_programada)) + '</b>' : '') +
        (t.fecha_limite ? '<br>Plazo: <b>' + esc_(f10_(t.fecha_limite)) + '</b>' : '') + '</p>' +
        '<p>Recuerda completar la AST antes de iniciar: <a href="' + urlApp_() + '">abrir app</a></p>'
    });
  } catch (e) {}
}

/* ===================== PANEL: REGISTROS ===================== */

function apiRegistros(token, fl) {
  var uR = auth_(token, ROLES_PANEL);
  fl = fl || {};
  var out = rows_('REGISTROS').filter(function (r) {
    if (esConfidencial_(r.form_id) && uR.rol !== 'admin') return false;   // denuncias: solo el administrador
    var d = String(r.fecha).slice(0, 10);
    if (fl.desde && d < fl.desde) return false;
    if (fl.hasta && d > fl.hasta) return false;
    if (fl.form_id && r.form_id !== fl.form_id) return false;
    if (fl.tecnico_rut && normRut_(r.tecnico_rut) !== normRut_(fl.tecnico_rut)) return false;
    if (fl.ticket_id && r.ticket_id !== fl.ticket_id) return false;
    if (fl.soloAlertas && !(Number(r.n_alertas) > 0)) return false;
    return true;
  }).reverse().slice(0, 3000).map(function (r) {
    var o = lite_(r);
    if (fl.conDatos) { try { o.datos = JSON.parse(r.datos || '{}'); } catch (e) { o.datos = {}; } }
    return o;
  });
  return { registros: out, formularios: forms_(false).map(function (f) { return { id: f.id, nombre: f.nombre, codigo: f.codigo }; }), tecnicos: usuariosLite_() };
}

function apiRegistro(token, id) {
  var u = auth_(token);
  var r = rows_('REGISTROS').filter(function (x) { return x.id === id; })[0];
  if (!r) throw new Error('Registro no encontrado.');
  if (esConfidencial_(r.form_id) && u.rol !== 'admin' && normRut_(r.tecnico_rut) !== u.rut) throw new Error('Registro confidencial.');
  if (ROLES_PANEL.indexOf(u.rol) < 0 && normRut_(r.tecnico_rut) !== u.rut) throw new Error('Sin permiso.');
  var o = lite_(r);
  try { o.datos = JSON.parse(r.datos || '{}'); } catch (e) { o.datos = {}; }
  return { registro: o, form: forms_(false).filter(function (f) { return f.id === r.form_id; })[0] || null };
}

/* ===================== PANEL: VEHÍCULOS ===================== */

function normPat_(p) { return String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function flota_() {
  var sh = hoja_('VEHICULOS');
  if (!sh) return PATENTES_EMPRESA.map(function (p) { return { patente: p, activo: 'SI' }; });
  return rows_('VEHICULOS').map(function (v) { return { patente: normPat_(v.patente), marca: v.marca, modelo: v.modelo, anio: v.anio, activo: String(v.activo).toUpperCase() === 'NO' ? 'NO' : 'SI', obs: v.obs }; });
}
function patentesActivas_() { return flota_().filter(function (v) { return v.activo === 'SI'; }).map(function (v) { return v.patente; }); }
/** Las preguntas "patente" de todos los formularios usan la lista de vehículos activos. */
function conPatentes_(forms) {
  var act = patentesActivas_();
  forms.forEach(function (f) { itemsOf_(f).forEach(function (it) { if (it.id === 'patente') { it.tipo = 'opciones'; it.opciones = act; } }); });
  return forms;
}

/** v = {original?, patente, marca, modelo, anio, activo, obs}. Si cambia la patente, también corrige los registros. */
function apiGuardarVehiculo(token, v) {
  auth_(token, ROLES_EDITOR);
  var p = normPat_(v.patente), orig = normPat_(v.original);
  if (!/^[A-Z0-9]{5,8}$/.test(p)) throw new Error('Patente no válida (ej: LLWY41).');
  var filas = rows_('VEHICULOS'), ex = filas.filter(function (x) { return normPat_(x.patente) === (orig || p); })[0];
  if ((!orig || orig !== p) && filas.some(function (x) { return normPat_(x.patente) === p; })) throw new Error('La patente ' + p + ' ya existe.');
  var obj = { patente: p, marca: v.marca || '', modelo: v.modelo || '', anio: v.anio || '', activo: v.activo === 'NO' ? 'NO' : 'SI', obs: v.obs || '' };
  if (ex) update_('VEHICULOS', ex._row, obj); else { obj.creado = new Date(); append_('VEHICULOS', obj); }
  if (orig && orig !== p) corregirPatente_(orig, p);
  return apiVehiculos(token);
}

/** Cambia la patente en todos los registros (para patentes mal escritas). */
function corregirPatente_(de, a) {
  de = normPat_(de); a = normPat_(a);
  var n = 0;
  rows_('REGISTROS').forEach(function (r) {
    if (r.form_id !== 'BITACORA' && r.form_id !== 'VEHICULO') return;
    var d = json_(r.datos, {});
    if (normPat_(d.patente) !== de) return;
    d.patente = a;
    update_('REGISTROS', r._row, { datos: JSON.stringify(d) });
    n++;
  });
  return n;
}
function apiCorregirPatente(token, de, a) {
  auth_(token, ROLES_EDITOR);
  if (!a) throw new Error('Elige la patente correcta.');
  corregirPatente_(de, a);
  return apiVehiculos(token);
}

function apiVehiculos(token) {
  auth_(token, ROLES_PANEL);
  var flota = flota_(), patentes = flota.map(function (v) { return v.patente; }), desconocidas = [];
  var regs = [];
  rows_('REGISTROS').forEach(function (r) {
    if (r.form_id !== 'BITACORA' && r.form_id !== 'VEHICULO') return;
    var d = {};
    try { d = JSON.parse(r.datos || '{}'); } catch (e) {}
    if (!d.patente) return;
    var p = normPat_(d.patente);
    if (patentes.indexOf(p) < 0 && desconocidas.indexOf(p) < 0) desconocidas.push(p);
    regs.push({
      id: r.id, fecha: r.fecha, form_id: r.form_id, patente: p, tecnico: r.tecnico_nombre,
      conductor: d.conductor || r.tecnico_nombre, tipo: r.form_id === 'VEHICULO' ? 'Checklist de vehículo' : (d.tipo_reg || ''),
      km: Number(d.km) || '', litros: Number(d.litros) || '', monto: Number(d.monto_comb || d.rt_monto || d.mant_monto || d.doc_monto) || '',
      rt_vence: d.rt_vence || '', rt_resultado: d.rt_resultado || '', soap_vence: d.soap_vence || '', permiso_vence: d.permiso_vence || '',
      prox_km: Number(d.mant_prox_km) || '', detalle: d.mant_detalle || d.inc_detalle || d.estado_entrega || d.obs || '',
      entrega: d.entrega || '', n_alertas: Number(r.n_alertas) || 0, alertas: r.alertas, pdf_url: r.pdf_url
    });
  });
  return { patentes: patentes.filter(function (p) { return flota.filter(function (v) { return v.patente === p; })[0].activo === 'SI'; }).concat(desconocidas),
    flota: flota, desconocidas: desconocidas, registros: regs.reverse(), hoy: fmt_(new Date(), 'yyyy-MM-dd') };
}

/* ===================== PANEL: GASTOS Y ASIENTOS ===================== */

// Cuentas contables (ajústalas a tu plan de cuentas)
var CUENTAS_GASTO = {
  'Combustible': 'Combustibles y lubricantes', 'Peaje / TAG': 'Peajes y estacionamientos',
  'Estacionamiento': 'Peajes y estacionamientos', 'Colación': 'Alimentación y colaciones',
  'Materiales': 'Materiales e insumos', 'Herramientas': 'Herramientas menores',
  'Alojamiento': 'Viáticos y alojamiento', 'Otro': 'Gastos generales'
};
var CUENTAS_PAGO = {
  'Tarjeta empresa': 'Banco (tarjeta empresa)', 'Transferencia empresa': 'Banco', 'Efectivo': 'Caja',
  'Fondo por rendir': 'Fondos por rendir', 'Cuenta propia del colaborador': 'Cuentas por pagar colaboradores', 'Caja chica': 'Caja chica'
};
var CUENTA_IVA = 'IVA crédito fiscal';

function gastosPlanos_(fl) {
  fl = fl || {};
  var out = [];
  rows_('REGISTROS').forEach(function (r) {
    if (r.form_id !== 'GASTOS') return;
    var d = String(r.fecha).slice(0, 10);
    if (fl.desde && d < fl.desde) return;
    if (fl.hasta && d > fl.hasta) return;
    if (fl.tecnico_rut && normRut_(r.tecnico_rut) !== normRut_(fl.tecnico_rut)) return;
    var datos = {};
    try { datos = JSON.parse(r.datos || '{}'); } catch (e) {}
    (datos.gastos || []).forEach(function (g, i) {
      var monto = Math.round(Number(g.monto) || 0), fac = g.tipo_doc === 'Factura';
      var neto = fac ? Math.round(monto / 1.19) : monto;
      var L = {
        fecha: String(r.fecha).slice(0, 16), registro: r.id, linea: i + 1, colaborador: r.tecnico_nombre, rut_colaborador: r.tecnico_rut,
        ticket: r.ticket_id || '', tipo: g.tipo || '', detalle: g.detalle || '', tipo_doc: g.tipo_doc || '', doc: g.doc || '',
        rut_prov: g.rut_prov || '', razon: g.razon || '', medio: g.medio || '', origen: g.origen || '',
        pendiente: g.pendiente === 'Sí' ? 'Sí' : 'No', neto: neto, iva: monto - neto, monto: monto, pdf_url: r.pdf_url,
        estado: g.estado || 'Por rendir', fecha_rendido: g.fecha_rendido || '', rendido_por: g.rendido_por || '', nota: g.nota || '',
        comprobantes: g.comprobantes || []
      };
      if (fl.origen && L.origen !== fl.origen) return;
      if (fl.estado && L.estado !== fl.estado) return;
      if (fl.soloPendientes && L.pendiente !== 'Sí') return;
      out.push(L);
    });
  });
  return out.sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; });
}

function fondosFiltrados_(fl) {
  fl = fl || {};
  return rows_('FONDOS').filter(function (x) {
    var d = f10_(x.fecha);
    return (!fl.desde || d >= fl.desde) && (!fl.hasta || d <= fl.hasta) && (!fl.tecnico_rut || normRut_(x.rut) === normRut_(fl.tecnico_rut));
  });
}
function asientos_(lineas, fondos) {
  var a = [], n = 0;
  (fondos || []).forEach(function (x) {
    n++;
    var g = 'Entrega de fondo por rendir a ' + x.nombre + (x.obs ? ' · ' + x.obs : '');
    a.push({ n: n, fecha: f10_(x.fecha), cuenta: 'Fondos por rendir', glosa: g, debe: Number(x.monto) || 0, haber: 0 });
    a.push({ n: n, fecha: f10_(x.fecha), cuenta: CUENTAS_PAGO[x.medio] || 'Banco', glosa: g, debe: 0, haber: Number(x.monto) || 0 });
  });
  lineas.forEach(function (L) {
    n++;
    var f = L.fecha.slice(0, 10);
    var glosa = [L.tipo, L.detalle, L.razon, (L.tipo_doc + ' ' + L.doc).trim(), L.colaborador].filter(String).join(' · ') + (L.pendiente === 'Sí' ? ' · DOC. PENDIENTE' : '');
    a.push({ n: n, fecha: f, cuenta: CUENTAS_GASTO[L.tipo] || 'Gastos generales', glosa: glosa, debe: L.neto, haber: 0 });
    if (L.iva) a.push({ n: n, fecha: f, cuenta: CUENTA_IVA, glosa: glosa, debe: L.iva, haber: 0 });
    a.push({ n: n, fecha: f, cuenta: CUENTAS_PAGO[L.medio] || 'Fondos por rendir', glosa: glosa, debe: 0, haber: L.monto });
  });
  return a;
}

function apiGastos(token, fl) {
  auth_(token, ROLES_GESTION);
  var lineas = gastosPlanos_(fl);
  var fondos = (fl && (fl.estado || fl.origen || fl.soloPendientes)) ? [] : fondosFiltrados_(fl);
  return { lineas: lineas, asientos: asientos_(lineas, fondos), tecnicos: usuariosLite_() };
}

var COLS_GASTOS = [['fecha', 'Fecha'], ['registro', 'N° registro'], ['colaborador', 'Colaborador'], ['rut_colaborador', 'RUT colaborador'],
  ['ticket', 'Ticket'], ['tipo', 'Tipo de gasto'], ['detalle', 'Detalle'], ['tipo_doc', 'Tipo doc.'], ['doc', 'N° doc.'],
  ['rut_prov', 'RUT proveedor'], ['razon', 'Razón social'], ['medio', 'Medio de pago'], ['origen', 'Origen fondos'],
  ['pendiente', 'Doc. pendiente'], ['estado', 'Estado'], ['fecha_rendido', 'Fecha rendición'], ['rendido_por', 'Rendido por'],
  ['nota', 'Nota'], ['comprobantes', 'Comprobantes de rendición'], ['neto', 'Neto'], ['iva', 'IVA'], ['monto', 'Total']];

/**
 * Cambia el estado de uno o varios gastos (Por rendir / Rendido), marca documentos recibidos
 * y corrige datos del documento. items = [{registro, linea}], cambios = {estado, pendiente, tipo_doc, doc, rut_prov, razon, nota}
 */
function apiActualizarGastos(token, items, cambios, fl, archivos) {
  var u = auth_(token, ROLES_GESTION);
  // Comprobantes (foto o PDF de la transferencia / pago): se guardan una vez y se enlazan a cada gasto
  var urls = [];
  if (archivos && archivos.length) {
    var dest = carpetaDe_('gastos', fmt_(new Date(), 'yyyy-MM'), 'Comprobantes de pago');
    archivos.forEach(function (a, i) {
      var ok = /^image\//.test(a.mime) || a.mime === 'application/pdf';
      if (!ok) throw new Error('Solo se aceptan fotos o PDF.');
      var nombre = 'Comprobante_' + fmt_(new Date(), 'yyyyMMdd_HHmmss') + '_' + (i + 1) + '_' + String(a.nombre || '').replace(/[^\w.\-]/g, '_').slice(-60);
      urls.push(dest.createFile(Utilities.newBlob(Utilities.base64Decode(a.data), a.mime, nombre)).getUrl());
    });
  }
  var permitidos = ['estado', 'pendiente', 'tipo_doc', 'doc', 'rut_prov', 'razon', 'nota'];
  var gf = forms_(false).filter(function (f) { return f.id === 'GASTOS'; })[0];
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); fresco_();
  try {
    var porReg = {};
    (items || []).forEach(function (it) { (porReg[it.registro] = porReg[it.registro] || []).push(Number(it.linea)); });
    rows_('REGISTROS').forEach(function (r) {
      if (!porReg[r.id]) return;
      var datos = {};
      try { datos = JSON.parse(r.datos || '{}'); } catch (e) { return; }
      porReg[r.id].forEach(function (ln) {
        var g = (datos.gastos || [])[ln - 1];
        if (!g) return;
        permitidos.forEach(function (k) { if (cambios.hasOwnProperty(k) && cambios[k] !== undefined) g[k] = String(cambios[k]); });
        if (cambios.estado === 'Rendido' && !g.fecha_rendido) { g.fecha_rendido = fmt_(new Date(), 'yyyy-MM-dd HH:mm'); g.rendido_por = u.nombre; }
        if (cambios.estado === 'Por rendir') { g.fecha_rendido = ''; g.rendido_por = ''; }
        if (urls.length) g.comprobantes = (g.comprobantes || []).concat(urls);
      });
      var ev = gf ? evalua_(gf, datos) : { alertas: [] };
      update_('REGISTROS', r._row, { datos: JSON.stringify(datos), n_alertas: ev.alertas.length, alertas: ev.alertas.join(' | ') });
    });
  } finally { lock.releaseLock(); }
  return apiGastos(token, fl);
}

/** Crea una planilla con los gastos y los asientos, la guarda en Drive y la devuelve como Excel o PDF. */
function apiExportGastos(token, fl, formato) {
  auth_(token, ROLES_GESTION);
  fl = fl || {};
  var lineas = gastosPlanos_(fl), as = asientos_(lineas, (fl.estado || fl.origen || fl.soloPendientes) ? [] : fondosFiltrados_(fl));
  if (!lineas.length) throw new Error('No hay gastos en ese período.');
  var carpeta = carpetaDe_('sistema', 'Planillas exportadas');
  var nombre = 'Gastos_' + (fl.desde || 'inicio') + '_a_' + (fl.hasta || fmt_(new Date(), 'yyyy-MM-dd'));
  var ss = SpreadsheetApp.create(nombre);
  DriveApp.getFileById(ss.getId()).moveTo(carpeta);

  var h1 = ss.getSheets()[0].setName('Gastos');
  var datos = [COLS_GASTOS.map(function (c) { return c[1]; })].concat(lineas.map(function (L) {
    return COLS_GASTOS.map(function (c) { var v = L[c[0]]; return limpia_(Array.isArray(v) ? v.join(' ') : v); });
  }));
  var tot = lineas.reduce(function (a, L) { a[0] += L.neto; a[1] += L.iva; a[2] += L.monto; return a; }, [0, 0, 0]);
  var filaTot = COLS_GASTOS.map(function () { return ''; });
  var iN = COLS_GASTOS.length - 3;
  filaTot[0] = 'TOTAL'; filaTot[iN] = tot[0]; filaTot[iN + 1] = tot[1]; filaTot[iN + 2] = tot[2];
  datos.push(filaTot);
  h1.getRange(1, 1, datos.length, COLS_GASTOS.length).setValues(datos);
  h1.getRange(1, 1, 1, COLS_GASTOS.length).setFontWeight('bold').setBackground('#23306b').setFontColor('#ffffff');
  h1.getRange(datos.length, 1, 1, COLS_GASTOS.length).setFontWeight('bold');
  h1.getRange(2, iN + 1, datos.length - 1, 3).setNumberFormat('$#,##0');
  h1.setFrozenRows(1);

  var h2 = ss.insertSheet('Asientos');
  var d2 = [['N° asiento', 'Fecha', 'Cuenta', 'Glosa', 'Debe', 'Haber']].concat(as.map(function (x) {
    return [x.n, x.fecha, x.cuenta, limpia_(x.glosa), x.debe || '', x.haber || ''];
  }));
  var td = as.reduce(function (a, x) { a[0] += x.debe; a[1] += x.haber; return a; }, [0, 0]);
  d2.push(['', '', 'TOTALES', '', td[0], td[1]]);
  h2.getRange(1, 1, d2.length, 6).setValues(d2);
  h2.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#23306b').setFontColor('#ffffff');
  h2.getRange(d2.length, 1, 1, 6).setFontWeight('bold');
  h2.getRange(2, 5, d2.length - 1, 2).setNumberFormat('$#,##0');
  h2.setFrozenRows(1);
  try { h1.autoResizeColumns(1, COLS_GASTOS.length); h2.autoResizeColumns(1, 6); } catch (e) {}
  SpreadsheetApp.flush();

  var pdf = formato === 'pdf';
  var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=' +
    (pdf ? 'pdf&portrait=false&fitw=true&size=letter&gridlines=false&sheetnames=true&printtitle=true' : 'xlsx');
  var blob = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob()
    .setName(nombre + (pdf ? '.pdf' : '.xlsx'));
  var archivo = carpeta.createFile(blob);
  return {
    nombre: blob.getName(), mime: pdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    data: Utilities.base64Encode(blob.getBytes()), url: archivo.getUrl(), planilla: ss.getUrl()
  };
}

/** Ejecútala una vez desde el editor para dar el permiso de exportar a Excel/PDF. */
function autorizar() {
  UrlFetchApp.fetch('https://www.google.com', { muteHttpExceptions: true });
  Logger.log('Permisos OK');
}

/* ===================== PERSONAS: DOCUMENTOS, CURSOS, ENTREGAS, FONDOS ===================== */

function hoy_() { return fmt_(new Date(), 'yyyy-MM-dd'); }
function f10_(v) { return String(v || '').slice(0, 10); }
function sumaMeses_(f, m) { var d = new Date(f10_(f) + 'T12:00:00'); d.setMonth(d.getMonth() + Number(m)); return fmt_(d, 'yyyy-MM-dd'); }
function diasHasta_(f) { return Math.round((new Date(f10_(f) + 'T12:00:00') - new Date(hoy_() + 'T12:00:00')) / 864e5); }
function estadoVence_(f) { if (!f10_(f)) return 'sin_vencimiento'; var d = diasHasta_(f); return d < 0 ? 'vencido' : d <= 30 ? 'por_vencer' : 'vigente'; }
function json_(s, def) { try { return s ? JSON.parse(s) : def; } catch (e) { return def; } }
function nuevoId_(pre) { return pre + fmt_(new Date(), 'yyMMddHHmmss') + Utilities.getUuid().replace(/-/g, '').slice(0, 5).toUpperCase(); }
function personas_() { return usuariosLite_().filter(function (x) { return /-/.test(x.rut); }); }
function persona_(rut) { return usuariosLite_().filter(function (x) { return x.rut === normRut_(rut); })[0]; }

function carpetaTrabajador_(rut, nombre) {
  return carpetaDe_('personal', nombre + ' - ' + normRut_(rut));
}
function guardarArchivo_(folder, a, prefijo) {
  if (!a || !a.data) throw new Error('Falta el archivo.');
  if (!/^image\//.test(a.mime) && a.mime !== 'application/pdf') throw new Error('Solo se aceptan fotos o PDF.');
  var ext = a.mime === 'application/pdf' ? '.pdf' : a.mime === 'image/png' ? '.png' : '.jpg';
  var nombre = prefijo + '_' + fmt_(new Date(), 'yyyyMMdd_HHmmss') + ext;
  return folder.createFile(Utilities.newBlob(Utilities.base64Decode(a.data), a.mime, nombre)).getUrl();
}

function cursos_(todos) {
  return rows_('CURSOS').filter(function (c) { return todos || String(c.activo).toUpperCase() !== 'NO'; })
    .map(function (c) { return { id: c.id, nombre: c.nombre, horas: c.horas, vigencia_meses: Number(c.vigencia_meses) || 0, aplica: c.aplica || 'todos', base: c.base, activo: c.activo, orden: Number(c.orden) || 99 }; })
    .sort(function (a, b) { return a.orden - b.orden; });
}

/** Estado de cada curso para cada persona, usando capacitaciones registradas y certificados subidos. */
function matrizCursos_(personas, cursos) {
  var ult = {};
  function marca(rut, cid, fecha, fuente, revisar) {
    rut = normRut_(rut); fecha = f10_(fecha);
    if (!rut || !cid || !fecha) return;
    ult[rut] = ult[rut] || {};
    if (!ult[rut][cid] || ult[rut][cid].fecha < fecha) ult[rut][cid] = { fecha: fecha, fuente: fuente, revisar: !!revisar };
  }
  rows_('CAPACITACIONES').forEach(function (c) {
    json_(c.asistentes, []).forEach(function (a) { if (a.firma_url || c.acta_url) marca(a.rut, c.curso_id, c.fecha, 'Capacitación ' + f10_(c.fecha)); });
  });
  rows_('DOCUMENTOS').forEach(function (d) {
    if (d.categoria === 'curso' && d.estado !== 'Rechazado')
      marca(d.rut, d.curso_id, d.fecha_emision || d.fecha, d.url ? 'Certificado' : 'Marcado como realizado', d.estado !== 'Aprobado');
  });
  var out = {};
  personas.forEach(function (p) {
    out[p.rut] = {};
    cursos.forEach(function (c) {
      var u = (ult[p.rut] || {})[c.id];
      if (!u) { out[p.rut][c.id] = { estado: c.aplica === 'opcional' ? 'no_aplica' : 'falta' }; return; }
      var vence = c.vigencia_meses ? sumaMeses_(u.fecha, c.vigencia_meses) : '';
      out[p.rut][c.id] = { estado: vence ? estadoVence_(vence) : 'vigente', fecha: u.fecha, vence: vence, fuente: u.fuente, revisar: u.revisar };
    });
  });
  return out;
}

function pendientesFirma_(rut) {
  rut = normRut_(rut);
  var out = [];
  rows_('CAPACITACIONES').forEach(function (c) {
    json_(c.asistentes, []).forEach(function (a) {
      if (normRut_(a.rut) === rut && !a.firma_url) out.push({ tipo: 'cap', id: c.id, titulo: c.curso_nombre, fecha: f10_(c.fecha),
        detalle: [c.horas ? c.horas + ' h' : '', c.relator ? 'Relator: ' + c.relator : '', c.lugar].filter(String).join(' · '), temario: c.temario, acta_url: c.acta_url });
    });
  });
  rows_('ACTIVIDADES').forEach(function (a) {
    json_(a.asistentes, []).forEach(function (x) {
      if (normRut_(x.rut) === rut && !x.firma_url) out.push({ tipo: 'act', id: a.id, titulo: a.tipo, fecha: f10_(a.fecha), uv: nivelUV_(a.indice_uv), prevencion: a.prevencion || '',
        charla: a.charla_id ? charlaPublica_(a.charla_id) : null,
        detalle: [a.hora_inicio ? a.hora_inicio + (a.hora_fin ? '–' + a.hora_fin : '') : '', a.lugar, 'Realizada por ' + a.realizada_por].filter(String).join(' · '),
        acuerdos: json_(a.acuerdos, []) });
    });
  });
  rows_('BIBLIOTECA').forEach(function (b) {
    if (String(b.activo).toUpperCase() === 'NO') return;
    json_(b.asistentes, []).forEach(function (x) {
      if (normRut_(x.rut) === rut && !x.firma_url) out.push({ tipo: 'doc', id: b.id, titulo: 'Leer y firmar: ' + b.titulo, fecha: f10_(b.fecha),
        detalle: b.categoria + (b.version ? ' · versión ' + b.version : ''), url: b.url });
    });
  });
  rows_('PRESTAMOS').forEach(function (p) {
    if (normRut_(p.rut) === rut && !p.firma_url && !p.fecha_devolucion) out.push({ tipo: 'pre', id: p.id, titulo: 'Préstamo: ' + p.activo, fecha: f10_(p.fecha_entrega),
      detalle: 'Entregado por ' + p.entregado_por + ' · estado ' + (p.estado_salida || 'Bueno') + (p.obs_salida ? ' · ' + p.obs_salida : '') });
  });
  rows_('ENTREGAS').forEach(function (e) {
    if (normRut_(e.rut) === rut && e.estado !== 'Firmada') out.push({ tipo: 'ent', id: e.id, titulo: 'Entrega de ' + (e.motivo || 'elementos').toLowerCase(),
      fecha: f10_(e.fecha), detalle: 'Entregado por ' + e.entregado_por, items: json_(e.items, []), obs: e.obs });
  });
  return out;
}

function saldoFondo_(rut) {
  rut = normRut_(rut);
  var entregado = 0, rendido = 0;
  rows_('FONDOS').forEach(function (f) { if (normRut_(f.rut) === rut) entregado += Number(f.monto) || 0; });
  if (!entregado) return null;
  gastosPlanos_({ tecnico_rut: rut }).forEach(function (L) { if (L.medio === 'Fondo por rendir') rendido += L.monto; });
  return { entregado: entregado, rendido: rendido, saldo: entregado - rendido };
}

function docsLite_(d) {
  return { id: d.id, fecha: f10_(d.fecha), rut: d.rut, nombre: d.nombre, categoria: d.categoria, tipo: d.tipo, curso_id: d.curso_id, descripcion: d.descripcion,
    fecha_emision: f10_(d.fecha_emision), fecha_vence: f10_(d.fecha_vence), url: d.url, estado: d.estado, subido_por: d.subido_por, obs: d.obs,
    vence_estado: estadoVence_(d.fecha_vence) };
}
function entregaLite_(e) {
  return { id: e.id, fecha: f10_(e.fecha), rut: e.rut, nombre: e.nombre, motivo: e.motivo, items: json_(e.items, []), obs: e.obs,
    entregado_por: e.entregado_por, estado: e.estado, fecha_firma: e.fecha_firma, pdf_url: e.pdf_url, firma_url: e.firma_url,
    firma_empleador: e.firma_empleador_url ? 'propia' : 'guardada', firmado_empleador_por: e.firmado_empleador_por || '' };
}

/* ---------- App técnico: perfil ---------- */

function apiPerfil(token) {
  var u = auth_(token);
  var cursos = cursos_(), yo = persona_(u.rut) || { rut: u.rut, nombre: u.nombre, cargo: u.cargo };
  var m = matrizCursos_([yo], cursos)[yo.rut] || {};
  return {
    user: u, cursos: cursos.map(function (c) { var x = m[c.id] || {}; return { id: c.id, nombre: c.nombre, horas: c.horas, base: c.base, estado: x.estado, fecha: x.fecha, vence: x.vence, revisar: x.revisar, fuente: x.fuente }; }),
    documentos: rows_('DOCUMENTOS').filter(function (d) { return normRut_(d.rut) === u.rut; }).map(docsLite_).reverse(),
    entregas: rows_('ENTREGAS').filter(function (e) { return normRut_(e.rut) === u.rut; }).map(entregaLite_).reverse(),
    pendientes: pendientesFirma_(u.rut), fondo: saldoFondo_(u.rut), tiposDocumento: TIPOS_DOCUMENTO,
    biblioteca: rows_('BIBLIOTECA').filter(function (b) { return String(b.activo).toUpperCase() !== 'NO' && String(b.publico).toUpperCase() === 'SI'; })
      .map(function (b) { var a = json_(b.asistentes, []).filter(function (x) { return normRut_(x.rut) === u.rut; })[0];
        return { titulo: b.titulo, categoria: b.categoria, version: b.version, url: b.url, firmado: a ? !!a.firma_url : null }; }).reverse()
  };
}

/** d = {rut?, tipo, curso_id, fecha_emision, fecha_vence, descripcion}. El técnico sube para sí; admin/editor para cualquiera. */
function apiSubirDocumento(token, d, archivo) {
  var u = auth_(token);
  var admin = ROLES_EDITOR.indexOf(u.rol) >= 0;
  var p = d.rut && admin ? persona_(d.rut) : { rut: u.rut, nombre: u.nombre };
  if (!p) throw new Error('Trabajador no encontrado.');
  if (!d.tipo) throw new Error('Elige el tipo de documento.');
  var esCurso = d.tipo === 'Certificado de curso';
  if (esCurso && !d.curso_id) throw new Error('Elige a qué curso corresponde el certificado.');
  var vence = d.fecha_vence || '';
  if (esCurso && !vence && d.fecha_emision) {
    var c = cursos_(true).filter(function (x) { return x.id === d.curso_id; })[0];
    if (c && c.vigencia_meses) vence = sumaMeses_(d.fecha_emision, c.vigencia_meses);
  }
  var url = guardarArchivo_(carpetaTrabajador_(p.rut, p.nombre), archivo, String(d.tipo).replace(/[^\wáéíóúñÁÉÍÓÚÑ]+/g, '_'));
  append_('DOCUMENTOS', { id: nuevoId_('D'), fecha: new Date(), rut: p.rut, nombre: p.nombre, categoria: esCurso ? 'curso' : 'documento',
    tipo: d.tipo, curso_id: esCurso ? d.curso_id : '', descripcion: d.descripcion || '', fecha_emision: d.fecha_emision || '',
    fecha_vence: vence, horas: d.horas || '', url: url, subido_por: u.nombre, estado: admin ? 'Aprobado' : 'Por revisar', obs: '' });
  return admin && d.rut ? apiPersonas(token) : apiPerfil(token);
}

/**
 * Marca un curso como realizado. c = {rut?, curso_id, fecha, institucion, horas}. archivo (certificado) es opcional.
 * Si lo marca el trabajador queda "Por revisar"; si lo marca admin/editor queda aprobado.
 */
function apiMarcarCurso(token, c, archivo) {
  var u = auth_(token);
  var admin = ROLES_EDITOR.indexOf(u.rol) >= 0;
  var p = c.rut && admin ? persona_(c.rut) : { rut: u.rut, nombre: u.nombre };
  if (!p) throw new Error('Trabajador no encontrado.');
  var curso = cursos_(true).filter(function (x) { return x.id === c.curso_id; })[0];
  if (!curso) throw new Error('Curso no encontrado.');
  if (!c.fecha) throw new Error('Indica la fecha en que lo hiciste.');
  if (c.fecha > hoy_()) throw new Error('La fecha no puede ser futura.');
  var url = archivo && archivo.data ? guardarArchivo_(carpetaTrabajador_(p.rut, p.nombre), archivo, 'Certificado_' + curso.id) : '';
  append_('DOCUMENTOS', { id: nuevoId_('D'), fecha: new Date(), rut: p.rut, nombre: p.nombre, categoria: 'curso', tipo: 'Certificado de curso',
    curso_id: curso.id, descripcion: curso.nombre + (c.institucion ? ' · ' + c.institucion : ''), fecha_emision: c.fecha,
    fecha_vence: curso.vigencia_meses ? sumaMeses_(c.fecha, curso.vigencia_meses) : '', horas: c.horas || '', url: url,
    subido_por: u.nombre, estado: admin ? 'Aprobado' : 'Por revisar', obs: url ? '' : 'Sin certificado adjunto' });
  if (admin && c.rut) return c.volver === 'cap' ? apiCapacitaciones(token) : apiPersonas(token);
  return apiPerfil(token);
}

function apiCambiarPin(token, actual, nuevo) {
  var u = auth_(token);
  if (!/^\d{4,8}$/.test(String(nuevo))) throw new Error('El PIN nuevo debe tener entre 4 y 8 números.');
  var row = rows_('USUARIOS').filter(function (x) { return normRut_(x.rut) === u.rut; })[0];
  if (!row || row.pin_hash !== hash_(actual)) throw new Error('El PIN actual no es correcto.');
  if (pinDebil_(row, u.rut, String(nuevo))) throw new Error('Ese PIN es muy fácil de adivinar (1234, números repetidos o el inicio de tu RUT). Elige otro.');
  update_('USUARIOS', row._row, { pin_hash: hash_(nuevo) });
  return true;
}

var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
function rutPuntos_(r) { var m = normRut_(r).match(/^(\d+)-([\dK])$/); return m ? m[1].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + m[2] : String(r || ''); }
function fechaLarga_(f) { f = f10_(f); return f ? Number(f.slice(8, 10)) + ' de ' + MESES[Number(f.slice(5, 7)) - 1] + ' de ' + f.slice(0, 4) : ''; }

/** Documento "Entrega de Implementos de Trabajo" con firma del trabajador y del empleador. */
function htmlEntrega_(e, firmaData, c) {
  var it = json_(e.items, []), p = persona_(e.rut) || {};
  var esMat = function (x) { return x.tipo === 'Material de operación'; }, hayMat = it.some(esMat), soloMat = it.length && it.every(esMat);
  var firmaEmp = e.firma_empleador_url ? firmaDataUri_(e.firma_empleador_url) : (c.firma_empleador ? firmaDataUri_(c.firma_empleador) : '');
  var quienEmp = e.firmado_empleador_por || c.representante;
  var linea = function (img) { return '<div style="height:72px;text-align:center">' + (img ? '<img src="' + img + '" style="height:66px">' : '&nbsp;') + '</div><div style="border-top:1px solid #000;margin:0 14px 4px"></div>'; };
  return '<html><head><meta charset="utf-8"><style>body{font-family:Arial;font-size:13px;line-height:1.55;margin:30px 50px}h2{text-decoration:underline;margin:24px 0 14px;font-size:16px}' +
    'td{vertical-align:top}</style></head><body>' +
    '<div style="text-align:right">' + logoImg_(80) + '</div>' +
    '<p style="text-align:right;margin-top:24px">' + esc_(c.ciudad || '') + ' ' + fechaLarga_(e.fecha) + '</p>' +
    (soloMat ? '<h2>Entrega de Materiales de Operación</h2><p>Por intermedio de la presente se deja constancia de la entrega de los siguientes materiales de operación:</p><ul>'
      : '<h2>Entrega de Implementos de Trabajo</h2><p>Por intermedio de la presente se deja constancia de la entrega de implementos de trabajo consistentes en:</p><ul>') +
    it.map(function (x) { return '<li>' + esc_(('0' + (x.cantidad || 1)).slice(-2)) + (x.unidad && x.unidad !== 'unidad' ? ' ' + esc_(x.unidad) + (Number(x.cantidad) > 1 ? 's' : '') + ' de' : '') + ' ' + esc_(x.elemento) + (x.talla ? ' (talla ' + esc_(x.talla) + ')' : '') + (x.codigo ? ' <small>[' + esc_(x.codigo) + ']</small>' : '') + '</li>'; }).join('') + '</ul>' +
    (e.motivo ? '<p><b>Motivo:</b> ' + esc_(e.motivo) + (e.obs ? ' · ' + esc_(e.obs) : '') + '</p>' : '') +
    (hayMat ? '<p>Los materiales de operación son para uso exclusivo en los trabajos de la empresa. El trabajador debe registrar en cada orden de trabajo lo que utiliza y devolver a bodega lo que no use.</p>' : '') +
    (soloMat ? '' : '<p>La entrega de los materiales de trabajo es de <b>“uso obligatorio y personal”</b> del trabajador, siendo éste responsable del buen uso y conservación de los mismos. ' +
    'Todo defecto o deterioro deberá ser comunicado de inmediato al encargado, quien procederá al reemplazo.</p>' +
    '<p>En caso de mal uso o maltrato del equipo, el trabajador asumirá los gastos de reparación o reposición, según sea el caso.</p>') +
    '<p style="margin-top:24px"><b>Recibo conforme.</b></p>' +
    '<table style="width:100%;margin-top:30px;text-align:center"><tr><td style="width:50%">' + linea(firmaData) + esc_(e.nombre) + '<br>RUT: ' + esc_(rutPuntos_(e.rut)) + '<br><small>' + esc_(p.cargo || 'Trabajador') + '</small></td>' +
    '<td style="width:50%">' + linea(firmaEmp) + esc_(c.razon_social || c.empresa) + '<br>RUT: ' + esc_(c.rut_empresa || '') + (quienEmp ? '<br><small>' + esc_(quienEmp) + '</small>' : '') + '</td></tr></table>' +
    '<p style="color:#777;font-size:10px;margin-top:40px">Firmado electrónicamente el ' + fmt_(new Date(), 'dd-MM-yyyy HH:mm') + ' · Entregado por ' + esc_(e.entregado_por) + ' · Registro ' + esc_(e.id) + '</p></body></html>';
}

/** El trabajador firma una capacitación (tipo 'cap') o una entrega (tipo 'ent'). */
function firmar_(p, tipo, id, firmaB64) {
  if (!firmaB64) throw new Error('Falta la firma.');
  if (tipo === 'pre') return firmarPrestamo_(p, id, firmaB64);
  var folder = carpetaTrabajador_(p.rut, p.nombre);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); fresco_();
  try {
    var firmaUrl = guardarArchivo_(folder, { mime: 'image/png', data: firmaB64 }, 'Firma_' + tipo + '_' + id);
    if (tipo === 'cap' || tipo === 'act' || tipo === 'doc') {
      var hoja = tipo === 'cap' ? 'CAPACITACIONES' : tipo === 'act' ? 'ACTIVIDADES' : 'BIBLIOTECA';
      var c = rows_(hoja).filter(function (x) { return x.id === id; })[0];
      if (!c) throw new Error('Registro no encontrado.');
      var as = json_(c.asistentes, []), ok = false;
      as.forEach(function (a) { if (normRut_(a.rut) === p.rut) { a.firma_url = firmaUrl; a.fecha_firma = fmt_(new Date(), 'yyyy-MM-dd HH:mm'); ok = true; } });
      if (!ok) throw new Error(p.nombre + ' no figura como asistente.');
      update_(hoja, c._row, { asistentes: JSON.stringify(as) });
    } else {
      var e = rows_('ENTREGAS').filter(function (x) { return x.id === id; })[0];
      if (!e || normRut_(e.rut) !== p.rut) throw new Error('Entrega no encontrada.');
      var pdf = Utilities.newBlob(htmlEntrega_(e, 'data:image/png;base64,' + firmaB64, cfg_()), 'text/html', 'e.html').getAs('application/pdf')
        .setName('Entrega_' + f10_(e.fecha) + '_' + p.nombre.replace(/\s+/g, '_') + '.pdf');
      var pdfUrl = sub_(folder, 'ENTREGAS').createFile(pdf).getUrl();
      update_('ENTREGAS', e._row, { estado: 'Firmada', firma_url: firmaUrl, fecha_firma: fmt_(new Date(), 'yyyy-MM-dd HH:mm'), pdf_url: pdfUrl });
    }
  } finally { lock.releaseLock(); }
}
/** El trabajador firma desde su celular. */
function apiFirmar(token, tipo, id, firmaB64, respuesta) {
  var u = auth_(token), res = null;
  if (tipo === 'act') res = responderCharla_(u, id, respuesta);   // valida la respuesta antes de guardar la firma
  firmar_({ rut: u.rut, nombre: u.nombre }, tipo, id, firmaB64);
  if (res && res.guardar) { append_('RESP_CHARLAS', res.guardar); delete res.guardar; }
  var p = apiPerfil(token); if (res) p.respuestaCharla = res;
  return p;
}
/** Firma presencial: el trabajador firma en el equipo del panel (charla, capacitación o entrega). */
function apiFirmarPresencial(token, tipo, id, rut, firmaB64) {
  auth_(token, ROLES_PANEL);
  var p = persona_(rut);
  if (!p) throw new Error('Trabajador no encontrado.');
  firmar_(p, tipo, id, firmaB64);
  return true;
}
/** Guarda la firma del empleador (se usa en todas las entregas y actas). */
function apiFirmaEmpleador(token, firmaB64) {
  auth_(token, ['admin']);
  var url = guardarArchivo_(carpetaDe_('sistema', 'Firmas del empleador'), { mime: 'image/png', data: firmaB64 }, 'Firma_empleador');
  var r = rows_('CONFIG').filter(function (x) { return x.clave === 'firma_empleador'; })[0];
  if (r) sh_('CONFIG').getRange(r._row, 2).setValue(url); else sh_('CONFIG').appendRow(['firma_empleador', url, 'Firma del empleador (no editar)']);
  return apiConfig(token);
}

/* ---------- Panel: personas ---------- */

function apiPersonas(token) {
  auth_(token, ROLES_EDITOR);
  var per = personas_(), cursos = cursos_();
  var docs = rows_('DOCUMENTOS').map(docsLite_), ents = rows_('ENTREGAS').map(entregaLite_);
  return { personas: per, cursos: cursos, matriz: matrizCursos_(per, cursos), documentos: docs.reverse(), entregas: ents.reverse(),
    pendientes: per.reduce(function (o, p) { o[p.rut] = pendientesFirma_(p.rut).length; return o; }, {}),
    fondos: per.reduce(function (o, p) { var s = saldoFondo_(p.rut); if (s) o[p.rut] = s; return o; }, {}),
    tiposDocumento: TIPOS_DOCUMENTO };
}

function apiDocumentoEstado(token, id, estado, obs) {
  auth_(token, ROLES_EDITOR);
  var d = rows_('DOCUMENTOS').filter(function (x) { return x.id === id; })[0];
  if (!d) throw new Error('Documento no encontrado.');
  update_('DOCUMENTOS', d._row, { estado: estado, obs: obs || '' });
  return apiPersonas(token);
}

/* ---------- Panel: biblioteca de prevención (matrices, procedimientos, etc.) ---------- */

var CATEGORIAS_BIB = ['Matriz de riesgos (MIPER)', 'Procedimiento de trabajo seguro', 'Instructivo', 'Reglamento interno (RIOHS)',
  'Información de riesgos laborales (IRL)', 'Programa de trabajo preventivo', 'Plan de emergencia', 'Política de seguridad y salud',
  'Hoja de datos de seguridad (HDS)', 'Investigación de accidente', 'Inspección / auditoría', 'Formato / registro', 'Otro'];
var MIMES_BIB = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'];

function bibLite_(b) {
  return { id: b.id, fecha: f10_(b.fecha), categoria: b.categoria, titulo: b.titulo, version: b.version, fecha_doc: f10_(b.fecha_doc),
    fecha_vence: f10_(b.fecha_vence), vence_estado: estadoVence_(b.fecha_vence), url: b.url, mime: b.mime, publico: b.publico,
    requiere_firma: b.requiere_firma, asistentes: json_(b.asistentes, []), subido_por: b.subido_por, obs: b.obs };
}
/* ====== Formato en blanco de un formulario → Biblioteca SST ====== */
var FORMATOS_AUTO = ['INSPECCION', 'OBSERVACION'];   // se publican solos al correr actualizarSistema
function formatoBlancoHtml_(f, cfg) {
  var css = 'body{font-family:Arial,sans-serif;font-size:10px;color:#111}table{width:100%;border-collapse:collapse;margin:4px 0}' +
    'td{border:1px solid #9aa3b5;padding:4px;vertical-align:top}.s td{background:#e6eaf5;font-weight:bold}.k{width:55%}.h td{border:none}.op{white-space:nowrap;margin-right:10px}';
  var cajas = function (ops) { return ops.map(function (o) { return '<span class="op">☐ ' + esc_(o) + '</span>'; }).join(' '); };
  var h = '<html><head><meta charset="utf-8"><style>' + css + '</style></head><body>';
  h += '<table class="h"><tr><td>' + logoImg_(56) + '<br><small>' + esc_(cfg.razon_social || cfg.empresa || '') + '</small></td>' +
    '<td style="text-align:right"><b style="font-size:14px">' + esc_(String(f.nombre).toUpperCase()) + '</b><br><span style="color:#555">Código: ' + esc_(f.codigo || f.id) +
    '<br>Formato en blanco · ' + fmt_(new Date(), 'dd-MM-yyyy') + '</span></td></tr></table>';
  h += '<table><tr><td style="width:33%"><b>Fecha:</b></td><td style="width:33%"><b>Hora:</b></td><td><b>Lugar:</b></td></tr></table>';
  (f.secciones || []).forEach(function (sec) {
    h += '<table><tr class="s"><td colspan="2">' + esc_(sec.titulo) + (sec.nota ? ' <span style="font-weight:normal">— ' + esc_(sec.nota) + '</span>' : '') + '</td></tr>';
    (sec.items || []).forEach(function (it) {
      if (it.tipo === 'foto') return;
      if (it.tipo === 'info') { h += '<tr><td colspan="2"><b>' + esc_(it.texto) + '</b></td></tr>'; return; }
      var c = '';
      if (it.tipo === 'sino') c = cajas(['SÍ', 'NO']);
      else if (it.opciones && it.opciones.length) c = cajas(it.opciones.map(function (o) { return typeof o === 'object' ? (o.texto || o.label || o.valor || '') : o; }));
      var alto = it.tipo === 'parrafo' ? 46 : it.tipo === 'firma' ? 50 : 16;
      if (it.tipo === 'parrafo' || it.tipo === 'firma') h += '<tr><td colspan="2"><b>' + esc_(it.texto) + '</b><div style="height:' + alto + 'px"></div></td></tr>';
      else h += '<tr><td class="k">' + esc_(it.texto) + '</td><td style="height:' + alto + 'px">' + c + '</td></tr>';
    });
    h += '</table>';
  });
  return h + '</body></html>';
}
function tituloFormato_(f) { return (f.codigo ? f.codigo + ' · ' : '') + f.nombre + ' (formato)'; }
function publicarFormato_(f, u, soloSiFalta) {
  var titulo = tituloFormato_(f);
  var viejos = rows_('BIBLIOTECA').filter(function (b) { return b.titulo === titulo && String(b.activo).toUpperCase() !== 'NO'; });
  if (soloSiFalta && viejos.length) return null;
  var cat = /INSPEC|OBSERV|AUDIT/.test(f.id) ? 'Inspección / auditoría' : 'Formato / registro';
  var pdf = Utilities.newBlob(formatoBlancoHtml_(f, cfg_()), 'text/html', 'f.html').getAs('application/pdf').setName(titulo.replace(/[\/\\:]/g, '-') + '.pdf');
  var file = carpetaDe_('biblioteca', cat).createFile(pdf);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  viejos.forEach(function (b) { update_('BIBLIOTECA', b._row, { activo: 'NO', obs: 'Reemplazado el ' + hoy_() }); });
  append_('BIBLIOTECA', { id: nuevoId_('B'), fecha: new Date(), categoria: cat, titulo: titulo, version: f.version || '00', fecha_doc: hoy_(), fecha_vence: '',
    url: file.getUrl(), mime: 'application/pdf', publico: 'SI', requiere_firma: 'NO', asistentes: '[]', subido_por: u ? u.nombre : 'Sistema', activo: 'SI',
    obs: 'Formato en blanco generado desde el formulario ' + f.id + ' del sistema' });
  return titulo;
}
function apiPublicarFormato(token, id) {
  var u = auth_(token, ROLES_EDITOR);
  var f = forms_(false).filter(function (x) { return x.id === id; })[0];
  if (!f) throw new Error('El formulario no existe.');
  return { ok: true, titulo: publicarFormato_(f, u, false) };
}
function apiBiblioteca(token) {
  auth_(token, ROLES_EDITOR);
  return { documentos: rows_('BIBLIOTECA').filter(function (b) { return String(b.activo).toUpperCase() !== 'NO'; }).map(bibLite_).reverse(),
    categorias: CATEGORIAS_BIB, personas: personas_() };
}
/** d = {categoria, titulo, version, fecha_doc, fecha_vence, publico, requiere_firma, asistentes:[rut], obs, reemplaza} */
function apiSubirBiblioteca(token, d, archivo) {
  var u = auth_(token, ROLES_EDITOR);
  if (!d.titulo) throw new Error('Ponle un título al documento.');
  if (!archivo || !archivo.data) throw new Error('Falta el archivo.');
  if (!/^image\//.test(archivo.mime) && MIMES_BIB.indexOf(archivo.mime) < 0) throw new Error('Formato no permitido. Usa PDF, Excel, Word, PowerPoint o foto.');
  var carpeta = carpetaDe_('biblioteca', d.categoria || 'Otro');
  var file = carpeta.createFile(Utilities.newBlob(Utilities.base64Decode(archivo.data), archivo.mime, archivo.nombre || d.titulo));
  var publico = d.publico === 'NO' ? 'NO' : 'SI';
  if (publico === 'SI') { try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {} }
  var firma = d.requiere_firma === 'SI';
  var ruts = firma ? ((d.asistentes && d.asistentes.length) ? d.asistentes : personas_().map(function (p) { return p.rut; })) : [];
  var as = ruts.map(persona_).filter(Boolean).map(function (p) { return { rut: p.rut, nombre: p.nombre, cargo: p.cargo, firma_url: '', fecha_firma: '' }; });
  if (d.reemplaza) {
    var old = rows_('BIBLIOTECA').filter(function (x) { return x.id === d.reemplaza; })[0];
    if (old) update_('BIBLIOTECA', old._row, { activo: 'NO', obs: 'Reemplazado el ' + hoy_() });
  }
  append_('BIBLIOTECA', { id: nuevoId_('B'), fecha: new Date(), categoria: d.categoria || 'Otro', titulo: d.titulo, version: d.version || '',
    fecha_doc: d.fecha_doc || '', fecha_vence: d.fecha_vence || '', url: file.getUrl(), mime: archivo.mime, publico: publico,
    requiere_firma: firma ? 'SI' : 'NO', asistentes: JSON.stringify(as), subido_por: u.nombre, activo: 'SI', obs: d.obs || '' });
  if (as.length) {
    var em = {};
    rows_('USUARIOS').forEach(function (x) { em[normRut_(x.rut)] = x.email; });
    as.forEach(function (x) { if ((em[x.rut]) && correoTrab_()) try { MailApp.sendEmail(em[x.rut], 'Documento para leer y firmar: ' + d.titulo,
      'Hola ' + x.nombre + ', se publicó "' + d.titulo + '" (' + (d.categoria || '') + '). Léelo y firma que lo leíste en la app (Mi perfil):\n' + urlApp_()); } catch (e) {} });
  }
  return apiBiblioteca(token);
}
/** Editar un documento de la biblioteca: datos y quiénes deben firmar. Las firmas ya hechas se conservan. */
function apiEditarBiblioteca(token, id, d) {
  auth_(token, ROLES_EDITOR);
  var b = rows_('BIBLIOTECA').filter(function (x) { return x.id === id; })[0];
  if (!b) throw new Error('No encontrado.');
  if (!d || !String(d.titulo || '').trim()) throw new Error('Ponle un título al documento.');
  var firma = d.requiere_firma === 'SI', antes = json_(b.asistentes, []), idx = {};
  antes.forEach(function (x) { idx[normRut_(x.rut)] = x; });
  var nuevos = [], as = firma ? (d.asistentes || []).map(normRut_).filter(Boolean).map(function (r) {
    if (idx[r]) return idx[r];
    var p = persona_(r); if (!p) return null;
    var o = { rut: p.rut, nombre: p.nombre, cargo: p.cargo, firma_url: '', fecha_firma: '' }; nuevos.push(o); return o;
  }).filter(Boolean) : [];
  var publico = d.publico === 'NO' ? 'NO' : 'SI';
  if (publico === 'SI' && String(b.publico).toUpperCase() !== 'SI') { try { DriveApp.getFileById(String(b.url).match(/[-\w]{25,}/)[0]).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {} }
  update_('BIBLIOTECA', b._row, { categoria: d.categoria || b.categoria, titulo: String(d.titulo).trim(), version: d.version || '', fecha_doc: d.fecha_doc || '',
    fecha_vence: d.fecha_vence || '', publico: publico, requiere_firma: firma ? 'SI' : 'NO', asistentes: JSON.stringify(as), obs: d.obs || '' });
  avisarFirmaBib_(nuevos, d.titulo, d.categoria);
  return apiBiblioteca(token);
}
function avisarFirmaBib_(lista, titulo, cat) {
  if (!lista.length || !correoTrab_()) return;
  var em = {}; rows_('USUARIOS').forEach(function (x) { em[normRut_(x.rut)] = x.email; });
  lista.forEach(function (x) { if (em[x.rut]) try { MailApp.sendEmail(em[x.rut], 'Documento para leer y firmar: ' + titulo,
    'Hola ' + x.nombre + ', tienes para leer "' + titulo + '" (' + (cat || '') + '). Léelo y firma que lo leíste en la app (Mi perfil):\n' + urlApp_()); } catch (e) {} });
}
/** Persona nueva: queda para firmar todos los documentos vigentes que piden firma (accion 'agregar'),
 *  o se quita de las firmas PENDIENTES de todos (accion 'quitar'; las firmas ya hechas se conservan como evidencia). */
function apiPersonaBiblioteca(token, rut, accion) {
  auth_(token, ROLES_EDITOR);
  var p = persona_(rut); rut = normRut_(rut);
  if (accion === 'agregar' && !p) throw new Error('Esa persona no está activa en Usuarios.');
  var n = 0, docs = [];
  rows_('BIBLIOTECA').forEach(function (b) {
    if (String(b.activo).toUpperCase() === 'NO' || String(b.requiere_firma).toUpperCase() !== 'SI') return;
    var L = json_(b.asistentes, []), ya = L.filter(function (x) { return normRut_(x.rut) === rut; })[0];
    if (accion === 'agregar' && !ya) { L.push({ rut: p.rut, nombre: p.nombre, cargo: p.cargo, firma_url: '', fecha_firma: '' }); update_('BIBLIOTECA', b._row, { asistentes: JSON.stringify(L) }); n++; docs.push(b.titulo); }
    if (accion === 'quitar' && ya && !ya.firma_url) { update_('BIBLIOTECA', b._row, { asistentes: JSON.stringify(L.filter(function (x) { return x !== ya; })) }); n++; docs.push(b.titulo); }
  });
  if (accion === 'agregar' && n) avisarFirmaBib_([{ rut: p.rut, nombre: p.nombre }], docs.length + ' documento(s) de prevención', 'Biblioteca SST');
  var r = apiBiblioteca(token); r.cambio = { n: n, docs: docs };
  return r;
}
function apiArchivarBiblioteca(token, id) {
  auth_(token, ROLES_EDITOR);
  var b = rows_('BIBLIOTECA').filter(function (x) { return x.id === id; })[0];
  if (!b) throw new Error('No encontrado.');
  update_('BIBLIOTECA', b._row, { activo: 'NO', obs: 'Archivado el ' + hoy_() });
  return apiBiblioteca(token);
}

/* ---------- Panel: capacitaciones ---------- */

function apiCapacitaciones(token) {
  auth_(token, ROLES_EDITOR);
  var per = personas_(), cursos = cursos_();
  return { cursos: cursos, todosCursos: cursos_(true), personas: per, matriz: matrizCursos_(per, cursos),
    sesiones: rows_('CAPACITACIONES').map(function (c) {
      return { id: c.id, fecha: f10_(c.fecha), curso_id: c.curso_id, curso_nombre: c.curso_nombre, horas: c.horas, relator: c.relator, relator_rut: c.relator_rut,
        lugar: c.lugar, temario: c.temario, evaluacion: c.evaluacion, asistentes: json_(c.asistentes, []), acta_url: c.acta_url, creado_por: c.creado_por };
    }).reverse() };
}

function apiGuardarCurso(token, c) {
  auth_(token, ROLES_EDITOR);
  if (!c || !c.nombre) throw new Error('El curso necesita nombre.');
  var id = c.id || String(c.nombre).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, '_').slice(0, 20);
  var obj = { id: id, nombre: c.nombre, horas: c.horas || '', vigencia_meses: Number(c.vigencia_meses) || 0, aplica: c.aplica === 'opcional' ? 'opcional' : 'todos',
    base: c.base || '', activo: c.activo === 'NO' ? 'NO' : 'SI', orden: Number(c.orden) || 99 };
  var ex = rows_('CURSOS').filter(function (x) { return x.id === id; })[0];
  if (ex) update_('CURSOS', ex._row, obj); else append_('CURSOS', obj);
  return apiCapacitaciones(token);
}

/** c = {curso_id, fecha, horas, relator, relator_rut, lugar, temario, evaluacion, asistentes:[rut]}; acta opcional (foto/PDF). */
function apiGuardarCapacitacion(token, c, acta) {
  var u = auth_(token, ROLES_EDITOR);
  var curso = cursos_(true).filter(function (x) { return x.id === c.curso_id; })[0];
  if (!curso) throw new Error('Elige el curso.');
  if (!c.fecha) throw new Error('Falta la fecha.');
  var as = (c.asistentes || []).map(persona_).filter(Boolean).map(function (p) { return { rut: p.rut, nombre: p.nombre, firma_url: '', fecha_firma: '' }; });
  if (!as.length) throw new Error('Marca al menos un asistente.');
  var actaUrl = '';
  if (acta && acta.data) {
    actaUrl = guardarArchivo_(carpetaDe_('capacitaciones', String(c.fecha || hoy_()).slice(0, 4), 'Capacitaciones'), acta, 'Acta_' + curso.id + '_' + c.fecha);
  }
  append_('CAPACITACIONES', { id: nuevoId_('C'), fecha: c.fecha, curso_id: curso.id, curso_nombre: curso.nombre, horas: c.horas || curso.horas || '',
    relator: c.relator || '', relator_rut: c.relator_rut || '', lugar: c.lugar || '', temario: c.temario || '', evaluacion: c.evaluacion || '',
    asistentes: JSON.stringify(as), acta_url: actaUrl, creado_por: u.nombre, creado: new Date() });
  as.forEach(function (a) {
    var p = rows_('USUARIOS').filter(function (x) { return normRut_(x.rut) === a.rut; })[0];
    if ((p && p.email) && correoTrab_()) try { MailApp.sendEmail(p.email, 'Firma pendiente: ' + curso.nombre, 'Hola ' + a.nombre + ', tienes que firmar tu asistencia a "' + curso.nombre + '" (' + c.fecha + '). Entra a la app, toca tu perfil y firma.\n' + urlApp_()); } catch (e) {}
  });
  return apiCapacitaciones(token);
}

function apiSubirActa(token, id, acta) {
  auth_(token, ROLES_EDITOR);
  var c = rows_('CAPACITACIONES').filter(function (x) { return x.id === id; })[0];
  if (!c) throw new Error('Capacitación no encontrada.');
  update_('CAPACITACIONES', c._row, { acta_url: guardarArchivo_(carpetaDe_('capacitaciones', f10_(c.fecha).slice(0, 4) || fmt_(new Date(), 'yyyy'), 'Capacitaciones'), acta, 'Acta_' + c.curso_id + '_' + f10_(c.fecha)) });
  return apiCapacitaciones(token);
}

/* ---------- Panel: entregas de EPP, herramientas y ropa ---------- */

function sugerenciasEntrega_() {
  var epp = [], her = [];
  forms_(false).forEach(function (f) {
    if (f.id !== 'EPP' && f.id !== 'HERRAMIENTAS') return;
    itemsOf_(f).forEach(function (it) { if (it.tipo === 'sino') (f.id === 'EPP' ? epp : her).push(it.texto); });
  });
  EPP_EXTRA.concat(rubroDef_().epp || []).forEach(function (x) { if (epp.indexOf(x) < 0) epp.push(x); });
  return { 'EPP': epp, 'Herramienta': her, 'Ropa de trabajo': ROPA_SUGERIDA };
}

function apiEntregas(token) {
  auth_(token, ROLES_PANEL);
  var c = cfg_(), s = saldos_();
  return { entregas: rows_('ENTREGAS').map(entregaLite_).reverse(), personas: personas_(), sugerencias: sugerenciasEntrega_(),
    inventario: inventario_(false).map(function (i) { i.bodega = Math.round((s.bodega[i.codigo] || 0) * 100) / 100; return i; }),
    hayFirmaEmpleador: !!c.firma_empleador, representante: c.representante || '' };
}

/** e = {rut, fecha, motivo, items:[{tipo, elemento, cantidad, talla}], obs} */
function apiGuardarEntrega(token, e) {
  var u = auth_(token, ROLES_PANEL);
  var p = persona_(e.rut);
  if (!p) throw new Error('Elige el trabajador.');
  var items = (e.items || []).filter(function (x) { return x.elemento || x.codigo; });
  if (!items.length) throw new Error('Agrega al menos un elemento.');
  var c = cfg_(), firmaEmp = '', idE = nuevoId_('E');
  var inv = {}; inventario_(true).forEach(function (i) { inv[i.codigo] = i; });
  items.forEach(function (x) { if (x.codigo && !inv[x.codigo]) x.codigo = ''; if (x.codigo) { x.elemento = x.elemento || inv[x.codigo].nombre; x.tipo = inv[x.codigo].categoria === 'Material de operación' ? 'Material de operación' : (x.tipo || inv[x.codigo].categoria); x.unidad = inv[x.codigo].unidad; } });
  if (e.firma_empleador) {
    firmaEmp = guardarArchivo_(carpetaDe_('sistema', 'Firmas del empleador'), { mime: 'image/png', data: e.firma_empleador }, 'Firma_empleador_entrega');
  } else if (!c.firma_empleador) throw new Error('Falta la firma del empleador: firma en el recuadro o guarda una firma fija en Configuración.');
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    salidaEntrega_(items, p, u, idE);
    append_('ENTREGAS', { id: idE, fecha: e.fecha || hoy_(), rut: p.rut, nombre: p.nombre, motivo: e.motivo || 'Primera entrega',
      items: JSON.stringify(items), obs: e.obs || '', entregado_por: u.nombre, estado: 'Pendiente de firma', creado: new Date(),
      firma_empleador_url: firmaEmp, firmado_empleador_por: firmaEmp ? (e.firmado_por || u.nombre) : (c.representante || '') });
  } finally { lock.releaseLock(); }
  var row = rows_('USUARIOS').filter(function (x) { return normRut_(x.rut) === p.rut; })[0];
  if ((row && row.email) && correoTrab_()) try { MailApp.sendEmail(row.email, 'Firma pendiente: entrega de elementos', 'Hola ' + p.nombre + ', se registró una entrega de elementos a tu nombre. Entra a la app, toca tu perfil y firma la recepción.\n' + urlApp_()); } catch (x) {}
  return apiEntregas(token);
}

/* ---------- Panel: fondos por rendir ---------- */

function apiFondos(token) {
  auth_(token, ROLES_GESTION);
  var per = personas_();
  return { fondos: rows_('FONDOS').map(function (f) { return { id: f.id, fecha: f10_(f.fecha), rut: f.rut, nombre: f.nombre, monto: Number(f.monto) || 0, medio: f.medio, obs: f.obs, entregado_por: f.entregado_por }; }).reverse(),
    saldos: per.map(function (p) { var s = saldoFondo_(p.rut); return s ? { rut: p.rut, nombre: p.nombre, entregado: s.entregado, rendido: s.rendido, saldo: s.saldo } : null; }).filter(Boolean),
    personas: per };
}

function apiGuardarFondo(token, f) {
  var u = auth_(token, ROLES_GESTION);
  var p = persona_(f.rut);
  if (!p) throw new Error('Elige el colaborador.');
  if (!(Number(f.monto) > 0)) throw new Error('Ingresa el monto entregado.');
  append_('FONDOS', { id: nuevoId_('F'), fecha: f.fecha || hoy_(), rut: p.rut, nombre: p.nombre, monto: Number(f.monto), medio: f.medio || 'Transferencia empresa',
    obs: f.obs || '', entregado_por: u.nombre, creado: new Date() });
  return apiFondos(token);
}

/* ---------- Panel: incidentes ---------- */

function apiIncidentes(token) {
  auth_(token, ROLES_PANEL);
  var n = 0;
  return rows_('REGISTROS').filter(function (r) { return r.form_id === 'INCIDENTE'; }).map(function (r) {
    var d = json_(r.datos, {}), s = d._seg || {};
    n++;
    return { id: r.id, correlativo: 'INC-' + ('000' + n).slice(-3), fecha: r.fecha, fecha_ev: f10_(d.fecha_ev), hora_ev: d.hora_ev, tipo: d.tipo_inc,
      involucrado: String(d.involucrado || '').split(' · ')[0], lugar: d.lugar_ev, descripcion: d.descripcion, reporta: r.tecnico_nombre,
      pdf_url: r.pdf_url, lat: r.lat, lng: r.lng, seg: { estado: s.estado || 'Abierto', responsable: s.responsable || '', causas: s.causas || '',
        medidas: s.medidas || '', diat: s.diat || '', fecha_cierre: s.fecha_cierre || '', actualizado_por: s.actualizado_por || '', fecha: s.fecha || '' } };
  }).reverse();
}

function apiSeguimientoIncidente(token, id, seg) {
  var u = auth_(token, ROLES_PANEL);
  var r = rows_('REGISTROS').filter(function (x) { return x.id === id && x.form_id === 'INCIDENTE'; })[0];
  if (!r) throw new Error('Incidente no encontrado.');
  var d = json_(r.datos, {});
  d._seg = { estado: seg.estado || 'Abierto', responsable: seg.responsable || '', causas: seg.causas || '', medidas: seg.medidas || '', diat: seg.diat || '',
    fecha_cierre: seg.estado === 'Cerrado' ? (seg.fecha_cierre || hoy_()) : '', actualizado_por: u.nombre, fecha: fmt_(new Date(), 'yyyy-MM-dd HH:mm') };
  update_('REGISTROS', r._row, { datos: JSON.stringify(d) });
  return apiIncidentes(token);
}

/* ---------- Panel: registro de actividades (charlas, reuniones) ---------- */

var TIPOS_ACTIVIDAD = ['Charla de 5 minutos', 'Reunión interna', 'Reunión con cliente', 'Inducción', 'Otra'];

function nivelUV_(n) {
  if (n === '' || n === null || n === undefined || isNaN(Number(n))) return null;
  n = Number(n);
  var t = n <= 2 ? ['Bajo', 'Sin riesgo relevante.'] : n <= 5 ? ['Moderado', 'Usar bloqueador FPS 30+, lentes y jockey.'] :
    n <= 7 ? ['Alto', 'Bloqueador FPS 50+ cada 2 horas, cubrenuca, lentes y manga larga. Hidratarse.'] :
    n <= 10 ? ['Muy alto', 'Bloqueador FPS 50+ cada 2 horas, cubrenuca legionario, lentes UV, manga larga. Evitar exposición de 11:00 a 16:00 cuando se pueda.'] :
    ['Extremo', 'Exposición mínima: protección total (FPS 50+, cubrenuca, lentes, manga larga) y pausas a la sombra.'];
  return { indice: n, nivel: t[0], medidas: t[1] };
}
function actividadLite_(a) {
  return { id: a.id, fecha: f10_(a.fecha), tipo: a.tipo, hora_inicio: a.hora_inicio, hora_fin: a.hora_fin, lugar: a.lugar, realizada_por: a.realizada_por,
    uv: nivelUV_(a.indice_uv), prevencion: a.prevencion || '', firma_realizador: a.firma_realizador || '',
    asistentes: json_(a.asistentes, []), acuerdos: json_(a.acuerdos, []), obs: a.obs, acta_url: a.acta_url, creado_por: a.creado_por };
}
function apiActividades(token) {
  auth_(token, ROLES_PANEL);
  return { actividades: rows_('ACTIVIDADES').map(actividadLite_).reverse(), personas: personas_(), tipos: TIPOS_ACTIVIDAD };
}
/** a = {tipo, fecha, hora_inicio, hora_fin, lugar, realizada_por, asistentes:[rut], acuerdos:[{tema, decision, responsable}], obs} */
function apiGuardarActividad(token, a) {
  var u = auth_(token, ROLES_PANEL);
  if (!a.fecha || !a.tipo) throw new Error('Falta el tipo o la fecha.');
  var lista = (a.asistentes && a.asistentes.length) ? a.asistentes : (a.tipo === 'Charla de 5 minutos' ? personas_().map(function (p) { return p.rut; }) : []);
  var as = lista.map(persona_).filter(Boolean).map(function (p) { return { rut: p.rut, nombre: p.nombre, cargo: p.cargo, firma_url: '', fecha_firma: '' }; });
  if (!as.length) throw new Error('Marca al menos un asistente.');
  var acu = (a.acuerdos || []).filter(function (x) { return x.tema || x.decision; });
  var hace2 = new Date(Date.now() - 2 * 60000);
  var dup = rows_('ACTIVIDADES').some(function (x) { return x.tipo === a.tipo && f10_(x.fecha) === f10_(a.fecha) && x.creado_por === u.nombre && new Date(String(x.creado).replace(' ', 'T')) > hace2; });
  if (dup) return apiActividades(token);
  var firmaR = '';
  if (a.firma_realizador) {
    firmaR = guardarArchivo_(carpetaDe_('capacitaciones', String(a.fecha || hoy_()).slice(0, 4), 'Charlas y reuniones'), { mime: 'image/png', data: a.firma_realizador }, 'Firma_realizador');
  }
  var idAct = nuevoId_('A');
  append_('ACTIVIDADES', { id: idAct, charla_id: a.charla_id || '', fecha: a.fecha, tipo: a.tipo, hora_inicio: a.hora_inicio || '', hora_fin: a.hora_fin || '', lugar: a.lugar || '',
    realizada_por: a.realizada_por || u.nombre, asistentes: JSON.stringify(as), acuerdos: JSON.stringify(acu), obs: a.obs || '', acta_url: '', creado_por: u.nombre, creado: new Date(),
    indice_uv: a.indice_uv === '' || a.indice_uv === undefined ? '' : Number(a.indice_uv), prevencion: a.prevencion || '', firma_realizador: firmaR });
  if (a.charla_id) try {
    var pc = rows_('PAUTA_CHARLAS').filter(function (x) { return x.id === a.charla_id; })[0];
    if (pc) update_('PAUTA_CHARLAS', pc._row, { actividad_id: idAct, realizada: a.fecha });
  } catch (e) { Logger.log('Pauta: ' + e); }
  var emails = {};
  rows_('USUARIOS').forEach(function (x) { emails[normRut_(x.rut)] = x.email; });
  as.forEach(function (x) {
    if ((emails[x.rut]) && correoTrab_()) try { MailApp.sendEmail(emails[x.rut], 'Firma pendiente: ' + a.tipo + ' del ' + a.fecha,
      'Hola ' + x.nombre + ', tienes que firmar tu asistencia a ' + a.tipo.toLowerCase() + ' del ' + a.fecha + '.\nEntra a la app, toca 👤 (Perfil) y firma en "Por firmar":\n' + urlApp_()); } catch (e) {}
  });
  return apiActividades(token);
}

function idDrive_(url) { var m = String(url || '').match(/\/d\/([\w-]+)/) || String(url || '').match(/id=([\w-]+)/); return m ? m[1] : ''; }
function firmaDataUri_(url) {
  try { var b = DriveApp.getFileById(idDrive_(url)).getBlob(); return 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes()); } catch (e) { return ''; }
}

function apiEliminarActividad(token, id) {
  auth_(token, ROLES_EDITOR);
  var a = rows_('ACTIVIDADES').filter(function (x) { return x.id === id; })[0];
  if (!a) throw new Error('No encontrada.');
  sh_('ACTIVIDADES').deleteRow(a._row); fresco_();
  if (a.charla_id) try {   // la charla de la pauta vuelve a quedar pendiente
    var pc = rows_('PAUTA_CHARLAS').filter(function (x) { return x.actividad_id === id; })[0];
    if (pc) update_('PAUTA_CHARLAS', pc._row, { actividad_id: '', realizada: '' });
  } catch (e) {}
  return apiActividades(token);
}

/** Genera el acta en PDF con las firmas de los asistentes (tipo 'act' = actividad, 'cap' = capacitación). */
function apiActaPdf(token, tipo, id) {
  auth_(token, ROLES_PANEL);
  var c = cfg_(), hoja = tipo === 'cap' ? 'CAPACITACIONES' : 'ACTIVIDADES';
  var r = rows_(hoja).filter(function (x) { return x.id === id; })[0];
  if (!r) throw new Error('Registro no encontrado.');
  var as = json_(r.asistentes, []);
  var css = 'body{font-family:Arial;font-size:11px}table{width:100%;border-collapse:collapse;margin:6px 0}td,th{border:1px solid #999;padding:5px;vertical-align:middle}th{background:#23306b;color:#fff;text-align:left}.k{background:#eef0f7;font-weight:bold;width:22%}';
  var h = '<html><head><meta charset="utf-8"><style>' + css + '</style></head><body><table style="border:none"><tr><td style="border:none">' + logoImg_(60) +
    '<br><small>' + esc_(c.razon_social || c.empresa) + '</small></td><td style="border:none;text-align:right"><b style="font-size:14px">' + (tipo === 'cap' ? 'REGISTRO DE CAPACITACIÓN' : 'REGISTRO DE ACTIVIDADES') + '</b></td></tr></table>';
  if (tipo === 'cap') {
    h += '<table><tr><td class="k">Curso</td><td colspan="3">' + esc_(r.curso_nombre) + '</td></tr><tr><td class="k">Fecha</td><td>' + f10_(r.fecha) + '</td><td class="k">Duración</td><td>' + esc_(r.horas) + ' h</td></tr>' +
      '<tr><td class="k">Relator</td><td>' + esc_(r.relator) + '</td><td class="k">RUT relator</td><td>' + esc_(r.relator_rut) + '</td></tr><tr><td class="k">Lugar</td><td colspan="3">' + esc_(r.lugar) + '</td></tr>' +
      '<tr><td class="k">Temario</td><td colspan="3">' + esc_(r.temario).replace(/\n/g, '<br>') + '</td></tr><tr><td class="k">Evaluación</td><td colspan="3">' + esc_(r.evaluacion) + '</td></tr></table>';
  } else {
    var uv = nivelUV_(r.indice_uv);
    h += '<table><tr><td class="k">Tipo</td><td>' + esc_(r.tipo) + '</td><td class="k">Fecha</td><td>' + f10_(r.fecha) + '</td></tr><tr><td class="k">Hora inicio</td><td>' + esc_(r.hora_inicio) +
      '</td><td class="k">Hora fin</td><td>' + esc_(r.hora_fin) + '</td></tr><tr><td class="k">Lugar</td><td colspan="3">' + esc_(r.lugar) + '</td></tr>' +
      (uv ? '<tr><td class="k">Índice UV</td><td colspan="3"><b>' + uv.indice + ' · ' + uv.nivel + '</b> — ' + esc_(uv.medidas) + '</td></tr>' : '') + '</table>' +
      (r.prevencion ? '<table><tr><th>Prevención de riesgos</th></tr><tr><td>' + esc_(r.prevencion).replace(/\n/g, '<br>') + '</td></tr></table>' : '');
  }
  h += '<table><tr><th>Nombre</th><th>RUT</th><th>Cargo</th><th>Firma</th></tr>' + as.map(function (a) {
    var p = persona_(a.rut) || {}, img = a.firma_url ? firmaDataUri_(a.firma_url) : '';
    return '<tr><td>' + esc_(a.nombre) + '</td><td>' + esc_(rutPuntos_(a.rut)) + '</td><td>' + esc_(a.cargo || p.cargo || '') + '</td><td style="height:44px">' +
      (img ? '<img src="' + img + '" style="height:40px">' : '<span style="color:#999">sin firma</span>') + '</td></tr>';
  }).join('') + '</table>';
  if (tipo !== 'cap') {
    var acu = json_(r.acuerdos, []);
    if (acu.length) h += '<table><tr><th>Tema tratado</th><th>Decisión / acuerdo</th><th>Responsable</th></tr>' + acu.map(function (x) {
      return '<tr><td>' + esc_(x.tema).replace(/\n/g, '<br>') + '</td><td>' + esc_(x.decision).replace(/\n/g, '<br>') + '</td><td>' + esc_(x.responsable) + '</td></tr>'; }).join('') + '</table>';
    if (r.obs) h += '<p>' + esc_(r.obs).replace(/\n/g, '<br>') + '</p>';
    var fr = r.firma_realizador ? firmaDataUri_(r.firma_realizador) : '';
    h += '<p><b>Actividad realizada por:</b> ' + esc_(r.realizada_por) + '</p>' + (fr ? '<p><img src="' + fr + '" style="height:55px"><br><small>Firma de quien realiza la actividad</small></p>' : '');
  }
  h += '<p style="color:#666">Generado el ' + fmt_(new Date(), 'dd-MM-yyyy HH:mm') + ' · ' + as.filter(function (a) { return a.firma_url; }).length + ' de ' + as.length + ' firmas.</p></body></html>';
  var nombre = (tipo === 'cap' ? 'Capacitacion_' + r.curso_id : 'Actividad_' + String(r.tipo).replace(/\W+/g, '_')) + '_' + f10_(r.fecha) + '.pdf';
  var url = carpetaDe_('capacitaciones', f10_(r.fecha).slice(0, 4) || fmt_(new Date(), 'yyyy'), tipo === 'cap' ? 'Capacitaciones' : 'Charlas y reuniones').createFile(Utilities.newBlob(h, 'text/html', 'a.html').getAs('application/pdf').setName(nombre)).getUrl();
  if (tipo !== 'cap') update_('ACTIVIDADES', r._row, { acta_url: url });
  return { url: url };
}

/** Actualiza los cargos según el Registro de Actividades (no toca PIN ni roles). */
function actualizarCargos_() {
  var cargos = { '20556161-7': 'Soporte', '17642785-K': 'Técnico', '26387994-5': 'Técnico', '27396654-4': 'Técnico', '26589493-3': 'Técnico',
    '15785087-3': 'Gerente', '10884582-1': 'Administrativo', '17276129-1': 'Jefa administrativa' };
  rows_('USUARIOS').forEach(function (u) {
    var c = cargos[normRut_(u.rut)] || u.cargo;
    var cambios = {};
    if (cargos[normRut_(u.rut)]) cambios.cargo = c;
    if (!u.area) cambios.area = /t[ée]cnico|instalador|liniero|terreno/i.test(c) ? 'Terreno' : (u.rol === 'tecnico' && !c ? 'Terreno' : 'Oficina');
    if (Object.keys(cambios).length) update_('USUARIOS', u._row, cambios);
  });
}

/* ---------- Avisos automáticos ---------- */

function estadoVehiculos_() {
  var v = { };
  rows_('REGISTROS').forEach(function (r) {
    if (r.form_id !== 'BITACORA') return;
    var d = json_(r.datos, {}), p = String(d.patente || '').toUpperCase();
    if (!p) return;
    var x = v[p] = v[p] || {};
    if (d.rt_vence) x.rt = d.rt_vence;
    if (d.soap_vence) x.soap = d.soap_vence;
    if (d.permiso_vence) x.permiso = d.permiso_vence;
    if (d.mant_prox_km) x.prox_km = Number(d.mant_prox_km);
    if (Number(d.km) > (x.km || 0)) x.km = Number(d.km);
  });
  return v;
}

function vencimientos_() {
  var out = [];
  rows_('DOCUMENTOS').forEach(function (d) {
    if (d.estado === 'Rechazado' || !f10_(d.fecha_vence)) return;
    var e = estadoVence_(d.fecha_vence);
    if (e === 'vencido' || e === 'por_vencer') out.push({ quien: d.nombre, que: d.tipo + (d.descripcion ? ' (' + d.descripcion + ')' : ''), vence: f10_(d.fecha_vence), estado: e });
  });
  rows_('BIBLIOTECA').forEach(function (b) {
    if (String(b.activo).toUpperCase() === 'NO' || !f10_(b.fecha_vence)) return;
    var e = estadoVence_(b.fecha_vence);
    if (e === 'vencido' || e === 'por_vencer') out.push({ quien: 'Biblioteca SST', que: b.categoria + ': ' + b.titulo + ' (revisar / actualizar)', vence: f10_(b.fecha_vence), estado: e });
  });
  var per = personas_(), cursos = cursos_(), m = matrizCursos_(per, cursos);
  per.forEach(function (p) {
    cursos.forEach(function (c) {
      var x = m[p.rut][c.id];
      if (x.estado === 'vencido' || x.estado === 'por_vencer') out.push({ quien: p.nombre, que: 'Curso: ' + c.nombre, vence: x.vence, estado: x.estado });
    });
  });
  var v = estadoVehiculos_();
  Object.keys(v).forEach(function (p) {
    [['rt', 'Revisión técnica'], ['soap', 'SOAP'], ['permiso', 'Permiso de circulación']].forEach(function (k) {
      var f = v[p][k[0]]; if (!f) return;
      var e = estadoVence_(f);
      if (e === 'vencido' || e === 'por_vencer') out.push({ quien: 'Vehículo ' + p, que: k[1], vence: f10_(f), estado: e });
    });
    if (v[p].prox_km && v[p].km && v[p].km >= v[p].prox_km - 1000)
      out.push({ quien: 'Vehículo ' + p, que: 'Mantención (próxima a los ' + v[p].prox_km.toLocaleString('es-CL') + ' km, va en ' + v[p].km.toLocaleString('es-CL') + ')', vence: '', estado: v[p].km >= v[p].prox_km ? 'vencido' : 'por_vencer' });
  });
  return out.sort(function (a, b) { return (a.vence || '0') < (b.vence || '0') ? -1 : 1; });
}

function sinJornada_() {
  var c = cfg_(), req = jornadaObligatoria_();
  var hoy = hoy_(), hechos = {};
  rows_('REGISTROS').forEach(function (r) { if (f10_(r.fecha) === hoy) (hechos[normRut_(r.tecnico_rut)] = hechos[normRut_(r.tecnico_rut)] || []).push(r.form_id); });
  var nombres = {};
  forms_(false).forEach(function (f) { nombres[f.id] = f.nombre; });
  var out = [];
  rows_('USUARIOS').forEach(function (u) {
    if (areaDe_(u) !== 'Terreno' || String(u.activo).toUpperCase() !== 'SI') return;
    if (!estadoDia_(u.rut, hoy).trabaja) return;   // licencia, vacaciones, permiso o sábado libre
    var falta = req.filter(function (id) { return (hechos[normRut_(u.rut)] || []).indexOf(id) < 0; });
    if (falta.length) out.push({ nombre: u.nombre, email: u.email, falta: falta.map(function (id) { return nombres[id] || id; }) });
  });
  return out;
}

function tablaHtml_(titulo, filas, cols) {
  if (!filas.length) return '';
  return '<h3 style="color:#23306b;margin:18px 0 6px">' + titulo + '</h3><table style="border-collapse:collapse;width:100%;font-size:13px">' +
    '<tr>' + cols.map(function (c) { return '<th style="text-align:left;background:#eef0f7;padding:6px;border:1px solid #dde">' + c + '</th>'; }).join('') + '</tr>' +
    filas.map(function (f) { return '<tr>' + f.map(function (x) { return '<td style="padding:6px;border:1px solid #dde">' + x + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
}

/** Correo diario (activado con activarAvisos). forzar = true para enviarlo aunque sea domingo o no haya novedades. */
function avisoDiario(forzar) {
  if (porEmpresas_('avisoDiario', arguments)) return;
  forzar = forzar === true;
  var c = cfg_();
  if (!c.correo_notificaciones) return 'Falta el correo de notificaciones.';
  if (!forzar && new Date().getDay() === 0) return 'Domingo: sin aviso.';
  var sj = sinJornada_(), ven = vencimientos_();
  var pend = [];
  var recordar = [];
  personas_().forEach(function (p) {
    var mias = pendientesFirma_(p.rut);
    mias.forEach(function (x) { if (diasHasta_(x.fecha) <= (x.tipo === 'act' ? -1 : -2)) pend.push([esc_(p.nombre), esc_(x.titulo), x.fecha]); });
    if (mias.length && estadoDia_(p.rut).trabaja) recordar.push({ p: p, n: mias.length, titulos: mias.map(function (x) { return x.titulo + ' (' + x.fecha + ')'; }) });
  });
  var inc = rows_('REGISTROS').filter(function (r) { return r.form_id === 'INCIDENTE' && (json_(r.datos, {})._seg || {}).estado !== 'Cerrado'; });
  var atr = rows_('TICKETS').filter(function (t) { return abierto_(t) && t.fecha_limite && f10_(t.fecha_limite) < hoy_(); });
  var fa = fallasAbiertas_();
  var bajo = []; try { var sb = saldos_(); inventario_(false).forEach(function (i) { var n = sb.bodega[i.codigo] || 0; if (i.minimo && n < i.minimo) bajo.push([esc_(i.nombre), esc_(i.codigo), n + ' ' + esc_(i.unidad), i.minimo]); }); } catch (e) {}
  var mant = []; try { mant = infraEstado_().filter(function (e) { return e.vencida || (e.dias !== null && e.dias <= 7); }); } catch (e) {}
  var diasPre = Number(c.dias_prestamo) || 7;
  var preL = rows_('PRESTAMOS').filter(function (p) { return !p.fecha_devolucion && diasPrestamo_(p) >= diasPre; });
  var html = tablaHtml_('⚡ Fallas de red abiertas (' + fa.length + ')', fa.map(function (f) { return [esc_(f.tipo), esc_((f.sector || '') + ' ' + (f.comuna || '')), f.inicio, '<b style="color:#c62828">' + f.horas + ' h</b>', f.clientes || '—']; }), ['Falla', 'Sector', 'Desde', 'Sin servicio', 'Clientes']) +
    tablaHtml_('Tickets atrasados (' + atr.length + ')', atr.map(function (t) { return [esc_(t.id), esc_(t.cliente), esc_(t.tecnico_nombre || 'Sin asignar'), f10_(t.fecha_limite)]; }), ['Ticket', 'Cliente', 'Técnico', 'Plazo']) +
    tablaHtml_('Sin formularios del día (' + sj.length + ')', sj.map(function (x) { return [esc_(x.nombre), esc_(x.falta.join(', '))]; }), ['Técnico', 'Le falta']) +
    tablaHtml_('Vencimientos próximos o vencidos (' + ven.length + ')', ven.map(function (x) {
      return [esc_(x.quien), esc_(x.que), x.vence || '—', x.estado === 'vencido' ? '<b style="color:#c62828">VENCIDO</b>' : '<b style="color:#b26a00">Por vencer</b>']; }), ['Quién', 'Qué', 'Vence', 'Estado']) +
    tablaHtml_('Firmas pendientes hace más de 2 días (' + pend.length + ')', pend, ['Trabajador', 'Documento', 'Desde']) +
    tablaHtml_('Incidentes sin cerrar (' + inc.length + ')', inc.map(function (r) { var d = json_(r.datos, {}); return [f10_(r.fecha), esc_(d.tipo_inc), esc_(r.tecnico_nombre)]; }), ['Fecha', 'Tipo', 'Reportó']) +
    tablaHtml_('📦 Bodega: materiales bajo el mínimo (' + bajo.length + ')', bajo, ['Material', 'Código', 'En bodega', 'Mínimo']) +
    tablaHtml_('🔧 Equipos prestados hace ' + diasPre + ' días o más (' + preL.length + ')', preL.map(function (p) { return [esc_(p.activo), esc_(p.nombre), f10_(p.fecha_entrega), diasPrestamo_(p) + ' días']; }), ['Equipo', 'Lo tiene', 'Desde', 'Hace']) +
    tablaHtml_('🛠 Mantenciones vencidas o por vencer (' + mant.length + ')', mant.map(function (e) { return [esc_(e.nombre), esc_(e.tipo), esc_(e.ubicacion || ''), e.ultima ? e.ultima.fecha : '—', '<b style="color:' + (e.vencida ? '#c62828' : '#b26a00') + '">' + esc_(e.alerta) + '</b>']; }), ['Equipo', 'Tipo', 'Ubicación', 'Última', 'Estado']);
  if (!html && !forzar) return 'Sin novedades.';
  MailApp.sendEmail({ to: c.correo_notificaciones, name: 'Prevención ' + (c.marca || ''), subject: '📋 Resumen diario de prevención · ' + fmt_(new Date(), 'dd-MM-yyyy'),
    htmlBody: '<div style="font-family:Arial;max-width:760px">' + (html || '<p>Todo al día. Sin novedades.</p>') +
      '<p style="color:#667;margin-top:20px"><a href="' + urlPanel_() + '">Abrir panel</a></p></div>' });
  var emails = {};
  rows_('USUARIOS').forEach(function (u) { emails[normRut_(u.rut)] = u.email; });
  recordar.forEach(function (r) {
    var em = emails[r.p.rut];
    if ((em) && correoTrab_()) try { MailApp.sendEmail(em, 'Tienes ' + r.n + ' documento(s) por firmar', 'Hola ' + r.p.nombre + ', tienes pendiente de firma: ' + r.titulos.join(', ') +
      '.\nEntra a la app, toca 👤 Perfil y firma: ' + urlApp_()); } catch (e) {}
  });
  sj.forEach(function (x) {
    if ((x.email) && correoTrab_()) try { MailApp.sendEmail(x.email, 'Recordatorio: formularios del día', 'Hola ' + x.nombre + ', aún no envías: ' + x.falta.join(', ') + '.\nRecuerda llenarlos antes de salir a terreno: ' + urlApp_()); } catch (e) {}
  });
  return 'Enviado.';
}

/** Correo semanal (lunes 8:00) con lo de los últimos 7 días. */
function resumenSemanal() {
  if (porEmpresas_('resumenSemanal', arguments)) return;
  var c = cfg_();
  if (!c.correo_notificaciones) return 'Falta el correo de notificaciones.';
  var d0 = fmt_(new Date(Date.now() - 7 * 864e5), 'yyyy-MM-dd'), R = rows_('REGISTROS').filter(function (r) { return f10_(r.fecha) >= d0 && !esConfidencial_(r.form_id); });
  var cuenta = {}, nombres = {};
  forms_(false).forEach(function (f) { nombres[f.id] = f.nombre; });
  R.forEach(function (r) { cuenta[r.form_id] = (cuenta[r.form_id] || 0) + 1; });
  var al = R.filter(function (r) { return Number(r.n_alertas) > 0; });
  var G = gastosPlanos_({ desde: d0 }), tot = G.reduce(function (a, L) { return a + L.monto; }, 0);
  var pr = gastosPlanos_({ estado: 'Por rendir' });
  var per = personas_(), cursos = cursos_(), m = matrizCursos_(per, cursos), req = 0, ok = 0;
  per.forEach(function (p) { cursos.forEach(function (cu) { var e = m[p.rut][cu.id].estado; if (e !== 'no_aplica') { req++; if (e === 'vigente' || e === 'por_vencer') ok++; } }); });
  var html = '<div style="font-family:Arial;max-width:760px"><h2 style="color:#23306b">Resumen semanal · ' + d0 + ' al ' + hoy_() + '</h2>' +
    tablaHtml_('Formularios enviados', Object.keys(cuenta).map(function (k) { return [esc_(nombres[k] || k), cuenta[k]]; }), ['Formulario', 'Cantidad']) +
    tablaHtml_('Registros con alertas (' + al.length + ')', al.slice(0, 30).map(function (r) { return [f10_(r.fecha), esc_(r.form_nombre), esc_(r.tecnico_nombre), esc_(r.alertas)]; }), ['Fecha', 'Formulario', 'Trabajador', 'Alertas']) +
    '<h3 style="color:#23306b">Gastos</h3><p>Declarados en la semana: <b>$' + tot.toLocaleString('es-CL') + '</b> (' + G.length + ' gastos). Por rendir en total: <b>' + pr.length + '</b> ($' +
      pr.reduce(function (a, L) { return a + L.monto; }, 0).toLocaleString('es-CL') + ').</p>' +
    (function () { var F = rows_('FALLAS').filter(function (f) { return f.estado === 'Cerrada' && f10_(f.inicio) >= d0; }), h = 0, ch = 0;
      F.forEach(function (f) { h += num_(f.horas); ch += num_(f.horas) * num_(f.clientes); });
      return '<h3 style="color:#23306b">Fallas de red</h3><p>Cerradas en la semana: <b>' + F.length + '</b> · horas sin servicio: <b>' + Math.round(h * 10) / 10 + '</b> · clientes × hora: <b>' + Math.round(ch) + '</b> · abiertas ahora: <b>' + fallasAbiertas_().length + '</b>.</p>'; })() +
    '<h3 style="color:#23306b">Capacitaciones</h3><p>Cumplimiento de cursos obligatorios: <b>' + (req ? Math.round(ok / req * 100) : 100) + '%</b> (' + ok + ' de ' + req + ').</p>' +
    tablaHtml_('Vencimientos', vencimientos_().map(function (x) { return [esc_(x.quien), esc_(x.que), x.vence || '—', x.estado === 'vencido' ? 'VENCIDO' : 'Por vencer']; }), ['Quién', 'Qué', 'Vence', 'Estado']) +
    '<p><a href="' + urlPanel_() + '">Abrir panel</a></p></div>';
  MailApp.sendEmail({ to: c.correo_notificaciones, name: 'Prevención ' + (c.marca || ''), subject: '📊 Resumen semanal de prevención · ' + hoy_(), htmlBody: html });
  return 'Enviado.';
}

function estadoAvisos_() {
  var t = ScriptApp.getProjectTriggers().map(function (x) { return x.getHandlerFunction(); });
  return { diario: t.indexOf('avisoDiario') >= 0, semanal: t.indexOf('resumenSemanal') >= 0, respaldo: t.indexOf('respaldoSemanal') >= 0 };
}
/** Ejecútala una vez desde el editor (o con el botón del panel) para activar los correos automáticos. */
function activarAvisos() {
  desactivarAvisos();
  ScriptApp.newTrigger('avisoDiario').timeBased().everyDays(1).atHour(9).nearMinute(0).inTimezone(TZ).create();
  ScriptApp.newTrigger('resumenSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).nearMinute(0).inTimezone(TZ).create();
  ScriptApp.newTrigger('respaldoSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(23).nearMinute(0).inTimezone(TZ).create();
  Logger.log('Avisos activados: diario 9:00 y semanal lunes 8:00.');
  return estadoAvisos_();
}
function desactivarAvisos() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['avisoDiario', 'resumenSemanal', 'respaldoSemanal'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  return estadoAvisos_();
}
function apiAvisos(token, accion) {
  auth_(token, ['admin']);
  if (accion === 'activar') return { estado: activarAvisos(), msg: 'Avisos activados.' };
  if (accion === 'desactivar') return { estado: desactivarAvisos(), msg: 'Avisos desactivados.' };
  if (accion === 'diario') return { estado: estadoAvisos_(), msg: 'Aviso diario: ' + avisoDiario(true) };
  if (accion === 'semanal') return { estado: estadoAvisos_(), msg: 'Resumen semanal: ' + resumenSemanal() };
  return { estado: estadoAvisos_() };
}

/**
 * ACTUALIZACIÓN v5: ejecútala una vez después de pegar este código.
 * Crea las hojas nuevas, agrega el formulario de incidentes, actualiza la bitácora y pone firma en todos los formularios.
 * No toca usuarios, PIN ni registros.
 */
/* ===================== BODEGA: STOCK, FACTURAS, PRÉSTAMOS Y FALLAS ===================== */

var CATEGORIAS_INV = ['Material de operación', 'EPP', 'Ropa de trabajo', 'Herramienta'];
var ROLES_BODEGA = ['admin', 'editor', 'soporte'];
/** Catálogo inicial de materiales de operación: [nombre, unidad, serializado (se registra también en Equipos)] */
var MATERIALES_INICIALES = [
  ['Drop', 'metro'], ['UTP exterior', 'metro'], ['UTP interior', 'metro'], ['ONT', 'unidad', 'ONT'], ['Decodificador', 'unidad', 'Decodificador'],
  ['Conector rápido verde', 'unidad'], ['Conector rápido azul', 'unidad'], ['Grampa 5 mm blanca', 'unidad'], ['Amarra plástica 15 cm', 'unidad'],
  ['Amarra grande 270 mm', 'unidad'], ['Repetidor', 'unidad', 'Repetidor'], ['Switch 5 puertos', 'unidad'], ['Switch 8 puertos', 'unidad'],
  ['Switch 16 puertos', 'unidad'], ['Switch 24 puertos', 'unidad'], ['RJ45', 'unidad'], ['Precinto', 'unidad'], ['Pasa muro', 'unidad'],
  ['Splitter 1x2', 'unidad', 'Splitter'], ['Splitter 1x4', 'unidad', 'Splitter'], ['Splitter 1x8', 'unidad', 'Splitter'], ['Splitter 1x16', 'unidad', 'Splitter'],
  ['RB (RouterBoard)', 'unidad', 'Router'], ['Cable HDMI', 'unidad']
];
var ACTIVOS_INICIALES = [['OTDR', 'Equipo de medición'], ['Power meter', 'Equipo de medición'], ['Tecle', 'Herramienta mayor'], ['Podadora', 'Herramienta mayor'],
  ['Laucha (guía pasacables)', 'Herramienta mayor'], ['Alargador 40 m', 'Herramienta mayor'], ['Etiquetadora', 'Herramienta mayor']];
var ESTADOS_ACTIVO = ['En administración', 'Prestado', 'En reparación', 'De baja'];
var TIPOS_FALLA = ['Corte de fibra (troncal o distribución)', 'Caída de PON / OLT', 'Corte de energía eléctrica', 'Falla de equipo de red (switch, router, RB)',
  'Falla de enlace inalámbrico', 'Falla del proveedor (internet de subida)', 'Daño por terceros (choque, poda, obras)', 'Robo o vandalismo',
  'Clima (viento, lluvia, nieve)', 'Mantención programada', 'Otra'];
var ALCANCES_FALLA = ['Sin servicio (corte total)', 'Servicio degradado (lento o intermitente)'];

function num_(v) { var n = Number(String(v === undefined ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; }
function carpetaBodega_(sub) {
  if (sub === 'EXPORTES') return carpetaDe_('sistema', 'Planillas exportadas');
  return carpetaDe_('bodega', sub);
}

/* ---------- catálogo y saldos ---------- */

function inventario_(todos) {
  return rows_('INVENTARIO').filter(function (x) { return todos || String(x.activo).toUpperCase() !== 'NO'; }).map(function (x) {
    return { codigo: String(x.codigo), nombre: x.nombre, categoria: x.categoria || 'Material de operación', unidad: x.unidad || 'unidad',
      minimo: num_(x.minimo), activo: x.activo || 'SI', obs: x.obs || '', serializado: x.serializado || '' };
  });
}
/** Efecto de cada movimiento: [en bodega, en el técnico] */
function efectoMov_(m, cat) {
  var q = num_(m.cantidad), mat = cat === 'Material de operación';
  switch (m.tipo) {
    case 'Ingreso': return [q, 0];
    case 'Entrega': return [-q, mat ? q : 0];
    case 'Consumo': return [0, -q];
    case 'Devolución': return [q, -q];
    case 'Ajuste': return [q, 0];          // cantidad con signo
    case 'Ajuste técnico': return [0, q];  // cantidad con signo
    default: return [0, 0];
  }
}
/** Saldos: {bodega:{codigo:n}, tecnicos:{rut:{codigo:n}}} */
function saldos_() {
  var cat = {}, out = { bodega: {}, tecnicos: {} };
  inventario_(true).forEach(function (i) { cat[i.codigo] = i.categoria; });
  rows_('MOV_INV').forEach(function (m) {
    var c = String(m.codigo), e = efectoMov_(m, cat[c]);
    if (e[0]) out.bodega[c] = (out.bodega[c] || 0) + e[0];
    if (e[1] && m.rut) {
      var r = normRut_(m.rut);
      out.tecnicos[r] = out.tecnicos[r] || {};
      out.tecnicos[r][c] = (out.tecnicos[r][c] || 0) + e[1];
    }
  });
  return out;
}
/** Materiales que tiene el técnico (para la app y la OT) */
function stockTecnico_(rut) {
  var s = (saldos_().tecnicos[normRut_(rut)] || {}), out = [];
  inventario_(true).forEach(function (i) {
    var n = Math.round((s[i.codigo] || 0) * 100) / 100;
    if (n) out.push({ codigo: i.codigo, nombre: i.nombre, unidad: i.unidad, cantidad: n });
  });
  return out;
}
function movs_(lista) {
  if (!lista.length) return;
  var sh = sh_('MOV_INV'), H = HOJAS.MOV_INV;
  sh.getRange(sh.getLastRow() + 1, 1, lista.length, H.length).setValues(lista.map(function (m) {
    return H.map(function (k) { return m[k] === undefined ? '' : limpia_(m[k]); });
  }));
  fresco_();
}
function siguienteCodigo_(cat) {
  var pre = { 'Material de operación': 'M', 'EPP': 'P', 'Ropa de trabajo': 'R', 'Herramienta': 'H' }[cat] || 'X', max = 0;
  rows_('INVENTARIO').forEach(function (x) { var m = String(x.codigo).match(new RegExp('^' + pre + '(\\d+)$')); if (m) max = Math.max(max, Number(m[1])); });
  return pre + ('00' + (max + 1)).slice(-3);
}
function sembrarInventario_() {
  if (rows_('INVENTARIO').length) return 0;
  var filas = [], n = { M: 0, P: 0, R: 0, H: 0 }, ahora = new Date();
  var cod = function (p) { n[p]++; return p + ('00' + n[p]).slice(-3); };
  MATERIALES_INICIALES.forEach(function (m) { filas.push([cod('M'), m[0], 'Material de operación', m[1], 0, 'SI', '', ahora, m[2] || '']); });
  var sug = sugerenciasEntrega_();
  (sug['EPP'] || []).forEach(function (x) { filas.push([cod('P'), x, 'EPP', 'unidad', 0, 'SI', '', ahora, '']); });
  (sug['Ropa de trabajo'] || []).forEach(function (x) { filas.push([cod('R'), x, 'Ropa de trabajo', 'unidad', 0, 'SI', '', ahora, '']); });
  (sug['Herramienta'] || []).forEach(function (x) { filas.push([cod('H'), x, 'Herramienta', 'unidad', 0, 'SI', '', ahora, '']); });
  var sh = sh_('INVENTARIO');
  if (filas.length) sh.getRange(2, 1, filas.length, filas[0].length).setValues(filas);
  fresco_();
  return filas.length;
}
function sembrarActivos_() {
  if (rows_('ACTIVOS').length) return 0;
  var ahora = new Date();
  ACTIVOS_INICIALES.forEach(function (a, i) {
    append_('ACTIVOS', { id: 'A' + ('00' + (i + 1)).slice(-3), nombre: a[0], tipo: a[1], estado: 'En administración', activo: 'SI', creado: ahora });
  });
  return ACTIVOS_INICIALES.length;
}

/* ---------- panel: bodega ---------- */

function movLite_(m) {
  return { id: m.id, fecha: String(m.fecha).slice(0, 16), tipo: m.tipo, codigo: String(m.codigo), nombre: m.nombre, cantidad: num_(m.cantidad), rut: m.rut,
    tecnico: m.tecnico, ref: m.ref, ticket_id: m.ticket_id, factura_id: m.factura_id, usuario: m.usuario, obs: m.obs };
}
function facturaLite_(f) {
  return { id: f.id, fecha: f10_(f.fecha), numero: f.numero, tipo_doc: f.tipo_doc, proveedor: f.proveedor, rut_proveedor: f.rut_proveedor, monto: num_(f.monto),
    items: json_(f.items, []), archivo_url: f.archivo_url, recibido_por: f.recibido_por, pdf_url: f.pdf_url, usuario: f.usuario, obs: f.obs };
}
function apiBodega(token) {
  auth_(token, ROLES_BODEGA);
  var s = saldos_(), inv = inventario_(true), per = personas_();
  var nombres = {}; per.forEach(function (p) { nombres[p.rut] = p.nombre; });
  var porTec = Object.keys(s.tecnicos).map(function (rut) {
    var it = inv.map(function (i) { return { codigo: i.codigo, nombre: i.nombre, unidad: i.unidad, cantidad: Math.round((s.tecnicos[rut][i.codigo] || 0) * 100) / 100 }; })
      .filter(function (x) { return x.cantidad; });
    return { rut: rut, nombre: nombres[rut] || rut, items: it };
  }).filter(function (t) { return t.items.length; });
  return {
    inventario: inv.map(function (i) {
      var enTec = 0; Object.keys(s.tecnicos).forEach(function (r) { enTec += s.tecnicos[r][i.codigo] || 0; });
      i.bodega = Math.round((s.bodega[i.codigo] || 0) * 100) / 100; i.tecnicos = Math.round(enTec * 100) / 100; return i;
    }),
    porTecnico: porTec,
    movimientos: rows_('MOV_INV').slice(-400).reverse().map(movLite_),
    facturas: rows_('FACTURAS').slice(-200).reverse().map(facturaLite_),
    personas: per, categorias: CATEGORIAS_INV, solicitudes: solicitudesPendientes_()
  };
}
/** Alta o edición de un artículo del catálogo. a = {codigo?, nombre, categoria, unidad, minimo, activo, obs} */
function apiGuardarArticulo(token, a) {
  auth_(token, ROLES_BODEGA);
  if (!a || !String(a.nombre || '').trim()) throw new Error('Escribe el nombre del artículo.');
  if (CATEGORIAS_INV.indexOf(a.categoria) < 0) throw new Error('Elige la categoría.');
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var ex = a.codigo ? rows_('INVENTARIO').filter(function (x) { return String(x.codigo) === String(a.codigo); })[0] : null;
    var dup = rows_('INVENTARIO').filter(function (x) { return normTxt_(x.nombre) === normTxt_(a.nombre) && (!ex || x._row !== ex._row); })[0];
    if (dup) throw new Error('Ya existe "' + dup.nombre + '" (' + dup.codigo + ').');
    var o = { nombre: String(a.nombre).trim(), categoria: a.categoria, unidad: a.unidad || 'unidad', minimo: num_(a.minimo), activo: a.activo === 'NO' ? 'NO' : 'SI', obs: a.obs || '' };
    if (ex) update_('INVENTARIO', ex._row, o);
    else { o.codigo = siguienteCodigo_(a.categoria); o.creado = new Date(); append_('INVENTARIO', o); }
  } finally { lock.releaseLock(); }
  return apiBodega(token);
}

/**
 * Ingreso a bodega con factura o guía.
 * f = {fecha, tipo_doc, numero, proveedor, rut_proveedor, monto, obs, items:[{codigo, cantidad, precio, series}], archivo:{mime,data}, firma (png b64), recibido_por}
 */
function apiIngresoFactura(token, f) {
  var u = auth_(token, ROLES_BODEGA);
  f = f || {};
  if (!String(f.numero || '').trim()) throw new Error('Escribe el número de la factura o guía.');
  if (!String(f.proveedor || '').trim()) throw new Error('Escribe el proveedor.');
  if (!f.firma) throw new Error('Falta la firma de quien recibe.');
  var inv = {}; inventario_(true).forEach(function (i) { inv[i.codigo] = i; });
  var items = (f.items || []).filter(function (x) { return x.codigo && num_(x.cantidad) > 0; }).map(function (x) {
    var i = inv[x.codigo]; if (!i) throw new Error('Artículo ' + x.codigo + ' no existe.');
    return { codigo: i.codigo, nombre: i.nombre, unidad: i.unidad, cantidad: num_(x.cantidad), precio: num_(x.precio), series: seriesDe_(x.series) };
  });
  if (!items.length) throw new Error('Agrega al menos un artículo con cantidad.');
  var dupF = rows_('FACTURAS').filter(function (x) { return String(x.numero).trim() === String(f.numero).trim() && normTxt_(x.proveedor) === normTxt_(f.proveedor); })[0];
  if (dupF && !f.confirmarDuplicado) throw new Error('La factura ' + f.numero + ' de ' + f.proveedor + ' ya fue ingresada el ' + f10_(dupF.fecha) + '.');

  var id = nuevoId_('FAC'), fecha = f.fecha || hoy_(), carpeta = carpetaDe_('bodega', 'Ingresos con factura', fmt_(new Date(), 'yyyy-MM'));
  var archivoUrl = f.archivo && f.archivo.data ? guardarArchivo_(carpeta, f.archivo, 'Factura_' + String(f.numero).replace(/\W+/g, '')) : '';
  var firmaUrl = guardarArchivo_(carpeta, { mime: 'image/png', data: f.firma }, 'Firma_ingreso_' + id);
  var fac = { id: id, fecha: fecha, numero: String(f.numero).trim(), tipo_doc: f.tipo_doc || 'Factura', proveedor: String(f.proveedor).trim(), rut_proveedor: f.rut_proveedor || '',
    monto: num_(f.monto) || items.reduce(function (a, x) { return a + x.cantidad * x.precio; }, 0), items: JSON.stringify(items), archivo_url: archivoUrl,
    recibido_por: f.recibido_por || u.nombre, firma_url: firmaUrl, usuario: u.nombre, obs: f.obs || '', creado: new Date() };
  var pdf = Utilities.newBlob(htmlIngreso_(fac, items, 'data:image/png;base64,' + f.firma, cfg_()), 'text/html', 'i.html').getAs('application/pdf')
    .setName('Ingreso_bodega_' + fecha + '_' + fac.tipo_doc + '_' + fac.numero.replace(/\W+/g, '') + '.pdf');
  fac.pdf_url = carpeta.createFile(pdf).getUrl();

  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    append_('FACTURAS', fac);
    movs_(items.map(function (x) {
      return { id: nuevoId_('MV'), fecha: fmt_(new Date()), tipo: 'Ingreso', codigo: x.codigo, nombre: x.nombre, cantidad: x.cantidad,
        ref: fac.tipo_doc + ' ' + fac.numero + ' · ' + fac.proveedor, factura_id: id, usuario: u.nombre, obs: x.series.length ? 'Series: ' + x.series.join(', ') : '' };
    }));
  } finally { lock.releaseLock(); }
  // equipos con serie (ONT, decodificadores…) quedan también en el inventario de Equipos
  var conSerie = [];
  items.forEach(function (x) {
    var tipo = (inv[x.codigo] || {}).serializado;
    x.series.forEach(function (s) { conSerie.push({ serie: s, tipo: tipo || x.nombre, modelo: x.nombre, estado: 'En bodega' }); });
  });
  if (conSerie.length) try { apiIngresarEquipos(token, conSerie); } catch (e) { Logger.log('Series del ingreso: ' + e); }
  var r = apiBodega(token); r.pdf_url = fac.pdf_url; return r;
}
function htmlIngreso_(fac, items, firmaData, c) {
  var $ = function (n) { return n ? '$' + Math.round(n).toLocaleString('es-CL') : ''; }, tot = 0;
  var filas = items.map(function (x, i) {
    var sub = x.cantidad * x.precio; tot += sub;
    return '<tr><td>' + (i + 1) + '</td><td>' + esc_(x.codigo) + '</td><td>' + esc_(x.nombre) + (x.series.length ? '<br><small>Series: ' + esc_(x.series.join(', ')) + '</small>' : '') +
      '</td><td style="text-align:right">' + x.cantidad + ' ' + esc_(x.unidad) + '</td><td style="text-align:right">' + $(x.precio) + '</td><td style="text-align:right">' + $(sub) + '</td></tr>';
  }).join('');
  return '<html><head><meta charset="utf-8"><style>body{font-family:Arial;font-size:12px;margin:28px 40px}table{width:100%;border-collapse:collapse}' +
    'th,td{border:1px solid #999;padding:5px;vertical-align:top}th{background:#23306b;color:#fff}h2{margin:18px 0 10px}</style></head><body>' +
    '<table style="border:0"><tr><td style="border:0">' + logoImg_(70) + '</td><td style="border:0;text-align:right"><b>' + esc_(c.razon_social || c.empresa || '') + '</b><br>RUT ' + esc_(c.rut_empresa || '') + '</td></tr></table>' +
    '<h2>Registro de ingreso a bodega</h2>' +
    '<table><tr><th>Documento</th><th>N°</th><th>Fecha</th><th>Proveedor</th><th>RUT proveedor</th></tr><tr><td>' + esc_(fac.tipo_doc) + '</td><td>' + esc_(fac.numero) +
    '</td><td>' + esc_(fac.fecha) + '</td><td>' + esc_(fac.proveedor) + '</td><td>' + esc_(fac.rut_proveedor) + '</td></tr></table><br>' +
    '<table><tr><th>#</th><th>Código</th><th>Material</th><th>Cantidad</th><th>Precio unit. neto</th><th>Subtotal</th></tr>' + filas +
    (tot ? '<tr><td colspan="5" style="text-align:right"><b>Total neto</b></td><td style="text-align:right"><b>' + $(tot) + '</b></td></tr>' : '') + '</table>' +
    (fac.obs ? '<p><b>Observaciones:</b> ' + esc_(fac.obs) + '</p>' : '') +
    '<p>Declaro haber recibido conforme los materiales detallados, en las cantidades indicadas, los que quedan en la bodega de la empresa.</p>' +
    '<table style="border:0;margin-top:30px"><tr><td style="border:0;width:50%;text-align:center"><img src="' + firmaData + '" style="height:70px"><div style="border-top:1px solid #000;margin:0 30px"></div>' +
    esc_(fac.recibido_por) + '<br><small>Recibe en bodega</small></td><td style="border:0"></td></tr></table>' +
    '<p style="color:#777;font-size:10px;margin-top:30px">Registro ' + esc_(fac.id) + ' · ingresado por ' + esc_(fac.usuario) + ' el ' + fmt_(new Date(), 'dd-MM-yyyy HH:mm') +
    (fac.archivo_url ? ' · Respaldo: ' + esc_(fac.archivo_url) : '') + '</p></body></html>';
}

/** Ajuste de inventario, devolución del técnico a bodega o baja. m = {tipo, codigo, cantidad, rut?, obs} */
function apiMovimientoBodega(token, m) {
  var u = auth_(token, ROLES_BODEGA);
  m = m || {};
  var tipos = ['Devolución', 'Ajuste', 'Ajuste técnico', 'Baja'];
  if (tipos.indexOf(m.tipo) < 0) throw new Error('Movimiento no válido.');
  var i = inventario_(true).filter(function (x) { return x.codigo === String(m.codigo); })[0];
  if (!i) throw new Error('Elige el artículo.');
  var q = num_(m.cantidad);
  if (!q) throw new Error('Escribe la cantidad.');
  if ((m.tipo === 'Devolución' || m.tipo === 'Baja') && q < 0) throw new Error('La cantidad debe ser positiva.');
  if (/Ajuste/.test(m.tipo) && !String(m.obs || '').trim()) throw new Error('Explica el motivo del ajuste.');
  var p = null;
  if (m.tipo === 'Devolución' || m.tipo === 'Ajuste técnico') { p = persona_(m.rut); if (!p) throw new Error('Elige el técnico.'); }
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var s = saldos_();
    if (m.tipo === 'Devolución' && q > ((s.tecnicos[p.rut] || {})[i.codigo] || 0) + 1e-9) throw new Error(p.nombre + ' solo tiene ' + (((s.tecnicos[p.rut] || {})[i.codigo]) || 0) + ' ' + i.unidad + ' de ' + i.nombre + '.');
    if (m.tipo === 'Baja' && q > (s.bodega[i.codigo] || 0) + 1e-9) throw new Error('En bodega solo hay ' + (s.bodega[i.codigo] || 0) + ' ' + i.unidad + '.');
    movs_([{ id: nuevoId_('MV'), fecha: fmt_(new Date()), tipo: m.tipo === 'Baja' ? 'Ajuste' : m.tipo, codigo: i.codigo, nombre: i.nombre,
      cantidad: m.tipo === 'Baja' ? -q : q, rut: p ? p.rut : '', tecnico: p ? p.nombre : '', ref: m.tipo === 'Baja' ? 'Baja / merma' : m.tipo, usuario: u.nombre, obs: m.obs || '' }]);
  } finally { lock.releaseLock(); }
  return apiBodega(token);
}

/** Descuenta del técnico lo que usó (OT o falla). items=[{codigo, cantidad}] */
function consumir_(u, items, ref, ticketId) {
  var inv = {}; inventario_(true).forEach(function (i) { inv[i.codigo] = i; });
  var L = (items || []).filter(function (x) { return x && inv[String(x.codigo)] && num_(x.cantidad) > 0; }).map(function (x) {
    var i = inv[String(x.codigo)];
    return { id: nuevoId_('MV'), fecha: fmt_(new Date()), tipo: 'Consumo', codigo: i.codigo, nombre: i.nombre, cantidad: num_(x.cantidad),
      rut: u.rut, tecnico: u.nombre, ref: ref, ticket_id: ticketId || '', usuario: u.nombre };
  });
  if (!L.length) return 0;
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try { movs_(L); } finally { lock.releaseLock(); }
  return L.length;
}

/** Al registrar una entrega: valida stock y descuenta de bodega lo que viene del catálogo. */
function salidaEntrega_(items, p, u, entregaId) {
  var inv = {}; inventario_(true).forEach(function (i) { inv[i.codigo] = i; });
  var s = saldos_(), pedido = {};
  items.forEach(function (x) { if (x.codigo && inv[x.codigo]) pedido[x.codigo] = (pedido[x.codigo] || 0) + num_(x.cantidad || 1); });
  Object.keys(pedido).forEach(function (c) {
    var hay = s.bodega[c] || 0;
    if (pedido[c] > hay + 1e-9) throw new Error('No alcanza el stock de ' + inv[c].nombre + ': hay ' + hay + ' ' + inv[c].unidad + ' en bodega.');
  });
  movs_(Object.keys(pedido).map(function (c) {
    return { id: nuevoId_('MV'), fecha: fmt_(new Date()), tipo: 'Entrega', codigo: c, nombre: inv[c].nombre, cantidad: pedido[c], rut: p.rut, tecnico: p.nombre,
      ref: 'Entrega ' + entregaId, usuario: u.nombre };
  }));
}

function exportar_(nombre, hojas, formato) {
  var carpeta = carpetaBodega_('EXPORTES');
  var ss = SpreadsheetApp.create(nombre);
  DriveApp.getFileById(ss.getId()).moveTo(carpeta);
  hojas.forEach(function (h, k) {
    var sh = k === 0 ? ss.getSheets()[0].setName(h.nombre) : ss.insertSheet(h.nombre);
    var datos = [h.cols].concat(h.filas.length ? h.filas.map(function (f) { return f.map(limpia_); }) : [h.cols.map(function (c, i) { return i ? '' : 'Sin datos'; })]);
    sh.getRange(1, 1, datos.length, h.cols.length).setValues(datos);
    sh.getRange(1, 1, 1, h.cols.length).setFontWeight('bold').setBackground('#23306b').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    try { sh.autoResizeColumns(1, h.cols.length); } catch (e) {}
  });
  SpreadsheetApp.flush();
  var pdf = formato === 'pdf';
  var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=' +
    (pdf ? 'pdf&portrait=false&fitw=true&size=letter&gridlines=false&sheetnames=true&printtitle=true' : 'xlsx');
  var blob = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob().setName(nombre + (pdf ? '.pdf' : '.xlsx'));
  var archivo = carpeta.createFile(blob);
  return { nombre: blob.getName(), mime: pdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    data: Utilities.base64Encode(blob.getBytes()), url: archivo.getUrl(), planilla: ss.getUrl() };
}
function enRango_(f, fl) { f = f10_(f); return (!fl.desde || f >= fl.desde) && (!fl.hasta || f <= fl.hasta); }

/** Planillas: 'bodega' (stock + movimientos + ingresos), 'entregas', 'prestamos', 'fallas' */
function apiExportar(token, que, fl, formato) {
  var u = auth_(token, ROLES_PANEL);
  fl = fl || {};
  var rango = (fl.desde || 'inicio') + '_a_' + (fl.hasta || hoy_());
  if (que === 'bodega') {
    if (ROLES_BODEGA.indexOf(u.rol) < 0) throw new Error('No tienes permiso.');
    var b = apiBodega(token);
    var movs = rows_('MOV_INV').filter(function (m) { return enRango_(m.fecha, fl); }).map(movLite_);
    var facs = rows_('FACTURAS').filter(function (f) { return enRango_(f.fecha, fl); }).map(facturaLite_);
    var detFac = [];
    facs.forEach(function (f) { f.items.forEach(function (x) { detFac.push([f.fecha, f.tipo_doc, f.numero, f.proveedor, f.rut_proveedor, x.codigo, x.nombre, x.cantidad, x.unidad, x.precio || '', (x.precio || 0) * x.cantidad || '', f.recibido_por, f.pdf_url]); }); });
    var porTec = [];
    b.porTecnico.forEach(function (t) { t.items.forEach(function (x) { porTec.push([t.nombre, t.rut, x.codigo, x.nombre, x.cantidad, x.unidad]); }); });
    return exportar_('Bodega_' + rango, [
      { nombre: 'Stock', cols: ['Código', 'Artículo', 'Categoría', 'Unidad', 'En bodega', 'En técnicos', 'Total', 'Mínimo', 'Bajo mínimo'],
        filas: b.inventario.filter(function (i) { return i.activo !== 'NO'; }).map(function (i) { return [i.codigo, i.nombre, i.categoria, i.unidad, i.bodega, i.tecnicos, i.bodega + i.tecnicos, i.minimo || '', i.minimo && i.bodega < i.minimo ? 'SÍ' : '']; }) },
      { nombre: 'Por técnico', cols: ['Técnico', 'RUT', 'Código', 'Material', 'Cantidad', 'Unidad'], filas: porTec },
      { nombre: 'Movimientos', cols: ['Fecha', 'Tipo', 'Código', 'Artículo', 'Cantidad', 'Técnico', 'Referencia', 'Ticket', 'Registrado por', 'Observación'],
        filas: movs.map(function (m) { return [m.fecha, m.tipo, m.codigo, m.nombre, m.cantidad, m.tecnico, m.ref, m.ticket_id, m.usuario, m.obs]; }) },
      { nombre: 'Ingresos con factura', cols: ['Fecha', 'Documento', 'N°', 'Proveedor', 'RUT proveedor', 'Código', 'Material', 'Cantidad', 'Unidad', 'Precio neto', 'Subtotal', 'Recibió', 'Acta PDF'], filas: detFac }
    ], formato);
  }
  if (que === 'entregas') {
    var filas = [];
    rows_('ENTREGAS').filter(function (e) { return enRango_(e.fecha, fl); }).forEach(function (e) {
      json_(e.items, []).forEach(function (x) { filas.push([f10_(e.fecha), e.nombre, e.rut, x.tipo || '', x.codigo || '', x.elemento, num_(x.cantidad) || 1, x.talla || '', e.motivo, e.estado, e.fecha_firma, e.entregado_por, e.pdf_url]); });
    });
    return exportar_('Entregas_' + rango, [{ nombre: 'Entregas', cols: ['Fecha', 'Trabajador', 'RUT', 'Tipo', 'Código', 'Elemento', 'Cantidad', 'Talla', 'Motivo', 'Estado', 'Fecha firma', 'Entregado por', 'Comprobante'], filas: filas }], formato);
  }
  if (que === 'prestamos') {
    return exportar_('Prestamos_' + rango, [
      { nombre: 'Préstamos', cols: ['Equipo', 'Técnico', 'RUT', 'Entregado', 'Entregó', 'Estado al salir', 'Firma técnico', 'Devuelto', 'Recibió', 'Estado al volver', 'Observación', 'Días'],
        filas: rows_('PRESTAMOS').filter(function (p) { return enRango_(p.fecha_entrega, fl); }).map(function (p) {
          return [p.activo, p.nombre, p.rut, String(p.fecha_entrega).slice(0, 16), p.entregado_por, p.estado_salida, p.fecha_firma ? 'Firmado ' + p.fecha_firma : 'Pendiente',
            String(p.fecha_devolucion).slice(0, 16), p.recibido_por, p.estado_devolucion, [p.obs_salida, p.obs_devolucion].filter(String).join(' / '), diasPrestamo_(p)];
        }) },
      { nombre: 'Equipos', cols: ['Código', 'Equipo', 'Tipo', 'Marca', 'Modelo', 'Serie', 'Estado', 'En poder de', 'Desde'],
        filas: rows_('ACTIVOS').map(function (a) { return [a.id, a.nombre, a.tipo, a.marca, a.modelo, a.serie, a.estado, a.nombre_tecnico, f10_(a.desde)]; }) }
    ], formato);
  }
  if (que === 'fallas') {
    var F = rows_('FALLAS').filter(function (f) { return enRango_(f.inicio, fl); }).map(fallaLite_);
    var porTipo = {};
    F.forEach(function (f) { var t = porTipo[f.tipo] = porTipo[f.tipo] || [0, 0, 0]; t[0]++; t[1] += f.horas || 0; t[2] += (f.horas || 0) * (f.clientes || 0); });
    return exportar_('Fallas_' + rango, [
      { nombre: 'Fallas', cols: ['N°', 'Inicio', 'Fin', 'Horas sin servicio', 'Tipo de falla', 'Alcance', 'Sector', 'Comuna', 'Clientes afectados', 'Clientes × hora', 'Causa', 'Solución', 'Estado', 'Reportó', 'Cerró', 'Tickets', 'Fotos'],
        filas: F.map(function (f) { return [f.id, f.inicio, f.fin, f.horas, f.tipo, f.alcance, f.sector, f.comuna, f.clientes, Math.round((f.horas || 0) * (f.clientes || 0) * 100) / 100, f.causa, f.solucion, f.estado, f.reportado_por, f.cerrado_por, f.tickets.join(', '), f.fotos.concat(f.fotos_cierre).join(' ')]; }) },
      { nombre: 'Resumen por tipo', cols: ['Tipo de falla', 'N° fallas', 'Horas sin servicio', 'Clientes × hora'],
        filas: Object.keys(porTipo).map(function (k) { return [k, porTipo[k][0], Math.round(porTipo[k][1] * 100) / 100, Math.round(porTipo[k][2] * 100) / 100]; }) }
    ], formato);
  }
  throw new Error('Planilla desconocida.');
}

/* ---------- préstamos de equipos de medición y herramientas mayores ---------- */

function diasPrestamo_(p) {
  var a = new Date(f10_(p.fecha_entrega) + 'T12:00:00'), b = new Date((f10_(p.fecha_devolucion) || hoy_()) + 'T12:00:00');
  return f10_(p.fecha_entrega) ? Math.max(0, Math.round((b - a) / 864e5)) : '';
}
function prestamoLite_(p) {
  return { id: p.id, activo_id: p.activo_id, activo: p.activo, rut: p.rut, nombre: p.nombre, fecha_entrega: String(p.fecha_entrega).slice(0, 16), entregado_por: p.entregado_por,
    estado_salida: p.estado_salida, obs_salida: p.obs_salida, firmado: !!p.firma_url, fecha_firma: p.fecha_firma, fecha_devolucion: String(p.fecha_devolucion || '').slice(0, 16),
    recibido_por: p.recibido_por, estado_devolucion: p.estado_devolucion, obs_devolucion: p.obs_devolucion, pdf_url: p.pdf_url, dias: diasPrestamo_(p) };
}
function activoLite_(a) {
  return { id: a.id, nombre: a.nombre, tipo: a.tipo, marca: a.marca, modelo: a.modelo, serie: a.serie, estado: a.estado, rut: a.rut, nombre_tecnico: a.nombre_tecnico,
    desde: f10_(a.desde), obs: a.obs, activo: a.activo || 'SI' };
}
function apiPrestamos(token) {
  auth_(token, ROLES_BODEGA);
  return { activos: rows_('ACTIVOS').map(activoLite_), prestamos: rows_('PRESTAMOS').slice(-300).reverse().map(prestamoLite_), personas: personas_(), estados: ESTADOS_ACTIVO };
}
/** a = {id?, nombre, tipo, marca, modelo, serie, estado, obs, activo} */
function apiGuardarActivo(token, a) {
  auth_(token, ROLES_BODEGA);
  if (!a || !String(a.nombre || '').trim()) throw new Error('Escribe el nombre del equipo.');
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var ex = a.id ? rows_('ACTIVOS').filter(function (x) { return x.id === a.id; })[0] : null;
    var o = { nombre: String(a.nombre).trim(), tipo: a.tipo || 'Equipo de medición', marca: a.marca || '', modelo: a.modelo || '', serie: a.serie || '', obs: a.obs || '', activo: a.activo === 'NO' ? 'NO' : 'SI' };
    if (ex) {
      if (a.estado && a.estado !== ex.estado) {
        if (ex.estado === 'Prestado') throw new Error('Está prestado a ' + ex.nombre_tecnico + ': primero registra la devolución.');
        if (a.estado === 'Prestado') throw new Error('Para prestarlo usa el botón "Prestar".');
        o.estado = a.estado;
      }
      update_('ACTIVOS', ex._row, o);
    } else {
      var max = 0; rows_('ACTIVOS').forEach(function (x) { var m = String(x.id).match(/^A(\d+)$/); if (m) max = Math.max(max, Number(m[1])); });
      o.id = 'A' + ('00' + (max + 1)).slice(-3); o.estado = 'En administración'; o.creado = new Date();
      append_('ACTIVOS', o);
    }
  } finally { lock.releaseLock(); }
  return apiPrestamos(token);
}
/** Préstamo: p = {ids:[activo_id], rut, estado_salida, obs, firma?(png b64)} */
function apiPrestar(token, p) {
  var u = auth_(token, ROLES_BODEGA);
  p = p || {};
  var per = persona_(p.rut);
  if (!per) throw new Error('Elige a quién se le entrega.');
  var ids = [].concat(p.ids || []);
  if (!ids.length) throw new Error('Elige al menos un equipo.');
  var nuevos = [];
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var A = rows_('ACTIVOS'), ahora = fmt_(new Date(), 'yyyy-MM-dd HH:mm');
    ids.forEach(function (id) {
      var a = A.filter(function (x) { return x.id === id; })[0];
      if (!a) throw new Error('Equipo ' + id + ' no existe.');
      if (a.estado !== 'En administración') throw new Error(a.nombre + ' no está disponible (' + a.estado + (a.nombre_tecnico ? ': ' + a.nombre_tecnico : '') + ').');
    });
    ids.forEach(function (id) {
      var a = A.filter(function (x) { return x.id === id; })[0];
      var pr = { id: nuevoId_('PR'), activo_id: a.id, activo: a.nombre + (a.serie ? ' (S/N ' + a.serie + ')' : ''), rut: per.rut, nombre: per.nombre, fecha_entrega: ahora,
        entregado_por: u.nombre, estado_salida: p.estado_salida || 'Bueno', obs_salida: p.obs || '', creado: new Date() };
      append_('PRESTAMOS', pr); nuevos.push(pr.id);
      update_('ACTIVOS', a._row, { estado: 'Prestado', rut: per.rut, nombre_tecnico: per.nombre, desde: ahora });
    });
  } finally { lock.releaseLock(); }
  if (p.firma) nuevos.forEach(function (id) { firmarPrestamo_(per, id, p.firma); });
  return apiPrestamos(token);
}
function htmlPrestamo_(pr, firmaData, c) {
  return '<html><head><meta charset="utf-8"><style>body{font-family:Arial;font-size:13px;line-height:1.5;margin:30px 50px}td{vertical-align:top}</style></head><body>' +
    '<div style="text-align:right">' + logoImg_(70) + '</div><p style="text-align:right">' + esc_(c.ciudad || '') + ' ' + fechaLarga_(pr.fecha_entrega) + '</p>' +
    '<h2 style="text-decoration:underline">Préstamo de equipo de la empresa</h2>' +
    '<p>Se deja constancia que <b>' + esc_(pr.nombre) + '</b>, RUT ' + esc_(rutPuntos_(pr.rut)) + ', recibe en préstamo para uso exclusivo en trabajos de la empresa:</p>' +
    '<ul><li><b>' + esc_(pr.activo) + '</b> — estado al entregar: ' + esc_(pr.estado_salida) + (pr.obs_salida ? ' (' + esc_(pr.obs_salida) + ')' : '') + '</li></ul>' +
    '<p>Me comprometo a cuidarlo, usarlo según las instrucciones del fabricante y devolverlo a administración cuando se me solicite o al terminar el trabajo. ' +
    'Informaré de inmediato cualquier daño, falla o pérdida.</p>' +
    '<table style="width:100%;margin-top:40px;text-align:center"><tr><td style="width:50%"><img src="' + firmaData + '" style="height:66px"><div style="border-top:1px solid #000;margin:0 14px 4px"></div>' +
    esc_(pr.nombre) + '<br>RUT ' + esc_(rutPuntos_(pr.rut)) + '</td><td>&nbsp;<div style="height:66px"></div><div style="border-top:1px solid #000;margin:0 14px 4px"></div>' + esc_(pr.entregado_por) + '<br><small>Entrega</small></td></tr></table>' +
    '<p style="color:#777;font-size:10px;margin-top:40px">Firmado electrónicamente el ' + fmt_(new Date(), 'dd-MM-yyyy HH:mm') + ' · Registro ' + esc_(pr.id) + '</p></body></html>';
}
function firmarPrestamo_(per, id, firmaB64) {
  var folder = carpetaTrabajador_(per.rut, per.nombre);
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var pr = rows_('PRESTAMOS').filter(function (x) { return x.id === id; })[0];
    if (!pr || normRut_(pr.rut) !== normRut_(per.rut)) throw new Error('Préstamo no encontrado.');
    var firmaUrl = guardarArchivo_(folder, { mime: 'image/png', data: firmaB64 }, 'Firma_prestamo_' + id);
    var pdf = Utilities.newBlob(htmlPrestamo_(pr, 'data:image/png;base64,' + firmaB64, cfg_()), 'text/html', 'p.html').getAs('application/pdf')
      .setName('Prestamo_' + f10_(pr.fecha_entrega) + '_' + String(pr.activo).replace(/\W+/g, '_') + '.pdf');
    var url = sub_(folder, 'PRESTAMOS').createFile(pdf).getUrl();
    update_('PRESTAMOS', pr._row, { firma_url: firmaUrl, fecha_firma: fmt_(new Date(), 'yyyy-MM-dd HH:mm'), pdf_url: url });
  } finally { lock.releaseLock(); }
}
/** Devolución a administración: d = {id (préstamo), estado_devolucion, obs} */
function apiDevolverPrestamo(token, d) {
  var u = auth_(token, ROLES_BODEGA);
  d = d || {};
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var pr = rows_('PRESTAMOS').filter(function (x) { return x.id === d.id; })[0];
    if (!pr) throw new Error('Préstamo no encontrado.');
    if (pr.fecha_devolucion) throw new Error('Ya fue devuelto el ' + pr.fecha_devolucion + '.');
    var est = d.estado_devolucion || 'Bueno';
    if (est !== 'Bueno' && !String(d.obs || '').trim()) throw new Error('Describe el daño o lo que falta.');
    update_('PRESTAMOS', pr._row, { fecha_devolucion: fmt_(new Date(), 'yyyy-MM-dd HH:mm'), recibido_por: u.nombre, estado_devolucion: est, obs_devolucion: d.obs || '' });
    var a = rows_('ACTIVOS').filter(function (x) { return x.id === pr.activo_id; })[0];
    if (a) update_('ACTIVOS', a._row, { estado: est === 'Bueno' ? 'En administración' : 'En reparación', rut: '', nombre_tecnico: '', desde: fmt_(new Date(), 'yyyy-MM-dd HH:mm'),
      obs: est === 'Bueno' ? a.obs : ('Devuelto ' + est.toLowerCase() + ': ' + d.obs) });
  } finally { lock.releaseLock(); }
  return apiPrestamos(token);
}
function prestamosDe_(rut) {
  return rows_('PRESTAMOS').filter(function (p) { return normRut_(p.rut) === normRut_(rut) && !p.fecha_devolucion; }).map(prestamoLite_);
}

/* ---------- fallas de red ---------- */

function horasEntre_(a, b) {
  var x = new Date(String(a).replace(' ', 'T')), y = b ? new Date(String(b).replace(' ', 'T')) : new Date();
  return isNaN(x) || isNaN(y) ? 0 : Math.max(0, Math.round((y - x) / 36e5 * 100) / 100);
}
function fallaLite_(f) {
  var abierta = f.estado !== 'Cerrada';
  return { id: f.id, creado: String(f.creado).slice(0, 16), reportado_por: f.reportado_por, tipo: f.tipo, alcance: f.alcance, sector: f.sector, comuna: f.comuna,
    descripcion: f.descripcion, inicio: String(f.inicio).slice(0, 16), fin: String(f.fin || '').slice(0, 16),
    horas: abierta ? horasEntre_(f.inicio) : num_(f.horas), clientes: num_(f.clientes), tickets: json_(f.tickets, []), causa: f.causa, solucion: f.solucion,
    estado: f.estado || 'Abierta', fotos: json_(f.fotos, []), fotos_cierre: json_(f.fotos_cierre, []), lat: f.lat, lng: f.lng, carpeta_url: f.carpeta_url,
    materiales: json_(f.materiales, []), cerrado_por: f.cerrado_por };
}
function fotosFalla_(carpeta, fotos, pre) {
  return (fotos || []).slice(0, 12).map(function (d, i) {
    var data = String(d.data || d).replace(/^data:[^,]+,/, '');
    return carpeta.createFile(Utilities.newBlob(Utilities.base64Decode(data), 'image/jpeg', pre + '_' + fmt_(new Date(), 'yyyyMMdd_HHmmss') + '_' + (i + 1) + '.jpg')).getUrl();
  });
}
function fechaHora_(v) {
  var s = String(v || '').replace('T', ' ').slice(0, 16);
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) throw new Error('Fecha y hora no válidas.');
  return s;
}
function avisarFalla_(f, cerrada) {
  try {
    var c = cfg_(), to = c.correo_notificaciones;
    if (!to) return;
    MailApp.sendEmail(to, (cerrada ? 'Falla cerrada: ' : '⚠ Falla de red: ') + f.tipo + ' · ' + (f.sector || f.comuna || ''),
      (cerrada ? 'Se cerró la falla ' + f.id + '. Horas sin servicio: ' + f.horas + '.\nCausa: ' + (f.causa || '') + '\nSolución: ' + (f.solucion || '')
        : 'Se reportó una falla de red.\nTipo: ' + f.tipo + '\nAlcance: ' + (f.alcance || '') + '\nSector: ' + (f.sector || '') + ' ' + (f.comuna || '') +
          '\nInicio: ' + f.inicio + '\nClientes afectados (aprox.): ' + (f.clientes || '?') + '\nReportó: ' + f.reportado_por + '\n\n' + (f.descripcion || '')) +
      '\n\nFotos: ' + (f.carpeta_url || ''));
  } catch (e) {}
}
/** Reporta una falla (técnico desde la app o soporte desde el panel). d = {tipo, alcance, sector, comuna, inicio, clientes, descripcion, fotos:[b64], geo, tickets} */
function apiReportarFalla(token, d) {
  var u = auth_(token);
  d = d || {};
  if (TIPOS_FALLA.indexOf(d.tipo) < 0) throw new Error('Elige el tipo de falla.');
  if (!String(d.sector || d.comuna || '').trim()) throw new Error('Indica el sector o la comuna afectada.');
  var inicio = d.inicio ? fechaHora_(d.inicio) : fmt_(new Date(), 'yyyy-MM-dd HH:mm');
  var id = 'FA' + fmt_(new Date(), 'yyMMddHHmm') + Utilities.getUuid().replace(/-/g, '').slice(0, 3).toUpperCase();
  var carpeta = carpetaDe_('fallas', fmt_(new Date(), 'yyyy-MM'), fmt_(new Date(), 'yyyy-MM-dd') + ' ' + id);
  var fotos = fotosFalla_(carpeta, d.fotos, 'Falla');
  var geo = d.geo || {};
  var f = { id: id, creado: fmt_(new Date()), reportado_por: u.nombre, reportado_rut: u.rut, tipo: d.tipo, alcance: d.alcance || ALCANCES_FALLA[0], sector: d.sector || '',
    comuna: d.comuna || '', descripcion: d.descripcion || '', inicio: inicio, clientes: num_(d.clientes) || '', tickets: JSON.stringify([].concat(d.tickets || [])),
    estado: 'Abierta', fotos: JSON.stringify(fotos), fotos_cierre: '[]', lat: geo.lat || '', lng: geo.lng || '', carpeta_url: carpeta.getUrl(), actualizado: new Date() };
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try { append_('FALLAS', f); } finally { lock.releaseLock(); }
  avisarFalla_(f, false);
  return { ok: true, id: id, fallas: fallasAbiertas_() };
}
/** Agrega fotos o datos a una falla abierta, o la cierra. d = {id, fotos, descripcion?, clientes?, tickets?, cerrar:{fin, causa, solucion, materiales:[{codigo,cantidad}], cerrarTickets}} */
function apiActualizarFalla(token, d) {
  var u = auth_(token);
  d = d || {};
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  var f, cambios = { actualizado: new Date() }, cerrada = false;
  try {
    f = rows_('FALLAS').filter(function (x) { return x.id === d.id; })[0];
    if (!f) throw new Error('Falla no encontrada.');
    var panel = ROLES_PANEL.indexOf(u.rol) >= 0;
    if (f.estado === 'Cerrada' && !panel) throw new Error('Esta falla ya está cerrada.');
    var carpeta = carpetaDeFalla_(f);
    if (d.cerrar) {
      var fin = d.cerrar.fin ? fechaHora_(d.cerrar.fin) : fmt_(new Date(), 'yyyy-MM-dd HH:mm');
      if (fin < String(f.inicio).slice(0, 16)) throw new Error('La hora de término es anterior al inicio.');
      if (!String(d.cerrar.causa || '').trim()) throw new Error('Describe la causa.');
      cambios.fin = fin; cambios.horas = horasEntre_(f.inicio, fin); cambios.causa = d.cerrar.causa; cambios.solucion = d.cerrar.solucion || '';
      cambios.estado = 'Cerrada'; cambios.cerrado_por = u.nombre;
      cambios.fotos_cierre = JSON.stringify(json_(f.fotos_cierre, []).concat(fotosFalla_(carpeta, d.fotos, 'Cierre')));
      if (d.cerrar.materiales && d.cerrar.materiales.length) cambios.materiales = JSON.stringify(d.cerrar.materiales);
      cerrada = true;
    } else if (d.fotos && d.fotos.length) {
      cambios.fotos = JSON.stringify(json_(f.fotos, []).concat(fotosFalla_(carpeta, d.fotos, 'Falla')));
    }
    ['descripcion', 'sector', 'comuna', 'alcance'].forEach(function (k) { if (d[k] !== undefined) cambios[k] = d[k]; });
    if (d.tipo !== undefined) { if (TIPOS_FALLA.indexOf(d.tipo) < 0) throw new Error('Tipo de falla no válido.'); cambios.tipo = d.tipo; }
    if (d.clientes !== undefined) cambios.clientes = num_(d.clientes) || '';
    if (d.inicio) { cambios.inicio = fechaHora_(d.inicio); if (f.estado === 'Cerrada') cambios.horas = horasEntre_(cambios.inicio, f.fin); }
    if (d.tickets !== undefined) cambios.tickets = JSON.stringify([].concat(d.tickets || []));
    update_('FALLAS', f._row, cambios);
  } finally { lock.releaseLock(); }
  if (cerrada) {
    if (d.cerrar.materiales) consumir_(u, d.cerrar.materiales, 'Falla ' + f.id, '');
    if (d.cerrar.cerrarTickets) cerrarTicketsFalla_(json_(cambios.tickets || f.tickets, []), f.id, u);
    for (var k in cambios) f[k] = cambios[k];
    avisarFalla_(f, true);
  }
  return { ok: true, fallas: fallasAbiertas_() };
}
function carpetaDeFalla_(f) {
  var m = String(f.carpeta_url || '').match(/folders\/([\w-]+)/) || String(f.carpeta_url || '').match(/id=([\w-]+)/);
  if (m) try { return DriveApp.getFolderById(m[1]); } catch (e) {}
  return carpetaDe_('fallas', String(f.creado).slice(0, 7), String(f.creado).slice(0, 10) + ' ' + f.id);
}
function cerrarTicketsFalla_(ids, fallaId, u) {
  if (!ids.length) return;
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    rows_('TICKETS').forEach(function (t) {
      if (ids.indexOf(t.id) < 0 || t.estado === 'Cerrado' || t.estado === 'Anulado') return;
      update_('TICKETS', t._row, { estado: 'Cerrado', cerrado: new Date(), actualizado: new Date(),
        notas: (t.notas ? t.notas + '\n' : '') + fmt_(new Date(), 'dd-MM HH:mm') + ' Cerrado por ' + u.nombre + ': resuelto con la falla de red ' + fallaId + '.' });
    });
  } finally { lock.releaseLock(); }
}
function fallasAbiertas_() { return rows_('FALLAS').filter(function (f) { return f.estado !== 'Cerrada'; }).map(fallaLite_).reverse(); }
/** Panel: lista e indicadores. fl = {desde, hasta} */
function apiFallas(token, fl) {
  auth_(token, ROLES_PANEL);
  fl = fl || {};
  var F = rows_('FALLAS').map(fallaLite_).filter(function (f) { return f.estado !== 'Cerrada' || enRango_(f.inicio, fl); })
    .sort(function (a, b) { return (a.estado === 'Cerrada') - (b.estado === 'Cerrada') || (a.inicio < b.inicio ? 1 : -1); });
  var abiertos = rows_('TICKETS').filter(function (t) { return t.estado !== 'Cerrado' && t.estado !== 'Anulado'; })
    .map(function (t) { return { id: t.id, cliente: t.cliente, comuna: t.comuna, direccion: t.direccion, tipo: t.tipo, creado: String(t.creado).slice(0, 16) }; });
  return { fallas: F, tipos: TIPOS_FALLA, alcances: ALCANCES_FALLA, ticketsAbiertos: abiertos, comunas: comunas_() };
}

/* ===================== BORRAR REGISTROS CARGADOS POR ERROR ===================== */
/* Lo borrado queda en la hoja PAPELERA (copia completa de la fila) por si hay que recuperarlo. */

var BORRABLES = {
  bib: ['BIBLIOTECA', 'id', ROLES_EDITOR], cap: ['CAPACITACIONES', 'id', ROLES_EDITOR], act: ['ACTIVIDADES', 'id', ROLES_EDITOR],
  doc: ['DOCUMENTOS', 'id', ROLES_EDITOR], ent: ['ENTREGAS', 'id', ROLES_EDITOR], fon: ['FONDOS', 'id', ROLES_GESTION],
  fac: ['FACTURAS', 'id', ROLES_GESTION], mov: ['MOV_INV', 'id', ROLES_GESTION], art: ['INVENTARIO', 'codigo', ROLES_GESTION],
  activo: ['ACTIVOS', 'id', ROLES_GESTION], pre: ['PRESTAMOS', 'id', ROLES_GESTION], fal: ['FALLAS', 'id', ROLES_GESTION],
  reg: ['REGISTROS', 'id', ['admin']], caja: ['CAJA', 'id', ROLES_GESTION], infra: ['INFRA', 'id', ROLES_GESTION], mant: ['MANTENCIONES', 'id', ROLES_GESTION]
};
function aPapelera_(hoja, filas, u, motivo) {
  filas.slice().sort(function (a, b) { return b._row - a._row; }).forEach(function (f) {
    var row = f._row, copia = {};
    for (var k in f) if (k !== '_row') copia[k] = f[k];
    append_('PAPELERA', { fecha: fmt_(new Date()), hoja: hoja, id: String(f.id || f.codigo || ''), usuario: u.nombre, motivo: motivo || '', datos: JSON.stringify(copia).slice(0, 49000) });
    sh_(hoja).deleteRow(row);
    fresco_();
  });
}
/** Revisa que, sin esos movimientos, ningún stock quede negativo. */
function validarSinMovs_(ids) {
  var fuera = {}; ids.forEach(function (x) { fuera[x] = 1; });
  var cat = {}, nom = {}, b = {}, t = {};
  inventario_(true).forEach(function (i) { cat[i.codigo] = i.categoria; nom[i.codigo] = i.nombre; });
  rows_('MOV_INV').forEach(function (m) {
    if (fuera[m.id]) return;
    var c = String(m.codigo), e = efectoMov_(m, cat[c]);
    b[c] = (b[c] || 0) + e[0];
    if (e[1] && m.rut) { var k = normRut_(m.rut) + '|' + c; t[k] = (t[k] || 0) + e[1]; }
  });
  var afect = {}; rows_('MOV_INV').forEach(function (m) { if (fuera[m.id]) afect[String(m.codigo)] = 1; });
  Object.keys(afect).forEach(function (c) {
    if ((b[c] || 0) < -1e-9) throw new Error('No se puede: ' + nom[c] + ' quedaría en ' + Math.round(b[c] * 100) / 100 + ' en bodega (ya se entregó o usó). Corrige con un ajuste.');
  });
  Object.keys(t).forEach(function (k) {
    var c = k.split('|')[1];
    if (afect[c] && t[k] < -1e-9) throw new Error('No se puede: el técnico ya usó parte de ' + nom[c] + '. Registra una devolución o un ajuste en vez de borrar.');
  });
}
function papeleraDrive_(url) { try { var id = idDrive_(url); if (id) DriveApp.getFileById(id).setTrashed(true); } catch (e) {} }

/** Borra un registro hecho por error. tipo: bib, cap, act, doc, ent, fon, fac, mov, art, activo, pre, fal, reg */
function apiEliminar(token, tipo, id, motivo) {
  var def = BORRABLES[tipo];
  if (!def) throw new Error('No se puede borrar ese tipo de registro.');
  var u = auth_(token, def[2]);
  var hoja = def[0], clave = def[1];
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var f = rows_(hoja).filter(function (x) { return String(x[clave]) === String(id); })[0];
    if (!f) throw new Error('Ese registro ya no existe.');
    var movs = [];
    if (tipo === 'ent') movs = rows_('MOV_INV').filter(function (m) { return m.ref === 'Entrega ' + id; });
    if (tipo === 'fac') movs = rows_('MOV_INV').filter(function (m) { return m.factura_id === id; });
    if (tipo === 'reg') movs = rows_('MOV_INV').filter(function (m) { return m.tipo === 'Consumo' && / · R\w+$/.test(m.ref) && String(m.ref).slice(-String(id).length) === String(id); });
    if (tipo === 'mov') {
      if (['Ajuste', 'Ajuste técnico', 'Devolución'].indexOf(f.tipo) < 0)
        throw new Error('Este movimiento viene de ' + (f.tipo === 'Ingreso' ? 'una factura' : f.tipo === 'Entrega' ? 'una entrega' : 'una OT o falla') + ': borra ese registro en vez del movimiento.');
      validarSinMovs_([f.id]);
    }
    if (movs.length) validarSinMovs_(movs.map(function (m) { return m.id; }));
    if (tipo === 'art' && rows_('MOV_INV').some(function (m) { return String(m.codigo) === String(id); }))
      throw new Error('Este artículo ya tiene movimientos. En vez de borrarlo, edítalo y márcalo como inactivo.');
    if (tipo === 'activo' && rows_('PRESTAMOS').some(function (p) { return p.activo_id === id; }))
      throw new Error('Este equipo tiene préstamos registrados. En vez de borrarlo, edítalo y márcalo como inactivo.');
    if (tipo === 'pre' && !f.fecha_devolucion) {
      var a = rows_('ACTIVOS').filter(function (x) { return x.id === f.activo_id; })[0];
      if (a && a.estado === 'Prestado' && normRut_(a.rut) === normRut_(f.rut)) update_('ACTIVOS', a._row, { estado: 'En administración', rut: '', nombre_tecnico: '', desde: fmt_(new Date(), 'yyyy-MM-dd HH:mm') });
    }
    if (movs.length) aPapelera_('MOV_INV', movs, u, 'Junto con ' + hoja + ' ' + id);
    f = rows_(hoja).filter(function (x) { return String(x[clave]) === String(id); })[0];
    aPapelera_(hoja, [f], u, motivo);
  } finally { lock.releaseLock(); }
  if (tipo === 'bib' || tipo === 'doc') papeleraDrive_(f.url);
  if (tipo === 'fac' && f.archivo_url) papeleraDrive_(f.archivo_url);
  return { ok: true };
}

/* ===================== PESTAÑAS DEL PANEL POR ROL ===================== */

var PESTANAS_OCULTAS_INICIAL = { prevencionista: ['fallas', 'vehiculos'] };
/** Pestañas que no ve un rol: las de su rol + los módulos que la empresa apagó (estos tampoco los ve el admin). */
function ocultasDe_(rol) {
  var c = {}; try { c = cfg_(); } catch (e) {}
  var o = apagados_(c);
  if (rol !== 'admin') (pestanasOcultas_()[rol] || []).forEach(function (t) { if (o.indexOf(t) < 0) o.push(t); });
  return o;
}
function apagados_(c) { return [].concat(json_((c || {}).modulos_apagados || '[]', []) || []).map(String).filter(function (t) { return /^[a-z]+$/.test(t) && t !== 'hoy' && t !== 'config'; }); }
function pestanasOcultas_() {
  var c = {}; try { c = cfg_(); } catch (e) {}
  return c.pestanas_ocultas ? json_(c.pestanas_ocultas, PESTANAS_OCULTAS_INICIAL) : PESTANAS_OCULTAS_INICIAL;
}
/** o = {editor:[...], soporte:[...], prevencionista:[...]} pestañas que NO ve cada rol. */
function apiGuardarPestanas(token, o) {
  auth_(token, ['admin']);
  var limpio = {};
  ['editor', 'soporte', 'prevencionista'].forEach(function (r) {
    limpio[r] = [].concat((o || {})[r] || []).map(String).filter(function (t) { return /^[a-z]+$/.test(t) && t !== 'hoy'; });
  });
  var txt = JSON.stringify(limpio), fila = rows_('CONFIG').filter(function (r) { return r.clave === 'pestanas_ocultas'; })[0];
  if (fila) sh_('CONFIG').getRange(fila._row, 2).setValue(txt);
  else append_('CONFIG', { clave: 'pestanas_ocultas', valor: txt, descripcion: 'Pestañas del panel que no ve cada rol (se cambia en Configuración)' });
  return limpio;
}

/* ===================== ORDENAR DRIVE (se ejecuta una vez) ===================== */
/**
 * Mueve lo que ya estaba guardado a las carpetas numeradas nuevas. Mover no cambia los enlaces:
 * los PDF y fotos siguen abriendo igual desde el panel y la app.
 * Si hay muchos archivos y se acaba el tiempo, vuelve a ejecutarla: sigue donde quedó.
 */
function ordenarDrive() {
  var t0 = Date.now(), root = raiz_(), n = 0, props = props_();
  var tarde = function () { return Date.now() - t0 > 270000; };
  var falta = function () { Logger.log('Se movieron ' + n + ' elementos. Aún faltan: vuelve a ejecutar ordenarDrive para continuar.'); return 'PENDIENTE'; };
  var C = {}; Object.keys(CARPETAS).forEach(function (k) { C[k] = sub_(root, CARPETAS[k]); });
  var vieja = function (nombre, padre) { var it = (padre || root).getFoldersByName(nombre); while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) return f; } return null; };
  var vacia = function (f) { return !f.getFiles().hasNext() && !f.getFolders().hasNext(); };
  var botar = function (f) { if (f && vacia(f)) f.setTrashed(true); };
  /** Mueve todo lo de src a dest, juntando subcarpetas con el mismo nombre. */
  var fusionar = function (src, dest) {
    var it = src.getFiles();
    while (it.hasNext()) { if (tarde()) return false; it.next().moveTo(dest); n++; }
    var fo = src.getFolders();
    while (fo.hasNext()) {
      if (tarde()) return false;
      var s = fo.next(), d = vieja(s.getName(), dest);
      if (d && d.getId() !== s.getId()) { if (!fusionar(s, d)) return false; botar(s); } else if (!d) { s.moveTo(dest); n++; }
    }
    return true;
  };
  /** Recorre las subcarpetas de src (con iteradores nuevos, porque se van moviendo). */
  var cadaSub = function (src, fn) {
    for (var vuelta = 0; vuelta < 5; vuelta++) {
      var it = src.getFolders(), alguna = false;
      while (it.hasNext()) { if (tarde()) return false; alguna = true; if (fn(it.next()) === false) return false; }
      if (!alguna) return true;
    }
    return true;
  };
  var porFecha = function (src, destDe) {   // archivos sueltos: van a la carpeta que corresponde a su fecha
    var it = src.getFiles();
    while (it.hasNext()) { if (tarde()) return false; var f = it.next(); f.moveTo(destDe(fmt_(f.getDateCreated(), 'yyyy-MM'))); n++; }
    return true;
  };

  // 1. Formularios sin ticket que estaban en JORNADAS: incidentes, gastos y vehículos a su carpeta
  var R = rows_('REGISTROS'), desde = Number(props.getProperty('ORDENAR_REG') || 0);
  var mover = { INCIDENTE: 1, GASTOS: 1, BITACORA: 1, VEHICULO: 1 };
  for (var i = desde; i < R.length; i++) {
    if (tarde()) { props.setProperty('ORDENAR_REG', String(i)); return falta(); }
    var r = R[i];
    if (r.ticket_id || !mover[r.form_id]) continue;
    var fecha = new Date(String(r.fecha).replace(' ', 'T'));
    if (isNaN(fecha)) fecha = new Date();
    var dest = carpeta_(null, fecha, { nombre: r.tecnico_nombre }, { id: r.form_id }, json_(r.datos, {}));
    var ids = {}, txt = String(r.pdf_url) + ' ' + String(r.datos), m, re = /\/d\/([\w-]{20,})|[?&]id=([\w-]{20,})/g;
    while ((m = re.exec(txt))) ids[m[1] || m[2]] = 1;
    Object.keys(ids).forEach(function (id) {
      try { var file = DriveApp.getFileById(id), p = file.getParents(); if (!p.hasNext() || p.next().getId() !== dest.getId()) { file.moveTo(dest); n++; } } catch (e) {}
    });
  }
  props.setProperty('ORDENAR_REG', String(R.length));

  // 2. TICKETS → 01 TRABAJOS / año / mes
  var tk = vieja('TICKETS');
  if (tk) {
    var T = {}; rows_('TICKETS').forEach(function (t) { T[t.id] = t; });
    if (!cadaSub(tk, function (fo) {
      var t = T[fo.getName().split(' - ')[0]], mes = t && t.creado ? String(t.creado).slice(0, 7) : fmt_(fo.getDateCreated(), 'yyyy-MM');
      fo.moveTo(sub_(sub_(C.trabajos, mes.slice(0, 4)), mes)); n++;
    })) return falta();
    if (!fusionar(tk, C.trabajos)) return falta();
    botar(tk);
  }
  // 3. JORNADAS → 02 JORNADA DIARIA
  var jo = vieja('JORNADAS');
  if (jo) { if (!fusionar(jo, C.jornada)) return falta(); botar(jo); }
  // 4. TRABAJADORES (RUT - Nombre) → 06 PERSONAL (Nombre - RUT)
  var tr = vieja('TRABAJADORES');
  if (tr) {
    if (!cadaSub(tr, function (f2) {
      var nm = f2.getName(), mm = nm.match(/^([\dKk.\-]+) - (.+)$/), nuevoNom = mm ? mm[2] + ' - ' + mm[1] : nm;
      var ya = vieja(nuevoNom, C.personal);
      if (ya) { if (!fusionar(f2, ya)) return false; f2.setTrashed(true); } else { f2.setName(nuevoNom); f2.moveTo(C.personal); n++; }
    })) return falta();
    if (!fusionar(tr, C.personal)) return falta();
    botar(tr);
  }
  // 5. COMPROBANTES / mes → 04 GASTOS / mes / Comprobantes de pago
  var co = vieja('COMPROBANTES');
  if (co) {
    if (!cadaSub(co, function (f3) { if (!fusionar(f3, sub_(sub_(C.gastos, f3.getName()), 'Comprobantes de pago'))) return false; f3.setTrashed(true); })) return falta();
    if (!porFecha(co, function (m3) { return sub_(sub_(C.gastos, m3), 'Comprobantes de pago'); })) return falta();
    botar(co);
  }
  // 6. Biblioteca, capacitaciones y charlas
  var bi = vieja('BIBLIOTECA_SST');
  if (bi) { if (!fusionar(bi, C.biblioteca)) return falta(); botar(bi); }
  [['CAPACITACIONES', 'Capacitaciones'], ['ACTIVIDADES', 'Charlas y reuniones']].forEach(function (x) {
    var v = vieja(x[0]);
    if (v && porFecha(v, function (m4) { return sub_(sub_(C.capacitaciones, m4.slice(0, 4)), x[1]); }) && fusionar(v, C.capacitaciones)) botar(v);
  });
  if (tarde()) return falta();
  // 7. Fallas → 10 FALLAS DE RED / mes
  var fa = vieja('FALLAS');
  if (fa) {
    if (!cadaSub(fa, function (f4) { var m5 = (f4.getName().match(/^(\d{4}-\d{2})/) || [])[1] || fmt_(f4.getDateCreated(), 'yyyy-MM'); f4.moveTo(sub_(C.fallas, m5)); n++; })) return falta();
    botar(fa);
  }
  // 8. Bodega y carpetas del sistema
  var bo = vieja('BODEGA');
  if (bo) {
    var ing = vieja('INGRESOS', bo);
    if (ing) { if (!porFecha(ing, function (m6) { return sub_(sub_(C.bodega, 'Ingresos con factura'), m6); })) return falta(); botar(ing); }
    var ex = vieja('EXPORTES', bo);
    if (ex) { if (!fusionar(ex, sub_(C.sistema, 'Planillas exportadas'))) return falta(); botar(ex); }
    if (!fusionar(bo, C.bodega)) return falta();
    botar(bo);
  }
  var sis = [['EXPORTES', 'Planillas exportadas'], ['RESPALDOS', 'Respaldos'], ['CONFIG', 'Firmas del empleador']];
  for (var k = 0; k < sis.length; k++) {
    var v2 = vieja(sis[k][0]);
    if (v2) { if (!fusionar(v2, sub_(C.sistema, sis[k][1]))) return falta(); botar(v2); }
  }
  props.deleteProperty('ORDENAR_REG');
  Logger.log('Drive ordenado ✓ (' + n + ' elementos movidos). Los enlaces del panel y la app siguen funcionando.');
  return 'LISTO';
}

/* ===================== CHECKLISTS MENSUALES Y SOLICITUDES ===================== */

/** Al enviar un checklist con ítems "inventario": cada cosa que falta o que pide cambio queda como solicitud pendiente. */
function crearSolicitudes_(f, resp, reg, u) {
  var filas = [];
  itemsOf_(f).forEach(function (it) {
    if (it.tipo !== 'inventario' || !Array.isArray(resp[it.id])) return;
    resp[it.id].forEach(function (x) {
      if (!x || !x.item || (x.tengo && !x.cambio)) return;
      filas.push(x);
    });
  });
  if (!filas.length) return 0;
  var ahora = new Date(), k = 0;
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var sh = sh_('SOLICITUDES'), H = HOJAS.SOLICITUDES;
    var V = filas.map(function (x) {
      var o = { id: nuevoId_('SO') + (k++), fecha: ahora, registro_id: reg.id, form_id: f.id, patente: String(resp.patente || '').toUpperCase(),
        rut: u.rut, nombre: u.nombre, item: String(x.item).slice(0, 120),
        motivo: x.cambio ? (x.tengo ? 'Solicita cambio' : 'No cuenta con · solicita') : 'No cuenta con',
        estado: 'Pendiente', revisado_por: '', fecha_revision: '', obs: '', pdf_url: reg.pdf_url };
      return H.map(function (h) { return limpia_(o[h] === undefined ? '' : o[h]); });
    });
    sh.getRange(sh.getLastRow() + 1, 1, V.length, H.length).setValues(V);
    fresco_();
  } finally { lock.releaseLock(); }
  return filas.length;
}

function solicitudLite_(r) {
  return { id: r.id, fecha: fmtFecha_(r.fecha), registro_id: r.registro_id, form_id: r.form_id, patente: r.patente, rut: r.rut, nombre: r.nombre,
    item: r.item, motivo: r.motivo, estado: r.estado, revisado_por: r.revisado_por, fecha_revision: fmtFecha_(r.fecha_revision), obs: r.obs, pdf_url: r.pdf_url };
}
function fmtFecha_(v) { return v instanceof Date ? fmt_(v, 'yyyy-MM-dd HH:mm') : String(v || ''); }

/** Solicitudes + el último checklist mensual de cada camioneta y de cada técnico. */
function apiChecklists(token) {
  auth_(token, ROLES_PANEL);
  var sol = rows_('SOLICITUDES').map(solicitudLite_).reverse();
  var ult = {};
  rows_('REGISTROS').forEach(function (r) {
    if (r.form_id !== 'CHK_CAMIONETA' && r.form_id !== 'CHK_INDIVIDUAL') return;
    var d = json_(r.datos, {}), clave = r.form_id === 'CHK_CAMIONETA' ? String(d.patente || 'Sin patente').toUpperCase() : r.tecnico_nombre;
    var L = Array.isArray(d.insumos) ? d.insumos : [];
    ult[r.form_id + '|' + clave] = { form_id: r.form_id, clave: clave, fecha: fmtFecha_(r.fecha), tecnico: r.tecnico_nombre, pdf_url: r.pdf_url,
      total: L.length, tiene: L.filter(function (x) { return x.tengo; }).length, faltan: L.filter(function (x) { return !x.tengo; }).map(function (x) { return x.item; }),
      cambios: L.filter(function (x) { return x.cambio; }).map(function (x) { return x.item; }) };
  });
  return { solicitudes: sol, ultimos: Object.keys(ult).map(function (k) { return ult[k]; }).sort(function (a, b) { return a.clave < b.clave ? -1 : 1; }),
    patentes: patentesActivas_(), mes: fmt_(new Date(), 'yyyy-MM') };
}

/** El supervisor revisa: ids = [id], estado = Entregado | Rechazado | Pendiente */
function apiRevisarSolicitudes(token, ids, estado, obs) {
  var u = auth_(token, ROLES_BODEGA.concat(['prevencionista']));
  if (['Entregado', 'Rechazado', 'Pendiente'].indexOf(estado) < 0) throw new Error('Estado no válido.');
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    rows_('SOLICITUDES').forEach(function (r) {
      if ((ids || []).indexOf(r.id) < 0) return;
      update_('SOLICITUDES', r._row, { estado: estado, revisado_por: estado === 'Pendiente' ? '' : u.nombre, fecha_revision: estado === 'Pendiente' ? '' : new Date(), obs: obs || r.obs });
    });
  } finally { lock.releaseLock(); }
  return apiChecklists(token);
}
function solicitudesPendientes_() { try { return rows_('SOLICITUDES').filter(function (r) { return r.estado === 'Pendiente'; }).length; } catch (e) { return 0; } }

/* ===================== RED: OLT, NAP, MUFAS Y FACTIBILIDAD ===================== */

/* Código de colores de inspección de herramientas (procedimiento SIG-PT-01): cambia cada mes, rojo = no conformidad. */
var COLORES_MES = [['Verde', '🟩', '#43a047'], ['Blanco', '⬜', '#e0e0e0'], ['Amarillo', '🟨', '#fdd835'], ['Azul', '🟦', '#1e88e5']];
var MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function colorMes_(d) { d = d || new Date(); var m = Number(fmt_(d, 'yyyy-MM-dd').slice(5, 7)), x = COLORES_MES[(m - 1) % 4]; return { nombre: x[0], emoji: x[1], hex: x[2], mes: MESES_ES[m - 1] }; }
var TIPOS_RED = ['OLT', 'NAP', 'Mufa', 'Splitter', 'Poste', 'Otro'];

function redLite_(r) {
  var o = {}; HOJAS.RED.forEach(function (h) { o[h] = r[h] instanceof Date ? fmt_(r[h], 'yyyy-MM-dd HH:mm') : r[h]; });
  ['lat', 'lng', 'capacidad', 'ocupados', 'cupos'].forEach(function (k) { o[k] = o[k] === '' ? '' : Number(o[k]); });
  return o;
}
function apiRed(token) {
  auth_(token);   // también la usan los técnicos (mapa de cupos en la app)
  var c = cfg_();
  return { puntos: rows_('RED').map(redLite_).filter(function (p) { return !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== ''; }),
    tipos: TIPOS_RED, radio: Number(c.radio_factible) || 150, centro: centroClientes_() };
}
/** App de técnicos: mapa de red con los cupos al día (si Mikrowisp está conectado directo, refresca las NAP si la última lectura tiene más de 15 min). */
function apiRedVivo(token) {
  auth_(token);
  var c = cfg_(), m = mwCfg_(), nota = '';
  var ult = c.mw_red_ts ? new Date(String(c.mw_red_ts).replace(' ', 'T')) : null;
  var cache = cache_();
  if (m.url && m.token && (!ult || Date.now() - ult.getTime() > 15 * 60000) && !cache.get('red_intento')) {
    cache.put('red_intento', '1', 600);   // si Mikrowisp no responde, no reintentar en cada apertura (10 min)
    try { importarRed_(mapNapsMw_(mwLista_(mwPost_(m.naps, {}))), 'Mikrowisp'); setCfg_('mw_red_ts', fmt_(new Date(), 'yyyy-MM-dd HH:mm')); fresco_(); nota = 'recién'; }
    catch (e) { Logger.log('Red en vivo: ' + e); }
  }
  var r = apiRed(token);
  r.actualizado = nota === 'recién' ? 'recién leído de Mikrowisp' : (cfg_().mw_red_ts ? 'Mikrowisp ' + String(cfg_().mw_red_ts).slice(11, 16) : '');
  return r;
}
/** Centro del mapa cuando aún no hay puntos de red: promedio de los clientes con ubicación. */
function centroClientes_() {
  var la = 0, ln = 0, n = 0;
  rows_('CLIENTES').forEach(function (x) { var a = Number(x.lat), b = Number(x.lng); if (a && b && !isNaN(a) && !isNaN(b)) { la += a; ln += b; n++; } });
  if (!n) rows_('REGISTROS').slice(-300).forEach(function (x) { var a = Number(x.lat), b = Number(x.lng); if (a && b && !isNaN(a) && !isNaN(b)) { la += a; ln += b; n++; } });
  return n ? [la / n, ln / n] : null;
}

/** Importa puntos de red (Excel de NAP u otros). filas = [{id, tipo, nombre, lat, lng, olt, pon, splitter, capacidad, ocupados, cupos, potencia, estado, obs}]. No duplica: actualiza por id. */
function apiImportarRed(token, filas, origen) {
  auth_(token, ROLES_TICKETS.concat(['prevencionista']));
  return importarRed_(filas, origen || 'Excel');
}
function distM_(la1, ln1, la2, ln2) {
  var R = 6371000, t = function (x) { return x * Math.PI / 180; }, dLa = t(la2 - la1), dLn = t(ln2 - ln1);
  var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(t(la1)) * Math.cos(t(la2)) * Math.sin(dLn / 2) * Math.sin(dLn / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}
/** Claves para reconocer la misma NAP con nombres distintos (Excel vs Mikrowisp): N° de precinto (6-8 dígitos) y N° de NAP. */
function clavesNap_(s) {
  s = String(s || ''); var o = [];
  (s.match(/\b\d{6,8}\b/g) || []).forEach(function (p) { if (p !== '99999999') o.push('P' + p); });
  var m = s.match(/NAP[\s_\-#]*0*(\d{1,5})\b/i); if (m) o.push('N' + m[1]);
  return o;
}
/** Une dos listas de precintos (separadas por | , ; o espacio) sin repetir; quita el 99999999 de relleno. */
function unirPrecintos_(a, b) {
  var o = [], ya = {};
  [a, b].forEach(function (s) { String(s || '').split(/[|,;\s]+/).forEach(function (p) { p = p.replace(/\.0$/, '').trim(); if (p && p !== '99999999' && !ya[p]) { ya[p] = 1; o.push(p); } }); });
  return o.join(' ');
}
function importarRed_(filas, origen) {
  var H = HOJAS.RED, col = {}; H.forEach(function (k, j) { col[k] = j; });
  var nuevos = 0, act = 0, juntadas = 0, ahora = new Date(), recibidas = (filas || []).length;
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var sh = sh_('RED');
    var V = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, H.length).getValues() : [];
    var idx = {}; V.forEach(function (r, i) { if (r[0]) idx[String(r[0]).trim().toUpperCase()] = i; });
    var borrar = {};
    if (origen === 'Mikrowisp') {
      // Junta cada NAP de Mikrowisp con la misma NAP ya cargada (Excel o a mano): mismo precinto o mismo N° de NAP.
      var porClave = {}, usadas = {};
      V.forEach(function (r, i) { if (String(r[0]).indexOf('MW_NAP_') === 0) return; clavesNap_([r[0], r[col.nombre], r[col.precinto]].join(' ')).forEach(function (k) { if (porClave[k] === undefined) porClave[k] = i; }); });
      (filas || []).forEach(function (f) {
        if (!f) return;
        var ks = clavesNap_([f._claves, f.nombre, f.precinto].join(' ')), j;
        for (var q = 0; q < ks.length && j === undefined; q++) j = porClave[ks[q]];
        if (j === undefined && Number(f.lat) && Number(f.lng)) {   // sin nombre en común: la NAP del mapa a menos de 30 m
          var mejor = 30;
          V.forEach(function (r, i) {
            if (String(r[0]).indexOf('MW_NAP_') === 0 || usadas[i] || !Number(r[col.lat])) return;
            var d = distM_(Number(f.lat), Number(f.lng), Number(r[col.lat]), Number(r[col.lng]));
            if (d <= mejor) { mejor = d; j = i; }
          });
        }
        if (j === undefined) return;
        usadas[j] = true;
        var viejo = String(f.id || '').toUpperCase(); if (idx[viejo] !== undefined && idx[viejo] !== j) borrar[idx[viejo]] = true;   // NAP duplicada creada antes desde Mikrowisp
        var r = V[j]; f.id = String(r[0]); f.nombre = r[col.nombre] || f.nombre; f.lat = r[col.lat]; f.lng = r[col.lng];
        ['olt', 'pon', 'splitter', 'potencia'].forEach(function (k) { if (r[col[k]]) f[k] = r[col[k]]; });
        juntadas++;
      });
    }
    filas = (filas || []).filter(function (f) { return f && (f.id || f.nombre) && !isNaN(Number(f.lat)) && !isNaN(Number(f.lng)) && Number(f.lat) && Number(f.lng); }).slice(0, 20000);
    filas.forEach(function (f) {
      var id = String(f.id || f.nombre).trim(), k = id.toUpperCase(), i = idx[k], r = i !== undefined ? V[i] : H.map(function () { return ''; });
      var cap = f.capacidad === '' || f.capacidad === undefined ? r[col.capacidad] : Number(f.capacidad);
      var ocu = f.ocupados === '' || f.ocupados === undefined ? r[col.ocupados] : Number(f.ocupados);
      var cup = f.cupos !== '' && f.cupos !== undefined && !isNaN(Number(f.cupos)) ? Number(f.cupos) : (cap !== '' && ocu !== '' ? Math.max(0, cap - ocu) : r[col.cupos]);
      var mwAntes = i !== undefined && String(r[col.origen]) === 'Mikrowisp' && origen !== 'Mikrowisp';
      if (mwAntes) { cap = r[col.capacidad]; ocu = r[col.ocupados]; cup = r[col.cupos]; }   // re-importar el Excel no pisa los cupos que ya vienen de Mikrowisp
      else if (origen === 'Excel' && i !== undefined && cup !== '' && !isNaN(Number(cup))) {
        var nr = String(r[col.reservas] || '').split('|').filter(Boolean).length; if (nr) cup = Math.max(0, Number(cup) - nr);   // instalaciones desde la OT aún pendientes
      }
      if (i !== undefined && col.reservas !== undefined && origen === 'Mikrowisp') {   // cupos tomados desde la OT que Mikrowisp aún no muestra
        var ocuAntes = r[col.ocupados], resAntes = String(r[col.reservas] || '').split('|').filter(Boolean).length;
        cup = aplicarReservas_(r, col, ocu, ocuAntes === '' ? '' : Number(ocuAntes) - resAntes, cup);
        var resAhora = String(r[col.reservas] || '').split('|').filter(Boolean).length;
        if (resAhora && ocu !== '' && !isNaN(Number(ocu))) ocu = Number(ocu) + resAhora;
      }
      var o = { id: id, tipo: f.tipo || r[col.tipo] || 'NAP', nombre: f.nombre || r[col.nombre] || id, lat: Number(f.lat), lng: Number(f.lng), olt: f.olt || r[col.olt],
        pon: f.pon || r[col.pon], splitter: f.splitter || r[col.splitter], capacidad: cap, ocupados: ocu, cupos: cup, potencia: f.potencia || r[col.potencia],
        estado: f.estado || r[col.estado], obs: f.obs || r[col.obs], origen: mwAntes ? 'Mikrowisp' : origen, actualizado: ahora,
        precinto: f.precinto || r[col.precinto], precintos: f.precintos === ' ' ? '' : (origen === 'Excel' && f.precintos ? unirPrecintos_(r[col.precintos], f.precintos) : (f.precintos || r[col.precintos])) };
      H.forEach(function (h, j) { if (o[h] !== undefined && o[h] !== null) r[j] = limpia_(o[h]); });
      if (i === undefined) { V.push(r); idx[k] = V.length - 1; nuevos++; } else act++;
    });
    var antes = V.length;
    if (Object.keys(borrar).length) V = V.filter(function (r, i) { return !borrar[i]; });
    if (V.length) sh.getRange(2, 1, V.length, H.length).setValues(V);
    if (antes > V.length) sh.getRange(2 + V.length, 1, antes - V.length, H.length).clearContent();
    fresco_();
  } finally { lock.releaseLock(); }
  return { nuevos: nuevos, actualizados: act, total: filas.length, recibidas: recibidas, juntadas: juntadas, duplicadas_borradas: Object.keys(borrar).length };
}
/** Un punto a mano (mufa, OLT…). p = {id?, tipo, nombre, lat, lng, ...} */
function apiGuardarPuntoRed(token, p) {
  auth_(token, ROLES_TICKETS.concat(['prevencionista']));
  if (!p || !p.nombre) throw new Error('Ponle un nombre.');
  if (isNaN(Number(p.lat)) || isNaN(Number(p.lng)) || !Number(p.lat)) throw new Error('Falta la ubicación (latitud y longitud).');
  if (!p.id) p.id = (p.tipo || 'PTO').toUpperCase().slice(0, 4) + '_' + Utilities.getUuid().slice(0, 6).toUpperCase();
  importarRed_([p], 'Manual');
  return apiRed(token);
}
/** Precintos de una NAP con el cliente que tiene cada uno (panel → Mapa → Editar). */
function apiPrecintosNap(token, id) {
  auth_(token, ROLES_PANEL);
  var n = rows_('RED').filter(function (x) { return String(x.id) === String(id); })[0]; if (!n) return [];
  var porPrec = {}; rows_('CLIENTES').forEach(function (c) { var k = String(c.precinto || '').replace(/\.0$/, '').trim(); if (k) porPrec[k] = c; });
  var res = {}; String(n.reservas || '').split('|').filter(Boolean).forEach(function (r) { var a = r.split(';'); if (a[0]) res[a[0]] = (a[1] || '') + (a[2] ? ' ' + a[2] : ''); });
  return String(n.precintos || '').split(/[|,;\s]+/).map(function (p) { return p.replace(/\.0$/, '').trim(); }).filter(function (p) { return p && p !== '99999999'; })
    .map(function (p) { var c = porPrec[p]; return { precinto: p, cliente: c ? c.nombre : '', direccion: c ? [c.direccion, c.comuna].filter(Boolean).join(', ') : '', reserva: res[p] || '' }; });
}
/** App del técnico: crea una caja NAP en su ubicación actual. */
function apiNuevaNap(token, p) {
  var u = auth_(token);
  var nom = String(p && p.nombre || '').trim().slice(0, 60);
  if (!nom) throw new Error('Ponle el nombre o número de la NAP.');
  if (!Number(p.lat) || !Number(p.lng)) throw new Error('Falta la ubicación: activa el GPS.');
  var m = nom.match(/^NAP[\s_\-#]*0*(\d{1,5})$/i), id = m ? 'NAP_' + m[1] : nom.toUpperCase().replace(/[^A-Z0-9_]+/g, '_');
  if (/^\d{1,5}$/.test(nom)) id = 'NAP_' + Number(nom);
  var prec = String(p.precinto || '').replace(/\D/g, '');
  var ya = rows_('RED').filter(function (x) {
    if (String(x.id).toUpperCase() === id) return true;
    var k = clavesNap_([x.id, x.nombre, x.precinto].join(' '));
    return prec && k.indexOf('P' + prec) >= 0;
  })[0];
  if (ya) throw new Error('Ya existe esa NAP en el mapa (' + (ya.nombre || ya.id) + '). Si hay que corregirla, avisa a la oficina.');
  var cap = Number(p.capacidad) || '', ocu = Number(p.ocupados) || 0;
  importarRed_([{ id: id, tipo: 'NAP', nombre: id + (prec ? ' · precinto ' + prec : ''), lat: Number(p.lat), lng: Number(p.lng), capacidad: cap, ocupados: ocu,
    cupos: cap !== '' ? Math.max(0, cap - ocu) : '', precinto: prec, precintos: unirPrecintos_('', p.precintos || ''), pon: String(p.pon || '').slice(0, 80),
    olt: String(p.pon || '').indexOf(' - ') > 0 ? String(p.pon).split(' - ')[0] : '', potencia: String(p.potencia || '').replace(',', '.').slice(0, 10),
    obs: [String(p.obs || '').slice(0, 150), 'Creada en terreno por ' + u.nombre + ' ' + fmt_(new Date(), 'dd-MM-yyyy') + (p.acc ? ' (GPS ±' + p.acc + ' m)' : '')].filter(Boolean).join(' · ') }], 'Terreno');
  return apiRed(token);
}
function apiBorrarPuntoRed(token, id) {
  var u = auth_(token, ROLES_TICKETS);
  var r = rows_('RED').filter(function (x) { return String(x.id) === String(id); })[0];
  if (!r) throw new Error('No existe.');
  append_('PAPELERA', { fecha: new Date(), hoja: 'RED', id: id, usuario: u.nombre, motivo: 'Borrado desde el mapa', datos: JSON.stringify(redLite_(r)) });
  sh_('RED').deleteRow(r._row); fresco_();
  return apiRed(token);
}

/* ===================== MIKROWISP: SINCRONIZACIÓN POR API ===================== */
/*
 * Configuración (panel → Configuración): mw_url = https://(dominio de Mikrowisp de la empresa)   mw_token = token del operador con "Activar acceso API".
 * Los nombres de los métodos se pueden cambiar en CONFIG (mw_api_clientes, mw_api_naps) sin tocar el código.
 */
function mwCfg_() {
  var c = cfg_(), url = String(c.mw_url || '').trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  return { url: url, token: String(c.mw_token || '').trim(), clientes: c.mw_api_clientes || 'GetAllClients', naps: c.mw_api_naps || 'GetCajasNap',
    tickets: c.mw_api_tickets || 'ListTicket', cerrar: c.mw_api_cerrar || 'CloseTicket', cerrarActivo: String(c.mw_cerrar || 'SI').toUpperCase() !== 'NO' };
}
function mwPost_(metodo, cuerpo) {
  var m = mwCfg_();
  if (!m.url || !m.token) throw new Error('Falta configurar mw_url y mw_token (panel → Configuración).');
  var body = { token: m.token }; for (var k in (cuerpo || {})) body[k] = cuerpo[k];
  var r = UrlFetchApp.fetch(m.url + '/api/v1/' + metodo, { method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true });
  var txt = r.getContentText(), j = null;
  try { j = JSON.parse(txt); } catch (e) {}
  if (r.getResponseCode() >= 400 || !j) throw new Error('Mikrowisp ' + metodo + ' respondió ' + r.getResponseCode() + ': ' + txt.slice(0, 200));
  if (j.estado && String(j.estado).toLowerCase() === 'error') throw new Error('Mikrowisp ' + metodo + ': ' + (j.mensaje || JSON.stringify(j).slice(0, 200)));
  return j;
}
/** Busca la primera lista de objetos dentro de la respuesta (cada versión de Mikrowisp la nombra distinto). */
function mwLista_(j) {
  if (Array.isArray(j)) return j;
  if (!j || typeof j !== 'object') return [];
  if (j.data && typeof j.data === 'object' && !Array.isArray(j.data)) return mwLista_(j.data);   // ListTicket: {data:{tickets:[...]}}
  var cand = ['datos', 'data', 'tickets', 'clientes', 'clients', 'naps', 'cajas', 'onus', 'operadores', 'response', 'items', 'result', 'results'];
  for (var i = 0; i < cand.length; i++) if (Array.isArray(j[cand[i]])) return j[cand[i]];
  for (var k in j) if (Array.isArray(j[k]) && j[k].length && typeof j[k][0] === 'object') return j[k];
  return [];
}
/** Trae todas las páginas (Mikrowisp entrega de a 25 si no se pide más: usa limit + pagina). */
function mwTodos_(metodo) {
  var todos = [], vistos = {}, porPag = 500;
  for (var p = 1; p <= 100; p++) {
    var L = mwLista_(mwPost_(metodo, { limit: porPag, pagina: p }));
    var nuevos = L.filter(function (x) { var k = String(x.id); if (vistos[k]) return false; vistos[k] = 1; return true; });
    todos = todos.concat(nuevos);
    if (L.length < porPag || !nuevos.length) break;
  }
  return todos;
}
function mwVal_(o, claves) {
  for (var i = 0; i < claves.length; i++) { var v = o[claves[i]]; if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim(); }
  return '';
}

/** Explora la API de Mikrowisp: prueba varios nombres de método y muestra cuáles existen y qué devuelven.
 *  Ejecutar desde el editor y copiar el registro. No modifica nada en Mikrowisp (solo consultas). */
function explorarMikrowisp() {
  var m = mwCfg_(), out = [];
  var probar = function (metodo, cuerpo) {
    var body = { token: m.token }; for (var k in (cuerpo || {})) body[k] = cuerpo[k];
    var txt = '', code = 0;
    try { var r = UrlFetchApp.fetch(m.url + '/api/v1/' + metodo, { method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true }); code = r.getResponseCode(); txt = r.getContentText(); }
    catch (e) { txt = 'EXCEPCIÓN ' + e.message; }
    var j = null; try { j = JSON.parse(txt); } catch (e) {}
    var res;
    if (j) { var L = mwLista_(j); res = L.length ? 'LISTA ' + L.length + ' · campos: ' + Object.keys(L[0]).join(',') : JSON.stringify(j).slice(0, 220); }
    else res = 'HTTP ' + code + ' ' + txt.slice(0, 120);
    out.push(metodo + ' ' + JSON.stringify(cuerpo || {}) + ' → ' + res);
  };
  ['GetClients', 'GetAllClients', 'ListClients', 'ListClient', 'GetClientsList', 'GetListClients', 'ListUsers', 'GetUsers'].forEach(function (x) { probar(x, {}); });
  probar('GetClientsDetails', { limit: 2 }); probar('GetClientsDetails', { idcliente: 1 });
  ['GetNap', 'GetNaps', 'ListNap', 'ListNaps', 'GetCajasNap', 'GetCajaNap', 'ListCajasNap', 'ListCajaNap', 'GetNapBox', 'ListNapBox'].forEach(function (x) { probar(x, {}); });
  ['ListTickets', 'GetTickets', 'GetTicket', 'ListAllTickets', 'GetAllTickets'].forEach(function (x) { probar(x, {}); });
  probar('ListTicket', { estado: 'abierto' }); probar('ListTicket', { idsoporte: 1 }); probar('ListTicket', { idcliente: 1 });
  ['ListRouters', 'ListMonitoreo', 'GetInstalaciones', 'ListInstalaciones'].forEach(function (x) { probar(x, {}); });
  Logger.log('\n' + out.join('\n'));
  return out;
}
/** Tercera exploración: cómo listar tickets abiertos. Solo consultas. */
function explorarMikrowisp3() {
  var m = mwCfg_(), out = [];
  var q = function (metodo, cuerpo) {
    var body = { token: m.token }; for (var k in (cuerpo || {})) body[k] = cuerpo[k];
    try { var r = UrlFetchApp.fetch(m.url + '/api/v1/' + metodo, { method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true }); return r.getContentText(); }
    catch (e) { return 'EXC ' + e.message; }
  };
  out.push('GetAllClients limit 500 pagina 2 → ' + (function () { try { var L = mwLista_(JSON.parse(q('GetAllClients', { limit: 500, pagina: 2 }))); return L.length + ' filas ids ' + (L[0] || {}).id + '…' + (L[L.length - 1] || {}).id; } catch (e) { return e.message; } })());
  [{ id: 10793 }, { idticket: 10793 }, { ticket: 10793 }, { id_ticket: 10793 }, { idsoporte: 23 }, { idsoporte: 0 }, { idsoporte: 'todos' }, { idcliente: 0 }, { idcliente: 'todos' }, { idcliente: 7, estado: 'abierto' }].forEach(function (c) {
    out.push('ListTicket ' + JSON.stringify(c) + ' → ' + q('ListTicket', c).slice(0, 260));
  });
  out.push('TICKET COMPLETO (cliente 7): ' + q('ListTicket', { idcliente: 7 }).slice(0, 1800));
  ['GetTicketDetails', 'ListTicketAll', 'ListSoporte', 'GetSoporte', 'ListTicketsAbiertos', 'GetOperadores', 'ListOperadores', 'GetStaff', 'ListStaff'].forEach(function (x) { out.push(x + ' → ' + q(x, {}).slice(0, 200)); });
  Logger.log('\n' + out.join('\n'));
  return out;
}
/** Segunda exploración: paginación de clientes, formato de NAP y de tickets. Solo consultas. */
function explorarMikrowisp2() {
  var m = mwCfg_(), out = [];
  var q = function (metodo, cuerpo) {
    var body = { token: m.token }; for (var k in (cuerpo || {})) body[k] = cuerpo[k];
    try { var r = UrlFetchApp.fetch(m.url + '/api/v1/' + metodo, { method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true }); return JSON.parse(r.getContentText()); }
    catch (e) { return { error: e.message }; }
  };
  var resumen = function (j) { var L = mwLista_(j); return L.length ? L.length + ' filas · ids ' + L[0].id + '…' + L[L.length - 1].id : JSON.stringify(j).slice(0, 160); };
  [{}, { limit: 100 }, { limite: 100 }, { pagina: 2 }, { page: 2 }, { offset: 25 }, { inicio: 25 }, { start: 25 }, { desde: 25 }, { estado: 'ACTIVO' }].forEach(function (c) {
    out.push('GetAllClients ' + JSON.stringify(c) + ' → ' + resumen(q('GetAllClients', c)));
  });
  var C = mwLista_(q('GetAllClients', {}));
  if (C[0]) out.push('CLIENTE EJEMPLO: ' + JSON.stringify(C[0]).slice(0, 1500));
  var N = mwLista_(q('GetCajasNap', {}));
  if (N[0]) out.push('NAP EJEMPLO: ' + JSON.stringify(N[0]).slice(0, 1200));
  out.push('GetCajasNap {limit:100} → ' + resumen(q('GetCajasNap', { limit: 100 })));
  [10, 50, 100, 200, 500, 1000, 2000, 3000, 5000, 8000].forEach(function (n) { out.push('ListTicket idsoporte ' + n + ' → ' + JSON.stringify(q('ListTicket', { idsoporte: n })).slice(0, 300)); });
  C.slice(0, 5).forEach(function (c) { out.push('ListTicket idcliente ' + c.id + ' → ' + JSON.stringify(q('ListTicket', { idcliente: c.id })).slice(0, 400)); });
  Logger.log('\n' + out.join('\n'));
  return out;
}
/** Ejecuta esto una vez desde el editor: muestra en el registro qué responde Mikrowisp, para ajustar si hace falta. */
function probarMikrowisp() {
  var m = mwCfg_();
  Logger.log('URL: ' + m.url + '/api/v1/  ·  token: ' + (m.token ? m.token.slice(0, 4) + '…' : '(vacío)'));
  [[m.clientes, { limit: 3 }], [m.naps, {}], [m.tickets, {}]].forEach(function (x) {
    try { var j = mwPost_(x[0], x[1]), L = mwLista_(j); Logger.log('✔ ' + x[0] + ': ' + L.length + ' fila(s). Campos: ' + (L[0] ? Object.keys(L[0]).join(', ') : JSON.stringify(j).slice(0, 300))); }
    catch (e) { Logger.log('✘ ' + x[0] + ': ' + e.message); }
  });
}

/** Sincronización nocturna (3 am): clientes y cajas NAP desde Mikrowisp. Los equipos de almacén siguen por Excel (la API no los entrega). */
function sincronizarMikrowisp() {
  if (porEmpresas_('sincronizarMikrowisp', arguments)) return;
  var m = mwCfg_(), res = { clientes: null, naps: null, errores: [] };
  if (!m.url || !m.token) { res.errores.push('Falta la dirección de Mikrowisp o el token: escríbelos en Configuración y aprieta Guardar.'); Logger.log(res.errores[0]); return res; }
  try {
    res.clientes = importarClientes_(mapClientesMw_(mwTodos_(m.clientes)));
  } catch (e) { res.errores.push('Clientes: ' + e.message); }
  try {
    res.naps = importarRed_(mapNapsMw_(mwLista_(mwPost_(m.naps, {}))), 'Mikrowisp');
  } catch (e) { res.errores.push('NAP: ' + e.message); }
  if (String(cfg_().mw_api_cliente || '') === 'NO') setCfg_('mw_api_cliente', '');
  setCfg_('mw_ultima_sync', fmt_(new Date(), 'yyyy-MM-dd HH:mm') + (res.errores.length ? ' · con errores: ' + res.errores.join(' | ').slice(0, 300) : ' · OK'));
  Logger.log(JSON.stringify(res));
  return res;
}
function setCfg_(clave, valor) {
  var r = rows_('CONFIG').filter(function (x) { return x.clave === clave; })[0];
  if (r) update_('CONFIG', r._row, { valor: valor }); else append_('CONFIG', { clave: clave, valor: valor, descripcion: '' });
}
/** Activa la sincronización todos los días a las 3:00. */
function activarSyncMikrowisp() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (['sincronizarMikrowisp', 'sincronizarTicketsMw'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sincronizarMikrowisp').timeBased().everyDays(1).atHour(3).inTimezone(TZ).create();
  ScriptApp.newTrigger('sincronizarTicketsMw').timeBased().everyMinutes(10).create();
  Logger.log('Sincronización con Mikrowisp activada: clientes y NAP todos los días a las 3:00, tickets cada 10 minutos.');
}
/** Activa la lectura de SmartOLT cada 2 horas (estado y señal de todas las ONU). */
function activarSyncSmartOlt() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'sincronizarSmartOlt') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sincronizarSmartOlt').timeBased().everyHours(2).create();
  Logger.log('SmartOLT: se leerán las ONU cada 2 horas.');
}
function apiSyncMikrowisp(token) { auth_(token, ['admin']); var r = sincronizarMikrowisp(); var t = sincronizarTicketsMw(); r.tickets = t.tickets; r.errores = r.errores.concat(t.errores); return r; }

/* ---------- Tickets de Mikrowisp → tickets del sistema (cada 10 min) ---------- */
/** ListTicket exige idsoporte: 0 = sin asignar (los que levanta la oficina) + uno por cada operador, por si alguno se asignó allá. */
function mwTicketsTodos_(m) {
  var L = mwLista_(mwPost_(m.tickets, { idsoporte: 0 })), vistos = {};
  L.forEach(function (t) { vistos[t.id] = 1; });
  try {
    mwLista_(mwPost_('GetOperadores', {})).forEach(function (o) {
      if (!o.id || /deshab/i.test(o.estado || '')) return;
      try { mwLista_(mwPost_(m.tickets, { idsoporte: o.id })).forEach(function (t) { if (!vistos[t.id]) { vistos[t.id] = 1; L.push(t); } }); } catch (e) {}   // "No hay ningún ticket"
    });
  } catch (e) {}
  return L;
}
function textoPlano_(h) {
  return String(h || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/<br\s*\/?>|<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}
function tipoDesdeTexto_(s) {
  s = normTxt_(s);
  if (/instal/.test(s)) return 'Instalación'; if (/retir/.test(s)) return 'Retiro de equipo'; if (/cambio/.test(s)) return 'Cambio de equipo';
  if (/trasl/.test(s)) return 'Traslado'; if (/mantenc/.test(s)) return 'Mantención';
  return 'Visita técnica / falla';
}
/** Busca el técnico del sistema por el nombre del operador/técnico de Mikrowisp. */
function tecnicoPorNombre_(nombre, tecs) {
  var n = normTxt_(nombre); if (!n) return null;
  var exacto = tecs.filter(function (t) { return normTxt_(t.nombre) === n; })[0]; if (exacto) return exacto;
  var partes = String(nombre).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(function (x) { return x.length > 2; });
  var c = tecs.filter(function (t) { var tn = normTxt_(t.nombre); return partes.length && partes.every(function (p) { return tn.indexOf(p.replace(/[^a-z0-9]/g, '')) >= 0; }); });
  return c.length === 1 ? c[0] : null;
}
function sincronizarTicketsMw() {
  if (porEmpresas_('sincronizarTicketsMw', arguments)) return;
  var m = mwCfg_(), res = { tickets: null, errores: [] };
  if (!m.url || !m.token) { res.errores.push('Tickets: falta configurar Mikrowisp.'); return res; }
  var L;
  try { L = mwTicketsTodos_(m); } catch (e) { res.errores.push('Tickets: ' + e.message); return res; }
  try { res.clientesNuevos = clientesDeTicketsMw_(L); } catch (e) { Logger.log('Clientes de tickets: ' + e); }
  res.tickets = procesarTicketsMw_(L);
  return res;
}
/** Fecha de creación del ticket en Mikrowisp (null si no viene o no se entiende). */
function fechaTicketMw_(x) {
  var v = mwVal_(x, ['fecha_soporte', 'fecha_creacion', 'fechacreacion', 'fecha_registro', 'fecha_apertura', 'fecha', 'creado', 'created_at']);
  if (!v || /^0000/.test(v)) return null;
  var m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/) || null;
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = String(v).match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}
/** Días hacia atrás que se importan de Mikrowisp (Configuración → mw_dias_tickets; 0 = todos). */
/** Fecha de Mikrowisp como texto 'aaaa-mm-dd hh:mm' para guardar en el ticket. */
function fechaTicketMwTxt_(x) {
  var v = mwVal_(x, ['fecha_soporte', 'fecha_creacion', 'fechacreacion', 'fecha_registro', 'fecha_apertura', 'fecha', 'creado', 'created_at']);
  if (/^\d{4}-\d{2}-\d{2}/.test(v) && !/^0000/.test(v)) return v.replace('T', ' ').slice(0, 16);
  var f = fechaTicketMw_(x); return f ? Utilities.formatDate(f, TZ, 'yyyy-MM-dd') : '';
}
function mwLimiteTickets_() {
  var raw = cfg_().mw_dias_tickets, d = (raw === undefined || raw === '') ? 30 : Number(raw);
  if (!(d > 0)) return null;
  var f = new Date(); f.setHours(0, 0, 0, 0); f.setDate(f.getDate() - d); return f;
}
/** Clientes recién creados en Mikrowisp: si llega un ticket de un cliente que aún no está en el sistema,
 *  se pide solo ese cliente a Mikrowisp al momento (no espera la sincronización de las 3:00). */
function clientesDeTicketsMw_(L) {
  var c = cfg_(); if (String(c.mw_api_cliente || '') === 'NO') return 0;
  var conocidos = {}, ya = {}, limite = mwLimiteTickets_();
  rows_('CLIENTES').forEach(function (x) { if (x.mw_id) conocidos[String(x.mw_id)] = 1; });
  rows_('TICKETS').forEach(function (t) { if (t.mw_ticket) ya[String(t.mw_ticket)] = 1; });
  var ids = [];
  L.forEach(function (x) {
    var id = mwVal_(x, ['id', 'idticket']), ic = mwVal_(x, ['idcliente', 'id_cliente', 'cliente_id']);
    if (!ic || conocidos[ic] || ya[String(id)] || ids.indexOf(ic) >= 0) return;
    var est = normTxt_(mwVal_(x, ['estado', 'status'])), f = fechaTicketMw_(x);
    if (/cerr|resuel|finaliz|close/.test(est) || (limite && f && f < limite)) return;
    ids.push(ic);
  });
  if (!ids.length) return 0;
  var r = mwClientesPorId_(ids.slice(0, 20));
  if (!r.length) return 0;
  var imp = importarClientes_(mapClientesMw_(r));
  Logger.log('Clientes nuevos desde tickets: ' + r.length);
  return r.length;
}
/** Pide a Mikrowisp clientes puntuales por su id. Prueba los nombres de método conocidos y recuerda el que funciona. */
function mwClientesPorId_(ids) {
  var c = cfg_(), metodos = c.mw_api_cliente ? [c.mw_api_cliente] : ['GetClientsDetails', 'GetClientDetails', 'GetClient'], out = [];
  ids.forEach(function (ic) {
    for (var i = 0; i < metodos.length; i++) {
      try {
        var j = mwPost_(metodos[i], { idcliente: Number(ic) || ic });
        var L = mwLista_(j);
        if (!L.length) { var o = j.datos || j.data || j.cliente || j.client; if (o && typeof o === 'object' && !Array.isArray(o)) L = [o]; }
        L = L.filter(function (x) { return x && typeof x === 'object' && (mwVal_(x, ['nombre', 'name'])); });
        L.forEach(function (x) { if (!mwVal_(x, ['id', 'idcliente', 'id_cliente'])) x.id = ic; });
        out = out.concat(L.slice(0, 1));
        if (!L.length) { if (i < metodos.length - 1 && !c.mw_api_cliente) continue; return; }   // respondió sin cliente: no se da por bueno el método
        if (!c.mw_api_cliente) { setCfg_('mw_api_cliente', metodos[i]); c.mw_api_cliente = metodos[i]; metodos = [metodos[i]]; }
        return;
      } catch (e) {
        if (/URL api es incorrect/i.test(e.message)) {
          if (metodos.length === 1 || i === metodos.length - 1) { if (!c.mw_api_cliente) { setCfg_('mw_api_cliente', 'NO'); c.mw_api_cliente = 'NO'; } metodos = []; return; }
          continue;
        }
        Logger.log('Cliente ' + ic + ': ' + e.message); return;   // p. ej. cliente no encontrado
      }
    }
  });
  return out;
}
/** EJECUTAR UNA VEZ desde el editor para comprobar que Mikrowisp entrega un cliente por su número. */
function probarClienteMikrowisp() {
  setCfg_('mw_api_cliente', ''); fresco_();
  var cli = rows_('CLIENTES').filter(function (x) { return x.mw_id; }).slice(-1)[0];
  if (!cli) { Logger.log('Primero sincroniza los clientes (sincronizarMikrowisp).'); return; }
  var r = mwClientesPorId_([cli.mw_id]); fresco_();
  var met = cfg_().mw_api_cliente;
  if (r.length) Logger.log('✔ Funciona (' + met + '). Cliente #' + cli.mw_id + ': ' + JSON.stringify(mapClientesMw_(r)[0]) +
    '\nDesde ahora, cuando llegue un ticket de un cliente nuevo, se trae ese cliente al momento.');
  else Logger.log('✘ Mikrowisp no entregó el cliente #' + cli.mw_id + (met === 'NO' ? ' (ningún método conocido existe en esta versión).' : '.') +
    ' Los clientes nuevos seguirán llegando con la sincronización de las 3:00. Copia este registro y mándamelo.');
}
function procesarTicketsMw_(L) {
  var nuevos = 0, cerrados = 0, antiguos = 0, limite = mwLimiteTickets_();
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var T = rows_('TICKETS'), ya = {};
    T.forEach(function (t) { if (t.mw_ticket) ya[String(t.mw_ticket)] = t; });
    var C = rows_('CLIENTES'), porMw = {}, porRut = {};
    C.forEach(function (c) { if (c.mw_id) porMw[String(c.mw_id)] = c; if (c.rut) porRut[normRut_(c.rut)] = c; });
    var tecs = usuariosLite_().filter(function (x) { return x.rol === 'tecnico' || x.area === 'Terreno'; });
    if (!tecs.length) tecs = usuariosLite_();
    L.forEach(function (x) {
      var id = mwVal_(x, ['id', 'idticket', 'id_ticket', 'ticket']); if (!id) return;
      var est = normTxt_(mwVal_(x, ['estado', 'status', 'estatus']));
      var cerrado = /cerr|resuel|finaliz|close/.test(est) || (x.fecha_cerrado && !/^0000/.test(String(x.fecha_cerrado)));
      var ex = ya[String(id)];
      if (ex) {   // cerrado en Mikrowisp → se cierra también aquí si seguía abierto
        if (!ex.mw_fecha) { var fx = fechaTicketMwTxt_(x); if (fx) update_('TICKETS', ex._row, { mw_fecha: fx }); }
        if (cerrado && ['Cerrado', 'Anulado'].indexOf(ex.estado) < 0) { update_('TICKETS', ex._row, { estado: 'Cerrado', cerrado: new Date(), actualizado: new Date(), notas: String(ex.notas || '') + ' · Cerrado en Mikrowisp' }); cerrados++; }
        return;
      }
      if (cerrado) return;   // solo se traen los abiertos
      var fMw = fechaTicketMw_(x);
      if (limite && fMw && fMw < limite) { antiguos++; return; }   // ticket viejo olvidado en Mikrowisp: no se trae
      var cli = porMw[mwVal_(x, ['idcliente', 'id_cliente', 'cliente_id'])] || porRut[normRut_(mwVal_(x, ['cedula', 'rut']))] || null;
      var asunto = mwVal_(x, ['asunto', 'titulo', 'subject']), det = textoPlano_(Array.isArray(x.mensajes) && x.mensajes[0] ? x.mensajes[0].contenido : mwVal_(x, ['descripcion', 'detalle', 'mensaje', 'contenido', 'problema']));
      var dp = mwVal_(x, ['dp', 'departamento']), fv = mwVal_(x, ['fechavisita', 'fecha_visita']), turno = mwVal_(x, ['turno']).trim();
      var tec = tecnicoPorNombre_(mwVal_(x, ['tecnico', 'agente', 'operador', 'asignado', 'responsable']), tecs);
      var t = { cliente: cli ? cli.nombre : (mwVal_(x, ['cliente', 'nombre', 'nombre_cliente']) || 'Cliente Mikrowisp'), cliente_id: cli ? cli.id : '', rut: cli ? cli.rut : '',
        direccion: cli ? cli.direccion : mwVal_(x, ['direccion']), comuna: cli ? cli.comuna : '', telefono: cli ? String(cli.telefono || '') : mwVal_(x, ['telefono', 'movil']),
        tipo: tipoDesdeTexto_(asunto + ' ' + det), prioridad: /urg|alta|high/.test(normTxt_(mwVal_(x, ['prioridad', 'priority']))) ? 'Urgente' : 'Normal',
        descripcion: [asunto, det].filter(Boolean).join(' · ').slice(0, 1500) + (turno ? ' · Turno ' + turno.replace(/[()]/g, '') : '') + ' (Ticket Mikrowisp #' + id + (dp ? ', ' + dp : '') + ')', tecnico_rut: tec ? tec.rut : '',
        fecha_programada: /^0000/.test(fv) ? '' : f10_(fv), mw_fecha: fechaTicketMwTxt_(x) };
      var idServ = mwVal_(x, ['idservicio', 'id_servicio', 'servicio_id']);   // si Mikrowisp dice a qué servicio corresponde
      if (cli) { var SL = json_(cli.servicios, []), sv = idServ ? SL.filter(function (s) { return String(s.id) === String(idServ); })[0] : (SL.length === 1 ? SL[0] : null);
        if (sv) { t.servicio_id = sv.id; t.servicio = textoServicio_(sv); if (sv.dir) t.direccion = sv.dir; }
        else if (idServ) t.servicio_id = idServ; }
      crearTicketSistema_(t, 'Mikrowisp', id);
      nuevos++;
    });
  } finally { lock.releaseLock(); }
  if (nuevos || cerrados) Logger.log('Tickets Mikrowisp: ' + nuevos + ' nuevos, ' + cerrados + ' cerrados.');
  return { nuevos: nuevos, cerrados: cerrados, antiguos: antiguos, total: L.length };
}
/** EJECUTAR UNA VEZ desde el editor: anula los tickets que ya entraron desde Mikrowisp y que allá
 *  son más antiguos que el límite (mw_dias_tickets, 30 días por defecto). Solo toca los que siguen
 *  "Asignado" o "Pendiente" (no los que un técnico ya tiene en camino o en terreno). No cambia nada en Mikrowisp. */
function anularTicketsMwAntiguos() {
  var m = mwCfg_(), limite = mwLimiteTickets_();
  if (!limite) { Logger.log('mw_dias_tickets está en 0 (traer todos): no hay nada que anular.'); return; }
  if (!m.url || !m.token) throw new Error('Falta configurar Mikrowisp (dirección y token).');
  var fechas = {}, sinFecha = 0;
  mwTicketsTodos_(m).forEach(function (x) { var id = mwVal_(x, ['id', 'idticket', 'id_ticket', 'ticket']), f = fechaTicketMw_(x); if (id) { if (f) fechas[String(id)] = f; else sinFecha++; } });
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  var n = 0, revisados = 0, lista = [];
  try {
    rows_('TICKETS').forEach(function (t) {
      if (!t.mw_ticket || ['Asignado', 'Pendiente'].indexOf(t.estado) < 0) return;
      revisados++;
      var f = fechas[String(t.mw_ticket)];
      if (!f || f >= limite) return;
      update_('TICKETS', t._row, { estado: 'Anulado', actualizado: new Date(), notas: String(t.notas || '') + ' · Anulado: ticket antiguo de Mikrowisp (' + Utilities.formatDate(f, TZ, 'dd-MM-yyyy') + ')' });
      lista.push(t.id + ' (MW #' + t.mw_ticket + ', ' + Utilities.formatDate(f, TZ, 'dd-MM-yyyy') + ')'); n++;
    });
  } finally { lock.releaseLock(); }
  Logger.log((lista.length ? lista.join('\n') + '\n\n' : '') + 'Listo: ' + n + ' ticket(s) antiguos anulados de ' + revisados + ' abiertos que vinieron de Mikrowisp. Límite: desde el ' +
    Utilities.formatDate(limite, TZ, 'dd-MM-yyyy') + '.' + (sinFecha ? ' (' + sinFecha + ' ticket(s) de Mikrowisp sin fecha: no se tocaron)' : ''));
}
/** Panel → Hoy: cambia cuántos días hacia atrás se traen de Mikrowisp y anula los que quedaron fuera. */
function apiFiltroTicketsMw(token, dias) {
  var u = auth_(token, ['admin', 'editor', 'soporte']);
  dias = Math.max(0, Math.min(3650, Math.round(Number(dias) || 0)));
  setCfg_('mw_dias_tickets', dias); fresco_();
  var r = { dias: dias, anulados: 0, nota: '' };
  if (!dias) { r.nota = 'Se traerán todos los tickets abiertos de Mikrowisp.'; return r; }
  var m = mwCfg_();
  if (!m.url || !m.token) { r.nota = 'Filtro guardado. Los tickets antiguos que ya estaban no se pudieron revisar (Mikrowisp se conecta por el puente).'; return r; }
  var antes = rows_('TICKETS').filter(function (t) { return t.estado === 'Anulado'; }).length;
  anularTicketsMwAntiguos(); fresco_();
  r.anulados = rows_('TICKETS').filter(function (t) { return t.estado === 'Anulado'; }).length - antes;
  return r;
}
/** Crea un ticket sin sesión (lo usa la sincronización). */
function crearTicketSistema_(t, creadoPor, mwId) {
  var tec = t.tecnico_rut ? usuariosLite_().filter(function (x) { return x.rut === normRut_(t.tecnico_rut); })[0] : null;
  var c = rows_('CONFIG').filter(function (r) { return r.clave === 'contador_tickets'; })[0];
  var n = (Number(c ? c.valor : 0) || 0) + 1;
  if (c) sh_('CONFIG').getRange(c._row, 2).setValue(n); else sh_('CONFIG').appendRow(['contador_tickets', n, 'Correlativo de tickets']);
  var id = 'TK-' + ('0000' + n).slice(-5);
  var obj = { id: id, creado: new Date(), creado_por: creadoPor, cliente: t.cliente, direccion: t.direccion || '', comuna: t.comuna || '', telefono: t.telefono || '',
    tipo: t.tipo, prioridad: t.prioridad || 'Normal', descripcion: t.descripcion || '', tecnico_rut: tec ? tec.rut : '', tecnico_nombre: tec ? tec.nombre : '',
    estado: 'Asignado', actualizado: new Date(), fecha_programada: t.fecha_programada || '', cliente_id: t.cliente_id || clienteUpsert_(t), cliente_rut: t.rut ? normRut_(t.rut) : '', mw_ticket: mwId || '', mw_fecha: t.mw_fecha || '', servicio_id: t.servicio_id || '', servicio: t.servicio || '' };
  try { ubicarDesdeCliente_(obj); } catch (e) {}
  append_('TICKETS', obj);
  if (tec) try { avisarTecnico_(tec.rut, id, obj); } catch (e) {}
  return id;
}
/** Al cerrar un ticket que vino de Mikrowisp, se cierra allá también (si está activado). */
function cerrarEnMw_(ticket, resp, u) {
  if (!ticket.mw_ticket) return;
  var m = mwCfg_(); if (!m.cerrarActivo) return;
  var txt0 = 'Cerrado desde la app de prevención por ' + u.nombre + (resp && (resp.detalle || resp.resultado) ? ': ' + [resp.resultado, resp.detalle].filter(Boolean).join(' · ') : '');
  if (String(cfg_().puente_clave || '')) { append_('MW_COLA', { id: nuevoId_('MQ'), fecha: new Date(), mw_ticket: ticket.mw_ticket, accion: 'cerrar', texto: txt0.slice(0, 500), estado: 'Pendiente' }); return; }
  if (!m.url || !m.token) return;
  var txt = 'Cerrado desde la app de prevención por ' + u.nombre + (resp && (resp.detalle || resp.resultado) ? ': ' + [resp.resultado, resp.detalle].filter(Boolean).join(' · ') : '');
  var nombres = [m.cerrar, 'CloseTicket', 'CerrarTicket'].filter(function (x, i, a) { return a.indexOf(x) === i; }), ult = null;
  for (var i = 0; i < nombres.length; i++) {
    try { mwPost_(nombres[i], { id: ticket.mw_ticket, idticket: ticket.mw_ticket, motivo_cierre: txt.slice(0, 500), motivo: txt.slice(0, 500), mensaje: txt.slice(0, 500) }); if (nombres[i] !== m.cerrar) setCfg_('mw_api_cerrar', nombres[i]); return; }
    catch (e) { ult = e; if (!/URL api es incorrect/i.test(e.message)) throw e; }
  }
  if (ult) throw ult;
}



/* ===================== UBICACIÓN EXACTA DEL CLIENTE (link de Google Maps de Mikrowisp) ===================== */
/** Saca lat/lng de un link de Google Maps (largo o corto maps.app.goo.gl, que se sigue hasta la dirección final). */
function coordsDeLink_(url) {
  url = String(url || '').trim(); if (!url) return null;
  var leer = function (u) {
    var m = u.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/) || u.match(/[?&](?:q|query|ll|destination)=(-?\d{1,2}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/) ||
      u.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/) || u.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
    return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
  };
  var r = leer(url); if (r) return r;
  if (!/^https?:\/\//.test(url)) return null;
  for (var i = 0; i < 4; i++) {
    var resp = UrlFetchApp.fetch(url, { followRedirects: false, muteHttpExceptions: true });
    var h = resp.getHeaders(), loc = h.Location || h.location;
    if (!loc) { var txt = resp.getContentText().slice(0, 20000); return leer(txt.replace(/\\u003d/g, '=').replace(/&amp;/g, '&')) || null; }
    url = loc; r = leer(decodeURIComponent(url)); if (r) return r;
  }
  return null;
}
/** Al crear/editar un ticket: si el cliente tiene link de ubicación y aún no tiene coordenadas, las calcula y las deja en el cliente y el ticket. */
function ubicarDesdeCliente_(obj) {
  if (!obj.cliente_id) return;
  var c = rows_('CLIENTES').filter(function (x) { return x.id === obj.cliente_id; })[0];
  if (!c || !c.mapa_url) return;
  if (!c.lat) { var ll = coordsDeLink_(c.mapa_url); if (ll) { update_('CLIENTES', c._row, { lat: ll.lat, lng: ll.lng }); c.lat = ll.lat; c.lng = ll.lng; } }
  if (c.lat) { obj.lat = c.lat; obj.lng = c.lng; }
}
/** Índice precinto del cliente → NAP (según los precintos ocupados de cada NAP). */
function napPorPrecinto_() {
  var o = {};
  try { rows_('RED').forEach(function (n) { String(n.precintos || '').split(/[|,;\s]+/).forEach(function (p) { p = p.replace(/\.0$/, '').trim(); if (p && p !== '99999999') o[p] = n; }); }); } catch (e) {}
  return o;
}


/* ===================== CAJA CHICA ===================== */
var MEDIOS_ENTRADA_CAJA = ['Transferencia', 'Giro (emergencia)', 'Efectivo', 'Otro'];
var MEDIOS_SALIDA_CAJA = ['Efectivo de caja chica'];

/** Movimientos de caja chica: entradas (transferencias o giros) y salidas (pagos hechos con esa plata).
 *  Los gastos que los técnicos rinden con medio de pago "Caja chica" también cuentan como salida. */
function apiCaja(token, fl) {
  auth_(token, ROLES_GESTION);
  fl = fl || {};
  var M = rows_('CAJA').map(function (r) {
    return { id: r.id, fecha: f10_(r.fecha), tipo: r.tipo, medio: r.medio, monto: Number(r.monto) || 0, concepto: r.concepto, proveedor: r.proveedor,
      documento: r.documento, responsable: r.responsable, comprobante_url: r.comprobante_url, registrado_por: r.registrado_por, origen: 'Caja' };
  });
  gastosPlanos_({}).forEach(function (L) {
    if (L.medio !== 'Caja chica') return;
    M.push({ id: L.registro + '|' + L.linea, fecha: f10_(L.fecha), tipo: 'Salida', medio: 'Rendición', monto: Number(L.monto) || 0,
      concepto: [L.tipo, L.detalle].filter(Boolean).join(' · '), proveedor: L.razon || '', documento: [L.tipo_doc, L.doc].filter(Boolean).join(' '),
      responsable: L.colaborador, comprobante_url: L.pdf_url || '', registrado_por: L.colaborador, origen: 'Rendición' });
  });
  M.sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; });
  var saldo = 0, inicial = 0;
  M.forEach(function (m) { saldo += m.tipo === 'Entrada' ? m.monto : -m.monto; m.saldo = saldo; if (fl.desde && m.fecha < fl.desde) inicial = saldo; });
  var V = M.filter(function (m) { return (!fl.desde || m.fecha >= fl.desde) && (!fl.hasta || m.fecha <= fl.hasta); });
  var ent = 0, sal = 0; V.forEach(function (m) { if (m.tipo === 'Entrada') ent += m.monto; else sal += m.monto; });
  return { movimientos: V.reverse(), saldo: saldo, inicial: inicial, entradas: ent, salidas: sal, mediosEntrada: MEDIOS_ENTRADA_CAJA, personas: personas_() };
}
/** m = {fecha, tipo: Entrada|Salida, medio, monto, concepto, proveedor, documento, responsable, archivo:{nombre,mime,data}} */
function apiGuardarCaja(token, m, fl) {
  var u = auth_(token, ROLES_GESTION);
  if (!m || ['Entrada', 'Salida'].indexOf(m.tipo) < 0) throw new Error('Elige si es entrada o salida.');
  if (!(Number(m.monto) > 0)) throw new Error('Ingresa el monto.');
  if (!String(m.concepto || '').trim()) throw new Error(m.tipo === 'Entrada' ? 'Escribe de dónde viene la plata (ej. giro cuenta corriente).' : 'Escribe en qué se gastó.');
  var fecha = f10_(m.fecha) || hoy_(), url = '';
  if (m.archivo && m.archivo.data) url = guardarArchivo_(carpetaDe_('gastos', 'Caja chica', fecha.slice(0, 7)), m.archivo, 'Caja_' + m.tipo + '_' + fecha);
  append_('CAJA', { id: nuevoId_('CJ'), fecha: fecha, tipo: m.tipo, medio: m.medio || (m.tipo === 'Entrada' ? 'Transferencia' : 'Efectivo de caja chica'), monto: Math.round(Number(m.monto)),
    concepto: String(m.concepto).trim(), proveedor: m.proveedor || '', documento: m.documento || '', responsable: m.responsable || u.nombre,
    comprobante_url: url, registrado_por: u.nombre, creado: new Date() });
  return apiCaja(token, fl);
}


/* ===================== SMARTOLT: señal y estado de cada ONU ===================== */
/* Config: so_url = https://empresa.smartolt.com   so_token = API KEY (SmartOLT → Settings → API KEY). Se cruza por N° de serie con los equipos instalados. */
function soCfg_() { var c = cfg_(); return { url: String(c.so_url || '').trim().replace(/\/+$/, '').replace(/\/api$/, ''), token: String(c.so_token || '').trim() }; }
function soGet_(ruta) {
  var m = soCfg_();
  if (!m.url || !m.token) throw new Error('Falta configurar SmartOLT (dirección y API KEY) en Configuración.');
  var r = UrlFetchApp.fetch(m.url + '/api/' + ruta, { method: 'get', headers: { 'X-Token': m.token }, muteHttpExceptions: true });
  var txt = r.getContentText(), j = null; try { j = JSON.parse(txt); } catch (e) {}
  if (r.getResponseCode() >= 400 || !j) throw new Error('SmartOLT ' + ruta + ' respondió ' + r.getResponseCode() + ': ' + txt.slice(0, 200));
  if (j.status === false) throw new Error('SmartOLT ' + ruta + ': ' + (j.error || JSON.stringify(j).slice(0, 200)));
  return j;
}
function snNorm_(s) {
  var x = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  // 485754431A2B3C4D (hex) → HWTC1A2B3C4D: así calzan las series escritas de las dos formas
  if (/^[0-9A-F]{16}$/.test(x)) { var pre = ''; for (var i = 0; i < 8; i += 2) pre += String.fromCharCode(parseInt(x.substr(i, 2), 16)); if (/^[A-Z]{4}$/.test(pre)) x = pre + x.slice(8); }
  return x;
}
function onusPorSn_() {
  var o = {};
  try { rows_('ONUS').forEach(function (x) { delete x._row; o[snNorm_(x.sn)] = x; }); } catch (e) {}
  return o;
}
/** Normaliza nombres para cruzar ONU ↔ cliente: minúsculas, sin tildes ni símbolos. */
function nomNorm_(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ''); }
/** Índice de ONU por nombre / ID externo (en SmartOLT se suele poner el nombre del cliente, su usuario PPP o su ID de Mikrowisp). */
function onusPorNombre_() {
  var o = {};
  try { rows_('ONUS').forEach(function (x) { delete x._row; [x.nombre, x.external_id].forEach(function (k) { k = nomNorm_(k); if (k.length >= 4 && !o[k]) o[k] = x; }); }); } catch (e) {}
  return o;
}
function clientePorId_(cid) {
  if (!_M.cliId) { _M.cliId = {}; rows_('CLIENTES').forEach(function (c) { _M.cliId[c.id] = c; }); }
  return _M.cliId[cid];
}
/** ONU del cliente: 1) por N° de serie de su equipo instalado; 2) por nombre, usuario PPP, ID de Mikrowisp o RUT en el nombre de la ONU. */
function onuDeCliente_(cid, cli) {
  if (!_M.onus) _M.onus = onusPorSn_();
  if (!_M.eqCli) { _M.eqCli = {}; rows_('EQUIPOS').forEach(function (e) { if (e.estado === 'Instalado' && e.cliente_id) (_M.eqCli[e.cliente_id] = _M.eqCli[e.cliente_id] || []).push(e.serie); }); }
  var L = _M.eqCli[cid] || [];
  for (var i = 0; i < L.length; i++) { var x = _M.onus[snNorm_(L[i])]; if (x) return x; }
  var c = cli || clientePorId_(cid); if (!c) return null;
  if (!_M.onuNom) _M.onuNom = onusPorNombre_();
  var claves = [c.usuario_ppp, c.mw_id, c.rut && String(c.rut).replace(/[^0-9kK]/g, ''), c.nombre, c.id];
  for (var j = 0; j < claves.length; j++) { var k = nomNorm_(claves[j]); if (k.length >= 4 && _M.onuNom[k]) return _M.onuNom[k]; }
  return null;
}
/** Cuántos clientes quedaron vinculados a una ONU (para revisar el cruce). */
function cruceSmartOlt_() {
  _M.onus = null; _M.eqCli = null; _M.onuNom = null; _M.cliId = null;
  var C = rows_('CLIENTES').filter(function (c) { return String(c.activo) !== 'false' && String(c.activo) !== 'NO' && !/retir|cancel|baja|elimin/i.test(String(c.estado_servicio || '')); }), n = 0, sin = [], usadas = {}, rep = 0;
  C.forEach(function (c) { var o = onuDeCliente_(c.id, c); if (o) { n++; if (usadas[o.sn]) rep++; usadas[o.sn] = 1; } else if (sin.length < 5) sin.push(c.nombre); });
  return { clientes: C.length, vinculados: n, repetidas: rep, ejemplos_sin_onu: sin };
}
/** Trae todas las ONU de SmartOLT (nombre, OLT, puerto, estado y señal). */
function sincronizarSmartOlt() {
  if (porEmpresas_('sincronizarSmartOlt', arguments)) return;
  var res = { onus: 0, errores: [] };
  try {
    var L = mwLista_(soGet_('onu/get_all_onus_details'));
    var ahora = new Date(), H = HOJAS.ONUS;
    var V = L.map(function (x) {
      var o = { sn: snNorm_(mwVal_(x, ['sn', 'serial', 'onu_sn'])), external_id: mwVal_(x, ['unique_external_id', 'external_id', 'id']), nombre: mwVal_(x, ['name', 'onu_name', 'nombre']),
        olt: mwVal_(x, ['olt_name', 'olt']), tarjeta: mwVal_(x, ['board']), puerto: mwVal_(x, ['port', 'pon_port']), zona: mwVal_(x, ['zone_name', 'zone']),
        estado: mwVal_(x, ['status', 'onu_status', 'state']), senal: mwVal_(x, ['signal_1310', 'signal_value', 'rx_power', 'signal']), actualizado: ahora };
      return H.map(function (h) { return limpia_(o[h]); });
    }).filter(function (r) { return r[0]; });
    var lock = LockService.getScriptLock(); lock.waitLock(30000);
    try {
      var sh = sh_('ONUS');
      if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, H.length).clearContent();
      if (V.length) sh.getRange(2, 1, V.length, H.length).setValues(V);
      fresco_();
    } finally { lock.releaseLock(); }
    res.onus = V.length;
    res.ejemplo_onu = V.length ? { nombre: V[0][2], external_id: V[0][1] } : null;
    try { var cr = cruceSmartOlt_(); res.vinculados = cr.vinculados; res.clientes = cr.clientes; res.repetidas = cr.repetidas; res.sin_onu = cr.ejemplos_sin_onu; } catch (e) {}
  } catch (e) { res.errores.push('SmartOLT: ' + e.message); }
  setCfg_('so_ultima_sync', fmt_(new Date(), 'yyyy-MM-dd HH:mm') + (res.errores.length ? ' · error: ' + res.errores[0].slice(0, 200) : ' · ' + res.onus + ' ONU'));
  Logger.log(JSON.stringify(res));
  return res;
}
/** Señal en vivo de la ONU del cliente de un ticket (botón en la app del técnico). */
function apiSenalOnu(token, ticketId) {
  auth_(token);
  var t = rows_('TICKETS').filter(function (x) { return x.id === ticketId; })[0];
  if (!t || !t.cliente_id) throw new Error('El ticket no tiene cliente vinculado.');
  var o = onuDeCliente_(t.cliente_id);
  if (!o) throw new Error('No encontré la ONU de este cliente en SmartOLT. Se busca por N° de serie del equipo instalado, o por nombre, usuario PPP o ID de Mikrowisp en el nombre de la ONU.');
  var vivo = {};
  try {
    var j = soGet_('onu/get_onu_signal/' + encodeURIComponent(o.external_id));
    var txt = JSON.stringify(j), m = txt.match(/-?\d{1,2}(?:\.\d+)?\s*dBm/i);
    vivo.senal = m ? m[0] : mwVal_(j, ['onu_signal_value', 'onu_signal_1310', 'signal_value', 'onu_signal']);
    vivo.calidad = mwVal_(j, ['onu_signal']);
  } catch (e) { vivo.error = e.message; }
  try { var st = soGet_('onu/get_onu_status/' + encodeURIComponent(o.external_id)); vivo.estado = mwVal_(st, ['onu_status', 'status_text', 'state']) || (st.status === true ? '' : ''); } catch (e) {}
  o.vivo = vivo;
  return o;
}
function apiSyncSmartOlt(token) {
  auth_(token, ['admin']);
  var r = sincronizarSmartOlt();
  if (!r.errores.length && !ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'sincronizarSmartOlt'; })) {
    try { activarSyncSmartOlt(); r.automatico = true; } catch (e) {}
  }
  return r;
}


/* ===================== MANTENCIONES: generadores, aires acondicionados y otros equipos de sitio ===================== */
var TIPOS_INFRA = ['Generador', 'Aire acondicionado', 'UPS / baterías', 'Rectificador', 'Extintor', 'Otro'];
var TIPOS_MANT = ['Preventiva', 'Correctiva', 'Revisión / prueba', 'Carga de combustible'];
var CADA_DIAS_DEF = { 'Generador': 90, 'Aire acondicionado': 180, 'UPS / baterías': 180, 'Rectificador': 180, 'Extintor': 365, 'Otro': 180 };

function infraEstado_() {
  var hoy = hoy_(), M = rows_('MANTENCIONES'), ult = {};
  M.forEach(function (m) { var f = f10_(m.fecha); if (m.tipo !== 'Carga de combustible' && (!ult[m.equipo_id] || f > ult[m.equipo_id].fecha)) ult[m.equipo_id] = { fecha: f, tipo: m.tipo, por: m.realizada_por, horometro: m.horometro }; });
  return rows_('INFRA').filter(function (e) { return e.activo !== 'NO'; }).map(function (e) {
    var u = ult[e.id] || null, cada = Number(e.cada_dias) || CADA_DIAS_DEF[e.tipo] || 180;
    var prox = u ? fmt_(new Date(new Date(u.fecha + 'T12:00:00').getTime() + cada * 864e5), 'yyyy-MM-dd') : '';
    var dias = prox ? Math.round((new Date(prox + 'T12:00:00') - new Date(hoy + 'T12:00:00')) / 864e5) : null;
    var alerta = !u ? 'Sin mantención registrada' : dias < 0 ? 'Vencida hace ' + (-dias) + ' día(s)' : dias <= 15 ? 'Toca en ' + dias + ' día(s)' : '';
    return { id: e.id, tipo: e.tipo, nombre: e.nombre, ubicacion: e.ubicacion, marca: e.marca, modelo: e.modelo, serie: e.serie, capacidad: e.capacidad, cada_dias: cada,
      obs: e.obs, ultima: u, proxima: prox, dias: dias, alerta: alerta, vencida: !u || dias < 0 };
  }).sort(function (a, b) { return (a.dias === null ? -1e9 : a.dias) - (b.dias === null ? -1e9 : b.dias); });
}
function apiMantenciones(token) {
  auth_(token, ROLES_PANEL);
  var nom = {}; rows_('INFRA').forEach(function (e) { nom[e.id] = e.nombre; });
  return { equipos: infraEstado_(), tipos: TIPOS_INFRA, tiposMant: TIPOS_MANT, personas: personas_(),
    historial: rows_('MANTENCIONES').map(function (m) { return { id: m.id, equipo_id: m.equipo_id, equipo: nom[m.equipo_id] || m.equipo_id, fecha: f10_(m.fecha), tipo: m.tipo, realizada_por: m.realizada_por,
      horometro: m.horometro, detalle: m.detalle, costo: Number(m.costo) || 0, archivo_url: m.archivo_url, registrado_por: m.registrado_por }; }).sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }) };
}
/** e = {id?, tipo, nombre, ubicacion, marca, modelo, serie, capacidad, cada_dias, obs, activo} */
function apiGuardarInfra(token, e) {
  auth_(token, ROLES_BODEGA);
  if (!e || !String(e.nombre || '').trim()) throw new Error('Ponle un nombre (ej. Generador nodo Lo Águila).');
  if (TIPOS_INFRA.indexOf(e.tipo) < 0) throw new Error('Elige el tipo de equipo.');
  var o = { tipo: e.tipo, nombre: String(e.nombre).trim(), ubicacion: e.ubicacion || '', marca: e.marca || '', modelo: e.modelo || '', serie: e.serie || '', capacidad: e.capacidad || '',
    cada_dias: Number(e.cada_dias) || CADA_DIAS_DEF[e.tipo], obs: e.obs || '', activo: e.activo === 'NO' ? 'NO' : 'SI' };
  var ex = e.id ? rows_('INFRA').filter(function (x) { return x.id === e.id; })[0] : null;
  if (ex) update_('INFRA', ex._row, o); else { o.id = nuevoId_('EQ'); o.creado = new Date(); append_('INFRA', o); }
  return apiMantenciones(token);
}
/** m = {equipo_id, fecha, tipo, realizada_por, horometro, detalle, costo, archivo:{nombre,mime,data}} */
function apiRegistrarMantencion(token, m) {
  var u = auth_(token, ROLES_BODEGA);
  var e = rows_('INFRA').filter(function (x) { return x.id === (m && m.equipo_id); })[0];
  if (!e) throw new Error('Elige el equipo.');
  if (!String(m.detalle || '').trim()) throw new Error('Escribe qué se hizo.');
  var fecha = f10_(m.fecha) || hoy_(), url = '';
  if (m.archivo && m.archivo.data) url = guardarArchivo_(carpetaMant_(e, fecha), m.archivo, 'Mantencion_' + fecha);
  append_('MANTENCIONES', { id: nuevoId_('MT'), equipo_id: e.id, fecha: fecha, tipo: TIPOS_MANT.indexOf(m.tipo) >= 0 ? m.tipo : 'Preventiva', realizada_por: m.realizada_por || u.nombre,
    horometro: m.horometro || '', detalle: String(m.detalle).trim(), costo: Number(m.costo) || 0, archivo_url: url, registrado_por: u.nombre, creado: new Date() });
  return apiMantenciones(token);
}
function carpetaMant_(e, fecha) { return carpetaDe_('bodega', 'Mantenciones', String(e.nombre).replace(/[\/]/g, '-'), fecha.slice(0, 4)); }

/** Un servicio de Mikrowisp (plan, dirección, IP, usuario PPP…). Nunca se guarda la clave PPP. */
function servicioMw_(s) {
  return { id: mwVal_(s, ['id', 'idservicio', 'id_servicio']), plan: mwVal_(s, ['perfil', 'plan', 'nombre_plan']), dir: mwVal_(s, ['direccion', 'direccion_servicio']),
    ip: mwVal_(s, ['ip', 'ipap']), ppp: mwVal_(s, ['pppuser', 'usuario_ppp', 'user']), router: mwVal_(s, ['nodo', 'router', 'emisor']),
    estado: mwVal_(s, ['status_user', 'estado', 'status']).toUpperCase(), coord: mwVal_(s, ['coordenadas', 'ubicacion']), precinto: mwVal_(s, ['precinto']) };
}
function textoServicio_(s) { return [s.id ? '#' + s.id : '', s.plan, s.dir, s.ppp ? 'PPP ' + s.ppp : '', s.ip ? 'IP ' + s.ip : ''].filter(Boolean).join(' · '); }
function mapClientesMw_(L) {
  return L.map(function (c) {
      var SV = Array.isArray(c.servicios) ? c.servicios.filter(function (s) { return s && typeof s === 'object'; }) : [];
      var serv = SV[0] || {}, lista = SV.map(servicioMw_);
      return { servicios: lista.length ? JSON.stringify(lista) : '', n_servicios: lista.length, mw_id: mwVal_(c, ['id', 'idcliente', 'id_cliente']), nombre: mwVal_(c, ['nombre', 'name', 'cliente']), rut: mwVal_(c, ['cedula', 'rut', 'dni', 'documento']),
        telefono: mwVal_(c, ['movil', 'telefono', 'celular', 'phone']), direccion: mwVal_(c, ['direccion_principal', 'direccion', 'address']) || mwVal_(serv, ['direccion']),
        comuna: mwVal_(c, ['zona', 'comuna', 'ciudad']), plan: lista.length > 1 ? lista.length + ' servicios' : (mwVal_(serv, ['perfil', 'plan']) || mwVal_(c, ['plan'])),
        estado_servicio: mwVal_(c, ['estado', 'status']).toUpperCase(), usuario_ppp: mwVal_(serv, ['pppuser', 'usuario_ppp', 'user']) || mwVal_(c, ['pppuser', 'usuario_ppp']),
        precinto: mwVal_(c, ['precinto', 'Precinto']) || mwVal_(serv, ['precinto']),
        email: (mwVal_(c, ['correo', 'email', 'mail', 'correo_electronico']).match(/[^\s,;]+@[^\s,;]+\.[a-z]{2,}/i) || [''])[0],
        mapa_url: [mwVal_(c, ['direccion_secundaria', 'direccionsecundaria', 'DireccionSecundaria', 'direccion2', 'ubicacion', 'coordenadas']), mwVal_(serv, ['coordenadas', 'ubicacion'])]
          .filter(function (x) { return /maps|goo\.gl|^-?\d+\.\d+\s*,/.test(x); })[0] || '' };
  }).filter(function (x) { return x.nombre; });
}
function mapNapsMw_(N) {
  return N.map(function (n) {
    var ub = mwVal_(n, ['coordenadas', 'ubicacion_gps', 'gps', 'location']), ll = ub.split(/[,;\s]+/);
    var desc = mwVal_(n, ['descripcion', 'nombre']), rp = n.resumen_puertos || {};
    var prec = (desc.match(/\b(\d{6,8})\b/) || [])[1] || mwVal_(n, ['precinto']), pot = (desc.match(/(-?\d{1,2}[.,]\d+)\s*dBm/i) || [])[1] || mwVal_(n, ['potencia']);
    var cap = Number(rp.total || mwVal_(n, ['puertos', 'capacidad'])) || '';
    return { id: 'MW_NAP_' + mwVal_(n, ['id']), tipo: 'NAP', nombre: desc || ('NAP ' + mwVal_(n, ['id'])), lat: ll[0], lng: ll[1],
      capacidad: cap, ocupados: rp.usados !== undefined ? Number(rp.usados) : '', cupos: rp.libres !== undefined ? Number(rp.libres) : '',
      potencia: pot ? String(pot).replace(',', '.') : '', obs: [mwVal_(n, ['ubicacion']), mwVal_(n, ['detalles'])].filter(Boolean).join(' · '), precinto: prec,
      _claves: [desc, mwVal_(n, ['nombre', 'name', 'codigo']), prec].join(' ') };
  });
}

/* ===================== PUENTE LOCAL CON MIKROWISP (sin abrir la API a internet) ===================== */
/* Un script en un equipo de la red de la empresa consulta Mikrowisp por dentro y envía los datos aquí (doPost).
 * Así el firewall de Mikrowisp queda cerrado. La clave del puente se genera en Configuración. */
function doPost(e) {
  var out;
  try {
    var b = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (modoPlataforma_()) {
      var cod = (e && e.parameter && e.parameter.e) || b.e;
      if (cod) usarEmpresa_(cod);
      else if (!b.rpc || PUBLICAS_PLATAFORMA.indexOf(b.rpc) < 0) throw new Error('Falta el código de empresa.');
    }
    if (b.rpc) return rpc_(b);
    var clave = String(cfg_().puente_clave || '');
    if (!clave || b.clave !== clave) throw new Error('Clave del puente incorrecta.');
    out = puente_(b);
    setCfg_('puente_ultimo', fmt_(new Date(), 'yyyy-MM-dd HH:mm') + ' · ' + b.accion + (out && out.resumen ? ' · ' + out.resumen : ''));
    out.ok = true;
  } catch (err) { out = { ok: false, error: err.message }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function puente_(b) {
  var d = Array.isArray(b.datos) ? b.datos : mwLista_(b.datos || {});
  if (b.accion === 'clientes') { var r = importarClientes_(mapClientesMw_(d)); setCfg_('mw_ultima_sync', fmt_(new Date(), 'yyyy-MM-dd HH:mm') + ' · por puente · OK'); return { clientes: r, resumen: r.creados + ' nuevos, ' + r.actualizados + ' actualizados' }; }
  if (b.accion === 'naps') { var n = importarRed_(mapNapsMw_(d), 'Mikrowisp'); return { naps: n, resumen: n.nuevos + ' nuevas, ' + n.actualizados + ' actualizadas' }; }
  if (b.accion === 'tickets') { var t = procesarTicketsMw_(d); return { tickets: t, resumen: t.nuevos + ' nuevos, ' + t.cerrados + ' cerrados' }; }
  if (b.accion === 'pendientes') {
    return { pendientes: rows_('MW_COLA').filter(function (q) { return q.estado === 'Pendiente'; }).map(function (q) { return { id: q.id, mw_ticket: String(q.mw_ticket), accion: q.accion, texto: q.texto }; }), resumen: '' };
  }
  if (b.accion === 'hechos') {
    var ok = b.ids || [], n2 = 0;
    rows_('MW_COLA').forEach(function (q) { if (ok.indexOf(q.id) >= 0 && q.estado === 'Pendiente') { update_('MW_COLA', q._row, { estado: 'Hecho' }); n2++; } });
    return { hechos: n2, resumen: n2 + ' cerrados en Mikrowisp' };
  }
  if (b.accion === 'hola') return { resumen: 'conectado', empresa: cfg_().marca || '' };
  throw new Error('Acción desconocida: ' + b.accion);
}
function apiNuevaClavePuente(token) {
  auth_(token, ['admin']);
  setCfg_('puente_clave', Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8));
  return apiConfig(token);
}


/* ===================== VEHÍCULOS: subir documentos desde el panel ===================== */
/** d = {patente, tipo: 'Revisión técnica'|'SOAP'|'Permiso de circulación'|'Otro documento', vence, fecha, resultado, monto, obs, archivo:{nombre,mime,data}} */
function apiDocVehiculo(token, d) {
  var u = auth_(token, ROLES_PANEL);
  var p = normPat_(d && d.patente);
  if (!p) throw new Error('Elige la patente.');
  var tipos = ['Revisión técnica', 'SOAP', 'Permiso de circulación', 'Otro documento'];
  if (tipos.indexOf(d.tipo) < 0) throw new Error('Elige el tipo de documento.');
  if (d.tipo !== 'Otro documento' && !f10_(d.vence)) throw new Error('Pon la fecha de vencimiento.');
  if (!d.archivo || !d.archivo.data) throw new Error('Adjunta el documento (PDF o foto).');
  var now = new Date(), mes = fmt_(now, 'yyyy-MM');
  var carpeta = carpetaDe_('vehiculos', p, mes);
  var url = guardarArchivo_(carpeta, d.archivo, d.tipo.replace(/\W+/g, '_') + '_' + p);
  var datos = { patente: p, conductor: u.nombre, doc_fotos: [url], doc_monto: Number(d.monto) || '', obs: d.obs || '', _panel: true };
  if (d.tipo === 'Revisión técnica') { datos.tipo_reg = 'Revisión técnica'; datos.rt_fecha = f10_(d.fecha) || hoy_(); datos.rt_resultado = d.resultado || 'Aprobada'; datos.rt_vence = f10_(d.vence); datos.rt_monto = datos.doc_monto; datos.rt_cert = [url]; }
  else if (d.tipo === 'SOAP') { datos.tipo_reg = 'SOAP / permiso de circulación'; datos.soap_vence = f10_(d.vence); }
  else if (d.tipo === 'Permiso de circulación') { datos.tipo_reg = 'SOAP / permiso de circulación'; datos.permiso_vence = f10_(d.vence); }
  else { datos.tipo_reg = 'Otro'; datos.obs = (d.obs || 'Documento') + (f10_(d.vence) ? ' · vence ' + f10_(d.vence) : ''); }
  var f = forms_(false).filter(function (x) { return x.id === 'BITACORA'; })[0] || { nombre: 'Bitácora de vehículo' };
  append_('REGISTROS', { id: nuevoId_('R'), fecha: now, form_id: 'BITACORA', form_nombre: f.nombre, ticket_id: '', tecnico_rut: u.rut, tecnico_nombre: u.nombre,
    n_alertas: d.resultado === 'Rechazada' ? 1 : 0, alertas: d.resultado === 'Rechazada' ? 'Revisión técnica rechazada' : '', pdf_url: url, carpeta_url: carpeta.getUrl(),
    client_id: '', datos: JSON.stringify(datos) });
  return apiVehiculos(token);
}


/* ===================== TÉCNICO: "Voy en camino" ===================== */
function apiEnCamino(token, id, geo) {
  var u = auth_(token);
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var t = rows_('TICKETS').filter(function (x) { return x.id === id; })[0];
    if (!t) throw new Error('El ticket no existe.');
    if (!esDelTicket_(t, u.rut)) throw new Error('Este ticket no está asignado a ti.');
    if (['Cerrado', 'Anulado'].indexOf(t.estado) >= 0) throw new Error('El ticket ya está ' + t.estado.toLowerCase() + '.');
    var hora = fmt_(new Date(), 'HH:mm'), donde = geo && geo.lat ? ' (desde ' + Number(geo.lat).toFixed(5) + ',' + Number(geo.lng).toFixed(5) + ')' : '';
    update_('TICKETS', t._row, { estado: 'En camino', actualizado: new Date(), notas: (t.notas ? String(t.notas) + ' · ' : '') + 'En camino ' + fmt_(new Date(), 'dd-MM') + ' ' + hora + donde });
  } finally { lock.releaseLock(); }
  return { ok: true };
}

function actualizarSistema() {
  setup();
  try { if (cfg_().rubro) sembrarRubro_(cfg_().rubro); } catch (e) { Logger.log('Rubro: ' + e); }
  try { forms_(false).filter(function (f) { return FORMATOS_AUTO.indexOf(f.id) >= 0; }).forEach(function (f) { publicarFormato_(f, null, true); }); } catch (e) { console.warn('Formatos: ' + e); }
  try {   // OT: correo del cliente y opción "no firma digitalmente"
    var fot = rows_('FORMULARIOS').filter(function (x) { return x.id === 'OT'; })[0], dot = fot ? json_(fot.definicion, null) : null;
    if (dot && JSON.stringify(dot).indexOf('correo_cliente') < 0) {
      var base = DEFAULT_FORMS.filter(function (f) { return f.id === 'OT'; })[0], nuevos = [];
      base.secciones.forEach(function (sec) { sec.items.forEach(function (it) { if (['correo_cliente', 'cliente_no_firma', 'motivo_no_firma'].indexOf(it.id) >= 0) nuevos.push(it); }); });
      var puesto = false;
      (dot.secciones || []).forEach(function (sec) {
        var k = sec.items.map(function (it) { return it.id; }).indexOf('firma_cliente');
        if (k >= 0 && !puesto) { Array.prototype.splice.apply(sec.items, [k, 0].concat(nuevos)); puesto = true; }
      });
      if (!puesto && dot.secciones && dot.secciones.length) dot.secciones[dot.secciones.length - 1].items = nuevos.concat(dot.secciones[dot.secciones.length - 1].items);
      sh_('FORMULARIOS').getRange(fot._row, 7).setValue(JSON.stringify(dot)); fresco_();
    }
  } catch (e) { Logger.log('OT: ' + e); }
  try {   // OT: NAP usada y precinto del cliente (descuenta el cupo al tiro)
    var fo2 = rows_('FORMULARIOS').filter(function (x) { return x.id === 'OT'; })[0], d2 = fo2 ? json_(fo2.definicion, null) : null;
    if (d2 && JSON.stringify(d2).indexOf('"nap"') < 0) {
      var nv = [{ id: 'nap', tipo: 'nap', texto: 'NAP donde quedó conectado (instalación o traslado)' }, { id: 'precinto', tipo: 'texto', texto: 'N° de precinto del cliente' }];
      var ok2 = false;
      (d2.secciones || []).forEach(function (sec) {
        var k = sec.items.map(function (it) { return it.id; }).indexOf('potencia');
        if (k >= 0 && !ok2) { Array.prototype.splice.apply(sec.items, [k + 1, 0].concat(nv)); ok2 = true; }
      });
      if (!ok2 && d2.secciones && d2.secciones.length) d2.secciones[0].items = d2.secciones[0].items.concat(nv);
      sh_('FORMULARIOS').getRange(fo2._row, 7).setValue(JSON.stringify(d2)); fresco_();
    }
  } catch (e) { Logger.log('OT NAP: ' + e); }
  try {   // AST: detalle del estado personal y propietario o encargado mayor de 18 años
    var fa = rows_('FORMULARIOS').filter(function (x) { return x.id === 'AST'; })[0], da = fa ? json_(fa.definicion, null) : null;
    if (da && JSON.stringify(da).indexOf('g_estado_det') < 0) {
      (da.secciones || []).forEach(function (sec) {
        var k = sec.items.map(function (it) { return it.id; }).indexOf('g_estado');
        if (k >= 0) sec.items.splice(k + 1, 0, { id: 'g_estado_det', tipo: 'texto', texto: 'Detalle del estado personal (opcional; si marcaste NO, explica qué pasa)' });
        var kp = -1;
        sec.items.forEach(function (it, j) { if (/propietario est/i.test(it.texto || '')) { it.texto = 'El propietario o un encargado mayor de 18 años está presente (riesgos domiciliarios)'; kp = j; } });
        if (kp >= 0 && !sec.items.some(function (it) { return it.id === 'encargado'; })) sec.items.push({ id: 'encargado', tipo: 'texto', texto: 'Nombre de quien está presente en el domicilio (propietario o encargado mayor de 18 años)' });
      });
      sh_('FORMULARIOS').getRange(fa._row, 7).setValue(JSON.stringify(da)); fresco_();
    }
  } catch (e) { Logger.log('AST: ' + e); }
  try {   // incidente: criterios de accidente grave o fatal (Circular SUSESO 3335)
    var fi = rows_('FORMULARIOS').filter(function (x) { return x.id === 'INCIDENTE'; })[0], di = fi ? json_(fi.definicion, null) : null;
    if (di && JSON.stringify(di).indexOf('"grave"') < 0) {
      (di.secciones = di.secciones || []).splice(1, 0, { titulo: '¿Accidente GRAVE o FATAL? (Circular SUSESO 3335)', si: { campo: 'tipo_inc', valor: ['Accidente de trabajo', 'Accidente de trayecto'] }, items: GRAVE_ITEMS });
      sh_('FORMULARIOS').getRange(fi._row, 7).setValue(JSON.stringify(di)); fresco_();
    } else if (di && JSON.stringify(di).indexOf('grave_diat') < 0) {   // versión anterior de la sección: se actualiza (Circulares 3.705 y 3.831)
      di.secciones.forEach(function (sec) { if (sec.items && sec.items.some(function (it) { return it.id === 'grave'; })) sec.items = GRAVE_ITEMS; });
      sh_('FORMULARIOS').getRange(fi._row, 7).setValue(JSON.stringify(di)); fresco_();
    }
  } catch (e) { Logger.log('Incidente grave: ' + e); }
  ['HERRAMIENTAS', 'CHK_CAMIONETA', 'CHK_INDIVIDUAL'].forEach(function (fid) {   // código de colores del mes (SIG-PT-01)
    try {
      var fr = rows_('FORMULARIOS').filter(function (x) { return x.id === fid; })[0], d3 = fr ? json_(fr.definicion, null) : null;
      if (!d3 || JSON.stringify(d3).indexOf('cinta_mes') >= 0) return;
      var sec = { titulo: 'Código de colores del mes (SIG-PT-01)', nota: 'Las herramientas y equipos revisados llevan cinta del color del mes. Rojo = no conformidad: no se usa y se entrega para reparación o baja.', items: CINTA_ITEMS };
      var ss3 = d3.secciones || (d3.secciones = []), k3 = ss3.map(function (s) { return s.titulo; }).indexOf('Cierre');
      if (k3 < 0) ss3.push(sec); else ss3.splice(k3, 0, sec);
      sh_('FORMULARIOS').getRange(fr._row, 7).setValue(JSON.stringify(d3)); fresco_();
    } catch (e) { Logger.log('Colores ' + fid + ': ' + e); }
  });
  var ar = DEFAULT_FORMS.filter(function (f) { return f.id === 'AST_RAPIDA'; })[0];   // AST rápida: siempre con las preguntas vigentes
  var far = rows_('FORMULARIOS').filter(function (x) { return x.id === 'AST_RAPIDA'; })[0];
  if (ar && far && far.definicion !== JSON.stringify(defDe_(ar))) { sh_('FORMULARIOS').getRange(far._row, 7).setValue(JSON.stringify(defDe_(ar))); fresco_(); }
  var b = DEFAULT_FORMS.filter(function (f) { return f.id === 'BITACORA'; })[0];
  var fila = rows_('FORMULARIOS').filter(function (x) { return x.id === 'BITACORA'; })[0];
  if (b && fila) { sh_('FORMULARIOS').getRange(fila._row, 7).setValue(JSON.stringify(defDe_(b))); Logger.log('Bitácora actualizada (SOAP / permiso).'); }
  agregarFirmaATodos();
  actualizarCargos_();
  vincularClientes_();
  actualizarOT_();
  var nI = sembrarInventario_(), nA = sembrarActivos_();
  if (nI) Logger.log('Catálogo de bodega creado con ' + nI + ' artículos (materiales, EPP, ropa y herramientas).');
  if (nA) Logger.log('Equipos de medición y herramientas mayores creados: ' + nA + '.');
  var trg = estadoAvisos_();
  if (trg.diario && !trg.respaldo) { ScriptApp.newTrigger('respaldoSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(23).nearMinute(0).inTimezone(TZ).create(); Logger.log('Respaldo semanal activado (domingos 23:00).'); }
  var epp = forms_(false).filter(function (f) { return f.id === 'EPP'; })[0];
  if (epp) {
    var sec = epp.secciones[0], ya = sec.items.map(function (x) { return x.texto; });
    ['Guante de tacto fino', 'Guante anticorte', 'Bloqueador solar'].forEach(function (t, i) {
      if (ya.indexOf(t) < 0) sec.items.push({ id: 'p_x' + i, tipo: 'sino', texto: t, req: true, alerta: 'NO', na: true });
    });
    var fe = rows_('FORMULARIOS').filter(function (x) { return x.id === 'EPP'; })[0];
    sh_('FORMULARIOS').getRange(fe._row, 7).setValue(JSON.stringify(defDe_(epp)));
  }
  forms_(false).forEach(function (gas) {   // medio de pago "Caja chica" en los formularios que piden medio de pago
    var cambio = false;
    itemsOf_(gas).forEach(function (it) { if (Array.isArray(it.opciones) && it.opciones.indexOf('Fondo por rendir') >= 0 && it.opciones.indexOf('Caja chica') < 0) { it.opciones.splice(2, 0, 'Caja chica'); cambio = true; } });
    var fg = rows_('FORMULARIOS').filter(function (x) { return x.id === gas.id; })[0];
    if (cambio && fg) sh_('FORMULARIOS').getRange(fg._row, 7).setValue(JSON.stringify(defDe_(gas)));
  });
  var cov = forms_(false).filter(function (f) { return f.id === 'COVID'; })[0];   // contacto con personal de salud: lo riesgoso es responder SÍ
  if (cov) { var cc = false; itemsOf_(cov).forEach(function (it) { if (it.id === 'c2' && !it.alerta) { it.alerta = 'SI'; cc = true; } });
    var fc = rows_('FORMULARIOS').filter(function (x) { return x.id === 'COVID'; })[0]; if (cc && fc) sh_('FORMULARIOS').getRange(fc._row, 7).setValue(JSON.stringify(defDe_(cov))); }
  Logger.log('Sistema actualizado. Ahora ejecuta activarAvisos para los correos automáticos.');
}

/* ===================== PANEL: FORMULARIOS ===================== */


function apiFormularios(token) { auth_(token, ROLES_PANEL); return forms_(false); }

function apiGuardarFormulario(token, f) {
  auth_(token, ROLES_EDITOR);
  if (!f || !f.id || !f.nombre) throw new Error('El formulario necesita ID y nombre.');
  f.id = String(f.id).toUpperCase().replace(/[^A-Z0-9_]/g, '');
  if (!Array.isArray(f.secciones) || !f.secciones.length) throw new Error('Agrega al menos una sección.');
  var json = JSON.stringify(defDe_(f));
  if (json.length > 49000) throw new Error('El formulario es demasiado grande.');
  var fila = [f.id, f.nombre, f.codigo || '', f.ambito || 'ticket', f.activo === 'NO' ? 'NO' : 'SI', Number(f.orden) || 99, json];
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); fresco_();
  try {
    var ex = rows_('FORMULARIOS').filter(function (x) { return x.id === f.id; })[0];
    if (ex) sh_('FORMULARIOS').getRange(ex._row, 1, 1, fila.length).setValues([fila]);
    else sh_('FORMULARIOS').appendRow(fila);
  } finally { lock.releaseLock(); }
  return forms_(false);
}

/* ===================== PANEL: USUARIOS ===================== */

function apiUsuarios(token) {
  auth_(token, ROLES_GESTION);
  return rows_('USUARIOS').map(function (x) {
    return { rut: normRut_(x.rut), nombre: x.nombre, cargo: x.cargo, rol: x.rol, email: x.email, telefono: x.telefono, activo: x.activo, creado: x.creado, area: areaDe_(x) };
  });
}

function apiGuardarUsuario(token, nu) {
  var me = auth_(token, ROLES_GESTION);
  var rut = normRut_(nu.rut);
  if (!rut || !nu.nombre) throw new Error('RUT y nombre son obligatorios.');
  var roles = ['tecnico', 'soporte', 'prevencionista', 'editor', 'admin'];
  if (roles.indexOf(nu.rol) < 0) nu.rol = 'tecnico';
  if (nu.rol === 'admin' && me.rol !== 'admin') throw new Error('Solo un administrador puede crear otros administradores.');
  if (nu.pin && !/^\d{4,8}$/.test(String(nu.pin))) throw new Error('El PIN debe tener entre 4 y 8 números.');
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); fresco_();
  try {
    var ex = rows_('USUARIOS').filter(function (x) { return normRut_(x.rut) === rut; })[0];
    var obj = { rut: rut, nombre: nu.nombre, cargo: nu.cargo || '', rol: nu.rol, email: nu.email || '', telefono: nu.telefono || '', activo: nu.activo === 'NO' ? 'NO' : 'SI',
      area: nu.area === 'Oficina' ? 'Oficina' : nu.area === 'Terreno' ? 'Terreno' : (nu.rol === 'tecnico' ? 'Terreno' : 'Oficina') };
    if (nu.pin) obj.pin_hash = hash_(nu.pin);
    if (ex) {
      if (ex.rol === 'admin' && me.rol !== 'admin') throw new Error('Solo un administrador puede modificar a otro administrador.');
      update_('USUARIOS', ex._row, obj);
    } else {
      if (!nu.pin) throw new Error('Asigna un PIN al usuario nuevo.');
      obj.creado = new Date();
      append_('USUARIOS', obj);
    }
  } finally { lock.releaseLock(); }
  return apiUsuarios(token);
}

/* ===================== PANEL: CONFIGURACIÓN ===================== */

function apiConfig(token) {
  auth_(token, ['admin']);
  var c = cfg_();
  c.url_base_datos = ss_().getUrl();
  c.url_drive = DriveApp.getFolderById(props_().getProperty('ROOT_ID')).getUrl();
  c.pestanas = pestanasOcultas_();
  c.rubros = listaRubros_(); c.vocab = vocab_(c);
  c.formsJornada = forms_(false).filter(function (f) { return f.ambito !== 'ticket'; }).map(function (f) { return { id: f.id, nombre: f.nombre }; });
  c.jornada_ids = jornadaObligatoria_();
  try { c.url_script = urlSis_(''); } catch (e) {}
  return c;
}

function apiGuardarConfig(token, obj) {
  auth_(token, ['admin']);
  var rubroAntes = String(cfg_().rubro || '').toUpperCase(), rubroNuevo = String((obj || {}).rubro || '').toUpperCase();
  var cambioRubro = rubroNuevo && RUBROS[rubroNuevo] && rubroNuevo !== rubroAntes && !(rubroAntes === 'CONTRATISTA' && rubroNuevo === 'MINERIA');
  if (cambioRubro) { obj.modulos_apagados = JSON.stringify(RUBROS[rubroNuevo].apagados || []); obj.vocabulario = ''; }
  var permitidas = ['codigo_empresa', 'rubro', 'color_primario', 'color_acento', 'modulos_apagados', 'vocabulario', 'empresa', 'marca', 'correo_notificaciones', 'notificar', 'correo_urgencias', 'correo_denuncias', 'jornada_obligatoria', 'razon_social', 'rut_empresa', 'ciudad', 'representante', 'comunas', 'dias_prestamo', 'url_app', 'url_panel', 'mw_url', 'mw_token', 'radio_factible', 'mw_cerrar', 'mw_dias_tickets', 'ast_opcional', 'firma_remota', 'correo_ot', 'clima_lat', 'clima_lng', 'matriz_fecha', 'matriz_elaboro', 'matriz_aprobo', 'correo_tecnicos', 'so_url', 'so_token', 'ast_linea_vertical'];
  var hay = {};
  rows_('CONFIG').forEach(function (r) {
    hay[r.clave] = 1;
    if (permitidas.indexOf(r.clave) >= 0 && obj.hasOwnProperty(r.clave)) sh_('CONFIG').getRange(r._row, 2).setValue(limpia_(obj[r.clave]));
  });
  permitidas.forEach(function (k) { if (!hay[k] && obj.hasOwnProperty(k)) append_('CONFIG', { clave: k, valor: obj[k], descripcion: '' }); });
  fresco_();
  if (obj.rubro && RUBROS[String(obj.rubro).toUpperCase()]) { try { sembrarRubro_(obj.rubro); } catch (e) { console.warn('Rubro: ' + e); } }
  return apiConfig(token);
}


/* ===================== AST OPCIONAL Y FIRMA DE LA OT POR EL CLIENTE ===================== */

/** Tipos de ticket en que la AST no es obligatoria para cerrar con la OT (Configuración → ast_opcional). */
function astOpcional_() {
  return String(cfg_().ast_opcional || '').split(',').map(function (x) { return x.trim(); }).filter(String);
}

/** Crea (o reutiliza) el enlace para que el cliente firme la OT desde su teléfono. */
function crearFirmaOT_(reg, ticket) {
  var ya = rows_('FIRMAS_OT').filter(function (x) { return x.registro_id === reg.id; })[0];
  var cli = ticket.cliente_id ? rows_('CLIENTES').filter(function (x) { return x.id === ticket.cliente_id; })[0] : null;
  var tel = String(ticket.telefono || (cli && cli.telefono) || '');
  if (ya) return { url: urlFirma_(ya.clave), telefono: tel, cliente: ya.cliente, estado: ya.estado };
  var clave = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
  var vence = new Date(); vence.setDate(vence.getDate() + 15);
  append_('FIRMAS_OT', { id: nuevoId_('FO'), creado: new Date(), registro_id: reg.id, ticket_id: ticket.id, cliente: ticket.cliente, telefono: tel,
    clave: clave, estado: 'Pendiente', vence: vence });
  return { url: urlFirma_(clave), telefono: tel, cliente: ticket.cliente, estado: 'Pendiente' };
}
function urlFirma_(clave) { return urlSis_('p=firmar&k=' + clave); }
function firmaPorClave_(k) {
  k = String(k || '').replace(/[^a-f0-9]/gi, '');
  if (k.length < 32) return null;
  return rows_('FIRMAS_OT').filter(function (x) { return x.clave === k; })[0] || null;
}
/** Resumen de la OT para mostrar al cliente (sin datos internos). */
function resumenOT_(fo) {
  var r = rows_('REGISTROS').filter(function (x) { return x.id === fo.registro_id; })[0];
  var t = rows_('TICKETS').filter(function (x) { return x.id === fo.ticket_id; })[0] || {};
  var d = json_(r && r.datos, {});
  var mats = Array.isArray(d.materiales) ? d.materiales.map(function (m) { return (m.cantidad || '') + ' ' + (m.unidad || '') + ' ' + (m.nombre || ''); }).join(', ') : String(d.materiales || '');
  return { ticket: fo.ticket_id, cliente: fo.cliente, direccion: [t.direccion, t.comuna].filter(Boolean).join(', '), fecha: r ? String(r.fecha).slice(0, 16) : '',
    tecnico: r ? r.tecnico_nombre : '', tipo: d.tipo || t.tipo || '', resultado: d.resultado || '', detalle: d.detalle || '', materiales: mats,
    potencia: d.potencia || '', n_ot: d.n_ot || '' };
}
function paginaFirmaOT_(k) {
  var c = cfg_(), fo = firmaPorClave_(k), html;
  var marca = esc_(c.marca || c.empresa || 'Servicio técnico');
  var css = '<style>*{box-sizing:border-box}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#f4f5f7;color:#1d1f23}' +
    '.w{max-width:560px;margin:0 auto;padding:16px}.c{background:#fff;border-radius:14px;padding:16px;margin:12px 0;box-shadow:0 1px 3px rgba(0,0,0,.08)}' +
    'h1{font-size:20px;margin:6px 0}dl{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0}dt{color:#666}dd{margin:0;font-weight:500}' +
    'canvas{width:100%;height:190px;border:2px dashed #bbb;border-radius:10px;background:#fff;touch-action:none}input{width:100%;padding:11px;border:1px solid #ccc;border-radius:9px;font-size:16px;margin:4px 0 10px}' +
    'button{padding:13px 16px;border-radius:10px;border:0;font-size:16px;font-weight:600}.p{background:#1d1f23;color:#fff;width:100%}.s{background:#e9eaee;margin-top:6px}.m{color:#666;font-size:14px}.ok{color:#1b7f3b}</style>';
  if (!fo) html = '<div class="c"><h1>Enlace no válido</h1><p class="m">Este enlace de firma no existe. Pide uno nuevo al técnico o a la oficina.</p></div>';
  else if (fo.estado === 'Firmada') html = '<div class="c"><h1 class="ok">✔ OT ya firmada</h1><p class="m">Firmada por ' + esc_(fo.nombre) + ' el ' + esc_(String(fo.firmado).slice(0, 16)) + '.</p>' +
    (fo.pdf_url ? '<p><a href="' + esc_(fo.pdf_url) + '">Ver copia (PDF)</a></p>' : '') + '</div>';
  else if (fo.vence && new Date(String(fo.vence).replace(' ', 'T')) < new Date()) html = '<div class="c"><h1>Enlace vencido</h1><p class="m">Pide uno nuevo a la oficina.</p></div>';
  else {
    var o = resumenOT_(fo), fila = function (a, b) { return b ? '<dt>' + a + '</dt><dd>' + esc_(b) + '</dd>' : ''; };
    html = '<div class="c"><p class="m" style="margin:0">' + marca + '</p><h1>Orden de trabajo ' + esc_(o.ticket) + '</h1><dl>' +
      fila('Cliente', o.cliente) + fila('Dirección', o.direccion) + fila('Fecha', o.fecha) + fila('Técnico', o.tecnico) + fila('Trabajo', o.tipo) +
      fila('Resultado', o.resultado) + fila('Detalle', o.detalle) + fila('Materiales', o.materiales) + fila('Potencia', o.potencia ? o.potencia + ' dBm' : '') + fila('N° OT', o.n_ot) + '</dl></div>' +
      '<div class="c" id="f"><b>Conformidad del cliente</b><p class="m">Al firmar confirmas que el trabajo descrito se realizó en tu domicilio.</p>' +
      '<label>Nombre de quien firma<input id="n" autocomplete="name"></label><label>RUT (opcional)<input id="r"></label>' +
      '<canvas id="cv"></canvas><button class="s" onclick="limpiar()">Borrar firma</button><p></p><button class="p" id="b" onclick="enviar()">Firmar OT</button><p class="m" id="e"></p></div>' +
      '<script>var cv=document.getElementById("cv"),x=cv.getContext("2d"),dib=false,hay=false;function tam(){var r=cv.getBoundingClientRect();cv.width=r.width*2;cv.height=r.height*2;x.scale(2,2);x.lineWidth=2.4;x.lineCap="round";x.strokeStyle="#111"}tam();' +
      'function pt(e){var r=cv.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return[t.clientX-r.left,t.clientY-r.top]}' +
      'function ini(e){e.preventDefault();dib=true;var p=pt(e);x.beginPath();x.moveTo(p[0],p[1])}function mov(e){if(!dib)return;e.preventDefault();var p=pt(e);x.lineTo(p[0],p[1]);x.stroke();hay=true}function fin(){dib=false}' +
      'cv.addEventListener("mousedown",ini);cv.addEventListener("mousemove",mov);window.addEventListener("mouseup",fin);cv.addEventListener("touchstart",ini,{passive:false});cv.addEventListener("touchmove",mov,{passive:false});cv.addEventListener("touchend",fin);' +
      'function limpiar(){x.clearRect(0,0,cv.width,cv.height);hay=false}' +
      'function enviar(){var n=document.getElementById("n").value.trim(),e=document.getElementById("e");if(!n){e.textContent="Escribe tu nombre.";return}if(!hay){e.textContent="Dibuja tu firma en el recuadro.";return}' +
      'var b=document.getElementById("b");b.disabled=true;b.textContent="Enviando…";google.script.run.withSuccessHandler(function(r){document.getElementById("f").innerHTML="<h1 class=ok>✔ ¡Gracias! OT firmada</h1>"+(r&&r.pdf_url?"<p><a href=\\""+r.pdf_url+"\\">Ver copia (PDF)</a></p>":"")})' +
      '.withFailureHandler(function(er){b.disabled=false;b.textContent="Firmar OT";e.textContent=er.message||er}).apiFirmarOT(' + JSON.stringify(String(k)) + ',{nombre:n,rut:document.getElementById("r").value.trim(),firma:cv.toDataURL("image/png").split(",")[1]})}</scr' + 'ipt>';
  }
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8">' + css + '</head><body><div class="w">' + html + '</div></body></html>')
    .setTitle('Firma de OT · ' + (c.marca || c.empresa || '')).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
/** Lo llama la página pública de firma (sin sesión: la clave del enlace es la autorización). */
function apiFirmarOT(k, d) {
  d = d || {};
  var nombre = String(d.nombre || '').trim().slice(0, 120), rut = String(d.rut || '').trim().slice(0, 20), firma = String(d.firma || '');
  if (!nombre) throw new Error('Escribe tu nombre.');
  if (!firma || firma.length < 200 || firma.length > 1500000) throw new Error('Dibuja tu firma.');
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var fo = firmaPorClave_(k);
    if (!fo) throw new Error('Enlace no válido.');
    if (fo.estado === 'Firmada') return { pdf_url: fo.pdf_url };
    if (fo.vence && new Date(String(fo.vence).replace(' ', 'T')) < new Date()) throw new Error('El enlace venció. Pide uno nuevo a la oficina.');
    var t = rows_('TICKETS').filter(function (x) { return x.id === fo.ticket_id; })[0];
    var carpeta = t ? carpeta_(t, new Date(), null, null, {}) : carpetaDe_('trabajos', 'Firmas OT');
    var ahora = new Date();
    var png = carpeta.createFile(Utilities.newBlob(Utilities.base64Decode(firma), 'image/png', 'firma_cliente_' + fo.ticket_id + '_' + fmt_(ahora, 'yyyyMMdd_HHmm') + '.png'));
    var o = resumenOT_(fo);
    var h = htmlOTCliente_(o, 'Firmado digitalmente por <b>' + esc_(nombre) + '</b>' + (rut ? ' (RUT ' + esc_(rut) + ')' : '') + ' el ' + fmt_(ahora, 'dd-MM-yyyy HH:mm') + ' desde el enlace enviado al cliente.', 'data:image/png;base64,' + firma);
    var pdfBlob = Utilities.newBlob(h, 'text/html', 'ot.html').getAs('application/pdf').setName('OT_' + fo.ticket_id + '_firmada_cliente_' + fmt_(ahora, 'yyyyMMdd_HHmm') + '.pdf');
    var pdf = carpeta.createFile(pdfBlob);
    try { var mail = correoDeTicket_(fo.registro_id, t); if (mail) enviarOTCorreo_(mail, o, pdfBlob, 'firmada'); } catch (e) { Logger.log('Correo OT firmada: ' + e); }
    try { pdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
    update_('FIRMAS_OT', fo._row, { estado: 'Firmada', firmado: ahora, nombre: nombre, rut: rut, firma_url: png.getUrl(), pdf_url: pdf.getUrl() });
    if (t) update_('TICKETS', t._row, { notas: String(t.notas || '') + ' · OT firmada por el cliente (' + nombre + ') ' + fmt_(ahora, 'dd-MM HH:mm') });
    return { pdf_url: pdf.getUrl() };
  } finally { lock.releaseLock(); }
}
/** Panel y app: estado de la firma del cliente de un ticket y enlace para (re)enviarlo. */
function apiFirmaOT(token, ticketId) {
  var u = auth_(token);
  var t = rows_('TICKETS').filter(function (x) { return x.id === ticketId; })[0];
  if (!t) throw new Error('El ticket no existe.');
  if (ROLES_PANEL.indexOf(u.rol) < 0 && !esDelTicket_(t, u.rut)) throw new Error('Este ticket no está asignado a ti.');
  var regs = rows_('REGISTROS').filter(function (r) { return r.ticket_id === ticketId && r.form_id === 'OT'; });
  if (!regs.length) return { estado: 'Sin OT' };
  var reg = regs[regs.length - 1];
  var fo = rows_('FIRMAS_OT').filter(function (x) { return x.registro_id === reg.id; })[0];
  if (fo && fo.estado === 'Firmada') return { estado: 'Firmada', nombre: fo.nombre, firmado: String(fo.firmado).slice(0, 16), pdf_url: fo.pdf_url };
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try { var r = crearFirmaOT_(reg, t); r.estado = 'Pendiente'; return r; } finally { lock.releaseLock(); }
}


/* ===================== PAUTA DE CHARLAS DIARIAS ===================== */

function fechaPauta_(v) {
  if (v instanceof Date) return fmt_(v, 'yyyy-MM-dd');
  var t = String(v || '').trim(); if (!t) return '';
  if (/^\d{4,5}(\.\d+)?$/.test(t)) return fmt_(new Date(Date.UTC(1899, 11, 30) + Math.round(Number(t)) * 864e5 + 12 * 36e5), 'yyyy-MM-dd');   // número de serie de Excel
  var m = t.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = t.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/); if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return '';
}
/** Carga o actualiza la pauta (por ID_CHARLA). No toca las charlas ya realizadas. filas = [{id, n, fecha, bloque, tema, ...}] */
function importarPautaCharlas_(filas) {
  var P = rows_('PAUTA_CHARLAS'), idx = {}, nuevas = 0, act = 0;
  P.forEach(function (x) { idx[String(x.id).toUpperCase()] = x; });
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    (filas || []).forEach(function (f) {
      var id = String(f.id || '').trim().toUpperCase(); if (!id || !String(f.tema || '').trim()) return;
      var o = { id: id, n: Number(f.n) || '', fecha: fechaPauta_(f.fecha), bloque: f.bloque || '', tema: f.tema, referencia: f.referencia || '', objetivo: f.objetivo || '',
        puntos: f.puntos || '', pregunta: f.pregunta || '', op_a: f.op_a || '', op_b: f.op_b || '', op_c: f.op_c || '', correcta: String(f.correcta || '').trim().toUpperCase().slice(0, 1), mensaje: f.mensaje || '' };
      var ya = idx[id];
      if (ya) { update_('PAUTA_CHARLAS', ya._row, o); act++; } else { append_('PAUTA_CHARLAS', o); nuevas++; }
    });
  } finally { lock.releaseLock(); }
  fresco_();
  return { nuevas: nuevas, actualizadas: act, total: rows_('PAUTA_CHARLAS').length };
}
/** Panel: importar la pauta desde el Excel (encabezados ID_CHARLA, N_CHARLA, FECHA, BLOQUE, TEMA, REFERENCIA_RIOHS, ...). */
function apiImportarPautaCharlas(token, filas) {
  auth_(token, ROLES_EDITOR);
  return importarPautaCharlas_(filas);
}
/** Lo que ve el trabajador al firmar (sin la respuesta correcta). */
function charlaPublica_(id) {
  var c = rows_('PAUTA_CHARLAS').filter(function (x) { return x.id === id; })[0]; if (!c) return null;
  return { id: c.id, n: c.n, tema: c.tema, referencia: c.referencia, objetivo: c.objetivo, puntos: c.puntos, mensaje: c.mensaje, pregunta: c.pregunta,
    opciones: [['A', c.op_a], ['B', c.op_b], ['C', c.op_c]].filter(function (o) { return o[1]; }) };
}
/** La charla que toca: la primera pendiente cuya fecha ya llegó (si un día no se hizo, se arrastra). */
function charlaDelDia_() {
  var hoy = hoy_(), P = rows_('PAUTA_CHARLAS');
  if (!P.length) return null;
  P.sort(function (a, b) { return (Number(a.n) || 0) - (Number(b.n) || 0); });
  var pend = P.filter(function (x) { return !x.actividad_id && f10_(x.fecha) && f10_(x.fecha) <= hoy; });
  var hechaHoy = P.filter(function (x) { return x.actividad_id && f10_(x.realizada) === hoy; })[0];
  var prox = P.filter(function (x) { return !x.actividad_id && f10_(x.fecha) > hoy; })[0];
  var c = pend[0];
  var pack = function (x) { return x ? { id: x.id, n: x.n, fecha: f10_(x.fecha), bloque: x.bloque, tema: x.tema, referencia: x.referencia, objetivo: x.objetivo, puntos: x.puntos,
    pregunta: x.pregunta, op_a: x.op_a, op_b: x.op_b, op_c: x.op_c, correcta: x.correcta, mensaje: x.mensaje } : null; };
  return { hoy: pack(c), atrasadas: Math.max(0, pend.length - 1), hecha: hechaHoy ? { n: hechaHoy.n, tema: hechaHoy.tema } : null,
    proxima: prox ? { n: prox.n, tema: prox.tema, fecha: f10_(prox.fecha) } : null, siguiente: !c && !hechaHoy ? pack(prox) : null, total: P.length, realizadas: P.filter(function (x) { return x.actividad_id; }).length };
}
/** Valida y prepara la respuesta del trabajador a la pregunta de la charla. */
function responderCharla_(u, actId, respuesta) {
  var a = rows_('ACTIVIDADES').filter(function (x) { return x.id === actId; })[0];
  if (!a || !a.charla_id) return null;
  var c = rows_('PAUTA_CHARLAS').filter(function (x) { return x.id === a.charla_id; })[0];
  if (!c || !c.pregunta) return null;
  respuesta = String(respuesta || '').trim().toUpperCase().slice(0, 1);
  if (['A', 'B', 'C'].indexOf(respuesta) < 0) throw new Error('Responde la pregunta de la charla antes de firmar.');
  var ok = respuesta === String(c.correcta).toUpperCase();
  var txt = { A: c.op_a, B: c.op_b, C: c.op_c };
  return { correcta: ok, respuesta: respuesta, buena: c.correcta, buenaTxt: txt[c.correcta] || '', mensaje: c.mensaje,
    guardar: { id: nuevoId_('RC'), fecha: new Date(), charla_id: c.id, actividad_id: actId, rut: u.rut, nombre: u.nombre, respuesta: respuesta, correcta: ok ? 'SI' : 'NO' } };
}
/** Panel: la pauta completa con su estado y resultados de la pregunta. */
function apiPautaCharlas(token) {
  auth_(token, ROLES_PANEL);
  var R = rows_('RESP_CHARLAS'), hoy = hoy_();
  var P = rows_('PAUTA_CHARLAS').sort(function (a, b) { return (Number(a.n) || 0) - (Number(b.n) || 0); }).map(function (x) {
    var rs = R.filter(function (r) { return r.charla_id === x.id; });
    return { id: x.id, n: x.n, fecha: f10_(x.fecha), bloque: x.bloque, tema: x.tema, referencia: x.referencia, realizada: f10_(x.realizada), actividad_id: x.actividad_id,
      estado: x.actividad_id ? 'Realizada' : (f10_(x.fecha) && f10_(x.fecha) <= hoy ? 'Pendiente' : 'Programada'),
      respuestas: rs.length, correctas: rs.filter(function (r) { return r.correcta === 'SI'; }).length,
      fallaron: rs.filter(function (r) { return r.correcta !== 'SI'; }).map(function (r) { return r.nombre; }) };
  });
  return { pauta: P, hoy: hoy };
}


/* ---------- OT al correo del cliente ---------- */
function htmlOTCliente_(o, nota, firmaSrc) {
  var c = cfg_(), fila = function (a, b) { return b ? '<tr><th style="text-align:left;background:#f2f3f5;width:28%">' + a + '</th><td>' + esc_(b) + '</td></tr>' : ''; };
  return '<html><body style="font-family:Arial;font-size:12px"><table style="width:100%;border:none"><tr><td style="border:none">' + (typeof logoImg_ === 'function' ? logoImg_(55) : '') +
    '</td><td style="border:none;text-align:right"><b style="font-size:15px">' + esc_(c.razon_social || c.empresa || '') + '</b><br>' + esc_(c.rut_empresa || '') + '</td></tr></table>' +
    '<h3>Orden de trabajo ' + esc_(o.ticket) + '</h3><table cellpadding="6" style="border-collapse:collapse;width:100%" border="1">' +
    fila('Cliente', o.cliente) + fila('Dirección', o.direccion) + fila('Fecha del trabajo', o.fecha) + fila('Técnico', o.tecnico) + fila('Trabajo', o.tipo) +
    fila('Resultado', o.resultado) + fila('Detalle', o.detalle) + fila('Materiales', o.materiales) + fila('Potencia', o.potencia ? o.potencia + ' dBm' : '') + fila('N° OT', o.n_ot) + '</table>' +
    '<p style="margin-top:18px">' + nota + '</p>' + (firmaSrc ? '<img src="' + firmaSrc + '" style="height:90px;border-bottom:1px solid #000">' : '') + '</body></html>';
}
function correoValido_(m) { m = String(m || '').trim(); return /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i.test(m) ? m : ''; }
function correoDeTicket_(regId, t) {
  var r = rows_('REGISTROS').filter(function (x) { return x.id === regId; })[0], d = json_(r && r.datos, {});
  var m = correoValido_(d.correo_cliente);
  if (!m && t && t.cliente_id) { var cl = rows_('CLIENTES').filter(function (x) { return x.id === t.cliente_id; })[0]; m = correoValido_(cl && cl.email); }
  return m;
}
function enviarOTCorreo_(mail, o, pdfBlob, modo, link) {
  var c = cfg_(); if (String(c.correo_ot || 'SI').toUpperCase() === 'NO') return '';
  var marca = c.marca || c.empresa || '';
  var cuerpo = '<p>Hola ' + esc_(String(o.cliente || '').split(' ')[0]) + ',</p><p>Gracias por preferir a ' + esc_(marca) + '. ' +
    (modo === 'enlace' ? 'Te enviamos la orden de trabajo ' + esc_(o.ticket) + ' de la visita técnica. Puedes revisarla y firmarla desde tu teléfono aquí:</p><p><a href="' + link + '" style="background:#1d1f23;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Revisar y firmar la OT</a></p>'
      : 'Adjuntamos la orden de trabajo ' + esc_(o.ticket) + ' de la visita técnica' + (modo === 'firmada' ? ', firmada por ti.' : '.') + '</p>') +
    '<p>Ante cualquier duda, responde este correo o comunícate con nosotros.</p><p>' + esc_(marca) + '</p>';
  var op = { to: mail, subject: 'Orden de trabajo ' + o.ticket + ' · ' + marca, htmlBody: cuerpo, name: marca };
  if (pdfBlob) op.attachments = [pdfBlob];
  if (c.correo_notificaciones) op.replyTo = String(c.correo_notificaciones).split(',')[0].trim();
  MailApp.sendEmail(op);
  return mail;
}
/** Al cerrar la OT: si hay correo, se le envía al cliente (con su firma, con nota de "no firmó", o con el enlace para firmar). */
function correoOTCliente_(reg, ticket, resp, firmaCliSrc, noFirma, firmaCli) {
  var mail = correoValido_(resp.correo_cliente), cl = null;
  if (ticket.cliente_id) cl = rows_('CLIENTES').filter(function (x) { return x.id === ticket.cliente_id; })[0];
  if (!mail && cl) mail = correoValido_(cl.email);
  if (!mail) return '';
  if (cl && !cl.email) try { update_('CLIENTES', cl._row, { email: mail }); } catch (e) {}   // se guarda para la próxima vez
  var o = resumenOT_({ registro_id: reg.id, ticket_id: ticket.id, cliente: ticket.cliente });
  if (firmaCli && firmaCli.url) return enviarOTCorreo_(mail, o, null, 'enlace', firmaCli.url);
  var nota = firmaCliSrc ? 'Firmada por el cliente en el lugar, el ' + o.fecha + '.' : noFirma ? 'El cliente prefirió no firmar digitalmente' + (resp.motivo_no_firma ? ' (' + esc_(resp.motivo_no_firma) + ')' : '') + '. Recibido conforme el ' + o.fecha + '.' : 'Trabajo realizado el ' + o.fecha + '.';
  var pdf = Utilities.newBlob(htmlOTCliente_(o, nota, firmaCliSrc || ''), 'text/html', 'ot.html').getAs('application/pdf').setName('OT_' + ticket.id + '.pdf');
  return enviarOTCorreo_(mail, o, pdf, firmaCliSrc ? 'firmada' : 'simple');
}


/* ---------- Clima e índice UV del día (Open-Meteo, sin clave) ---------- */
var CLIMA_TXT = { 0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado', 45: 'Neblina', 48: 'Neblina', 51: 'Llovizna', 53: 'Llovizna', 55: 'Llovizna',
  61: 'Lluvia débil', 63: 'Lluvia', 65: 'Lluvia fuerte', 71: 'Nieve', 73: 'Nieve', 75: 'Nieve', 80: 'Chubascos', 81: 'Chubascos', 82: 'Chubascos fuertes', 95: 'Tormenta', 96: 'Tormenta', 99: 'Tormenta' };
function climaHoy_() {
  var c = cfg_(), la = Number(c.clima_lat), ln = Number(c.clima_lng);
  if (!la || !ln) { var ce = centroClientes_(); if (ce) { la = ce[0]; ln = ce[1]; } }
  if (!la || !ln) return null;
  var key = 'clima_' + hoy_() + '_' + la.toFixed(2) + '_' + ln.toFixed(2), cache = cache_(), ya = cache.get(key);
  if (ya) return JSON.parse(ya);
  var u = 'https://api.open-meteo.com/v1/forecast?latitude=' + la + '&longitude=' + ln + '&daily=uv_index_max,temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max' +
    '&current=temperature_2m,weather_code&timezone=America%2FSantiago&forecast_days=1';
  var r = UrlFetchApp.fetch(u, { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  var j = JSON.parse(r.getContentText()), d = j.daily || {}, g = function (k) { return d[k] && d[k].length ? d[k][0] : null; };
  var uvi = g('uv_index_max'), o = { uv: nivelUV_(uvi === null ? '' : Math.round(uvi)), max: Math.round(g('temperature_2m_max')), min: Math.round(g('temperature_2m_min')),
    lluvia: g('precipitation_probability_max'), viento: Math.round(g('wind_speed_10m_max') || 0), cielo: CLIMA_TXT[g('weather_code')] || '',
    ahora: j.current ? Math.round(j.current.temperature_2m) : null };
  o.calor = o.max >= 30 ? 'Calor alto: hidratación (3 L/día), pausas a la sombra cada 45 min y trabajo en pareja.' : o.max >= 25 ? 'Temperatura alta: llevar agua y hacer pausas.' : '';
  o.texto = [o.cielo, o.max + '° máx / ' + o.min + '° mín', o.lluvia ? 'lluvia ' + o.lluvia + '%' : '', o.viento >= 30 ? 'viento ' + o.viento + ' km/h' : ''].filter(String).join(' · ');
  if (!o.uv || isNaN(o.max)) return null;   // respuesta incompleta: no se guarda ni se muestra
  cache.put(key, JSON.stringify(o), 3600);
  return o;
}


/** Formularios obligatorios del día como IDs (acepta IDs o nombres escritos a mano, sin importar tildes ni mayúsculas). */
function jornadaObligatoria_() {
  var F = forms_(false), n = function (x) { return normTxt_(x).replace(/[^a-z0-9]/g, ''); };
  return String(cfg_().jornada_obligatoria || 'SOMNOLENCIA').split(',').map(function (x) { return x.trim(); }).filter(String).map(function (x) {
    var f = F.filter(function (y) { return y.id === x; })[0] || F.filter(function (y) { return n(y.id) === n(x) || n(y.nombre) === n(x) || n(y.codigo) === n(x); })[0];
    return f ? f.id : null;
  }).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
}

/** EJECUTAR UNA VEZ desde el editor: averigua cómo se llama en Mikrowisp el método para cerrar tickets,
 *  probando con un ticket que NO existe (no cierra nada real). */
function probarCierreMikrowisp() {
  var m = mwCfg_(); if (!m.url || !m.token) throw new Error('Falta configurar Mikrowisp.');
  var nombres = ['CloseTicket', 'CerrarTicket', 'CloseTickets', 'TicketClose'], bueno = '', log = [];
  nombres.forEach(function (met) {
    if (bueno) return;
    var r = UrlFetchApp.fetch(m.url.replace(/\/+$/, '') + '/api/v1/' + met, { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ token: m.token, idticket: 999999999, id: 999999999, motivo_cierre: 'prueba', motivo: 'prueba' }) });
    var t = r.getContentText().slice(0, 300);
    log.push(met + ' → ' + t);
    if (!/URL api es incorrect/i.test(t) && r.getResponseCode() < 500) bueno = met;
  });
  if (bueno) { setCfg_('mw_api_cerrar', bueno); fresco_(); }
  Logger.log(log.join('\n') + '\n\n' + (bueno ? '✔ El método para cerrar es "' + bueno + '" (quedó guardado). Lo de arriba es la respuesta con un ticket de prueba que no existe: no se cerró nada. Mándame este registro para revisar el nombre del campo.'
    : '✘ Ningún nombre funcionó. Copia este registro y mándamelo.'));
}


/* ===================== APP INSTALABLE (GitHub Pages): llamadas por fetch ===================== */
/** La app de técnicos alojada en GitHub llama aquí en vez de google.script.run. Solo funciones públicas "api…",
 *  que validan su propia sesión igual que antes. */
function rpc_(b) {
  var out;
  try {
    var fn = String(b.rpc || '');
    if (!/^api[A-Z][A-Za-z0-9]*$/.test(fn) || typeof globalThis[fn] !== 'function') throw new Error('Función no permitida: ' + fn);
    var r = globalThis[fn].apply(null, Array.isArray(b.args) ? b.args : []);
    out = { ok: true, r: r === undefined ? null : r };
  } catch (err) { out = { ok: false, error: err && err.message ? err.message : String(err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}


/* ===================== MATRIZ DE RIESGOS (MIPER, DS 44) ===================== */
/* Método de evaluación: Probabilidad (1 baja · 2 media · 4 alta) × Consecuencia (1 ligeramente dañino · 2 dañino · 4 extremadamente dañino).
   Magnitud: 1-2 Tolerable · 4 Moderado · 8 Importante · 16 Intolerable. */
function nivelRiesgo_(p, c) {
  var m = (Number(p) || 0) * (Number(c) || 0);
  return { valor: m, nivel: !m ? '' : m <= 2 ? 'Tolerable' : m <= 4 ? 'Moderado' : m <= 8 ? 'Importante' : 'Intolerable' };
}
var MATRIZ_BASE = [
  // [proceso, tarea, puesto, rutinaria, peligro, riesgo, consecuencia, P, C, medidas, jerarquía, Pres, Cres, tipos de ticket]
  ['Traslado', 'Conducción de vehículo de la empresa', 'Técnico / conductor', 'SI', 'Tránsito vehicular, caminos rurales, fatiga', 'Choque, colisión o volcamiento', 'Lesiones graves, muerte', 2, 4, 'Licencia vigente; checklist diario del vehículo; declaración de somnolencia; respetar velocidades; prohibido usar celular al conducir; descanso cada 2 h', 'Administrativa', 1, 4, 'Instalación,Retiro de equipo,Cambio de equipo,Visita técnica / falla,Mantención,Traslado'],
  ['Instalación y soporte', 'Subir y trabajar en escalera en poste o fachada', 'Técnico', 'SI', 'Trabajo en altura (más de 1,8 m)', 'Caída de distinto nivel', 'Fracturas, lesiones graves, muerte', 2, 4, 'Escalera en buen estado y amarrada al poste; arnés con cola de vida sobre 1,8 m; casco con barbiquejo; trabajo en pareja; no subir con lluvia o viento fuerte', 'Ingeniería / EPP', 1, 4, 'Instalación,Visita técnica / falla,Mantención,Traslado'],
  ['Instalación y soporte', 'Trabajo cerca de tendido eléctrico', 'Técnico', 'SI', 'Líneas eléctricas energizadas', 'Contacto eléctrico directo o por inducción', 'Quemaduras, electrocución, muerte', 2, 4, 'Respetar distancias mínimas a líneas de media y baja tensión; nunca tocar ni apoyarse en cables eléctricos; escalera de fibra de vidrio; guantes dieléctricos; suspender si hay duda', 'Ingeniería / EPP', 1, 4, 'Instalación,Visita técnica / falla,Mantención,Traslado'],
  ['Instalación y soporte', 'Tendido de drop / fibra en vía pública', 'Técnico', 'SI', 'Tránsito de vehículos y peatones', 'Atropello', 'Lesiones graves, muerte', 2, 4, 'Señalizar con conos; chaleco reflectante; estacionar el vehículo como barrera; un compañero vigila el tránsito', 'Administrativa / EPP', 1, 4, 'Instalación,Visita técnica / falla,Mantención,Traslado'],
  ['Instalación y soporte', 'Herramientas y objetos en altura', 'Técnico / ayudante', 'SI', 'Herramientas o materiales que caen', 'Golpe por caída de objetos', 'Contusiones, lesiones en la cabeza', 2, 2, 'Casco obligatorio; delimitar el área bajo el poste; porta-herramientas; no lanzar herramientas', 'EPP / Administrativa', 1, 2, 'Instalación,Visita técnica / falla,Mantención,Traslado'],
  ['Instalación y soporte', 'Corte, pelado y fusión de fibra óptica', 'Técnico', 'SI', 'Astillas de fibra de vidrio; láser de la fibra', 'Contacto con astillas; daño ocular', 'Lesiones en ojos y piel', 2, 2, 'Lentes de seguridad; depositar restos en contenedor; no mirar el extremo de la fibra ni el conector; lavarse las manos', 'EPP / Administrativa', 1, 2, 'Instalación,Visita técnica / falla,Mantención'],
  ['Instalación y soporte', 'Uso de herramientas manuales y cortantes', 'Técnico', 'SI', 'Herramientas con filo (cuchillo, cortadora, alicate)', 'Cortes', 'Heridas en manos', 2, 2, 'Guantes de protección; herramientas en buen estado; cortar en dirección contraria al cuerpo', 'EPP', 1, 1, 'Instalación,Retiro de equipo,Cambio de equipo,Visita técnica / falla,Mantención,Traslado'],
  ['Instalación y soporte', 'Instalación o cambio de equipo dentro del domicilio', 'Técnico', 'SI', 'Superficies irregulares, desniveles, escaleras domésticas', 'Caída al mismo nivel o a distinto nivel', 'Esguinces, contusiones', 2, 2, 'AST rápida antes de empezar; calzado de seguridad; revisar el lugar; no usar sillas como escalera', 'Administrativa / EPP', 1, 2, 'Instalación,Retiro de equipo,Cambio de equipo,Visita técnica / falla'],
  ['Instalación y soporte', 'Ingreso a domicilios y predios', 'Técnico', 'SI', 'Animales (perros)', 'Mordeduras', 'Heridas, infecciones', 2, 2, 'Pedir al cliente que amarre a los animales antes de entrar; no ingresar si hay un perro suelto', 'Administrativa', 1, 2, 'Instalación,Retiro de equipo,Cambio de equipo,Visita técnica / falla,Traslado'],
  ['Instalación y soporte', 'Atención de clientes en terreno', 'Técnico', 'SI', 'Clientes molestos; zonas de riesgo', 'Agresión de terceros', 'Lesiones, estrés', 1, 2, 'No discutir; retirarse si hay agresión y avisar al supervisor; trabajar en pareja en zonas conflictivas', 'Administrativa', 1, 2, 'Instalación,Retiro de equipo,Cambio de equipo,Visita técnica / falla,Traslado'],
  ['Trabajo al aire libre', 'Trabajo bajo el sol', 'Técnico', 'SI', 'Radiación UV de origen solar', 'Exposición a radiación UV', 'Quemaduras, daño ocular, cáncer de piel', 4, 2, 'Bloqueador FPS 50+ cada 2 h; legionario o sombrero de ala ancha; lentes con filtro UV; ropa manga larga; revisar el índice UV del día (Ley 20.096)', 'EPP / Administrativa', 2, 2, 'Instalación,Visita técnica / falla,Mantención,Traslado'],
  ['Trabajo al aire libre', 'Trabajo con altas temperaturas', 'Técnico', 'SI', 'Calor ambiental', 'Golpe de calor, deshidratación', 'Desmayo, golpe de calor', 2, 2, '3 L de agua al día; pausas a la sombra cada 45 min; trabajos pesados en horas frescas; vigilarse entre compañeros', 'Administrativa', 1, 2, 'Instalación,Visita técnica / falla,Mantención,Traslado'],
  ['Bodega y carga', 'Carga y descarga de bobinas, escaleras y equipos', 'Técnico / bodeguero', 'SI', 'Manejo manual de carga', 'Sobreesfuerzo', 'Lumbago, lesiones musculares', 2, 2, 'Máximo 25 kg por persona (Ley 20.949); levantar con las piernas; pedir ayuda; usar carro', 'Administrativa', 1, 2, 'Instalación,Mantención,Traslado'],
  ['Mantención de red', 'Trabajo en NAP, mufa o gabinete', 'Técnico', 'NO', 'Altura, espacio reducido, insectos', 'Caída, picaduras', 'Lesiones, reacciones alérgicas', 2, 2, 'Mismas medidas de trabajo en altura; revisar antes de abrir; guantes', 'EPP', 1, 2, 'Visita técnica / falla,Mantención'],
  ['Mantención de nodo', 'Mantención de generador, UPS o aire acondicionado', 'Técnico', 'NO', 'Energía eléctrica, combustible, partes móviles', 'Contacto eléctrico, incendio, atrapamiento', 'Quemaduras, lesiones', 1, 4, 'Desenergizar y bloquear antes de intervenir; extintor a mano; no fumar; solo personal capacitado', 'Ingeniería / Administrativa', 1, 2, 'Mantención'],
  ['Oficina', 'Trabajo con computador', 'Administrativo / soporte', 'SI', 'Posturas mantenidas, pantalla', 'Trastornos musculoesqueléticos, fatiga visual', 'Dolor de espalda, cuello y muñecas', 2, 1, 'Silla regulable; pantalla a la altura de los ojos; pausas activas; evaluar puesto de trabajo', 'Administrativa', 1, 1, ''],
  ['Organización del trabajo', 'Carga de trabajo, atención de clientes', 'Todos', 'SI', 'Factores psicosociales', 'Estrés laboral', 'Problemas de salud mental', 2, 2, 'Aplicar el cuestionario CEAL-SM; pausas; canal de denuncia (Ley Karin)', 'Administrativa', 1, 2, '']
];
function filaMatriz_(x) {
  var a = nivelRiesgo_(x.p, x.c), r = nivelRiesgo_(x.p_res, x.c_res);
  return { id: x.id, orden: Number(x.orden) || 0, proceso: x.proceso, tarea: x.tarea, puesto: x.puesto, rutinaria: x.rutinaria, peligro: x.peligro, riesgo: x.riesgo,
    consecuencia: x.consecuencia, p: Number(x.p) || '', c: Number(x.c) || '', mr: a.valor, nivel: a.nivel, medidas: x.medidas, jerarquia: x.jerarquia,
    p_res: Number(x.p_res) || '', c_res: Number(x.c_res) || '', mr_res: r.valor, nivel_res: r.nivel, responsable: x.responsable, plazo: f10_(x.plazo), estado: x.estado,
    ast_tipos: x.ast_tipos, actualizado: String(x.actualizado || '').slice(0, 16), actualizado_por: x.actualizado_por };
}
function apiMatriz(token) {
  auth_(token, ROLES_PANEL);
  var c = cfg_();
  return { filas: rows_('MATRIZ').map(filaMatriz_).sort(function (a, b) { return a.orden - b.orden; }),
    info: { fecha: f10_(c.matriz_fecha), elaboro: c.matriz_elaboro || '', aprobo: c.matriz_aprobo || '', empresa: c.razon_social || c.empresa || '', rut: c.rut_empresa || '' } };
}
function apiGuardarFilaMatriz(token, f) {
  var u = auth_(token, ROLES_EDITOR);
  if (!String(f.tarea || '').trim() || !String(f.peligro || '').trim()) throw new Error('Falta la tarea o el peligro.');
  var o = {};
  ['proceso', 'tarea', 'puesto', 'rutinaria', 'peligro', 'riesgo', 'consecuencia', 'medidas', 'jerarquia', 'responsable', 'estado', 'ast_tipos'].forEach(function (k) { o[k] = String(f[k] || '').trim(); });
  ['p', 'c', 'p_res', 'c_res'].forEach(function (k) { var v = Number(f[k]); o[k] = [1, 2, 4].indexOf(v) >= 0 ? v : ''; });
  o.plazo = f.plazo || ''; o.actualizado = new Date(); o.actualizado_por = u.nombre;
  var lock = LockService.getScriptLock(); lock.waitLock(30000); fresco_();
  try {
    var ya = f.id ? rows_('MATRIZ').filter(function (x) { return x.id === f.id; })[0] : null;
    if (ya) update_('MATRIZ', ya._row, o);
    else { o.id = nuevoId_('MR'); o.orden = rows_('MATRIZ').length + 1; append_('MATRIZ', o); }
    setCfg_('matriz_fecha', hoy_());
  } finally { lock.releaseLock(); }
  fresco_(); return apiMatriz(token);
}
/* ===================== AUSENCIAS Y SÁBADOS ===================== */
/* Licencias, vacaciones y permisos (solo tipo y fechas: nunca el diagnóstico) + quién trabaja cada sábado.
 * Quien no trabaja ese día no aparece como "le falta el formulario", no recibe recordatorios y se avisa al asignarle un ticket. */
var TIPOS_AUSENCIA = ['Licencia médica', 'Vacaciones', 'Permiso', 'Día libre / compensado'];
function asegurarHoja_(n) {
  if (hoja_(n)) return hoja_(n);
  var sh = ss_().insertSheet(n); sh.getRange(1, 1, 1, HOJAS[n].length).setValues([HOJAS[n]]).setFontWeight('bold').setBackground('#23306b').setFontColor('#ffffff'); sh.setFrozenRows(1);
  _M.hojas[n] = sh; fresco_(); return sh;
}
function ausenciasIdx_() {
  if (_M.aus) return _M.aus;
  var o = { aus: {}, sab: {} };
  try { asegurarHoja_('AUSENCIAS'); rows_('AUSENCIAS').forEach(function (a) { var r = normRut_(a.rut); (o.aus[r] = o.aus[r] || []).push({ tipo: a.tipo, desde: f10_(a.desde), hasta: f10_(a.hasta) || f10_(a.desde) }); }); } catch (e) {}
  try { asegurarHoja_('SABADOS'); rows_('SABADOS').forEach(function (s) { o.sab[f10_(s.fecha)] = String(s.ruts || '').split(/[,\s]+/).filter(Boolean).map(normRut_); }); } catch (e) {}
  return (_M.aus = o);
}
/** ¿Trabaja esta persona ese día? {trabaja, motivo, hasta}. Domingo nadie; sábado solo los marcados; ausencias por rango de fechas. */
function estadoDia_(rut, fecha) {
  fecha = fecha || hoy_(); rut = normRut_(rut);
  var A = ausenciasIdx_(), L = A.aus[rut] || [];
  for (var i = 0; i < L.length; i++) if (L[i].desde && fecha >= L[i].desde && fecha <= L[i].hasta) return { trabaja: false, motivo: L[i].tipo, hasta: L[i].hasta };
  var dow = new Date(fecha + 'T12:00:00').getDay();
  if (dow === 0) return { trabaja: false, motivo: 'Domingo' };
  if (dow === 6 && (A.sab[fecha] || []).indexOf(rut) < 0) return { trabaja: false, motivo: 'Sábado libre' };
  return { trabaja: true };
}
function proximosSabados_(n) {
  var d = new Date(), out = [];
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  for (var i = 0; i < n; i++) { out.push(fmt_(d, 'yyyy-MM-dd')); d.setDate(d.getDate() + 7); }
  return out;
}
function apiAusencias(token) {
  auth_(token, ROLES_PANEL);
  asegurarHoja_('AUSENCIAS'); asegurarHoja_('SABADOS');
  var desde = fmt_(new Date(Date.now() - 60 * 86400000), 'yyyy-MM-dd');
  var personas = rows_('USUARIOS').filter(function (x) { return String(x.activo).toUpperCase() === 'SI'; })
    .map(function (x) { return { rut: normRut_(x.rut), nombre: x.nombre, area: areaDe_(x) }; }).sort(function (a, b) { return (a.area === 'Oficina') - (b.area === 'Oficina') || (a.nombre < b.nombre ? -1 : 1); });
  var sab = {}; rows_('SABADOS').forEach(function (s) { sab[f10_(s.fecha)] = String(s.ruts || '').split(/[,\s]+/).filter(Boolean).map(normRut_); });
  return {
    tipos: TIPOS_AUSENCIA, personas: personas, hoy: hoy_(), sabados: proximosSabados_(6).map(function (f) { return { fecha: f, ruts: sab[f] || [], marcado: !!sab[f] }; }),
    sabadosTodos: sab,
    ausencias: rows_('AUSENCIAS').filter(function (a) { return (f10_(a.hasta) || f10_(a.desde)) >= desde; })
      .map(function (a) { return { id: a.id, rut: normRut_(a.rut), nombre: a.nombre, tipo: a.tipo, desde: f10_(a.desde), hasta: f10_(a.hasta) || f10_(a.desde), obs: a.obs, registrado_por: a.registrado_por }; })
      .sort(function (a, b) { return a.desde < b.desde ? 1 : -1; })
  };
}
function apiGuardarAusencia(token, a) {
  var u = auth_(token, ROLES_PANEL);
  asegurarHoja_('AUSENCIAS');
  var p = usuariosLite_().filter(function (x) { return x.rut === normRut_(a.rut); })[0];
  if (!p) throw new Error('Elige al trabajador.');
  if (TIPOS_AUSENCIA.indexOf(a.tipo) < 0) throw new Error('Elige el tipo.');
  var d = f10_(a.desde), h = f10_(a.hasta) || d;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error('Falta la fecha de inicio.');
  if (h < d) throw new Error('La fecha de término es antes que la de inicio.');
  var obj = { rut: p.rut, nombre: p.nombre, tipo: a.tipo, desde: d, hasta: h, obs: String(a.obs || '').slice(0, 200) };
  var ex = a.id ? rows_('AUSENCIAS').filter(function (x) { return x.id === a.id; })[0] : null;
  if (ex) update_('AUSENCIAS', ex._row, obj);
  else { obj.id = 'AU-' + Utilities.getUuid().slice(0, 8).toUpperCase(); obj.registrado_por = u.nombre; obj.creado = new Date(); append_('AUSENCIAS', obj); }
  _M.aus = null;
  return apiAusencias(token);
}
function apiBorrarAusencia(token, id) {
  auth_(token, ROLES_PANEL);
  var x = rows_('AUSENCIAS').filter(function (r) { return r.id === id; })[0];
  if (x) { sh_('AUSENCIAS').deleteRow(x._row); fresco_(); }
  _M.aus = null;
  return apiAusencias(token);
}
function apiGuardarSabado(token, fecha, ruts) {
  var u = auth_(token, ROLES_PANEL);
  asegurarHoja_('SABADOS');
  fecha = f10_(fecha);
  if (new Date(fecha + 'T12:00:00').getDay() !== 6) throw new Error('Esa fecha no es sábado.');
  var lista = (ruts || []).map(normRut_).filter(Boolean).join(',');
  var ex = rows_('SABADOS').filter(function (s) { return f10_(s.fecha) === fecha; })[0];
  var obj = { fecha: fecha, ruts: lista, actualizado: new Date(), por: u.nombre };
  if (ex) update_('SABADOS', ex._row, obj); else append_('SABADOS', obj);
  _M.aus = null;
  return apiAusencias(token);
}
function apiBorrarFilaMatriz(token, id) {
  auth_(token, ROLES_EDITOR);
  var x = rows_('MATRIZ').filter(function (r) { return r.id === id; })[0];
  if (x) { sh_('MATRIZ').deleteRow(x._row); fresco_(); setCfg_('matriz_fecha', hoy_()); }
  return apiMatriz(token);
}
function apiGuardarInfoMatriz(token, d) {
  auth_(token, ROLES_EDITOR);
  setCfg_('matriz_elaboro', String(d.elaboro || '').slice(0, 120)); setCfg_('matriz_aprobo', String(d.aprobo || '').slice(0, 120));
  if (d.fecha) setCfg_('matriz_fecha', d.fecha);
  fresco_(); return apiMatriz(token);
}
/** Carga la plantilla base (solo si la matriz está vacía) para que la prevencionista la ajuste. */
function apiCargarMatrizBase(token) {
  var u = auth_(token, ROLES_EDITOR);
  if (rows_('MATRIZ').length) throw new Error('La matriz ya tiene filas. La plantilla solo se carga en una matriz vacía.');
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    (rubroDef_().matriz || MATRIZ_BASE).forEach(function (m, i) {
      append_('MATRIZ', { id: nuevoId_('MR'), orden: i + 1, proceso: m[0], tarea: m[1], puesto: m[2], rutinaria: m[3], peligro: m[4], riesgo: m[5], consecuencia: m[6],
        p: m[7], c: m[8], medidas: m[9], jerarquia: m[10], p_res: m[11], c_res: m[12], responsable: 'Supervisor / prevencionista', plazo: '', estado: 'Implementada',
        ast_tipos: m[13], actualizado: new Date(), actualizado_por: u.nombre });
    });
    setCfg_('matriz_fecha', hoy_());
  } finally { lock.releaseLock(); }
  fresco_(); return apiMatriz(token);
}
/** Para la AST en la app: peligros y medidas de la matriz según el tipo de trabajo. */
function matrizParaAst_() {
  var out = {};
  rows_('MATRIZ').forEach(function (x) {
    var n = nivelRiesgo_(x.p, x.c);
    String(x.ast_tipos || '').split(',').map(function (t) { return t.trim(); }).filter(String).forEach(function (t) {
      (out[t] = out[t] || []).push({ peligro: x.peligro, riesgo: x.riesgo, nivel: n.nivel, medidas: x.medidas });
    });
  });
  return out;
}


/* ---------- Ticket en pareja: técnico principal + técnico de apoyo (los dos lo ven y cualquiera llena los formularios) ---------- */
function esDelTicket_(t, rut) { return !!t && (normRut_(t.tecnico_rut) === rut || (!!t.apoyo_rut && normRut_(t.apoyo_rut) === rut)); }