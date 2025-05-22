// Prefijo que se usará como palabra clave para activar comandos
const ordenPrefijo = "CARRO";

// Espera a que el contenido del DOM esté completamente cargado antes de ejecutar el script
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const outputText = document.getElementById("outputText");
  const msgText = document.getElementById("msgText");

  outputText.innerHTML = `Di ${ordenPrefijo} para dar una orden`;

  let recognition;
  let stoppedManually = false;

  // Verificar compatibilidad del navegador
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "es-ES";
  } else {
    alert("Tu navegador no soporta reconocimiento de voz.");
    return;
  }

  // Evento para iniciar el reconocimiento al hacer doble clic
  startBtn.addEventListener("dblclick", () => {
    stoppedManually = false;
    recognition.start();
    startBtn.disabled = true;
    outputText.textContent = `Escuchando... Di ${ordenPrefijo} para interactuar.`;
    msgText.innerHTML = "";
  });

  // Manejar resultados de reconocimiento de voz
  recognition.onresult = (event) => {
    let transcript = event.results[event.results.length - 1][0].transcript.trim().toUpperCase();
    console.log("Texto reconocido:", transcript);

    if (transcript.includes(ordenPrefijo + " DETENTE")) {
      stoppedManually = true;
      recognition.stop();
      startBtn.disabled = false;
      outputText.textContent = "Detenido. Haz doble clic en el botón para iniciar nuevamente.";
      msgText.innerHTML = "";
    } else if (transcript.includes(ordenPrefijo)) {
      outputText.innerHTML = `Mensaje detectado: "<strong><em>${transcript}</em></strong>"`;
      msgText.innerHTML = "Consultando al asistente...";

      // Enviar el mensaje al servidor PHP
      fetch("http://34.236.237.105/iot/api-gpt-php/endpoints/chat.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: transcript }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Respuesta de la API:", data);
          if (data && data.data && data.data.reply) {
            msgText.innerHTML = `Respuesta: <strong>${data.data.reply.trim()}</strong>`;
          } else {
            msgText.innerHTML = "No se recibió respuesta del servidor.";
          }
        })
        .catch((error) => {
          console.error("Error al conectar con el servidor:", error);
          msgText.innerHTML = "Error al comunicarse con la API.";
        });
    }
  };

  // Manejo de errores
  recognition.onerror = (event) => {
    console.error("Error en el reconocimiento:", event.error);
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      alert("Permiso de micrófono denegado o bloqueado.");
    } else if (event.error === "network") {
      alert("Problema de conexión a internet.");
    }
    recognition.stop();
    startBtn.disabled = false;
  };

  // Si se detiene inesperadamente, reinicia
  recognition.onend = () => {
    if (!stoppedManually) {
      msgText.innerHTML = "El reconocimiento se detuvo inesperadamente.<br>Hablando nuevamente...";
      recognition.start();
    }
  };
});
