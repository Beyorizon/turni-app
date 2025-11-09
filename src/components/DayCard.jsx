// DayCard.jsx — Card vetrosa cliccabile per navigare al giorno

import { Link } from 'react-router-dom';

function DayCard({ day }) {
  return (
    <Link to={`/giorno/${day}`}>
      <div
        className="
          w-full max-w-[320px] h-[50px]
          bg-white/60 backdrop-blur-lg rounded-2xl shadow-md border border-white/20
          text-gray-700 flex items-center justify-center
          transition active:scale-95
          hover:bg-white hover:shadow-lg
        "
      >
        <span className="text-gray-800 font-semibold text-base">{day}</span>
      </div>
    </Link>
  );
}

export default DayCard;