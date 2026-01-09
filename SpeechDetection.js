export default class SpeechDetection {
    constructor(options) {
        this.speakingThreshold = options.speakingThreshold || 5;
        this.silenceThreshold = options.silenceThreshold || 1000;
        this.onUpdate = options.onUpdate;
        
        this.audioContext = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isCurrentlySpeaking = false;
        this.silenceTimer = null;
    }

    start() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(this.handleStream.bind(this))
                .catch(this.handleError.bind(this));
        } else {
            this.handleError('getUserMedia not supported.');
        }
    }

    handleStream(stream) {
        // 1. Setup VAD Analysis 
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.microphone.connect(this.analyser);
        this.analyser.fftSize = 512;

        // 2. Setup Recording 
        this.mediaRecorder = new MediaRecorder(stream);
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
            // Create the audio file (Blob) from chunks
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            this.audioChunks = []; // Clear memory
            
            // Send Blob to main.js
            if (this.onUpdate) this.onUpdate(false, audioBlob);
        };

        // Start the Loop
        this.checkSpeaking();
    }

    checkSpeaking() {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

        // Logic: Speech Detected
        if (average > this.speakingThreshold) {
            if (!this.isCurrentlySpeaking) {
                this.isCurrentlySpeaking = true;
                
                // START RECORDING
                if (this.mediaRecorder.state === "inactive") {
                    this.mediaRecorder.start();
                    console.log("Recording started...");
                }

                this.onUpdate(true, null); 
            }
            
            if (this.silenceTimer) {
                clearTimeout(this.silenceTimer);
                this.silenceTimer = null;
            }
        } 
        // Logic: Silence Detected
        else if (this.isCurrentlySpeaking) {
            if (!this.silenceTimer) {
                this.silenceTimer = setTimeout(() => {
                    this.isCurrentlySpeaking = false;
                    
                    // STOP RECORDING
                    if (this.mediaRecorder.state === "recording") {
                        this.mediaRecorder.stop();
                        console.log("Recording stopped. Processing...");
                    }

                    this.silenceTimer = null;
                }, this.silenceThreshold);
            }
        }

        requestAnimationFrame(this.checkSpeaking.bind(this));
    }

    handleError(error) {
        console.error("Error:", error);
    }
}