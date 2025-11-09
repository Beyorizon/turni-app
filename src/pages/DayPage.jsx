// DayPage.jsx — Mostra 3 sezioni: Turno A, B, C per il giorno selezionato
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import TurnTable from "../components/TurnTable";

export default function DayPage() {
  const { giorno } = useParams(); // es. "Lunedì"
  const [activeTab, setActiveTab] = useState("A");

  // Nome del giorno in forma leggibile
  const dayName = decodeURIComponent(giorno);

  // Niente conversioni a data
  const title = dayName;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex flex-col items-center px-4 pb-24">
      {/* Header sticky con dayName */}
      <div className="sticky top-0 backdrop-blur-[10px] bg-white/60 py-2 z-50 w-full text-center font-semibold text-[18px] text-gray-800">
        {title}
      </div>

      {/* Bottoni Turno scrollabili orizzontali */}
      <div className="w-full overflow-x-auto px-2 py-2">
        <div className="flex gap-3">
          {["A", "B", "C"].map((turn) => (
            <button
              key={turn}
              onClick={() => setActiveTab(turn)}
              className={`px-6 py-2 rounded-full text-sm font-medium shadow-md transition whitespace-nowrap ${
                activeTab === turn
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white/50 text-gray-600 hover:bg-white"
              }`}
            >
              Turno {turn}
            </button>
          ))}
        </div>
      </div>

      {/* Card TurnTable centrata e responsiva */}
      <div className="w-full max-w-[380px] mx-auto mt-4 mb-10">
        <TurnTable turno={activeTab} dayName={dayName} />
      </div>
    </main>
  );
}