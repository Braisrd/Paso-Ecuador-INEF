# 🔔 Guía Maestra de Notificaciones (v2)

## 🔄 ¿Cómo se actualiza la App?

La aplicación es una PWA moderna. Se actualiza sola, pero a veces necesita un empujoncito.

* **Usuario Nuevo**: Al entrar, ve la ultimísima versión.
* **Usuario Recurrente**: La app intenta actualizarse en segundo plano. La forma más rápida de forzar la actualización es **cerrar completamente la app (quitarla de la multitarea)** y volver a abrirla.
* *Nota*: Hemos cambiado el fondo de carga a azul celeste. Si sigues viendo el negro, cierra y abre un par de veces.

---

## 📲 Notificaciones Push: Guía Definitiva

### Diferencia: "Prueba" vs "Campaña"

Firebase tiene dos formas de enviar:

1. **Mensaje de Prueba (Test)**: Solo para TI. Para comprobar que funciona.
    * **Requiere**: "Token de registro FCM".
    * *¿Dónde lo saco?*: He añadido un botón en **Panel Admin > Buzón** que dice "Obtener Token". Lo copias, lo pegas en Firebase y te llega solo a ti.

2. **Campaña (A todos)**: Para TODOS los usuarios.
    * **NO requiere token**.
    * Pasos:
        1. Nueva campaña > Notificaciones.
        2. Título y Texto.
        3. **Segmentación del dispositivo (Target)**: Selecciona la opción que dice **"Aplicación web"** (Suele poner un código como `web:a86...`).
        4. Programación: "Ahora".
        5. Publicar.

---

## 🚀 Resumen del Proceso (El "Método YouTube")

Para enviar un aviso a toda la liga:

1. **Panel Admin > Buzón**: Escribe el mensaje y dale a "Publicar".
    * *(Esto pone el punto rojo en la app)*
2. **Firebase Console > Campaña**: Copia el mismo mensaje, elige "Aplicación web" en Target y envíalo.
    * *(Esto hace vibrar los móviles)*

---

### FAQ

* **¿Token FCM?**: Solo para pruebas. No te rayes con esto para mensajes normales.
* **¿Se borran?**: Sí, el buzón guarda las últimas 20. O las borras tú con la papelera 🗑️.
