(() => {
  const locale = ["en", "de"].includes(location.pathname.split("/")[1])
    ? location.pathname.split("/")[1]
    : "es";
  const index = locale === "en" ? 0 : locale === "de" ? 1 : -1;

  // Spanish is the source language. Each entry is [English, German] so the
  // page can be maintained in one place without duplicating its markup.
  const messages = {
    "Necesito orientación sobre mi pavimento": ["I need advice about my floor", "Ich benötige Beratung zu meinem Boden"],
    "Obraxen · Reparación de pavimentos industriales": ["Obraxen · Industrial floor repair", "Obraxen · Reparatur von Industrieböden"],
    "Reparación y rehabilitación de pavimentos industriales: juntas, fisuras, pulido, nivelación y preparación del soporte.": ["Industrial floor repair and refurbishment: joints, cracks, polishing, levelling and substrate preparation.", "Reparatur und Sanierung von Industrieböden: Fugen, Risse, Polieren, Nivellierung und Untergrundvorbereitung."],
    "Saltar al contenido": ["Skip to content", "Zum Inhalt springen"],
    "Identidad tipográfica. Contornos editables. Colores sRGB. Sin fuentes externas.": ["Typographic identity. Editable outlines. sRGB colours. No external fonts.", "Typografische Identität. Bearbeitbare Konturen. sRGB-Farben. Keine externen Schriften."],
    "Obraxen, inicio": ["Obraxen, home", "Obraxen, Startseite"],
    "Obraxen, volver al inicio": ["Obraxen, back to home", "Obraxen, zurück zur Startseite"],
    "Navegación principal": ["Main navigation", "Hauptnavigation"],
    "Navegación móvil": ["Mobile navigation", "Mobilnavigation"],
    "Idioma": ["Language", "Sprache"],
    "Cambiar idioma a": ["Change language to", "Sprache wechseln zu"],
    "Soluciones": ["Solutions", "Leistungen"],
    "Proyectos": ["Projects", "Projekte"],
    "Sectores": ["Sectors", "Branchen"],
    "Contacto": ["Contact", "Kontakt"],
    "Noticias": ["News", "Aktuelles"],
    "Cuéntanos tu caso": ["Tell us about your project", "Schildern Sie uns Ihr Projekt"],
    "Abrir menú": ["Open menu", "Menü öffnen"],
    "Cerrar menú": ["Close menu", "Menü schließen"],
    "Reproducir vídeo de fondo": ["Play background video", "Hintergrundvideo abspielen"],
    "Pausar vídeo de fondo": ["Pause background video", "Hintergrundvideo pausieren"],
    "Cancelar carga del vídeo": ["Cancel video loading", "Videoladevorgang abbrechen"],
    "Recuperamos tus pavimentos.": ["We restore your floors.", "Wir setzen Ihre Böden instand."],
    "Cuidamos tu actividad.": ["We protect your operations.", "Wir sichern Ihren Betrieb."],
    "¿Qué necesita tu pavimento?": ["What does your floor need?", "Was braucht Ihr Boden?"],
    "Soluciones; desliza o usa las flechas para explorar": ["Solutions; swipe or use the arrows to explore", "Leistungen; wischen Sie oder nutzen Sie die Pfeile zum Durchsehen"],
    "Reparación de pavimentos": ["Floor repair", "Bodenreparatur"],
    "Pulido y rehabilitación": ["Polishing and refurbishment", "Polieren und Sanieren"],
    "Nivelación y recrecidos": ["Levelling and screeds", "Nivellierung und Estriche"],
    "Retirada y preparación": ["Removal and preparation", "Entfernung und Vorbereitung"],
    "Juntas, fisuras y daños localizados.": ["Joints, cracks and localised damage.", "Fugen, Risse und lokale Schäden."],
    "Revisamos el origen y la extensión del daño para definir una reparación localizada.": ["We assess the cause and extent of the damage to define a targeted repair.", "Wir prüfen Ursache und Ausmaß des Schadens, um eine gezielte Reparatur festzulegen."],
    "Recuperación de superficies desgastadas.": ["Restoration of worn surfaces.", "Sanierung verschlissener Oberflächen."],
    "Valoramos el desgaste y el estado del soporte antes de elegir el tratamiento superficial.": ["We assess wear and substrate condition before selecting the surface treatment.", "Wir bewerten Verschleiß und Untergrundzustand, bevor wir die Oberflächenbehandlung auswählen."],
    "Corrección de desniveles y recuperación de cotas.": ["Correction of uneven levels and restoration of floor heights.", "Korrektur von Unebenheiten und Wiederherstellung der Höhen."],
    "Comprobamos las cotas y el uso de la zona para plantear la corrección del pavimento.": ["We check floor heights and how the area is used to plan the correction.", "Wir prüfen Höhen und Nutzung des Bereichs, um die Bodenkorrektur zu planen."],
    "Revestimientos, anclajes y preparación del soporte.": ["Coatings, anchors and substrate preparation.", "Beschichtungen, Anker und Untergrundvorbereitung."],
    "Evaluamos qué debe retirarse y cómo preparar el soporte para la siguiente intervención.": ["We assess what must be removed and how to prepare the substrate for the next intervention.", "Wir bewerten, was entfernt werden muss und wie der Untergrund für die nächste Maßnahme vorzubereiten ist."],
    "1 de 4": ["1 of 4", "1 von 4"],
    "Ver los 5 proyectos": ["View all 5 projects", "Alle 5 Projekte ansehen"],
    "Cinco proyectos del equipo": ["Five projects by the team", "Fünf Projekte des Teams"],
    "Proyectos. Usa las flechas para recorrerlos.": ["Projects. Use the arrows to browse them.", "Projekte. Nutzen Sie die Pfeile zum Durchsehen."],
    "Proyectos anteriores": ["Previous projects", "Vorherige Projekte"],
    "Proyectos siguientes": ["Next projects", "Nächste Projekte"],
    "Hannover, Alemania": ["Hanover, Germany", "Hannover, Deutschland"],
    "París, Francia": ["Paris, France", "Paris, Frankreich"],
    "Düsseldorf, Alemania": ["Düsseldorf, Germany", "Düsseldorf, Deutschland"],
    "Gauchy, Francia": ["Gauchy, France", "Gauchy, Frankreich"],
    "Bremen, Alemania": ["Bremen, Germany", "Bremen, Deutschland"],
    "Tratamiento de 18.084 m² de pavimento y retirada de 5.362 m² de revestimiento, con sistemas húmedo y seco para la planta principal y la entreplanta.": ["Treatment of 18,084 m² of flooring and removal of 5,362 m² of coating, using wet and dry systems across the main floor and mezzanine.", "Bearbeitung von 18.084 m² Bodenfläche und Entfernung von 5.362 m² Beschichtung mit Nass- und Trockenverfahren auf Hauptfläche und Zwischenebene."],
    "Rehabilitación de 2.700 m², retirada de revestimientos y reparación de 829 metros lineales de juntas y fisuras, con saneado de anclajes y huecos.": ["Refurbishment of 2,700 m², coating removal and repair of 829 linear metres of joints and cracks, including anchor and void repairs.", "Sanierung von 2.700 m², Entfernung von Beschichtungen und Reparatur von 829 laufenden Metern Fugen und Rissen einschließlich der Instandsetzung von Ankern und Fehlstellen."],
    "Rebaje de 1.730 anclajes y relleno con masilla bicomponente, junto con la retirada localizada de señalización y parches de pintura del pavimento.": ["Grinding down 1,730 anchors and filling them with two-component filler, together with local removal of floor markings and paint patches.", "Abschleifen und Verfüllen von 1.730 Ankern mit Zweikomponenten-Spachtelmasse sowie lokale Entfernung von Bodenmarkierungen und Farbflecken."],
    "Tratamiento superficial LitoBrillant sobre 4.200 m² de pavimento industrial, aplicado con fratasadora doble, densificador de litio y sellador.": ["LitoBrillant surface treatment across 4,200 m² of industrial flooring, applied with a ride-on trowel, lithium densifier and sealer.", "Oberflächenbehandlung mit LitoBrillant auf 4.200 m² Industrieboden, ausgeführt mit Doppelglätter, Lithiumverdichter und Versiegelung."],
    "Reparación de 1.121 metros lineales de fisuras y 465 huecos, retirada o rebaje de 5.000 anclajes y nivelación mediante lijado en los muelles de carga.": ["Repair of 1,121 linear metres of cracks and 465 voids, removal or grinding down of 5,000 anchors, and levelling by grinding at the loading bays.", "Reparatur von 1.121 laufenden Metern Rissen und 465 Fehlstellen, Entfernung oder Abschleifen von 5.000 Ankern sowie Nivellierung durch Schleifen an den Laderampen."],
    "1–2 de 5": ["1–2 of 5", "1–2 von 5"],
    "Sectores en los que trabajamos": ["Sectors we work in", "Branchen, in denen wir tätig sind"],
    "Selecciona un sector": ["Select a sector", "Wählen Sie eine Branche"],
    "Logística": ["Logistics", "Logistik"],
    "Industria": ["Industry", "Industrie"],
    "Automoción": ["Automotive", "Automobilindustrie"],
    "Distribución": ["Distribution", "Handel und Distribution"],
    "Alimentación": ["Food and beverage", "Lebensmittel und Getränke"],
    "Aparcamientos": ["Car parks", "Parkhäuser und Parkflächen"],
    "Almacenes, centros logísticos y zonas de carga.": ["Warehouses, logistics hubs and loading areas.", "Lager, Logistikzentren und Ladebereiche."],
    "Plantas de fabricación y áreas de producción.": ["Manufacturing plants and production areas.", "Fertigungsstätten und Produktionsbereiche."],
    "Instalaciones del automóvil y sus componentes.": ["Automotive facilities and component plants.", "Automobilwerke und Komponentenfertigungen."],
    "Grandes superficies y comercio mayorista.": ["Large-format retail and wholesale premises.", "Großflächenhandel und Großhandelsbetriebe."],
    "Producción de alimentos y bebidas.": ["Food and beverage production.", "Lebensmittel- und Getränkeproduktion."],
    "Plazas, zonas de circulación y accesos de vehículos.": ["Parking spaces, traffic lanes and vehicle access points.", "Stellplätze, Fahrspuren und Fahrzeugzufahrten."],
    "Ver sector": ["View sector", "Branche ansehen"],
    "Ver sector: Logística": ["View sector: Logistics", "Branche ansehen: Logistik"],
    "Pavimentos · Borrador": ["Floors · Draft", "Böden · Entwurf"],
    "Proyectos · Borrador": ["Projects · Draft", "Projekte · Entwurf"],
    "Obraxen · Borrador": ["Obraxen · Draft", "Obraxen · Entwurf"],
    "Cuando el pavimento necesita una segunda vida.": ["When a floor needs a second life.", "Wenn ein Boden ein zweites Leben braucht."],
    "Reparar, preparar y rehabilitar: distintas formas de actuar sobre un suelo existente según su estado y su próximo uso.": ["Repairing, preparing and refurbishing: different approaches for an existing floor according to its condition and intended use.", "Reparieren, vorbereiten und sanieren: unterschiedliche Vorgehensweisen für bestehende Böden je nach Zustand und künftiger Nutzung."],
    "Desliza para ver más borradores.": ["Swipe to see more drafts.", "Wischen Sie, um weitere Entwürfe zu sehen."],
    "Delticom: la rehabilitación de un pavimento logístico.": ["Delticom: refurbishing a logistics floor.", "Delticom: Sanierung eines Logistikbodens."],
    "Juntas y fisuras: qué conviene revisar antes de reparar.": ["Joints and cracks: what to check before repairing.", "Fugen und Risse: Was vor einer Reparatur geprüft werden sollte."],
    "El uso de cada zona marca la planificación.": ["How each area is used shapes the plan.", "Die Nutzung jedes Bereichs bestimmt die Planung."],
    "L’Oréal: tratamiento superficial en una instalación industrial.": ["L’Oréal: surface treatment in an industrial facility.", "L’Oréal: Oberflächenbehandlung in einer Industrieanlage."],
    "Encuentra la solución a partir del estado de tu pavimento.": ["Find the right solution from the condition of your floor.", "Die passende Lösung ergibt sich aus dem Zustand Ihres Bodens."],
    "Una consulta empieza por conocer tu instalación.": ["An enquiry starts with understanding your facility.", "Eine Anfrage beginnt damit, Ihre Anlage zu verstehen."],
    "Ver más borradores": ["View more drafts", "Weitere Entwürfe anzeigen"],
    "Ver menos borradores": ["View fewer drafts", "Weniger Entwürfe anzeigen"],
    "Cuéntanos": ["Tell us about", "Schildern Sie uns"],
    "tu caso": ["your project", "Ihr Projekt"],
    "¿Prefieres hablar directamente?": ["Would you prefer to speak directly?", "Möchten Sie lieber direkt sprechen?"],
    "Tu consulta": ["Your enquiry", "Ihre Anfrage"],
    "Los tres campos son obligatorios. Basta con un correo o un teléfono.": ["All three fields are required. An email address or phone number is enough.", "Alle drei Felder sind erforderlich. Eine E-Mail-Adresse oder Telefonnummer genügt."],
    "Prepara tu consulta en un correo dirigido al canal de contacto indicado. No se envía automáticamente: tú decides cuándo pulsar «Enviar».": ["Prepare your enquiry in an email addressed to the stated contact channel. It is not sent automatically: you decide when to press “Send”.", "Bereiten Sie Ihre Anfrage als E-Mail an den angegebenen Kontaktkanal vor. Sie wird nicht automatisch versendet: Sie entscheiden, wann Sie auf „Senden“ klicken."],
    "Quitar selección": ["Clear selection", "Auswahl entfernen"],
    "Nombre": ["Name", "Name"],
    "Correo electrónico o teléfono": ["Email address or phone number", "E-Mail-Adresse oder Telefonnummer"],
    "Preparar correo": ["Prepare email", "E-Mail vorbereiten"],
    "Activa JavaScript para validar los campos y preparar el correo.": ["Enable JavaScript to validate the fields and prepare the email.", "Aktivieren Sie JavaScript, um die Felder zu prüfen und die E-Mail vorzubereiten."],
    "Reparación de pavimentos industriales.": ["Industrial floor repair.", "Reparatur von Industrieböden."],
    "Aviso legal": ["Legal notice", "Impressum"],
    "Privacidad": ["Privacy", "Datenschutz"],
    "Cookies": ["Cookies", "Cookies"],
    "Volver arriba": ["Back to top", "Nach oben"],
    "Información legal básica": ["Basic legal information", "Grundlegende rechtliche Informationen"],
    "Este sitio web es titularidad de OBRAXEN SURFACE S.L., con NIF provisional B93963841 y domicilio en Calle Federico García Lorca, 22.": ["This website is operated by OBRAXEN SURFACE S.L., with provisional Spanish tax ID B93963841 and registered address at Calle Federico García Lorca, 22.", "Diese Website wird von OBRAXEN SURFACE S.L. betrieben, mit der vorläufigen spanischen Steuer-ID B93963841 und Sitz in Calle Federico García Lorca, 22."],
    "Identificación del titular de esta homepage de referencia. La revisión profesional del aviso legal y la aprobación de publicación siguen pendientes.": ["Identification of the operator of this reference homepage. Professional review of the legal notice and publication approval are still pending.", "Angaben zum Betreiber dieser Referenz-Homepage. Die professionelle Prüfung des Impressums und die Freigabe zur Veröffentlichung stehen noch aus."],
    "Titular": ["Operator", "Betreiber"],
    "NIF": ["Tax ID", "Steuer-ID"],
    "NIF provisional": ["Provisional tax ID", "Vorläufige Steuer-ID"],
    "Domicilio": ["Registered address", "Anschrift"],
    "Dominio": ["Domain", "Domain"],
    "Actividad": ["Activity", "Tätigkeit"],
    "El contenido del sitio se ofrece para presentar los servicios de OBRAXEN SURFACE S.L. y facilitar el contacto profesional.": ["This website presents the services of OBRAXEN SURFACE S.L. and makes professional contact easier.", "Diese Website stellt die Leistungen von OBRAXEN SURFACE S.L. vor und erleichtert die berufliche Kontaktaufnahme."],
    "Estado:": ["Status:", "Status:"],
    "esta preview permanece en noindex/nofollow y no equivale a la publicación legal definitiva.": ["this preview remains noindex/nofollow and does not constitute the final legal publication.", "Diese Vorschau bleibt noindex/nofollow und stellt keine endgültige rechtliche Veröffentlichung dar."],
    "En esta preview, el formulario valida los campos en el navegador y prepara un correo en tu aplicación local. No envía datos a un servidor ni los guarda en esta página.": ["In this preview, the form validates fields in the browser and prepares an email in your local application. It does not send data to a server or store it on this page.", "In dieser Vorschau prüft das Formular die Felder im Browser und bereitet eine E-Mail in Ihrer lokalen Anwendung vor. Es sendet keine Daten an einen Server und speichert sie nicht auf dieser Seite."],
    "OBRAXEN SURFACE S.L. trata los datos que envíes para atender tu consulta profesional y, si lo solicitas, preparar una propuesta relacionada con los servicios descritos en este sitio.": ["OBRAXEN SURFACE S.L. processes the details you send to handle your professional enquiry and, if you request it, prepare a proposal related to the services described on this website.", "OBRAXEN SURFACE S.L. verarbeitet die von Ihnen übermittelten Angaben, um Ihre berufliche Anfrage zu bearbeiten und auf Wunsch ein Angebot zu den auf dieser Website beschriebenen Leistungen zu erstellen."],
    "El formulario no transmite ni guarda datos en este sitio. Al pulsar «Preparar correo», tu dispositivo abre tu aplicación de correo y tú decides si envías el mensaje.": ["The form does not transmit or store data on this website. When you press “Prepare email”, your device opens your email application and you decide whether to send the message.", "Das Formular überträgt oder speichert keine Daten auf dieser Website. Wenn Sie auf „E-Mail vorbereiten“ klicken, öffnet Ihr Gerät Ihre E-Mail-Anwendung und Sie entscheiden, ob Sie die Nachricht senden."],
    "Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad escribiendo a": ["You can request access, rectification, erasure, objection, restriction or portability by writing to", "Sie können Auskunft, Berichtigung, Löschung, Widerspruch, Einschränkung oder Datenübertragbarkeit beantragen, indem Sie an folgende Adresse schreiben:"],
    ". También puedes presentar una reclamación ante la autoridad de protección de datos competente.": [". You may also lodge a complaint with the competent data-protection authority.", ". Sie können außerdem Beschwerde bei der zuständigen Datenschutzaufsichtsbehörde einlegen."],
    "El contacto de privacidad es": ["The privacy contact is", "Der Datenschutzkontakt ist"],
    ". El texto definitivo de privacidad y la revisión del tratamiento del proveedor de correo deben aprobarse antes de publicar.": [". The final privacy text and the review of the email provider's processing must be approved before publication.", ". Der endgültige Datenschutztext und die Prüfung der Verarbeitung durch den E-Mail-Anbieter müssen vor der Veröffentlichung genehmigt werden."],
    "Cookies y almacenamiento": ["Cookies and storage", "Cookies und Speicherung"],
    "Esta preview no carga analítica, publicidad ni cookies no esenciales. Tampoco utiliza almacenamiento local para conservar la consulta.": ["This preview does not load analytics, advertising or non-essential cookies. It also does not use local storage to retain the enquiry.", "Diese Vorschau lädt keine Analyse, Werbung oder nicht erforderlichen Cookies. Sie nutzt auch keinen lokalen Speicher, um die Anfrage aufzubewahren."],
    "Este sitio no carga analítica, publicidad ni cookies no esenciales. Tampoco utiliza almacenamiento local para conservar los datos de una consulta.": ["This website does not load analytics, advertising or non-essential cookies. It also does not use local storage to retain enquiry data.", "Diese Website lädt keine Analyse, Werbung oder nicht erforderlichen Cookies. Sie nutzt auch keinen lokalen Speicher, um Anfragedaten aufzubewahren."],
    "Si se incorpora una tecnología que requiera consentimiento, esta información se actualizará antes de activarla.": ["If a technology that requires consent is added, this information will be updated before it is activated.", "Wenn eine einwilligungspflichtige Technologie ergänzt wird, wird diese Information vor ihrer Aktivierung aktualisiert."],
    "La política definitiva de cookies y almacenamiento queda pendiente de revisión profesional antes de activar una versión pública.": ["The final cookie and storage policy remains subject to professional review before a public version is enabled.", "Die endgültige Cookie- und Speicherpolitik muss vor Aktivierung einer öffentlichen Version noch professionell geprüft werden."],
    "¿Qué ocurre en tu pavimento?": ["What is happening to your floor?", "Was ist mit Ihrem Boden passiert?"],
    "Cerrar menú de reparación": ["Close repair menu", "Reparaturmenü schließen"],
    "Elige lo que observas. Llevaremos tu selección al formulario para que nos cuentes tu caso.": ["Choose what you observe. We will take your selection to the form so you can tell us about your project.", "Wählen Sie aus, was Sie beobachten. Wir übernehmen Ihre Auswahl in das Formular, damit Sie uns Ihr Projekt schildern können."],
    "Juntas abiertas o fisuras": ["Open joints or cracks", "Offene Fugen oder Risse"],
    "Daños en juntas, grietas o puntos concretos del suelo.": ["Damage to joints, cracks or specific areas of the floor.", "Schäden an Fugen, Rissen oder einzelnen Bodenstellen."],
    "Superficie desgastada": ["Worn surface", "Verschlissene Oberfläche"],
    "Desgaste, polvo o pérdida del acabado.": ["Wear, dusting or loss of finish.", "Verschleiß, Staubbildung oder Verlust der Oberfläche."],
    "Desniveles en el suelo": ["Uneven floor levels", "Unebenheiten im Boden"],
    "Diferencias de altura o zonas que necesitan nivelación.": ["Differences in height or areas that need levelling.", "Höhenunterschiede oder Bereiche, die nivelliert werden müssen."],
    "Elementos que retirar": ["Elements to remove", "Zu entfernende Elemente"],
    "Revestimientos o anclajes antes de preparar el soporte.": ["Coatings or anchors before preparing the substrate.", "Beschichtungen oder Anker vor der Untergrundvorbereitung."],
    "¿Tu caso es diferente?": ["Is your situation different?", "Ist Ihr Fall anders gelagert?"],
    "No lo tengo claro": ["I am not sure", "Ich bin mir nicht sicher"],
    "Desplazamiento de ": ["Scroll position for ", "Scrollposition für "],
    "Ver los cinco proyectos documentados": ["View the five documented projects", "Die fünf dokumentierten Projekte ansehen"],
    "Proyectos anteriores": ["Previous projects", "Vorherige Projekte"],
    "Proyectos siguientes": ["Next projects", "Nächste Projekte"],
    "Soluciones anteriores": ["Previous solutions", "Vorherige Leistungen"],
    "Soluciones siguientes": ["Next solutions", "Nächste Leistungen"],
    "Borradores de noticias": ["News drafts", "Nachrichtenentwürfe"],
    "Consulta sobre tu pavimento": ["Enquiry about your floor", "Anfrage zu Ihrem Boden"],
    "Soluciones en el pie": ["Footer solutions", "Leistungen in der Fußzeile"],
    "Navegación del pie": ["Footer navigation", "Fußzeilennavigation"],
    "Información legal": ["Legal information", "Rechtliche Informationen"],
    "Idioma: español": ["Language: Spanish", "Sprache: Spanisch"],
    "Máquinas trabajando sobre el pavimento de una nave industrial": ["Machines working on an industrial warehouse floor", "Maschinen bei der Arbeit auf dem Boden einer Industriehalle"],
    "Junta deteriorada en un pavimento de hormigón": ["Damaged joint in a concrete floor", "Beschädigte Fuge in einem Betonboden"],
    "Fisura con pérdida de material en hormigón": ["Crack with material loss in concrete", "Riss mit Materialausbruch im Beton"],
    "Detalle de reparación de fisuras en hormigón": ["Detail of a concrete crack repair", "Detail einer Betonrissreparatur"],
    "Refuerzo metálico de una junta de pavimento": ["Metal reinforcement for a floor joint", "Metallverstärkung einer Bodenfuge"],
    "Superficie pulida en una nave industrial": ["Polished surface in an industrial facility", "Polierte Oberfläche in einer Industriehalle"],
    "Pavimento continuo de una nave": ["Seamless floor in an industrial facility", "Fugenloser Boden in einer Industriehalle"],
    "Superficie pulida entre pilares metálicos": ["Polished surface between steel columns", "Polierte Oberfläche zwischen Stahlstützen"],
    "Acabado pulido de un pavimento interior": ["Polished finish on an interior floor", "Polierte Oberfläche eines Innenbodens"],
    "Equipo nivelando hormigón fresco": ["Team levelling fresh concrete", "Team beim Nivellieren von frischem Beton"],
    "Regleado de hormigón fresco": ["Screeding fresh concrete", "Abziehen von frischem Beton"],
    "Extendido manual de hormigón fresco": ["Manual spreading of fresh concrete", "Manuelles Verteilen von frischem Beton"],
    "Nivel láser utilizado para comprobar cotas": ["Laser level used to check floor heights", "Lasernivelliergerät zur Prüfung der Höhen"],
    "Retirada de un revestimiento epoxi": ["Removal of an epoxy coating", "Entfernung einer Epoxidharzbeschichtung"],
    "Huecos tras la retirada de anclajes": ["Voids after anchor removal", "Fehlstellen nach dem Entfernen von Ankern"],
    "Marcas en el pavimento tras la retirada de elementos": ["Marks on the floor after element removal", "Spuren auf dem Boden nach dem Entfernen von Bauteilen"],
    "Aplicación de una capa de preparación sobre el suelo": ["Applying a preparation layer to the floor", "Aufbringen einer Vorbereitungsschicht auf den Boden"],
    "Pasillo de almacén con estanterías": ["Warehouse aisle with shelving", "Lagergang mit Regalen"],
    "Maquinaria en una instalación industrial": ["Machinery in an industrial facility", "Maschinen in einer Industrieanlage"],
    "Carrocería de automóvil en una línea robotizada": ["Vehicle body on a robotic production line", "Fahrzeugkarosserie auf einer Roboterlinie"],
    "Mercancías y palés en un pasillo de distribución": ["Goods and pallets in a distribution aisle", "Waren und Paletten in einem Vertriebsgang"],
    "Depósitos de acero en una instalación alimentaria": ["Steel tanks in a food-processing facility", "Stahltanks in einer Lebensmittelanlage"],
    "Plazas y circulación de un aparcamiento cubierto": ["Parking spaces and lanes in a covered car park", "Stellplätze und Fahrspuren in einem Parkhaus"],
    "Pavimento tratado en una nave logística": ["Treated floor in a logistics facility", "Behandelter Boden in einer Logistikhalle"],
    "Superficie del proyecto Delticom": ["Surface at the Delticom project", "Oberfläche im Projekt Delticom"],
    "Detalle de una junta en un pavimento de hormigón": ["Detail of a joint in a concrete floor", "Detail einer Fuge in einem Betonboden"],
    "Pasillo de una instalación logística": ["Aisle in a logistics facility", "Gang in einer Logistikanlage"],
    "Pavimento tratado en el proyecto L’Oréal": ["Treated floor at the L’Oréal project", "Behandelter Boden im Projekt L’Oréal"],
    "Maquinaria de tratamiento de pavimentos": ["Floor-treatment machinery", "Maschinen zur Bodenbearbeitung"],
    "Vista de un pavimento rehabilitado": ["View of a refurbished floor", "Ansicht eines sanierten Bodens"],
    "Pavimento de Delticom tras el tratamiento": ["Delticom floor after treatment", "Delticom-Boden nach der Behandlung"],
    "Pavimento pulido en la intervención de Hologram Bâtiment": ["Polished floor at the Hologram Bâtiment project", "Polierter Boden im Projekt Hologram Bâtiment"],
    "Vista general del pavimento intervenido en TP-Link": ["Overall view of the treated TP-Link floor", "Gesamtansicht des bearbeiteten TP-Link-Bodens"],
    "Resultado del tratamiento del pavimento de L’Oréal": ["Result of the L’Oréal floor treatment", "Ergebnis der Bodenbehandlung bei L’Oréal"],
    "Pasillo logístico de Blitz tras la intervención": ["Blitz logistics aisle after the intervention", "Logistikgang bei Blitz nach der Maßnahme"],
  };

  // Stable keys for maintained copy. Legacy exact-text entries migrate as edited.
  const keyedMessages = {
    "contact.intro": ["Describe el estado del pavimento y el uso de tu instalación para que podamos valorar tu consulta.", "Describe the floor condition and how your facility operates so we can assess your enquiry.", "Beschreiben Sie den Zustand des Bodens und die Nutzung Ihrer Anlage, damit wir Ihre Anfrage bewerten können."],
    "contact.required.name": ["Indica tu nombre.","Enter your name.","Geben Sie Ihren Namen an."],
    "contact.required.contact": ["Indica un correo electrónico o un teléfono.","Enter an email address or phone number.","Geben Sie eine E-Mail-Adresse oder Telefonnummer an."],
    "contact.required.message": ["Describe qué necesita tu pavimento.","Describe what your floor needs.","Beschreiben Sie, was Ihr Boden braucht."],
    "contact.required.field": ["Completa este campo.","Complete this field.","Füllen Sie dieses Feld aus."],
    "contact.invalidContact": ["Introduce un correo válido o un teléfono con prefijo si es internacional.","Enter a valid email address or a phone number with country code if international.","Geben Sie eine gültige E-Mail-Adresse oder bei internationalen Nummern eine Telefonnummer mit Ländervorwahl ein."],
    "contact.review": ["Revisa los campos indicados. La consulta todavía no se ha preparado.","Review the indicated fields. The enquiry has not been prepared yet.","Prüfen Sie die markierten Felder. Die Anfrage wurde noch nicht vorbereitet."],
    "contact.unconfigured": ["La consulta está validada, pero el canal de recepción aún no está configurado.","The enquiry is valid, but the receiving channel is not configured yet.","Die Anfrage ist gültig, aber der Empfangskanal ist noch nicht eingerichtet."],
    "contact.prepared": ["Consulta preparada. Revisa el contenido y decide si quieres enviarla.","Enquiry prepared. Review the content and decide whether you want to send it.","Anfrage vorbereitet. Prüfen Sie den Inhalt und entscheiden Sie, ob Sie sie senden möchten."],
    "contact.open": ["Abrir borrador de correo","Open email draft","E-Mail-Entwurf öffnen"],
    "contact.confirmation": ["Se abrirá tu aplicación de correo. El envío requiere tu confirmación.","Your email application will open. Sending requires your confirmation.","Ihre E-Mail-Anwendung wird geöffnet. Der Versand erfordert Ihre Bestätigung."],
    "contact.cleared": ["Selección eliminada. El texto de tu consulta se conserva.","Selection cleared. Your enquiry text has been kept.","Auswahl entfernt. Der Text Ihrer Anfrage bleibt erhalten."],
    "contact.prompt.logistica": ["Describe juntas, fisuras o desgaste en zonas de carga y paso de carretillas.","Describe joints, cracks or wear in loading areas and forklift routes.","Beschreiben Sie Fugen, Risse oder Verschleiß in Ladebereichen und auf Staplerwegen."],
    "contact.prompt.industria": ["Describe el daño y el uso de la zona: maquinaria, circulación o almacenamiento.","Describe the damage and how the area is used: machinery, traffic or storage.","Beschreiben Sie den Schaden und die Nutzung des Bereichs: Maschinen, Verkehr oder Lagerung."],
    "contact.prompt.automocion": ["Describe el estado del suelo en la zona de trabajo o paso de vehículos.","Describe the floor condition in the work area or vehicle routes.","Beschreiben Sie den Bodenzustand im Arbeitsbereich oder auf Fahrzeugwegen."],
    "contact.prompt.distribucion": ["Describe el daño en pasillos, zonas de reposición o carga de mercancías.","Describe the damage in aisles, replenishment areas or goods loading zones.","Beschreiben Sie den Schaden in Gängen, Nachschubbereichen oder Warenladezonen."],
    "contact.prompt.alimentacion": ["Describe el daño y si la zona está expuesta a humedad o limpieza frecuente.","Describe the damage and whether the area is exposed to moisture or frequent cleaning.","Beschreiben Sie den Schaden und ob der Bereich Feuchtigkeit oder häufiger Reinigung ausgesetzt ist."],
    "contact.prompt.aparcamientos": ["Describe daños en plazas, rampas o zonas de circulación.","Describe damage to parking spaces, ramps or traffic lanes.","Beschreiben Sie Schäden an Stellplätzen, Rampen oder Fahrspuren."],
    "contact.prompt.repair": ["Cuéntanos qué observas, en qué zona ocurre y cómo se utiliza ese espacio.","Tell us what you observe, where it occurs and how that space is used.","Schildern Sie, was Sie beobachten, wo es auftritt und wie dieser Bereich genutzt wird."],
    "contact.subject": ["Consulta sobre pavimento","Floor enquiry","Bodenanfrage"],
    "contact.nameLabel": ["Nombre: ","Name: ","Name: "],
    "contact.contactLabel": ["Contacto: ","Contact: ","Kontakt: "],
    "contact.maxLength": ["Utiliza como máximo {count} caracteres.","Use no more than {count} characters.","Verwenden Sie höchstens {count} Zeichen ein."],
    "contact.minLength": ["Escribe al menos {count} caracteres.","Enter at least {count} characters.","Geben Sie mindestens {count} Zeichen ein."],
    "contact.sector": ["Sector: {name}.","Sector: {name}.","Branche: {name}."],
    "contact.need": ["Necesidad: {name}.","Need: {name}.","Bedarf: {name}."],
    "hero.title": ["Recuperamos tus pavimentos.", ...messages["Recuperamos tus pavimentos."]],
    "hero.subtitle": ["Cuidamos tu actividad.", ...messages["Cuidamos tu actividad."]],
    "nav.solutions": ["Soluciones", ...messages["Soluciones"]],
    "nav.projects": ["Proyectos", ...messages["Proyectos"]],
    "nav.sectors": ["Sectores", ...messages["Sectores"]],
    "nav.contact": ["Contacto", ...messages["Contacto"]],
    "meta.title": ["Obraxen · Reparación de pavimentos industriales", ...messages["Obraxen · Reparación de pavimentos industriales"]],
    "meta.description": ["Reparación y rehabilitación de pavimentos industriales: juntas, fisuras, pulido, nivelación y preparación del soporte.", ...messages["Reparación y rehabilitación de pavimentos industriales: juntas, fisuras, pulido, nivelación y preparación del soporte."]],
  };
  // Keep exact-text compatibility while keyed messages become the maintained source.
  Object.values(keyedMessages).forEach(values => { messages[values[0]] = values.slice(1); });
  const rendered = new Set(Object.values(messages).map(values => values[index]?.trim()).filter(Boolean));
  const remember = value => { if (index >= 0 && typeof value === "string") rendered.add(value.trim()); return value; };
  const message = (key, params = {}) => {
    const value = keyedMessages[key]?.[index + 1];
    if (typeof value !== "string" || !value) throw new Error("Missing Home translation: " + key + " (" + locale + ")");
    return remember(value.replace(/\{(\w+)\}/g, (_, name) => {
      if (!Object.hasOwn(params, name) || !["string", "number"].includes(typeof params[name])) {
        throw new Error("Missing Home parameter: " + key + "." + name);
      }
      return String(params[name]);
    }));
  };
  const missing = new Set();
  // Names and identifiers deliberately remain unchanged across languages.
  const invariantText = new Set([
    "OBRAXEN", "Obraxen", "ES", "© 2026 Obraxen", "Español",
    "OBRAXEN SURFACE S.L.", "B93963841", "Calle Federico García Lorca, 22",
    "info@obraxen.com", "obraxen.com", "Blitz", "Delticom", "Hologram Bâtiment", "L’Oréal", "TP-Link",
  ]);
  const prefixed = [
      ["Desplazamiento de ", ["Scroll position for ", "Scrollposition für "]],
      ["Ver proyecto: ", ["View project: ", "Projekt ansehen: "]],
      ["Ver sector: ", ["View sector: ", "Branche ansehen: "]],
  ];
  const t = (value) => {
    if (index < 0 || typeof value !== "string") return value;
    if (messages[value]) return remember(messages[value][index]);
    for (const [prefix, translations] of prefixed) {
      if (value.startsWith(prefix)) return remember(translations[index] + t(value.slice(prefix.length)));
    }
    const position = /^(\d+(?:[–-]\d+)?) de (\d+)$/.exec(value);
    if (position) return remember(index === 0 ? `${position[1]} of ${position[2]}` : `${position[1]} von ${position[2]}`);
    return value;
  };
  const auditTranslation = (value) => {
    if (typeof value !== "string" || !value.trim() || !/\p{L}/u.test(value)) return;
    for (const [prefix] of prefixed) {
      if (value.startsWith(prefix)) auditTranslation(value.slice(prefix.length));
    }
    if (!rendered.has(value.trim()) && t(value) === value && !invariantText.has(value.trim())) missing.add(value);
  };
  window.obraxenI18n = {
    locale, message,
    translate(value) { if (index >= 0) auditTranslation(value); return t(value); },
    get missingTranslations() { return [...missing].sort(); },
  };

  const translateTextNode = (node, audit = false) => {
    if (node.parentElement?.closest("script,style,noscript")) return;
    const value = node.nodeValue;
    const trimmed = value?.trim();
    if (!trimmed) return;
    const key = node.parentElement?.getAttribute("data-i18n");
    if (audit && !key) auditTranslation(trimmed);
    const translated = key && index >= 0 ? message(key) : t(trimmed);
    if (translated !== trimmed) node.nodeValue = value.replace(trimmed, translated);
  };
  const translateElement = (element, audit = false) => {
    ["alt", "title", "aria-label", "placeholder", "data-repair"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const value = element.getAttribute(attribute);
      if (audit) auditTranslation(value);
      const translated = t(value);
      if (translated !== value) element.setAttribute(attribute, translated);
    });
  };
  const translateTree = (root, audit = false) => {
    if (root.nodeType === Node.TEXT_NODE) translateTextNode(root, audit);
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateElement(root, audit);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(node => translateTextNode(node, audit));
    if (root.querySelectorAll) root.querySelectorAll("[alt],[title],[aria-label],[placeholder],[data-repair]").forEach(element => translateElement(element, audit));
  };
  const updateMetadata = () => {
    // The canonical HTML owns Spanish copy, including editorial changes.
    if (index < 0) return;
    document.documentElement.lang = locale;
    document.title = message("meta.title");
    document.querySelector('meta[name="description"]')?.setAttribute("content", message("meta.description"));
  };
  const installLanguageSwitcher = () => {
    const indicator = document.querySelector("header .language");
    if (!indicator) return;
    const nav = document.createElement("nav");
    nav.className = "language language-switcher";
    nav.setAttribute("aria-label", t("Idioma"));
    [
      ["es", "ES", "Español"],
      ["en", "EN", "English"],
      ["de", "DE", "Deutsch"],
    ].forEach(([code, label, name]) => {
      const link = document.createElement("a");
      link.href = code === "es" ? `/${location.hash}` : `/${code}/${location.hash}`;
      link.lang = code;
      link.textContent = label;
      link.title = name;
      link.setAttribute("aria-label", `${t("Cambiar idioma a")} ${name}`);
      if (code === locale) link.setAttribute("aria-current", "page");
      nav.append(link);
    });
    indicator.replaceWith(nav);
  };

  updateMetadata();
  translateTree(document.body, index >= 0);
  installLanguageSwitcher();
  if (index >= 0) {
    const observer = new MutationObserver((records) => {
      observer.disconnect();
      records.forEach((record) => {
        if (record.type === "characterData") translateTextNode(record.target, true);
        if (record.type === "attributes") translateElement(record.target, true);
        record.addedNodes.forEach(node => translateTree(node, true));
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["alt", "title", "aria-label", "placeholder", "data-repair"] });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["alt", "title", "aria-label", "placeholder", "data-repair"] });
  }
})();
