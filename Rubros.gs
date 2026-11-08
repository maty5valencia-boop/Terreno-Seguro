/**
 * ==================================================================
 *  TERRENO SEGURO · PERFILES POR RUBRO
 * ==================================================================
 *  Cada rubro define lo que la empresa ve y trae cargado al crearse:
 *   - nombre      : cómo aparece en el asistente de alta y en Configuración
 *   - apagados    : pestañas del panel que no se usan (nadie las ve)
 *   - vocab       : nombres propios del rubro (tickets, clientes, trabajos…)
 *   - forms       : formularios propios del rubro (se agregan a los de siempre)
 *   - formsApagar : formularios de siempre que no aplican al rubro
 *   - jornada     : formularios que se piden cada día al iniciar la jornada
 *   - cursos      : cursos que se agregan · cursosApagar: los que no aplican
 *   - epp         : EPP sugeridos en las entregas
 *   - matriz      : matriz de riesgos base (null = la de ISP en Code.gs)
 *  Las referencias normativas son orientativas: la prevencionista de cada
 *  empresa debe revisarlas y ajustarlas a su realidad.
 *  Para agregar un rubro nuevo basta con copiar uno y cambiar sus datos.
 * ==================================================================
 */

/* ---------- piezas reutilizables ---------- */
function SI_(id, texto, extra) { var o = { id: id, tipo: 'sino', texto: texto, alerta: 'NO', req: true }; for (var k in (extra || {})) o[k] = extra[k]; return o; }
function SINA_(id, texto) { return SI_(id, texto, { na: true }); }
var CIERRE_FIRMA_ = function (pre) {
  return { titulo: 'Cierre', items: [
    { id: pre + 'obs', tipo: 'parrafo', texto: 'Observaciones y acciones correctivas' },
    { id: pre + 'fotos', tipo: 'foto', texto: 'Fotos (hallazgos o evidencia)' },
    { id: 'firma', tipo: 'firma', texto: 'Firma de quien inspecciona', req: true }
  ] };
};

var RUBROS = {

  /* ======================= PROVEEDORES DE INTERNET ======================= */
  ISP: {
    nombre: 'Proveedor de internet (ISP) / telecomunicaciones',
    apagados: [],
    vocab: {},
    forms: [], formsApagar: [], jornada: [],
    cursos: [], cursosApagar: [],
    epp: [],
    matriz: null
  },

  /* ======================= MINERÍA (CONTRATISTAS) ======================= */
  MINERIA: {
    nombre: 'Contratista minero',
    apagados: ['equipos', 'fallas', 'clientes'],
    vocab: { tickets: 'Órdenes de trabajo', trabajos: 'Órdenes', clientes: 'Mandantes', calendario: 'Programa' },
    formsApagar: ['COVID'],
    jornada: [],
    cursos: [
      ['INDUC_FAENA', 'Inducción de faena del mandante', '', 12, 'todos', 'Exigencia del mandante para ingresar a faena (ajustar horas y vigencia según su reglamento).'],
      ['LOTO', 'Bloqueo y aislamiento de energías (LOTO)', '', 24, 'todos', 'Control de energías peligrosas; exigencia habitual de los mandantes mineros (ajustar).'],
      ['ESP_CONF', 'Trabajo en espacios confinados', '', 24, 'opcional', 'Para quienes ingresan a espacios confinados (ajustar).'],
      ['IZAJE', 'Rigger / izaje de cargas', '', 24, 'opcional', 'Para quienes participan en maniobras de izaje (ajustar).'],
      ['4X4', 'Manejo defensivo en ruta minera / 4x4', '', 24, 'opcional', 'Exigencia del mandante para conductores en faena (ajustar).'],
      ['PRIM_AUX', 'Primeros auxilios', '', 24, 'opcional', 'Recomendado para al menos un trabajador por cuadrilla (ajustar).']
    ],
    cursosApagar: ['ELECT'],
    epp: ['Casco con barbiquejo', 'Lentes de seguridad', 'Protector auditivo', 'Respirador con filtro para polvo', 'Zapatos de seguridad', 'Guantes de cabritilla',
      'Arnés de cuerpo completo con doble cola', 'Ropa con cinta reflectante', 'Legionario', 'Bloqueador solar'],
    forms: [
      {
        id: 'PERMISO_AR', nombre: 'Permiso de trabajo de alto riesgo', codigo: 'PT-AR', ambito: 'libre', icono: '🛑',
        descripcion: 'Autorización antes de trabajos en altura, en caliente, en espacio confinado, con energías peligrosas o con izaje. Se firma antes de empezar.',
        requiereGeo: true,
        secciones: [
          { titulo: 'Trabajo', items: [
            { id: 'pt_faena', tipo: 'texto', texto: 'Faena / área del mandante', req: true },
            { id: 'pt_desc', tipo: 'parrafo', texto: 'Descripción del trabajo', req: true },
            { id: 'pt_tipos', tipo: 'multiple', texto: 'Tipo de trabajo de alto riesgo', opciones: ['Trabajo en altura', 'Trabajo en caliente (soldadura, corte, esmeril)', 'Espacio confinado', 'Energías peligrosas (eléctrica, hidráulica, neumática)', 'Izaje de cargas', 'Excavación'], req: true },
            { id: 'pt_desde', tipo: 'hora', texto: 'Válido desde (hora)', req: true },
            { id: 'pt_hasta', tipo: 'hora', texto: 'Válido hasta (hora)', req: true },
            { id: 'pt_equipo', tipo: 'parrafo', texto: 'Nombres de los trabajadores que ejecutan el trabajo', req: true }
          ]},
          { titulo: 'Verificaciones generales', nota: 'NO = no se puede iniciar el trabajo hasta corregirlo', items: [
            SI_('pt_ast', '¿Se hizo la AST / análisis de riesgos de la tarea con todo el equipo?'),
            SI_('pt_comp', '¿Los trabajadores están acreditados y capacitados para esta tarea?'),
            SI_('pt_epp', '¿Todos tienen el EPP específico de la tarea en buen estado?'),
            SI_('pt_area', '¿El área está delimitada y señalizada?'),
            SI_('pt_emerg', '¿Se conoce el plan de emergencia y el punto de encuentro de la faena?'),
            SI_('pt_mandante', '¿El mandante (dueño del área) autorizó el trabajo?')
          ]},
          { titulo: 'Trabajo en altura', nota: 'Responde N/A si no aplica', items: [
            SINA_('alt_arnes', 'Arnés de cuerpo completo y cola de vida inspeccionados'),
            SINA_('alt_anclaje', 'Punto de anclaje certificado o línea de vida instalada'),
            SINA_('alt_rescate', 'Hay plan de rescate para trabajador suspendido'),
            SINA_('alt_abajo', 'Área inferior delimitada (caída de objetos)')
          ]},
          { titulo: 'Trabajo en caliente', items: [
            SINA_('cal_combust', 'Materiales combustibles retirados o cubiertos (radio de 10 m)'),
            SINA_('cal_extintor', 'Extintor operativo al alcance'),
            SINA_('cal_vigia', 'Vigía de fuego designado durante y después del trabajo'),
            SINA_('cal_equipos', 'Equipos de soldadura/corte y mangueras en buen estado')
          ]},
          { titulo: 'Espacio confinado', items: [
            SINA_('ec_medicion', 'Medición de gases antes de ingresar (O2, explosividad, tóxicos) dentro de rango'),
            { id: 'ec_o2', tipo: 'numero', texto: 'Oxígeno medido (%)', min: 19.5, max: 23.5 },
            SINA_('ec_vigia', 'Vigía permanente en la entrada'),
            SINA_('ec_vent', 'Ventilación forzada instalada'),
            SINA_('ec_rescate', 'Equipo de rescate disponible')
          ]},
          { titulo: 'Energías peligrosas e izaje', items: [
            SINA_('en_bloqueo', 'Equipo desenergizado, bloqueado y con tarjeta de cada trabajador (LOTO)'),
            SINA_('en_cero', 'Se verificó energía cero antes de intervenir'),
            SINA_('iz_plan', 'Plan de izaje revisado (peso de la carga y capacidad del equipo)'),
            SINA_('iz_aparejos', 'Eslingas, grilletes y ganchos inspeccionados y con código de color'),
            SINA_('iz_rigger', 'Rigger acreditado dirigiendo la maniobra')
          ]},
          { titulo: 'Autorización', items: [
            { id: 'firma', tipo: 'firma', texto: 'Firma del responsable del trabajo', req: true },
            { id: 'pt_sup', tipo: 'texto', texto: 'Supervisor que autoriza', req: true },
            { id: 'firma_sup', tipo: 'firma', texto: 'Firma del supervisor', req: true },
            { id: 'firma_prev', tipo: 'firma', texto: 'Firma del prevencionista (si corresponde)' },
            { id: 'pt_cierre', tipo: 'sino', texto: 'Al terminar: ¿el área quedó limpia, sin bloqueos olvidados y se avisó al mandante?' }
          ]}
        ]
      },
      {
        id: 'CONTROLES_CRITICOS', nombre: 'Verificación de controles críticos', codigo: 'VCC', ambito: 'libre', icono: '✅',
        descripcion: 'Antes de la tarea: el supervisor verifica en terreno que los controles que evitan una fatalidad estén presentes.',
        requiereGeo: true,
        secciones: [
          { titulo: 'Tarea', items: [
            { id: 'cc_tarea', tipo: 'texto', texto: 'Tarea verificada', req: true },
            { id: 'cc_riesgo', tipo: 'opciones', texto: 'Riesgo de fatalidad', opciones: ['Caída de altura', 'Contacto con energía', 'Pérdida de control de vehículo', 'Interacción persona-equipo móvil', 'Caída de carga suspendida', 'Atrapamiento', 'Incendio', 'Otro'], req: true }
          ]},
          { titulo: 'Controles en terreno', nota: 'NO = detener la tarea y corregir', items: [
            SI_('cc1', '¿Los controles críticos definidos para este riesgo están implementados?'),
            SI_('cc2', '¿Los trabajadores saben explicar cuáles son los controles críticos de su tarea?'),
            SI_('cc3', '¿Los equipos y herramientas usados tienen su inspección vigente?'),
            SI_('cc4', '¿Hay un permiso de trabajo vigente si la tarea lo requiere?'),
            { id: 'cc_detuvo', tipo: 'sino', texto: '¿Se detuvo la tarea por falta de un control?', alerta: 'SI' }
          ]},
          CIERRE_FIRMA_('cc_')
        ]
      },
      {
        id: 'CHK_CAMIONETA_MINERA', nombre: 'Checklist camioneta para faena minera', codigo: 'CHK-CAM-MIN', ambito: 'jornada', icono: '🚙',
        descripcion: 'Equipamiento que el mandante exige para circular en faena (ajustar al reglamento de tránsito del mandante).',
        secciones: [
          { titulo: 'Vehículo', items: [
            { id: 'patente', tipo: 'opciones', texto: 'Patente', opciones: [], req: true },
            { id: 'cm_km', tipo: 'numero', texto: 'Kilometraje', req: true }
          ]},
          { titulo: 'Equipamiento de faena', nota: 'NO = no ingresar a faena hasta corregir', items: [
            SI_('cm1', 'Pértiga con banderín y luz'), SI_('cm2', 'Baliza en el techo funcionando'), SI_('cm3', 'Alarma de retroceso funcionando'),
            SI_('cm4', 'Cuñas (2) y conos (2 o más)'), SI_('cm5', 'Extintor con carga vigente'), SI_('cm6', 'Botiquín completo'),
            SI_('cm7', 'Radio de comunicación operativa'), SI_('cm8', 'Barra antivuelco / jaula (si el mandante la exige)', { na: true }),
            SI_('cm9', 'Neumáticos en buen estado y rueda de repuesto'), SI_('cm10', 'Cinturones de seguridad en todos los asientos'),
            SI_('cm11', 'Acreditación vigente del vehículo y del conductor para la faena')
          ]},
          CIERRE_FIRMA_('cm_')
        ]
      }
    ],
    matriz: [
      ['Traslado', 'Conducción en ruta minera y caminos de faena', 'Conductor', 'SI', 'Camino de montaña, equipos de gran tonelaje, fatiga', 'Choque, volcamiento, colisión con equipo minero', 'Lesiones graves, muerte', 2, 4, 'Licencia y acreditación vigentes; curso de manejo 4x4; checklist diario de camioneta minera; respetar reglamento de tránsito del mandante; control de fatiga y somnolencia', 'Administrativa', 1, 4, ''],
      ['Faena', 'Trabajo en altura', 'Trabajador', 'SI', 'Superficies sobre 1,8 m', 'Caída de distinto nivel', 'Fracturas, muerte', 2, 4, 'Permiso de trabajo de alto riesgo; arnés con doble cola; anclaje certificado; plan de rescate', 'Ingeniería / EPP', 1, 4, ''],
      ['Faena', 'Intervención de equipos con energía', 'Mantenedor', 'SI', 'Energía eléctrica, hidráulica o neumática', 'Contacto con energía, liberación inesperada', 'Quemaduras, amputaciones, muerte', 2, 4, 'Bloqueo y tarjeta personal (LOTO); verificación de energía cero; permiso de trabajo', 'Ingeniería', 1, 4, ''],
      ['Faena', 'Maniobras de izaje', 'Rigger / operador', 'NO', 'Carga suspendida', 'Caída de la carga, golpes', 'Lesiones graves, muerte', 2, 4, 'Plan de izaje; aparejos inspeccionados; rigger acreditado; nadie bajo la carga', 'Administrativa', 1, 4, ''],
      ['Faena', 'Trabajo cerca de equipos móviles', 'Trabajador', 'SI', 'Camiones, cargadores y vehículos en movimiento', 'Atropello', 'Lesiones graves, muerte', 2, 4, 'Respetar segregación persona-equipo; chaleco reflectante; contacto visual y radial con operador', 'Administrativa', 1, 4, ''],
      ['Faena', 'Trabajo en zonas con polvo', 'Trabajador', 'SI', 'Polvo con sílice', 'Exposición a sílice', 'Silicosis', 2, 4, 'Humectación; respirador con filtro adecuado y prueba de ajuste; vigilancia médica (PLANESI)', 'EPP', 1, 4, ''],
      ['Faena', 'Trabajo con equipos ruidosos', 'Trabajador', 'SI', 'Ruido sobre 85 dB(A)', 'Exposición a ruido', 'Hipoacusia', 2, 2, 'Protector auditivo; vigilancia médica (PREXOR); mantención de equipos', 'EPP', 1, 2, ''],
      ['Faena', 'Trabajo en gran altitud', 'Todos', 'SI', 'Hipobaria (faena sobre 3.000 m)', 'Mal agudo de montaña', 'Malestar, edema pulmonar o cerebral', 2, 4, 'Exámenes de altura vigentes; aclimatación; hidratación; no subir con síntomas', 'Administrativa', 1, 2, ''],
      ['Trabajo al aire libre', 'Trabajo bajo el sol', 'Todos', 'SI', 'Radiación UV de origen solar', 'Exposición a radiación UV', 'Quemaduras, cáncer de piel', 4, 2, 'Bloqueador FPS 50+; legionario; lentes con filtro UV; pausas a la sombra', 'EPP', 2, 1, ''],
      ['Organización del trabajo', 'Turnos y jornadas excepcionales', 'Todos', 'SI', 'Factores psicosociales, fatiga', 'Estrés, fatiga', 'Problemas de salud mental, accidentes', 2, 2, 'Respetar descansos; cuestionario CEAL-SM; canal de denuncia (Ley Karin)', 'Administrativa', 1, 2, '']
    ]
  },

  /* ======================= CONSTRUCCIÓN ======================= */
  CONSTRUCCION: {
    nombre: 'Construcción',
    apagados: ['equipos', 'fallas', 'mapa'],
    vocab: { tickets: 'Tareas de obra', trabajos: 'Tareas', clientes: 'Obras' },
    formsApagar: ['COVID'],
    jornada: [],
    cursos: [
      ['ANDAMIOS', 'Armado y uso seguro de andamios', '', 24, 'opcional', 'Referencia: NCh 998 y NCh 2501 (ajustar horas y vigencia).'],
      ['EXCAV', 'Seguridad en excavaciones', '', 24, 'opcional', 'Referencia: NCh 349 (ajustar).'],
      ['HERR_ELEC', 'Uso seguro de herramientas eléctricas', '', 24, 'todos', 'Exigencia interna (ajustar).'],
      ['IZAJE', 'Rigger / izaje de cargas', '', 24, 'opcional', 'Para quienes participan en maniobras de izaje (ajustar).']
    ],
    cursosApagar: ['ELECT'],
    epp: ['Casco con barbiquejo', 'Lentes de seguridad', 'Protector auditivo', 'Mascarilla para polvo', 'Zapatos de seguridad', 'Guantes de cabritilla',
      'Arnés de cuerpo completo', 'Chaleco reflectante', 'Legionario', 'Bloqueador solar'],
    forms: [
      {
        id: 'CHK_ANDAMIO', nombre: 'Inspección de andamio', codigo: 'CHK-AND', ambito: 'libre', icono: '🏗️',
        descripcion: 'Antes de usar el andamio cada día y después de cambios o mal tiempo. Referencia: NCh 998 y NCh 2501.',
        secciones: [
          { titulo: 'Andamio', items: [
            { id: 'an_ubic', tipo: 'texto', texto: 'Ubicación en la obra', req: true },
            { id: 'an_tipo', tipo: 'opciones', texto: 'Tipo', opciones: ['Modular metálico', 'Tubular', 'Colgante', 'Móvil (con ruedas)', 'Otro'] },
            { id: 'an_alto', tipo: 'numero', texto: 'Altura aproximada (m)' }
          ]},
          { titulo: 'Inspección', nota: 'NO = no usar el andamio (tarjeta roja) hasta corregir', items: [
            SI_('an1', 'Apoyado sobre base firme y nivelada, con placas base'), SI_('an2', 'Arriostrado y anclado a la estructura según altura'),
            SI_('an3', 'Plataformas completas, sin huecos y aseguradas'), SI_('an4', 'Barandas superior e intermedia y rodapié en todos los lados expuestos'),
            SI_('an5', 'Acceso seguro (escalera interior o adosada)'), SI_('an6', 'Piezas sin deformaciones, óxido severo ni soldaduras dañadas'),
            SINA_('an7', 'Ruedas con freno puesto (andamio móvil)'), SI_('an8', 'Tarjeta de estado visible (verde = apto)'),
            SI_('an9', 'Distancia segura a líneas eléctricas')
          ]},
          CIERRE_FIRMA_('an_')
        ]
      },
      {
        id: 'CHK_EXCAVACION', nombre: 'Inspección de excavación', codigo: 'CHK-EXC', ambito: 'libre', icono: '⛏️',
        descripcion: 'Diaria y después de lluvias o vibraciones. Referencia: NCh 349 (disposiciones de seguridad en excavaciones).',
        secciones: [
          { titulo: 'Excavación', items: [
            { id: 'ex_ubic', tipo: 'texto', texto: 'Ubicación', req: true },
            { id: 'ex_prof', tipo: 'numero', texto: 'Profundidad (m)', req: true },
            { id: 'ex_info', tipo: 'info', texto: 'Sobre 1,3 m de profundidad se requiere entibación, salvo que un especialista calcule la altura crítica y determine otra cosa (NCh 349).' }
          ]},
          { titulo: 'Inspección', nota: 'NO = nadie entra hasta corregir', items: [
            SINA_('ex1', 'Entibación instalada (profundidad sobre 1,3 m)'), SI_('ex2', 'Paredes sin grietas, socavones ni material suelto'),
            SI_('ex3', 'Material excavado y acopios alejados del borde (mínimo 0,6 m)'), SI_('ex4', 'Escalera de acceso y salida que sobresale del borde'),
            SI_('ex5', 'Borde señalizado y con barrera'), SI_('ex6', 'Servicios subterráneos identificados (agua, gas, electricidad)'),
            SI_('ex7', 'Sin acumulación de agua'), SI_('ex8', 'Maquinaria trabajando a distancia segura del borde')
          ]},
          CIERRE_FIRMA_('ex_')
        ]
      },
      {
        id: 'CHK_MAQUINARIA', nombre: 'Checklist de maquinaria de obra', codigo: 'CHK-MAQ', ambito: 'jornada', icono: '🚜',
        descripcion: 'Retroexcavadora, minicargador, rodillo, grúa u otra máquina, antes de operar.',
        secciones: [
          { titulo: 'Máquina', items: [
            { id: 'mq_tipo', tipo: 'texto', texto: 'Máquina y N° interno / patente', req: true },
            { id: 'mq_horo', tipo: 'numero', texto: 'Horómetro' }
          ]},
          { titulo: 'Revisión', nota: 'NO = no operar hasta corregir', items: [
            SI_('mq1', 'Operador con licencia y autorización vigentes'), SI_('mq2', 'Frenos y dirección funcionando'), SI_('mq3', 'Alarma de retroceso y bocina'),
            SI_('mq4', 'Luces y baliza'), SI_('mq5', 'Cinturón de seguridad'), SI_('mq6', 'Sin fugas de aceite, combustible o hidráulico'),
            SI_('mq7', 'Espejos y vidrios en buen estado'), SI_('mq8', 'Extintor con carga vigente'), SINA_('mq9', 'Elementos de izaje y accesorios en buen estado')
          ]},
          CIERRE_FIRMA_('mq_')
        ]
      },
      {
        id: 'CHK_HERR_ELEC', nombre: 'Inspección de herramientas eléctricas y tableros', codigo: 'CHK-ELEC', ambito: 'libre', icono: '🔌',
        descripcion: 'Herramientas portátiles, extensiones y tablero provisorio de faena.',
        secciones: [
          { titulo: 'Inspección', nota: 'NO = retirar de uso (tarjeta roja)', items: [
            SI_('he1', 'Cables y enchufes sin cortes, uniones con cinta ni partes expuestas'), SI_('he2', 'Carcasas sin daños y protecciones (guardas) puestas'),
            SI_('he3', 'Tablero provisorio con protector diferencial y tapa'), SI_('he4', 'Extensiones elevadas o protegidas del tránsito y del agua'),
            SI_('he5', 'Tierra de protección conectada')
          ]},
          CIERRE_FIRMA_('he_')
        ]
      }
    ],
    matriz: [
      ['Obra gruesa', 'Trabajo en altura (losas, techumbres, andamios)', 'Maestro / jornal', 'SI', 'Bordes abiertos, andamios', 'Caída de distinto nivel', 'Fracturas, muerte', 2, 4, 'Barandas y redes; andamios inspeccionados (NCh 998); arnés y línea de vida', 'Ingeniería', 1, 4, ''],
      ['Movimiento de tierra', 'Trabajo en excavaciones y zanjas', 'Jornal', 'SI', 'Paredes inestables', 'Derrumbe, sepultamiento', 'Asfixia, muerte', 2, 4, 'Entibación sobre 1,3 m (NCh 349); acopio alejado del borde; inspección diaria', 'Ingeniería', 1, 4, ''],
      ['Obra gruesa', 'Trabajo bajo cargas suspendidas o materiales en altura', 'Todos', 'SI', 'Materiales y herramientas que caen', 'Golpeado por', 'Lesiones en la cabeza, muerte', 2, 4, 'Casco con barbiquejo; delimitar áreas bajo trabajos; rodapiés; plan de izaje', 'Administrativa', 1, 2, ''],
      ['Instalaciones', 'Uso de herramientas eléctricas y tablero provisorio', 'Maestro', 'SI', 'Energía eléctrica', 'Contacto eléctrico', 'Quemaduras, electrocución', 2, 4, 'Protector diferencial; herramientas inspeccionadas; extensiones protegidas', 'Ingeniería', 1, 2, ''],
      ['Movimiento de tierra', 'Trabajo junto a maquinaria', 'Jornal / operador', 'SI', 'Maquinaria en movimiento', 'Atropello, atrapamiento', 'Lesiones graves, muerte', 2, 4, 'Alarma de retroceso; señalero; segregar peatones de maquinaria', 'Administrativa', 1, 4, ''],
      ['Terminaciones', 'Corte de materiales (hormigón, cerámica)', 'Maestro', 'SI', 'Polvo con sílice, ruido', 'Exposición a sílice y ruido', 'Silicosis, hipoacusia', 2, 4, 'Corte en húmedo; respirador y protector auditivo; vigilancia médica', 'EPP', 1, 2, ''],
      ['Bodega', 'Carga y traslado de materiales', 'Jornal', 'SI', 'Manejo manual de carga', 'Sobreesfuerzo', 'Lumbago, lesiones musculares', 2, 2, 'Máximo 25 kg por persona (Ley 20.949); carros y ayuda mecánica', 'Administrativa', 1, 2, ''],
      ['Trabajo al aire libre', 'Trabajo bajo el sol', 'Todos', 'SI', 'Radiación UV de origen solar', 'Exposición a radiación UV', 'Quemaduras, cáncer de piel', 4, 2, 'Bloqueador FPS 50+; legionario; lentes con filtro UV', 'EPP', 2, 1, '']
    ]
  },

  /* ======================= ALIMENTOS (SST + INOCUIDAD) ======================= */
  ALIMENTOS: {
    nombre: 'Alimentos (planta, cocina o casino)',
    apagados: ['equipos', 'fallas', 'mapa', 'prestamos'],
    vocab: { tickets: 'Tareas', trabajos: 'Tareas', clientes: 'Clientes' },
    formsApagar: ['COVID', 'VEHICULO', 'BITACORA', 'CHK_CAMIONETA', 'HERRAMIENTAS'],
    jornada: ['HIGIENE_PERSONAL'],
    cursos: [
      ['MANIP', 'Manipulación higiénica de alimentos', '', 12, 'todos', 'Reglamento Sanitario de los Alimentos (DS 977): el personal que manipula alimentos debe estar capacitado en higiene (ajustar horas y vigencia).'],
      ['BPM', 'Buenas prácticas de manufactura (BPM)', '', 24, 'todos', 'DS 977, art. 69: los establecimientos deben aplicar buenas prácticas de fabricación (ajustar).'],
      ['HACCP', 'Sistema HACCP', '', 24, 'opcional', 'Para el equipo HACCP de la empresa (ajustar).'],
      ['CUCHILLOS', 'Uso seguro de cuchillos y máquinas de cocina', '', 24, 'todos', 'Exigencia interna (ajustar).'],
      ['FRIO', 'Trabajo en cámaras de frío', '', 24, 'opcional', 'Para quienes ingresan a cámaras de refrigeración o congelación (ajustar).'],
      ['QUIM_ASEO', 'Manejo seguro de productos de limpieza y sanitización', '', 24, 'todos', 'Hojas de datos de seguridad, diluciones y EPP (ajustar).']
    ],
    cursosApagar: ['ELECT', 'ALTURA', 'MANEJO'],
    epp: ['Cofia', 'Mascarilla', 'Delantal impermeable', 'Botas antideslizantes', 'Zapatos de seguridad antideslizantes', 'Guante anticorte de malla',
      'Guantes de nitrilo', 'Ropa térmica para cámaras', 'Guantes térmicos para horno', 'Lentes de seguridad (químicos)'],
    forms: [
      {
        id: 'HIGIENE_PERSONAL', nombre: 'Control de higiene y salud del personal', codigo: 'BPM-HP', ambito: 'jornada', icono: '🧼',
        descripcion: 'Al entrar a la zona de alimentos. Quien tenga síntomas o heridas sin cubrir no manipula alimentos (DS 977, Reglamento Sanitario de los Alimentos).',
        secciones: [
          { titulo: 'Salud', nota: 'Si alguna respuesta queda en alerta, avisa al supervisor antes de manipular alimentos', items: [
            { id: 'hp_sint', tipo: 'sino', texto: '¿Tienes diarrea, vómitos, fiebre o dolor de estómago?', alerta: 'SI', req: true },
            { id: 'hp_resp', tipo: 'sino', texto: '¿Tienes tos, resfrío o secreción nasal?', alerta: 'SI', req: true },
            { id: 'hp_herida', tipo: 'sino', texto: '¿Tienes heridas o infecciones en manos o brazos sin cubrir?', alerta: 'SI', req: true }
          ]},
          { titulo: 'Presentación personal', items: [
            SI_('hp1', 'Uniforme limpio y completo'), SI_('hp2', 'Cofia cubriendo todo el pelo (y mascarilla si corresponde)'),
            SI_('hp3', 'Uñas cortas, limpias y sin esmalte'), SI_('hp4', 'Sin joyas, relojes ni accesorios'),
            SI_('hp5', 'Lavado y desinfección de manos al ingresar')
          ]},
          { titulo: 'Firma', items: [{ id: 'firma', tipo: 'firma', texto: 'Firma del trabajador', req: true }] }
        ]
      },
      {
        id: 'TEMPERATURAS', nombre: 'Registro de temperaturas', codigo: 'BPM-TEMP', ambito: 'libre', icono: '🌡️',
        descripcion: 'Cámaras, congeladores, vitrinas y productos. Los límites son sugeridos: ajústalos a tu plan HACCP en Formularios.',
        secciones: [
          { titulo: 'Equipo o producto', items: [
            { id: 'tp_equipo', tipo: 'texto', texto: 'Equipo o producto medido (ej. cámara 1, vitrina, lote de pollo)', req: true },
            { id: 'tp_tipo', tipo: 'opciones', texto: 'Tipo', opciones: ['Refrigeración', 'Congelación', 'Producto cocinado', 'Mantención en caliente', 'Recepción'], req: true }
          ]},
          { titulo: 'Medición', nota: 'Llena solo la que corresponde. Fuera de rango queda como alerta.', items: [
            { id: 'tp_ref', tipo: 'numero', texto: 'Refrigeración (°C) — límite sugerido: 0 a 5', min: 0, max: 5 },
            { id: 'tp_cong', tipo: 'numero', texto: 'Congelación (°C) — límite sugerido: -18 o menos', max: -18 },
            { id: 'tp_coc', tipo: 'numero', texto: 'Temperatura interna de cocción (°C) — límite sugerido: 70 o más', min: 70 },
            { id: 'tp_cal', tipo: 'numero', texto: 'Mantención en caliente (°C) — límite sugerido: 65 o más', min: 65 },
            { id: 'tp_accion', tipo: 'parrafo', texto: 'Si está fuera de rango: acción correctiva tomada (ajuste, traslado, descarte)' }
          ]},
          { titulo: 'Firma', items: [{ id: 'firma', tipo: 'firma', texto: 'Firma de quien mide', req: true }] }
        ]
      },
      {
        id: 'LIMPIEZA', nombre: 'Registro de limpieza y sanitización', codigo: 'BPM-POES', ambito: 'libre', icono: '🧽',
        descripcion: 'Según el programa de limpieza y sanitización (POES) de la planta o cocina.',
        secciones: [
          { titulo: 'Limpieza', items: [
            { id: 'lp_area', tipo: 'texto', texto: 'Área, equipo o superficie', req: true },
            { id: 'lp_tipo', tipo: 'opciones', texto: 'Tipo', opciones: ['Diaria', 'Profunda / semanal', 'Después de un incidente'], req: true },
            { id: 'lp_prod', tipo: 'texto', texto: 'Detergente / sanitizante usado y concentración', req: true },
            SI_('lp1', 'Se retiraron restos y se lavó con detergente'), SI_('lp2', 'Se enjuagó y se aplicó sanitizante con el tiempo de contacto indicado'),
            SI_('lp3', 'Verificación visual: superficie limpia, sin residuos ni olores'),
            SI_('lp4', 'Productos químicos guardados lejos de los alimentos y rotulados'),
            { id: 'lp_fotos', tipo: 'foto', texto: 'Foto (opcional)' }
          ]},
          { titulo: 'Firma', items: [{ id: 'firma', tipo: 'firma', texto: 'Firma de quien limpia', req: true }, { id: 'lp_verif', tipo: 'texto', texto: 'Verificado por (supervisor)' }] }
        ]
      },
      {
        id: 'RECEPCION_MP', nombre: 'Recepción de materias primas', codigo: 'BPM-REC', ambito: 'libre', icono: '📦',
        descripcion: 'Control de cada entrega de proveedor: temperatura, envase, rotulación y vencimiento.',
        secciones: [
          { titulo: 'Entrega', items: [
            { id: 'rc_prov', tipo: 'texto', texto: 'Proveedor', req: true }, { id: 'rc_doc', tipo: 'texto', texto: 'N° factura o guía' },
            { id: 'rc_prod', tipo: 'texto', texto: 'Producto(s) y lote', req: true }, { id: 'rc_venc', tipo: 'fecha', texto: 'Fecha de vencimiento' },
            { id: 'rc_temp', tipo: 'numero', texto: 'Temperatura de llegada (°C) — si es refrigerado, máximo sugerido 5', max: 5 }
          ]},
          { titulo: 'Control', items: [
            SI_('rc1', 'Transporte limpio y a la temperatura correcta'), SI_('rc2', 'Envases íntegros, sin golpes, abombamientos ni filtraciones'),
            SI_('rc3', 'Rotulación completa (nombre, lote, vencimiento, registro sanitario cuando corresponde)'),
            SI_('rc4', 'Características normales (color, olor, textura)'),
            { id: 'rc_res', tipo: 'opciones', texto: 'Resultado', opciones: ['Aceptado', 'Aceptado con observación', 'Rechazado'], req: true },
            { id: 'rc_fotos', tipo: 'foto', texto: 'Fotos (rotulado o problema)' }
          ]},
          { titulo: 'Firma', items: [{ id: 'firma', tipo: 'firma', texto: 'Firma de quien recibe', req: true }] }
        ]
      },
      {
        id: 'CONTROL_PLAGAS', nombre: 'Control de plagas', codigo: 'BPM-PLA', ambito: 'mensual', icono: '🐀',
        descripcion: 'Revisión de trampas y estaciones; adjuntar el certificado de la empresa de control de plagas.',
        secciones: [
          { titulo: 'Revisión', items: [
            { id: 'pl_estac', tipo: 'numero', texto: 'N° de estaciones / trampas revisadas', req: true },
            { id: 'pl_hall', tipo: 'sino', texto: '¿Se encontraron evidencias de plagas (fecas, consumo de cebo, insectos)?', alerta: 'SI', req: true },
            { id: 'pl_donde', tipo: 'parrafo', texto: 'Dónde y qué se encontró' },
            SI_('pl1', 'Puertas, mallas y rejillas sin aberturas'), SI_('pl2', 'Basura en contenedores tapados y retirada a diario'),
            SI_('pl3', 'Certificado vigente de la empresa de control de plagas'),
            { id: 'pl_fotos', tipo: 'foto', texto: 'Fotos' }
          ]},
          { titulo: 'Firma', items: [{ id: 'firma', tipo: 'firma', texto: 'Firma de quien revisa', req: true }] }
        ]
      },
      {
        id: 'INSP_COCINA', nombre: 'Inspección de seguridad en cocina / planta', codigo: 'SST-COC', ambito: 'libre', icono: '🔥',
        descripcion: 'Riesgos laborales propios del rubro: cortes, quemaduras, pisos húmedos, gas y frío.',
        secciones: [
          { titulo: 'Inspección', nota: 'NO = corregir y registrar la acción', items: [
            SI_('ck1', 'Pisos secos o con señalización de piso mojado; desagües limpios'), SI_('ck2', 'Cuchillos afilados, guardados y guante anticorte disponible'),
            SI_('ck3', 'Máquinas (cortadoras, mezcladoras) con protecciones y parada de emergencia'), SI_('ck4', 'Instalación de gas sin olor a gas y con sello verde vigente'),
            SI_('ck5', 'Extintores y manta ignífuga a mano; campana sin grasa acumulada'), SI_('ck6', 'Cámara de frío abre desde dentro y tiene alarma'),
            SI_('ck7', 'Químicos de aseo rotulados, con hoja de datos de seguridad, lejos de alimentos')
          ]},
          CIERRE_FIRMA_('ck_')
        ]
      }
    ],
    matriz: [
      ['Preparación', 'Uso de cuchillos y máquinas de corte', 'Manipulador / cocinero', 'SI', 'Elementos cortantes y partes móviles', 'Cortes, amputación', 'Heridas, pérdida de dedos', 2, 4, 'Guante anticorte; protecciones de máquinas; capacitación; no limpiar máquinas encendidas', 'Ingeniería / EPP', 1, 2, ''],
      ['Cocción', 'Trabajo con hornos, freidoras y ollas', 'Cocinero', 'SI', 'Superficies y líquidos calientes', 'Quemaduras', 'Quemaduras de 1° a 3° grado', 2, 2, 'Guantes térmicos; mangos hacia adentro; no trasladar aceite caliente', 'EPP', 1, 2, ''],
      ['Todas', 'Desplazamiento en cocina o planta', 'Todos', 'SI', 'Pisos húmedos o con grasa', 'Caída al mismo nivel', 'Esguinces, fracturas', 4, 2, 'Calzado antideslizante; limpieza inmediata de derrames; señalización', 'Administrativa', 2, 1, ''],
      ['Almacenamiento', 'Ingreso a cámaras de frío', 'Bodeguero', 'SI', 'Bajas temperaturas', 'Exposición a frío, quedar encerrado', 'Hipotermia', 2, 4, 'Ropa térmica; tiempo de permanencia limitado; apertura interior y alarma', 'Ingeniería', 1, 2, ''],
      ['Limpieza', 'Uso de detergentes y sanitizantes', 'Auxiliar de aseo', 'SI', 'Productos químicos', 'Contacto o inhalación', 'Dermatitis, irritación', 2, 2, 'Hoja de datos de seguridad; guantes y lentes; no mezclar productos', 'EPP', 1, 1, ''],
      ['Cocción', 'Uso de gas', 'Cocinero', 'SI', 'Gas licuado o natural', 'Fuga, incendio, explosión', 'Quemaduras graves, muerte', 1, 4, 'Instalación certificada; revisión diaria de olor a gas; extintores', 'Ingeniería', 1, 2, ''],
      ['Bodega', 'Carga y descarga de mercadería', 'Bodeguero', 'SI', 'Manejo manual de carga', 'Sobreesfuerzo', 'Lumbago, lesiones musculares', 2, 2, 'Máximo 25 kg por persona (Ley 20.949); carros', 'Administrativa', 1, 2, ''],
      ['Inocuidad', 'Manipulación de alimentos', 'Manipulador', 'SI', 'Contaminación biológica, química o física', 'Alimento contaminado (ETA)', 'Intoxicación de consumidores', 2, 4, 'Higiene del personal; control de temperaturas; limpieza y sanitización (POES); control de plagas; BPM según DS 977', 'Administrativa', 1, 2, '']
    ]
  },

  /* ======================= BODEGA, COMERCIO Y COSMÉTICOS ======================= */
  BODEGA: {
    nombre: 'Bodega, comercio y cosméticos / perfumes',
    apagados: ['equipos', 'fallas', 'mapa'],
    vocab: { tickets: 'Tareas', trabajos: 'Tareas', clientes: 'Tiendas y clientes' },
    formsApagar: ['COVID'],
    jornada: [],
    cursos: [
      ['GRUA_H', 'Operación segura de grúa horquilla', '', 24, 'opcional', 'Para operadores; requieren licencia clase D (ajustar).'],
      ['MMC', 'Manejo manual de cargas', '', 24, 'todos', 'Ley 20.949: máximo 25 kg por persona; técnica de levantamiento.'],
      ['SUSPEL', 'Manejo de sustancias peligrosas e inflamables', '', 12, 'opcional', 'DS 43/2015 (MINSAL): programa y registro de capacitaciones del personal de la bodega de sustancias peligrosas.'],
      ['EMERG', 'Plan de emergencia y evacuación', '', 12, 'todos', 'Simulacro y uso de extintores (ajustar).'],
      ['ATENCION', 'Atención de público y manejo de situaciones de violencia', '', 24, 'opcional', 'Para personal de tienda (Ley Karin: violencia de terceros).']
    ],
    cursosApagar: ['ELECT', 'ALTURA'],
    epp: ['Zapatos de seguridad', 'Guantes de cabritilla', 'Faja lumbar (solo si la indica la evaluación)', 'Chaleco reflectante', 'Casco', 'Lentes de seguridad',
      'Guantes de nitrilo', 'Mascarilla para vapores orgánicos'],
    forms: [
      {
        id: 'CHK_GRUA', nombre: 'Checklist grúa horquilla', codigo: 'CHK-GH', ambito: 'jornada', icono: '🏭',
        descripcion: 'Antes de operar, cada turno. Solo operadores autorizados con licencia clase D.',
        secciones: [
          { titulo: 'Equipo', items: [
            { id: 'gh_num', tipo: 'texto', texto: 'N° interno de la grúa', req: true }, { id: 'gh_horo', tipo: 'numero', texto: 'Horómetro' },
            { id: 'gh_comb', tipo: 'opciones', texto: 'Energía', opciones: ['Gas', 'Diésel', 'Eléctrica (batería)'] }
          ]},
          { titulo: 'Revisión', nota: 'NO = no operar y avisar al supervisor', items: [
            SI_('gh1', 'Operador con licencia clase D y autorización interna vigentes'), SI_('gh2', 'Frenos de servicio y de estacionamiento'),
            SI_('gh3', 'Dirección y ruedas en buen estado'), SI_('gh4', 'Bocina, alarma de retroceso y baliza'), SI_('gh5', 'Luces'),
            SI_('gh6', 'Horquillas sin grietas ni deformaciones; cadenas y mástil lubricados'), SI_('gh7', 'Sin fugas de aceite, gas o líquido de batería'),
            SI_('gh8', 'Cinturón de seguridad y techo protector'), SI_('gh9', 'Extintor con carga vigente'), SI_('gh10', 'Placa de capacidad de carga legible')
          ]},
          CIERRE_FIRMA_('gh_')
        ]
      },
      {
        id: 'INSP_INFLAMABLES', nombre: 'Inspección de almacenamiento de inflamables y sustancias peligrosas', codigo: 'SUSPEL', ambito: 'mensual', icono: '⚗️',
        descripcion: 'Perfumes, alcoholes, aerosoles y químicos. Referencia: DS 43/2015 MINSAL (almacenamiento de sustancias peligrosas). Ajustar según la cantidad almacenada y el tipo de bodega.',
        secciones: [
          { titulo: 'Bodega', items: [
            { id: 'sp_ubic', tipo: 'texto', texto: 'Bodega o sector', req: true },
            { id: 'sp_tipo', tipo: 'opciones', texto: 'Tipo de almacenamiento', opciones: ['Sector dentro de bodega común', 'Bodega de sustancias peligrosas adyacente', 'Bodega de sustancias peligrosas separada', 'Bodega exclusiva de inflamables'] }
          ]},
          { titulo: 'Inspección', nota: 'NO = corregir y registrar la acción', items: [
            SI_('sp1', 'Envases cerrados, en buen estado y etiquetados'), SI_('sp2', 'Hojas de datos de seguridad (HDS) disponibles en el lugar'),
            SI_('sp3', 'Sustancias incompatibles separadas (inflamables lejos de oxidantes y corrosivos)'), SI_('sp4', 'Ventilación adecuada y sin olor fuerte a solvente'),
            SI_('sp5', 'Sin fuentes de ignición (enchufes dañados, calefactores, cigarrillos); señalética de no fumar'),
            SI_('sp6', 'Sistema de control de derrames (bandeja, material absorbente)'), SI_('sp7', 'Extintores adecuados, señalizados y con carga vigente'),
            SI_('sp8', 'Pasillos y salidas despejados'), SI_('sp9', 'Cantidades dentro de lo autorizado para el tipo de bodega'),
            SI_('sp10', 'Personal capacitado en manejo de sustancias peligrosas y plan de emergencia')
          ]},
          CIERRE_FIRMA_('sp_')
        ]
      },
      {
        id: 'INSP_ESTANTERIAS', nombre: 'Inspección de estanterías y orden de bodega', codigo: 'CHK-EST', ambito: 'mensual', icono: '🗄️',
        descripcion: 'Racks, estanterías, pasillos y orden y aseo.',
        secciones: [
          { titulo: 'Inspección', nota: 'NO = descargar y reparar antes de usar', items: [
            SI_('es1', 'Estanterías ancladas al piso o muro'), SI_('es2', 'Sin montantes ni vigas golpeadas o deformadas'),
            SI_('es3', 'Carga máxima por nivel rotulada y respetada'), SI_('es4', 'Lo más pesado abajo; nada sobresale de los bordes'),
            SI_('es5', 'Pasillos despejados y demarcados (peatones y grúa separados)'), SI_('es6', 'Escaleras para alcanzar niveles altos en buen estado'),
            SI_('es7', 'Iluminación suficiente')
          ]},
          CIERRE_FIRMA_('es_')
        ]
      },
      {
        id: 'RECEPCION_MERC', nombre: 'Recepción de mercadería', codigo: 'REC-MER', ambito: 'libre', icono: '📦',
        descripcion: 'Control de cada entrega. En cosméticos y perfumes, revisar que el rótulo traiga el registro sanitario del ISP (DS 239/2002).',
        secciones: [
          { titulo: 'Entrega', items: [
            { id: 'rm_prov', tipo: 'texto', texto: 'Proveedor', req: true }, { id: 'rm_doc', tipo: 'texto', texto: 'N° factura o guía', req: true },
            { id: 'rm_prod', tipo: 'parrafo', texto: 'Productos, cantidades y lotes', req: true }
          ]},
          { titulo: 'Control', items: [
            SI_('rm1', 'Cantidades coinciden con la guía o factura'), SI_('rm2', 'Envases y cajas sin daños ni derrames'),
            SINA_('rm3', 'Cosméticos / perfumes: rótulo en español con N° de registro ISP'), SINA_('rm4', 'Productos con vencimiento vigente'),
            SINA_('rm5', 'Productos inflamables enviados directo a su zona de almacenamiento'),
            { id: 'rm_res', tipo: 'opciones', texto: 'Resultado', opciones: ['Aceptado', 'Aceptado con observación', 'Rechazado'], req: true },
            { id: 'rm_fotos', tipo: 'foto', texto: 'Fotos' }
          ]},
          { titulo: 'Firma', items: [{ id: 'firma', tipo: 'firma', texto: 'Firma de quien recibe', req: true }] }
        ]
      }
    ],
    matriz: [
      ['Bodega', 'Operación de grúa horquilla', 'Operador', 'SI', 'Equipo móvil, carga en altura', 'Atropello, volcamiento, caída de carga', 'Lesiones graves, muerte', 2, 4, 'Licencia clase D y autorización; checklist diario; pasillos peatonales separados; velocidad limitada', 'Ingeniería / administrativa', 1, 4, ''],
      ['Bodega', 'Almacenamiento en estanterías', 'Bodeguero', 'SI', 'Objetos almacenados en altura', 'Caída de objetos, colapso de estantería', 'Contusiones, lesiones graves', 2, 4, 'Estanterías ancladas y con carga rotulada; inspección mensual; casco en zona de racks', 'Ingeniería', 1, 2, ''],
      ['Bodega', 'Carga y descarga manual', 'Bodeguero / reponedor', 'SI', 'Manejo manual de carga', 'Sobreesfuerzo', 'Lumbago, lesiones musculares', 2, 2, 'Máximo 25 kg por persona (Ley 20.949); carros y transpaletas; capacitación', 'Administrativa', 1, 2, ''],
      ['Bodega', 'Almacenamiento de perfumes, alcoholes y aerosoles', 'Bodeguero', 'SI', 'Líquidos inflamables', 'Incendio, derrame', 'Quemaduras, intoxicación, pérdidas materiales', 2, 4, 'Almacenamiento según DS 43/2015; HDS disponibles; control de derrames; sin fuentes de ignición; extintores', 'Ingeniería', 1, 2, ''],
      ['Bodega', 'Manipulación de productos químicos', 'Bodeguero', 'NO', 'Sustancias peligrosas', 'Contacto o inhalación', 'Dermatitis, irritación', 2, 2, 'HDS; guantes y lentes; ventilación', 'EPP', 1, 1, ''],
      ['Tienda', 'Atención de público', 'Vendedor / cajero', 'SI', 'Clientes agresivos, robos', 'Agresión de terceros', 'Lesiones, estrés', 2, 2, 'Protocolo de violencia de terceros (Ley Karin); no oponer resistencia en robos; botón de pánico', 'Administrativa', 1, 2, ''],
      ['Tienda', 'Trabajo en caja y reposición', 'Cajero / reponedor', 'SI', 'Posturas mantenidas, movimientos repetitivos', 'Trastornos musculoesqueléticos', 'Dolor de espalda y extremidades', 2, 2, 'Pausas; silla o apoyo; alternar tareas; evaluación de puesto', 'Administrativa', 1, 1, ''],
      ['Todas', 'Desplazamiento en bodega y tienda', 'Todos', 'SI', 'Pisos con obstáculos o derrames', 'Caída al mismo nivel', 'Esguinces, fracturas', 2, 2, 'Orden y aseo; pasillos despejados; limpiar derrames de inmediato', 'Administrativa', 1, 1, '']
    ]
  },

  /* ======================= OTRO ======================= */
  OTRO: {
    nombre: 'Otro rubro',
    apagados: ['equipos', 'fallas'],
    vocab: { tickets: 'Tareas', trabajos: 'Tareas' },
    forms: [], formsApagar: ['COVID'], jornada: [],
    cursos: [], cursosApagar: ['ELECT'],
    epp: [],
    matriz: null
  }
};
// Compatibilidad con empresas creadas con el rubro "CONTRATISTA" antes de esta versión
RUBROS.CONTRATISTA = RUBROS.MINERIA;

/* ---------- funciones del perfil ---------- */

function rubroClave_(c) { var r = String((c || {}).rubro || '').toUpperCase(); return RUBROS[r] ? r : 'OTRO'; }
function rubroDef_(c) { if (!c) { try { c = cfg_(); } catch (e) { c = {}; } } return RUBROS[rubroClave_(c)]; }
/** Lista para el asistente de alta y Configuración: [clave, nombre] (sin alias). */
function listaRubros_() { return Object.keys(RUBROS).filter(function (k) { return k !== 'CONTRATISTA'; }).map(function (k) { return [k, RUBROS[k].nombre]; }); }
function apagadosRubro_() { var o = {}; Object.keys(RUBROS).forEach(function (k) { o[k] = RUBROS[k].apagados || []; }); return o; }
/** Vocabulario: el del rubro, con lo que la empresa cambie en CONFIG → vocabulario (JSON). */
function vocab_(c) {
  var v = {}, base = rubroDef_(c).vocab || {}, propio = json_((c || {}).vocabulario || '', {}) || {};
  Object.keys(base).forEach(function (k) { v[k] = base[k]; });
  Object.keys(propio).forEach(function (k) { if (propio[k]) v[k] = String(propio[k]); });
  return v;
}

/**
 * Carga lo propio del rubro: formularios, cursos y formularios diarios. Solo agrega lo que falta
 * (se puede repetir; no borra nada). Los formularios y cursos que no aplican quedan inactivos
 * la primera vez; si la empresa los reactiva, se respeta.
 */
function sembrarRubro_(clave) {
  var R = RUBROS[String(clave || '').toUpperCase()] || RUBROS.OTRO;
  var primeraVez = cfg_().rubro_sembrado !== String(clave || '').toUpperCase();

  var fSh = sh_('FORMULARIOS'), fRows = rows_('FORMULARIOS'), ids = fRows.map(function (r) { return r.id; });
  var orden = fRows.reduce(function (m, r) { return Math.max(m, Number(r.orden) || 0); }, 0);
  (R.forms || []).forEach(function (f) {
    if (ids.indexOf(f.id) < 0) { fSh.appendRow([f.id, f.nombre, f.codigo, f.ambito, 'SI', ++orden, JSON.stringify(defDe_(f))]); ids.push(f.id); }
  });
  fresco_();
  if (primeraVez) rows_('FORMULARIOS').forEach(function (r) {
    if ((R.formsApagar || []).indexOf(r.id) >= 0 && String(r.activo).toUpperCase() !== 'NO') update_('FORMULARIOS', r._row, { activo: 'NO' });
  });

  var cRows = rows_('CURSOS'), cIds = cRows.map(function (r) { return r.id; }), cOrden = cRows.length;
  (R.cursos || []).forEach(function (c) { if (cIds.indexOf(c[0]) < 0) { append_('CURSOS', { id: c[0], nombre: c[1], horas: c[2], vigencia_meses: c[3], aplica: c[4], base: c[5], activo: 'SI', orden: ++cOrden }); cIds.push(c[0]); } });
  if (primeraVez) rows_('CURSOS').forEach(function (r) {
    if ((R.cursosApagar || []).indexOf(r.id) >= 0 && String(r.activo).toUpperCase() !== 'NO') update_('CURSOS', r._row, { activo: 'NO' });
  });

  if (primeraVez && (R.jornada || []).length) {
    var jor = String(cfg_().jornada_obligatoria || '').split(',').map(function (x) { return x.trim(); }).filter(String);
    (R.jornada || []).forEach(function (j) { if (jor.indexOf(j) < 0) jor.push(j); });
    setCfg_('jornada_obligatoria', jor.join(','));
  }
  setCfg_('rubro_sembrado', String(clave || '').toUpperCase());
}
