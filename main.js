import SpeechDetection from './SpeechDetection.js';

document.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status');
    const visualIndicator = document.getElementById('visual-indicator');

    // Callback receives 'isSpeaking' AND the 'audioBlob'
    const onUpdate = (isSpeaking, audioBlob) => {
        if (isSpeaking) {
            statusDiv.textContent = 'Listening...';
            visualIndicator.classList.add('pulse');
        } else {
            visualIndicator.classList.remove('pulse');
            
            // If we have a blob, it means the user just finished a sentence
            if (audioBlob) {
                statusDiv.textContent = 'Analyzing Voice...';
                
                // Play audio locally to verify (Optional - for debugging)
                // const audioUrl = URL.createObjectURL(audioBlob);
                // new Audio(audioUrl).play();

                sendToServer(audioBlob);
            } else {
                statusDiv.textContent = 'Silence...';
            }
        }
    };

    const speechDetection = new SpeechDetection({
        speakingThreshold: 20,
        onUpdate: onUpdate
    });

    speechDetection.start();

    // The Messenger Function
    async function sendToServer(blob) {
        const formData = new FormData();
        formData.append('file', blob, 'recording.wav');

        try {
            // This will FAIL until build the backend, but the code is correct.
            const response = await fetch('http://127.0.0.1:5000/analyze', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            // Display Result
            statusDiv.innerText = `Verdict: ${data.result} (${(data.confidence * 100).toFixed(1)}%)`;
            
            // Color code the result
            visualIndicator.style.backgroundColor = data.result === "Real" ? "green" : "red";
            
        } catch (error) {
            console.error("Backend offline:", error);
            statusDiv.textContent = "Error: Backend Offline";
        }
    }
});