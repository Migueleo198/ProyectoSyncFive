let currentDate = new Date();

const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const monthYearEl = document.getElementById("monthYear");
    const calendarBody = document.getElementById("calendarBody");

    if (!monthYearEl || !calendarBody) return;

    monthYearEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Semana empieza en lunes
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    calendarBody.innerHTML = "";

    let dayCounter = 1 - startDay;

    for (let row = 0; row < 6; row++) {
        const tr = document.createElement("tr");

        for (let col = 0; col < 7; col++) {
            const td = document.createElement("td");
            td.style.height = "100px";
            td.style.backgroundColor = "#d9d9d9";

            if (dayCounter > 0 && dayCounter <= lastDay.getDate()) {
                const dayDiv = document.createElement("div");
                dayDiv.className = "fw-bold";
                dayDiv.textContent = dayCounter;
                td.appendChild(dayDiv);
            }

            tr.appendChild(td);
            dayCounter++;
        }

        calendarBody.appendChild(tr);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("prevMonth")?.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    document.getElementById("nextMonth")?.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    renderCalendar(currentDate);
});
