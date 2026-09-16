"use client";

import { useState } from "react";

export default function VolumeCalculator() {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [destination, setDestination] = useState<string>("DOUALA");

  const volume =
    Number(length) > 0 &&
    Number(width) > 0 &&
    Number(height) > 0
      ? (Number(length) * Number(width) * Number(height)) / 1_000_000
      : 0;

  const price =
    volume > 0
      ? destination === "YAOUNDE"
        ? volume * 600 * 1.1
        : volume * 600
      : 0;

  return (
    <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* En-tête */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Dimensions de votre colis
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Indiquez les dimensions en centimètres.
        </p>
      </div>

      {/* Grille des champs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Longueur */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Longueur
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.1"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="L"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              cm
            </span>
          </div>
        </div>

        {/* Largeur */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Largeur
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.1"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="l"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              cm
            </span>
          </div>
        </div>

        {/* Hauteur */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Hauteur
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="H"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              cm
            </span>
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Destination
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          >
            <option value="DOUALA" >
              Douala
            </option>
            <option value="YAOUNDE" >
              Yaoundé
            </option>
          </select>
        </div>
      </div>

      {/* Résultats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Volume estimé</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {volume.toFixed(3)} m³
          </p>
        </div>

        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-sm text-orange-700">Prix estimé</p>
          <p className="mt-1 text-2xl font-bold text-orange-900">
            {price.toFixed(2)} €
          </p>
        </div>
      </div>
    </div>
  );
}