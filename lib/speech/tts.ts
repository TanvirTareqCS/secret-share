export const speakText = (textToSpeak: string) => {
  if (!("speechSynthesis" in window)) {
    alert("Text-to-speech is not supported in this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  const cleanText = textToSpeak.replace(/'''/g, ''); 
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
};