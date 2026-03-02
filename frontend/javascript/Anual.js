const CALENDAR_ELEMENT = document.getElementById("calendar");

let year = new Date().getFullYear();

const MONT_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];


const BUTTON_NEXT_ELEMENT = document.createElement('button');

const CURRENT_YR = document.createElement('p');

CURRENT_YR.textContent = year;

CURRENT_YR.style.fontWeight = "bold";
CURRENT_YR.style.marginTop = '10px';


const BUTTON_PREV_ELEMENT = document.createElement('button');


BUTTON_NEXT_ELEMENT.textContent = '>';
BUTTON_PREV_ELEMENT.textContent = '<';

const CLASS_LIST_BUTTONS = 'btn btn-outline-secondary';

BUTTON_NEXT_ELEMENT.classList.add(...CLASS_LIST_BUTTONS.split(' '));
BUTTON_PREV_ELEMENT.classList.add(...CLASS_LIST_BUTTONS.split(' '));



document.body.querySelector('#year_elems_placeholder').append(BUTTON_PREV_ELEMENT);
document.body.querySelector('#year_elems_placeholder').append(CURRENT_YR);
document.body.querySelector('#year_elems_placeholder').append(BUTTON_NEXT_ELEMENT);





BUTTON_NEXT_ELEMENT.addEventListener('click',nextYear);

function nextYear(){
    year+=1;
    CURRENT_YR.textContent = year;
    CALENDAR_ELEMENT.innerHTML='';
    for (let m = 0; m < 12; m++) {
    CALENDAR_ELEMENT.insertAdjacentHTML("beforeend", generateMonth(m, year));
    }   
}

BUTTON_PREV_ELEMENT.addEventListener('click',previousYear);

function previousYear(){
    year-=1;
    CURRENT_YR.textContent = year;
    CALENDAR_ELEMENT.innerHTML='';
    for (let m = 0; m < 12; m++) {
    CALENDAR_ELEMENT.insertAdjacentHTML("beforeend", generateMonth(m, year));
    }   
}




function generateMonth(month, year) {
    const FIRST_DAY = new Date(year, month, 1).getDay() || 7;
    const DAYS_IN_MONTH = new Date(year, month + 1, 0).getDate();

    let html = `
            <div class="col-xl-3 col-lg-4 col-md-6">
              <table class="table table-bordered text-center align-middle">
                <thead class="table-dark">
                  <tr><th colspan="7">${MONT_NAMES[month]} ${year}</th></tr>
                  <tr class="table-secondary">
                    <th>L</th><th>M</th><th>X</th><th>J</th><th>V</th><th>S</th><th>D</th>
                  </tr>
                </thead>
                <tbody>
            `;

    let day = 1;
    for (let row = 0; row < 6; row++) {
        html += "<tr>";
        for (let col = 1; col <= 7; col++) {
            if ((row === 0 && col < FIRST_DAY) || day > DAYS_IN_MONTH) {
                html += "<td></td>";
            } else {
                html += `<td>${day}</td>`;
                day++;
            }
        }
        html += "</tr>";
    }

    html += "</tbody></table></div>";
    return html;
}

for (let m = 0; m < 12; m++) {
    CALENDAR_ELEMENT.insertAdjacentHTML("beforeend", generateMonth(m, year));
}



