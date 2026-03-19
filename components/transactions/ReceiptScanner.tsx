"use client"

import { useRef, useState } from "react"
import { Camera, Upload, X, Loader2 } from "lucide-react"

interface ReceiptData {
  merchant: string | null
  date: string | null
  total: number | null
  currency: string | null
  items: Array<{ name: string; amount: number }>
  category: string | null
  notes: string | null
}

interface ReceiptScannerProps {
  onScanComplete: (data: ReceiptData) => void
  onClose: () => void
}

export function ReceiptScanner({
  onScanComplete,
  onClose,
}: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cameraPermission, setCameraPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  async function requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      })
      stream.getTracks().forEach((track) => track.stop())
      setCameraPermission("granted")
      cameraInputRef.current?.click()
    } catch {
      setCameraPermission("denied")
    }
  }

  async function handleFile(file: File) {
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === "string") {
        setPreview(result)
      }
    }
    reader.readAsDataURL(file)

    setIsScanning(true)
    try {
      const formData = new FormData()
      formData.append("image", file)

      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? "Failed to scan receipt")
        return
      }

      onScanComplete(json.data)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsScanning(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#1A1A2E]">
          Scan Receipt
        </p>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          title="Close scanner"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {!preview && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={requestCameraPermission}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#00B9A7] hover:bg-[#E6F7F6] transition-all duration-200"
          >
            <Camera className="w-6 h-6 text-[#00B9A7]" />
            <span className="text-xs font-medium text-gray-600">
              Take Photo
            </span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#00B9A7] hover:bg-[#E6F7F6] transition-all duration-200"
          >
            <Upload className="w-6 h-6 text-[#00B9A7]" />
            <span className="text-xs font-medium text-gray-600">
              Upload Image
            </span>
          </button>
        </div>
      )}

      {cameraPermission === "denied" && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
          Camera access denied. Please allow camera permission in your browser settings, or use Upload Image instead.
        </p>
      )}

      {preview && (
        <div className="relative rounded-2xl overflow-hidden border border-gray-100">
          <img
            src={preview}
            alt="Receipt preview"
            className="w-full max-h-48 object-cover"
          />
          {isScanning && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
              <p className="text-xs text-white font-medium">
                Scanning receipt...
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
        aria-label="Upload receipt image"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
        aria-label="Take receipt photo"
      />
    </div>
  )
}
