"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, Camera, X } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  trigger?: React.ReactNode
  title?: string
  description?: string
}

export default function QRScanner({ onScan, trigger, title = "Scanner QR Code", description = "Scannez un QR code pour ajouter des données" }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startScanning = async () => {
    try {
      setError("")
      setIsScanning(true)

      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Caméra arrière pour mobile
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (err: any) {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.")
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const handleClose = () => {
    stopScanning()
    setIsOpen(false)
    setError("")
  }

  // Simulation de scan QR (en attendant une vraie librairie)
  const simulateQRScan = () => {
    const sampleData = {
      type: "colis",
      reference: `QR${Date.now()}`,
      description: "Article scanné via QR code",
      client: "Client QR",
      weight: "1.5kg",
      dimensions: "30x20x15cm",
      value: "150€"
    }
    
    onScan(JSON.stringify(sampleData))
    handleClose()
  }

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Scanner QR
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0 transition-all duration-300 ease-in-out">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <QrCode className="h-5 w-5" />
            {title}
          </DialogTitle>
          <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Zone de scan */}
          <div className="relative bg-gray-100 rounded-lg aspect-square flex items-center justify-center min-h-[200px] sm:min-h-[300px]">
            {isScanning ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center p-4">
                <Camera className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-500">Caméra prête</p>
              </div>
            )}
            
            {/* Overlay de scan */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-orange-500 rounded-lg animate-pulse">
                  <div className="absolute top-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-l-2 border-orange-500"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-r-2 border-orange-500"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-l-2 border-orange-500"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-r-2 border-orange-500"></div>
                </div>
              </div>
            )}
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm animate-in fade-in-0 slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {!isScanning ? (
              <Button onClick={startScanning} className="flex-1 flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-1">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Démarrer le scan</span>
                <span className="sm:hidden">Démarrer</span>
              </Button>
            ) : (
              <>
                <Button onClick={stopScanning} variant="outline" className="flex-1 flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-1">
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Arrêter</span>
                  <span className="sm:hidden">Arrêter</span>
                </Button>
                <Button onClick={simulateQRScan} className="flex-1 flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-1">
                  <QrCode className="h-4 w-4" />
                  <span className="hidden sm:inline">Simuler scan</span>
                  <span className="sm:hidden">Simuler</span>
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs sm:text-sm text-muted-foreground text-center space-y-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <p>• Pointez la caméra vers un QR code</p>
            <p>• Le scan se fera automatiquement</p>
            <p>• Utilisez "Simuler scan" pour tester</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
