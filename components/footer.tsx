import Image from "next/image"

export default function Footer() {
  return (
    <footer className="relative bg-gray-900 text-white py-12">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image src="/images/services-commerce.webp" alt="Port background" fill className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-black bg-opacity-70"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center">
          <p className="text-sm">© 2025 Danemo Srl. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
