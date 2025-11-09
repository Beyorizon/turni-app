// Home.jsx — Griglia dei 7 giorni della settimana con DayCard
import React from "react";
import { useNavigate } from "react-router-dom";
import DayCard from "../components/DayCard";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../lib/supabaseClient";

const DAYS = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

export default function Home() {
  const navigate = useNavigate();

  const generateWeeklyPDF = async () => {
    if (!supabase) return;

    const DAYS = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
    const [{ data: roles }, { data: workers }] = await Promise.all([
      supabase.from("roles").select("id, code"),
      supabase.from("workers").select("id, name"),
    ]);

    // Carica turni per i 7 giorni (senza usare 'date'); preferisci 'day', fallback su 'day_name'
    let { data: shifts } = await supabase
      .from("shifts")
      .select("day, day_name, type, role_id, worker_id")
      .in("day", DAYS);

    if (!shifts || shifts.length === 0) {
      const res = await supabase
        .from("shifts")
        .select("day_name, type, role_id, worker_id");
      shifts = res.data || [];
    }

    const roleById = new Map((roles || []).map(r => [r.id, r.code]));
    const workerById = new Map((workers || []).map(w => [w.id, w.name]));
    const byDay = Object.fromEntries(DAYS.map(d => [d, { A: [], B: [], C: [] }]));
    (shifts || []).forEach(s => {
      const dayKey = s.day || s.day_name;
      if (!dayKey || !byDay[dayKey]) return;
      byDay[dayKey][s.type]?.push({
        role: roleById.get(s.role_id) || "",
        worker: workerById.get(s.worker_id) || "",
      });
    });

    // Ordinamento ruoli coerente con UI
    const customOrder = ["CF","BART","1","2","3","C 1-3","4","5","C 4-5","CARR 1","CARR 2","CBL 2","BOOST","6","0","7","8","C 6-8"];
    const sortByRole = (a, b) => customOrder.indexOf(a.role) - customOrder.indexOf(b.role);

    // Setup PDF
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Layout: 3 colonne “card” affiancate
    const marginSide = 15;     // margine sinistro/destro della pagina
    const topTitleMargin = 12; // titolo giorno a 12mm dall’alto
    const columnsGap = 5;      // gap tra le 3 card
    const columns = 3;
    const cardWidth = (pageWidth - marginSide * 2 - columnsGap * (columns - 1)) / columns;
    const cardHeaderHeight = 8;  // altezza barra blu
    const cardRadius = 6 / 3.78; // ~6px → mm (approx)
    const innerPad = 3;          // padding interno della card
    const tablesStartY = topTitleMargin + 12 + cardHeaderHeight + innerPad; // sotto il titolo + header

    const toRows = (list) => list.sort(sortByRole).map(r => [r.role, r.worker]);

    DAYS.forEach((day, index) => {
      if (index > 0) doc.addPage();

      // Titolo del giorno — Helvetica, centrato, 13pt bold, #2C2C2E
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(44, 44, 46); // #2C2C2E
      doc.text(day, pageWidth / 2, topTitleMargin, { align: "center" });

      // Coordinate X delle 3 card
      const xA = marginSide;
      const xB = marginSide + cardWidth + columnsGap;
      const xC = marginSide + (cardWidth + columnsGap) * 2;

      // Y della parte superiore delle card
      const cardTopY = topTitleMargin + 4; // leggermente sotto il titolo

      // Intestazioni di turno (barra blu, testo bianco semibold 10pt, bordo superiore arrotondato)
      const drawHeader = (x, label) => {
        doc.setFillColor(0, 122, 255); // #007AFF
        doc.rect(x, cardTopY, cardWidth, cardHeaderHeight, "F"); // banda blu
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, x + cardWidth / 2, cardTopY + cardHeaderHeight - 2.5, { align: "center" });
      };
      drawHeader(xA, "Turno A");
      drawHeader(xB, "Turno B");
      drawHeader(xC, "Turno C");

      // Tabelle interne (theme plain, bordi sottili, colori soft)
      const drawTable = (x, rows) => {
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
          startY: tablesStartY,
          margin: { left: x },
          tableWidth: cardWidth,
          theme: "plain",
          head: [["RUOLO", "NOME"]],
          body: rows.length ? rows : [["-", "-"]],
          styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [230, 230, 235],
            textColor: [50, 50, 55],
          },
          alternateRowStyles: { fillColor: [247, 247, 250] },
          tableLineWidth: 0.1,
          headStyles: {
            fillColor: [0, 122, 255],
            textColor: 255,
            fontStyle: "bold",
          },
          // Nessun bordo esterno: la “card” lo tracerà con roundedRect
        });
        // Calcola altezza card necessaria (fino alla fine tabella)
        const finalY = doc.lastAutoTable?.finalY || tablesStartY + 20;
        const cardHeight = finalY - cardTopY + innerPad;

        // Bordo card arrotondato, sottile #E5E5EA, sfondo bianco (pagina è bianca)
        doc.setDrawColor(229, 229, 234); // #E5E5EA
        doc.setLineWidth(0.2);
        // Disegna bordo arrotondato attorno a header + tabella
        if (doc.roundedRect) {
          doc.roundedRect(x, cardTopY, cardWidth, cardHeight, cardRadius, cardRadius);
        } else {
          doc.rect(x, cardTopY, cardWidth, cardHeight);
        }
      };

      const rowsA = toRows(byDay[day].A || []);
      const rowsB = toRows(byDay[day].B || []);
      const rowsC = toRows(byDay[day].C || []);

      drawTable(xA, rowsA);
      drawTable(xB, rowsB);
      drawTable(xC, rowsC);
    });

    doc.save("Turni_Settimanali.pdf");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 pt-8 px-4 pb-24">
      <section className="max-w-6xl mx-auto">
        {/* Layout verticale centrato con gap e bottone PDF sopra */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={generateWeeklyPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md transition-all duration-200 mb-4"
          >
            📄 Esporta Settimana in PDF
          </button>

          <h1 className="text-gray-800 font-semibold text-lg">📅 Seleziona un giorno</h1>

          {/* Griglia responsiva: 1 colonna piccoli, 2 colonne >450px */}
          <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-3 w-full justify-items-center">
            {DAYS.map((day) => (
              <div key={day} className="w-full max-w-[320px]" onClick={() => navigate(`/giorno/${day}`)}>
                <DayCard day={day} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
