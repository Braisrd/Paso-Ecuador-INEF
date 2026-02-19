# MEMORIA DEL PROYECTO: Landing Page y Arena de Torneos eSports

## 1. Guías de Diseño y UX (Audiencia Gen Z)

* **Filosofía Mobile-First:** El diseño debe estar optimizado para pantallas móviles, con layouts verticales pensados para la navegación con el pulgar y que imiten la interacción de una app móvil [3, 6, 7].
* **Estética Visual:** Emplear la tendencia del "Neo-Brutalismo" (colores vibrantes y contrastantes, bordes marcados, tipografía grande y nostálgica estilo años 90) combinada con "Smart Simplicity" para no saturar al usuario [8, 9].
* **Interactividad y Dinamismo:** Evitar muros de texto. Integrar micro-interacciones al hacer scroll o hover, usar fondos oscuros (Dark Mode) y considerar videos cortos en bucle en la sección Hero [10-12].
* **Accesibilidad y Rendimiento:** La web debe cargar en menos de 2 segundos. Cumplimiento estricto de WCAG 2.2 Nivel AA (contraste de colores adecuado mínimo de 4.5:1 para el texto, etiquetas en formularios) [3, 13, 14].

## 2. Requisitos de SEO y Visibilidad 2025

* **Optimización para IA (AEO):** Estructurar el contenido para responder preguntas directas y usar lenguaje conversacional, de modo que herramientas como ChatGPT Search o Google AI Overviews puedan citar la página [15-17].
* **Datos Estructurados (Schema Markup):** Implementar código JSON-LD de tipo "Event" (Evento) y "Organization" para que los buscadores entiendan los horarios, fechas y detalles de los torneos [18, 19].
* **Core Web Vitals:** Asegurar puntuaciones altas en LCP (carga rápida), FID (interactividad) y CLS (estabilidad visual sin saltos en la pantalla) [5, 20].
* **Jerarquía de Contenido:** Uso correcto de etiquetas H1 (solo una por página), H2 y H3, junto con metadescripciones claras de no más de 120 caracteres orientadas al CTR [18, 21].

## 3. Lógica Funcional: Torneos y "Arena de Equipos"

* **Flujo de Registro Inteligente:** Formularios por pasos y con lógica condicional. Se debe preguntar al inicio si el usuario es un "Agente Libre" (jugador en solitario) o un "Capitán de Equipo" [22, 23].
  * **Agentes Libres:** Recopilar datos de rol preferido, nivel de habilidad y disponibilidad [4].
  * **Equipos:** Recopilar nombre del equipo, logo y registro de los integrantes (roster) [4].
* **Estructura de Competición:** El sistema debe prever la lógica para generar brackets (cuadros de eliminatoria simple o doble) y formatos de liguilla (round-robin) [4, 24].
* **Gestión de Datos (Firebase):** Crear un esquema que permita actualizar resultados en tiempo real y calcular tablas de clasificación (standings) automáticamente [4].
