import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function TurnTable({ turno, dayName }) {
  const [assignments, setAssignments] = useState({});
  const [roles, setRoles] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [message, setMessage] = useState("");

  // Carica ruoli e lavoratori al mount
  useEffect(() => {
    const fetchData = async () => {
      const { data: rolesData } = await supabase.from("roles").select("*").order("id");

      // Filtra i lavoratori in base al turno attivo (A/B/C)
      const { data: workersData } = await supabase
        .from("workers")
        .select("*")
        .eq("shift_group", turno)
        .order("id");

      setRoles(rolesData || []);
      setWorkers(workersData || []);
    };
    fetchData();
  }, [turno]);

  // Carica assegnazioni per turno e giorno
  useEffect(() => {
    const loadAssignments = async () => {
      if (!dayName || !turno) return;

      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("day", dayName)
        .eq("type", turno);

      if (error) console.error("Errore caricamento turni:", error);

      if (data && data.length > 0) {
        const map = {};
        data.forEach((row) => {
          map[row.role_id] = row.worker_id;
        });
        setAssignments(map);
      } else {
        setAssignments({});
      }
    };

    loadAssignments();
  }, [dayName, turno]);

  // Salvataggio su Supabase
  const handleChange = async (roleId, workerId) => {
    // Evita doppie assegnazioni nello stesso turno
    const alreadyAssigned = Object.entries(assignments).find(
      ([rId, wId]) => wId === workerId && rId !== roleId
    );

    if (alreadyAssigned) {
      alert("Questo lavoratore è già assegnato ad un altro ruolo in questo turno.");
      return;
    }

    setAssignments((prev) => ({ ...prev, [roleId]: workerId }));

    const { error } = await supabase
      .from("shifts")
      .upsert(
        {
          day: dayName,
          type: turno,
          role_id: roleId,
          worker_id: workerId,
        },
        { onConflict: "day,type,role_id" }
      );

    if (!error) {
      setMessage("✅ Salvato");
      setTimeout(() => setMessage(""), 1000);
    } else {
      console.error("Errore nel salvataggio:", error);
      setMessage("❌ Errore nel salvataggio");
    }
  };

  return (
    <div className="w-full max-w-[380px] mx-auto mt-4 mb-10 p-4 rounded-3xl bg-white/70 backdrop-blur-lg shadow-md border border-white/20">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Turno {turno}</h2>

      {message && (
        <div className="text-center text-sm text-green-600 font-medium mb-3 transition-opacity">
          {message}
        </div>
      )}

      {/* Layout a colonna centrata, blocchi compatti e responsivi */}
      <div className="flex flex-col items-center w-full">
        {roles.map((role) => (
          <div
            key={role.id}
            className="
              w-full max-w-[340px] mx-auto mb-3
              bg-white/60 backdrop-blur-lg rounded-2xl shadow-sm border border-white/20
              p-2 transition hover:shadow-md
              flex flex-col min-[450px]:flex-row min-[450px]:items-center min-[450px]:justify-between
            "
          >
            <span className="font-bold text-sm text-[#1E293B] text-left mb-2 min-[450px]:mb-0">
              {role.code}
            </span>
            <select
              className="
                w-full min-[450px]:w-[58%]
                text-sm h-8 rounded-[10px] px-2 py-1
                border border-gray-300 bg-white
                text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none
                hover:shadow-sm transition duration-200
              "
              value={assignments[role.id] || ""}
              onChange={(e) => handleChange(role.id, e.target.value)}
            >
              <option value="">-- Seleziona --</option>
              {workers.map((worker) => {
                const isAlreadySelected = Object.values(assignments).includes(worker.id);
                const isCurrentSelection = assignments[role.id] === worker.id;
                const isAssigned = isAlreadySelected && !isCurrentSelection;
                return (
                  <option
                    key={worker.id}
                    value={worker.id}
                    disabled={isAlreadySelected && !isCurrentSelection}
                    className={`${isAssigned ? 'text-red-600' : 'text-slate-900'}`}
                  >
                    {worker.name}
                  </option>
                );
              })}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
