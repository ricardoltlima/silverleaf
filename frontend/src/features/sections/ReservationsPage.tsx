const reservationDays = new Set([3, 8, 12, 15, 19, 24, 27]);

const scheduledReservations = [
  { date: "Mar 03", title: "Clubhouse - Birthday Event", owner: "House 024" },
  { date: "Mar 08", title: "Pickleball Court 2", owner: "House 011" },
  { date: "Mar 12", title: "BBQ Pavilion", owner: "House 042" },
  { date: "Mar 19", title: "Clubhouse Board Meeting", owner: "HOA" },
  { date: "Mar 27", title: "Tennis Court 1", owner: "House 006" }
];

export function ReservationsPage() {
  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          HOA Reservations
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Community Reservations Calendar</h2>
        <p className="mt-1 text-sm text-slate-600">
          View reserved days for shared spaces and check upcoming bookings.
        </p>
      </section>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">March 2026</h3>
          <span className="text-xs text-slate-500">Blue = Reserved</span>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }, (_, index) => {
            const day = index - 1;
            if (day <= 0 || day > 31) {
              return <div key={`empty-${index}`} className="h-12 rounded-lg bg-slate-50" />;
            }
            const isReserved = reservationDays.has(day);
            return (
              <div
                key={day}
                className={`flex h-12 items-center justify-center rounded-lg border text-sm font-medium ${
                  isReserved
                    ? "border-blue-300 bg-blue-100 text-blue-900"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-4">
        <h3 className="text-base font-semibold text-slate-900">Upcoming Reservations</h3>
        <div className="mt-3 space-y-2">
          {scheduledReservations.map((reservation) => (
            <div
              key={`${reservation.date}-${reservation.title}`}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="text-sm font-semibold text-slate-900">{reservation.title}</p>
              <p className="text-xs text-slate-600">
                {reservation.date} - {reservation.owner}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
