import type { jsPDF } from "jspdf"

export async function savePdfFile(pdf: jsPDF, filename: string): Promise<void> {
  const blob = pdf.output("blob")
  const file = new File([blob], filename, { type: "application/pdf" })

  // Web Share API — works in iOS 15+ PWA and Android Chrome PWA
  // Triggers the native share sheet so user can "Save to Files" / share
  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare?.({ files: [file] })
  ) {
    await navigator.share({ files: [file], title: filename })
    return
  }

  // Desktop fallback — standard <a download> approach
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
