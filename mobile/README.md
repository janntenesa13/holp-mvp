# HOLP Mobile — Fase 2

Aplicació nativa React Native amb Expo. Aquesta entrega permet crear tasques amb data, hora, responsable, recurrència i recordatori local; demana permís de notificacions, programa l’avís i el cancel·la quan la tasca es completa o s’elimina.

## Provar en un iPhone o Android

1. Instal·la Node.js LTS a l’ordinador.
2. Des d’aquesta carpeta, executa `npm install`.
3. Executa `npx expo start`.
4. Instal·la Expo Go al mòbil i escaneja el QR.
5. A HOLP, obre **Ajustos → Enviar notificació de prova**.

Les notificacions locals funcionen amb Expo Go. Les notificacions push remotes entre membres necessitaran una development build, un projecte EAS i un backend.

## Comportament dels recordatoris

- Es poden programar a l’hora exacta o 15, 30 o 60 minuts abans.
- Si no es concedeix permís, HOLP explica com activar-lo.
- En completar o eliminar una tasca, l’avís pendent es cancel·la.
- En tocar una notificació, HOLP obre la pantalla de tasques.
- Les tasques queden desades al dispositiu.
