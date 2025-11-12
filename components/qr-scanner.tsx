"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, Camera, X, RotateCcw } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

interface QRScannerProps {
  onScan: (data: string) => void
  trigger?: React.ReactNode
  title?: string
  description?: string
  keepOpenAfterScan?: boolean
}

export default function QRScanner({ 
  onScan, 
  trigger, 
  title = "Scanner QR Code", 
  description = "Scannez un QR code pour ajouter des données",
  keepOpenAfterScan = false
}: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scanAreaRef = useRef<HTMLDivElement>(null)
  const scannerIdRef = useRef(`qr-reader-${Math.random().toString(36).substring(7)}`)

  const startScanning = async () => {
    try {
      setError("")
      setIsScanning(true)
      setLastScanned(null)

      const scannerId = scannerIdRef.current
      
      // Créer une instance du scanner si elle n'existe pas
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId)
      }

      const scanner = scannerRef.current

      // Démarrer le scan
      await scanner.start(
        { facingMode: "environment" }, // Caméra arrière pour mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Scan réussi
          setLastScanned(decodedText)
          onScan(decodedText)
          
          // Si keepOpenAfterScan est false, fermer après le scan
          if (!keepOpenAfterScan) {
            await stopScanning()
            setIsOpen(false)
          } else {
            // Sinon, arrêter temporairement le scan pour permettre de rescanner
            await stopScanning()
          }
        },
        (errorMessage) => {
          // Ignorer les erreurs de scan (c'est normal pendant la recherche)
        }
      )
    } catch (err: any) {
      console.error("Erreur lors du scan:", err)
      setError(err.message || "Impossible d'accéder à la caméra. Vérifiez les permissions.")
      setIsScanning(false)
    }
  }

  const stopScanning = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop()
      }
      if (scannerRef.current) {
        await scannerRef.current.clear()
      }
    } catch (err) {
      console.error("Erreur lors de l'arrêt du scan:", err)
    }
    setIsScanning(false)
  }

  const handleRescan = async () => {
    setLastScanned(null)
    setError("")
    // S'assurer que le scanner est arrêté avant de redémarrer
    if (scannerRef.current && scannerRef.current.isScanning) {
      await stopScanning()
    }
    // Attendre un peu pour que le scanner soit complètement arrêté
    setTimeout(() => {
      startScanning()
    }, 100)
  }

  const handleClose = async () => {
    await stopScanning()
    setIsOpen(false)
    setError("")
    setLastScanned(null)
  }

  // Réinitialiser l'état quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen && !isScanning && !lastScanned) {
      // Le dialog vient de s'ouvrir, réinitialiser l'état
      setError("")
    }
  }, [isOpen])

  // Nettoyer lors du démontage
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear()
        })
      }
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose()
      } else {
        setIsOpen(true)
      }
    }}>
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
          <div className="relative bg-gray-100 rounded-lg aspect-square flex items-center justify-center min-h-[200px] sm:min-h-[300px] overflow-hidden">
            <div 
              id={scannerIdRef.current}
              ref={scanAreaRef}
              className="w-full h-full"
            />
            
            {!isScanning && !lastScanned && (
              <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                <div>
                  <Camera className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-gray-500">Cliquez sur "Démarrer le scan" pour commencer</p>
                </div>
              </div>
            )}

            {/* Message de scan réussi */}
            {lastScanned && !isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-50/90 backdrop-blur-sm rounded-lg">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <QrCode className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-green-700 mb-1">QR code scanné avec succès!</p>
                  <p className="text-xs text-green-600 break-all px-2">{lastScanned.substring(0, 50)}{lastScanned.length > 50 ? '...' : ''}</p>
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
            {!isScanning && !lastScanned ? (
              <Button onClick={startScanning} className="flex-1 flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-1">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Démarrer le scan</span>
                <span className="sm:hidden">Démarrer</span>
              </Button>
            ) : isScanning ? (
              <Button onClick={stopScanning} variant="outline" className="flex-1 flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-1">
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Arrêter</span>
                <span className="sm:hidden">Arrêter</span>
              </Button>
            ) : (
              <>
                {keepOpenAfterScan && (
                  <Button onClick={handleRescan} className="flex-1 flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-1">
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Rescanner</span>
                    <span className="sm:hidden">Rescanner</span>
                  </Button>
                )}
                <Button onClick={handleClose} variant="outline" className="flex-1 flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-1">
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Fermer</span>
                  <span className="sm:hidden">Fermer</span>
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs sm:text-sm text-muted-foreground text-center space-y-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <p>• Pointez la caméra vers un QR code</p>
            <p>• Le scan se fera automatiquement</p>
            {keepOpenAfterScan && <p>• Vous pouvez rescanner une autre commande après un scan réussi</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
