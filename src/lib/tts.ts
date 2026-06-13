export const speakText = (text: string, isKrio = false) => {
  if (!("speechSynthesis" in window)) {
    console.warn("Web Speech API not supported in this browser.")
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = isKrio ? 0.85 : 0.95
  utterance.pitch = 1.05
  const voices = window.speechSynthesis.getVoices()
  const englishVoice = voices.find(v => v.lang.startsWith("en-"))
  if (englishVoice) utterance.voice = englishVoice
  window.speechSynthesis.speak(utterance)
}
