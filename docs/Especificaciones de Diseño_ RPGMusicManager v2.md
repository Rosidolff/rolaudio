# **Especificaciones de Diseño: RPGMusicManager v2.0**

## **1\. Visión General y Arquitectura**

Aplicación de escritorio para gestión de audio en partidas de rol (TTRPG).

Objetivo: Gestión rápida de atmósferas mediante un sistema de capas (Música, Ambientes, SFX) filtradas por contexto temático (Frames).

### **1.1. Estructura de Interfaz (Layout)**

La aplicación reside en un panel lateral (aprox. 1/3 de pantalla).

1. **Header Global:** Selección de Frame, Volumen Maestro, Botón Pánico, Botón Añadir.  
2. **Navegación Principal:** Tres pestañas fijas (tabs) que alternan la vista central: **\[Música\] | \[Ambientes\] | \[SFX\]**.  
3. **Vista de Contenido:** Área principal que cambia según la pestaña seleccionada.

## **2\. Concepto Core: "Frames"**

Sistema de filtrado global. Todo archivo de audio debe pertenecer a un Frame específico o ser "Global".

* **Lista de Frames (Fija):**  
  * **Fantasía**  
  * **Futurista**  
  * **Grim Dark**  
* **Comportamiento:** \- Al seleccionar un Frame en el Header, solo se muestran las pistas asociadas a ese Frame \+ las pistas marcadas como "Global".  
  * Las pistas "Global" aparecen en todos los Frames.

## **3\. Módulos de Audio (Pestañas)**

### **3.1. Pestaña MÚSICA**

Organización mediante Acordeones Anidados.

Nota: Las categorías y playlists son INMUTABLES (Fixed).  
**Categorías: Acción, Cotidiano, Misterio, Terror, Exploración, Drama.**

**Estructura Fija:**

1. **Acción:** \[Combate, Persecución, Clímax, Asedio\]  
2. **Cotidiano:** \[Hoguera, Taberna, Viaje, Mercado\]  
3. **Misterio:** \[Investigación, Sigilo, Conspiración, Descubrimiento\]  
4. **Terror:** \[Misterio, Horror, Tensión, Encuentro Sobrenatural\]  
5. **Exploración:** \[Bosque, Ruinas, Mar, Desierto, Montañas\]  
6. **Drama:** \[Intriga, Ceremonia, Duelo, Revelación\]

**Funcionalidad de Reproducción:**

* **Comportamiento:** Solo suena una canción a la vez.  
* **Crossfade:** Transición suave automática (3-5s) al cambiar de pista.  
* **Ducking (Atenuación):** Si se activa un SFX ruidoso, la música baja su volumen momentáneamente (implementación básica).  
* **Controles:** Play, Pause, Loop (pista), Shuffle (lista), Scrubber (barra de tiempo), Volumen independiente.  
* **Orden:** Drag & drop para reordenar la cola de la playlist.

### **3.2. Pestaña AMBIENTES**

Pistas de sonido en bucle infinito que se superponen (Multitrack).

**Gestión de Presets (Escenas de Ambiente):**

* **Alcance:** Los presets guardan SOLO qué pistas de ambiente están activas y sus volúmenes. NO guardan música.  
* **Controles Superiores:** \- Select "Cargar Preset".  
  * Botón "Guardar configuración actual como Preset".  
  * Botón "Añadir Ambiente" (abre lista global filtrada por Frame).  
* **Lista Activa:** Muestra los ambientes sonando actualmente con slider de volumen individual y botón de mute/eliminar.

### **3.3. Pestaña SFX (Efectos de Sonido)**

Sonidos de reproducción única (One-shot).

Organización: Acordeones (múltiples pueden estar abiertos a la vez).

**Categorías Fijas:**

1. **Combate**  
2. **Social**  
3. **Entorno**  
4. **Misterio**  
5. **Magia**  
6. **Tecnología**

**Visualización:** Grid de botones con Icono \+ Nombre.

## **4\. Gestión de Archivos (Añadir Pista)**

Al importar un archivo (MP3/WAV), se abre un modal obligatorio:

1. **Archivo:** Selección local.  
2. **Nombre:** Nombre visible en la app.  
3. **Asignación de FRAME (Obligatorio):** \- \[ \] Fantasía  
   * \[ \] Futurista  
   * \[ \] Grim Dark  
   * \[ \] Global (Checkbox o Radio aparte).  
4. **Tipo de Pista (Selector):**  
   * **Música:** Seleccionar Playlists de destino (Multiselect de la lista fija del punto 3.1).  
   * **Ambiente:** Sin sub-categoría.  
   * **SFX:** Seleccionar Pack/Categoría única (de la lista fija del punto 3.3).

## **5\. Requisitos Técnicos y Persistencia**

### **5.1. Persistencia de Datos**

* **Requisito Crítico:** La base de datos NO debe depender del almacenamiento temporal del navegador (Cache/LocalStorage). Si el usuario borra la caché, los datos deben permanecer.  
* **Solución:** Arquitectura Server-side local.  
* **Tecnología:** Base de datos local en archivo (SQLite) o sistema de archivos JSON estructurado en el disco duro del usuario. PostgreSQL es viable si se opta por arquitectura cliente-servidor local.

### **5.2. Audio Engine**

* Soporte para reproducción simultánea (Music \+ X Ambientes \+ SFX).  
* Control de buses de audio independientes.

