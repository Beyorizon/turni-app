import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Listbox } from "@headlessui/react";

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

      {/* Layout colonna centrata, righe compatte e responsive */}
      <div className="flex flex-col items-center w-full">
        {roles.map((role) => {
          const selectedWorkerId = assignments[role.id] || "";
          const selectedWorker = workers.find((w) => w.id === selectedWorkerId);
          const selectedLabel = selectedWorker?.name || "-- Seleziona --";

          return (
            <div
              key={role.id}
              className="w-full max-w-[340px] mb-2 flex items-center justify-between gap-3"
            >
              <span className="font-medium text-slate-700 text-sm w-1/3 min-w-[80px] whitespace-nowrap">
                {role.code}
              </span>

              <Listbox
                value={selectedWorkerId}
                onChange={(val) => handleChange(role.id, val)}
              >
                <div className="relative w-2/3">
                  <Listbox.Button
                    className="
                      w-full h-8 rounded-xl border border-slate-200 p-1 text-sm
                      text-slate-900 bg-white hover:shadow-sm transition duration-200
                      focus:ring-2 focus:ring-blue-500 focus:outline-none
                    "
                  >
                    {selectedLabel}
                  </Listbox.Button>

                  <Listbox.Options
                    className="
                      absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl
                      bg-white shadow-lg border border-slate-200 focus:outline-none
                    "
                  >
                    {workers.map((worker) => {
                      const isAlreadySelected = Object.values(assignments).includes(worker.id);
                      const isCurrentSelection = assignments[role.id] === worker.id;
                      const isAssigned = isAlreadySelected && !isCurrentSelection;

                      return (
                        <Listbox.Option
                          key={worker.id}
                          value={worker.id}
                          disabled={isAssigned}
                          className={({ active, disabled }) =>
                            `
                              cursor-pointer select-none px-3 py-2 text-sm
                              ${active ? "bg-blue-50" : ""}
                              ${isAssigned ? "text-red-600" : "text-slate-900"}
                              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                            `
                          }
                        >
                          {worker.name}
                        </Listbox.Option>
                      );
                    })}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          );
        })}
      </div>
    </div>
  );
}
