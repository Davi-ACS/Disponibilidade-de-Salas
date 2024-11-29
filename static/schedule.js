let currentHourBlock = 0;

Object.freeze(hours);
Object.freeze(rooms);
Object.freeze(schedule);

const now = new Date();
    const currentHour = (now.getHours().toString().padStart(2, '0') + ":00-") + (now.getHours().toString().padStart(2, '0')-(-1) + ":00");

    hours.forEach((hour, index) => {
        if (hour == currentHour) {
            currentHourBlock = Math.floor(index / 4);
        }
    });

// Função para atualizar a exibição da tabela
function updateSchedule() {

    // Filtrar as horas visíveis


    const visible_hours = hours.slice(currentHourBlock * 4, (currentHourBlock + 1) * 4);

    //alert("currentHourBlock: " + currentHourBlock + "\n" + currentHourBlock*4 + " - " + (currentHourBlock + 1)*4 + "\n" + visible_hours);

    // Cabeçalho da tabela
    const thead = document.getElementById("schedule-thead");
    thead.innerHTML = `<tr><th>Sala</th>${visible_hours.map(hour => `<th>${hour}</th>`).join('')}</tr>`;

    // Corpo da tabela
    const tbody = document.getElementById("schedule-tbody");
    tbody.innerHTML = rooms.map(room => {
        return `
            <tr>
                <td>${room}</td>
                ${visible_hours.map(hour => {
                    const cellData = schedule[room] && schedule[room][hour] ? schedule[room][hour] : {main: "Livre", details: ""};
                    return `
                        <td>
                            <div class="schedule-cell" onclick="showDetails(this)">
                                <strong>${cellData.main}</strong>
                                ${cellData.main !== "Livre" ? `<div class="details">${cellData.details}</div>` : ""}
                            </div>
                        </td>
                    `;
                }).join('')}
            </tr>
        `;
    }).join('');
}

function nextHourBlock() {
    if ((currentHourBlock + 1) * 4 < hours.length) {
        currentHourBlock++;
        updateSchedule();
    }
}

function previousHourBlock() {
    if (currentHourBlock > 0) {
        currentHourBlock--;
        updateSchedule();
    }
}

function showDetails(cell) {
    cell.classList.toggle("expand");
}

//Função para recarregar a página com os filtros selecionados
function reloadPage() {
const selectedBloco = document.getElementById('bloco-filter').value;
const salafilter = document.getElementById('sala-filter').value;
const andarfilter = document.getElementById('andar-filter').value;
const diafilter = document.getElementById('dia-filter').value;
const queryString = `?bloco=${selectedBloco}&?sala=${salafilter}&andar=${andarfilter}&dia=${diafilter}`;
alert("Recarregando página com filtros selecionados");
window.location.href = `/salas/Blocos/${queryString}`;
}

//Função para alterar a Url
function chargeUrl() {
    const selectedBloco = document.getElementById('bloco-filter').value;
    const filterSala =  document.getElementById('sala-filter').value;
    const filterAndar = document.getElementById('andar-filter').value;
    const filterDia = document.getElementById('dia-filter').value;
    const queryString = `?bloco=${selectedBloco}&?sala=${filterSala}&andar=${filterAndar}&dia=${filterDia}`;
    const newUrl = `/salas/Blocos/${queryString}`;
    history.pushState(null, '', newUrl);
}

//É chamada quando a página é carregada
window.onload = function() {

// Inicializar tabela
updateSchedule();

// Get the query parameters from the URL
const urlParams = new URLSearchParams(window.location.search);

// Get the values from the query parameters
const bloco = urlParams.get('bloco');
const sala = urlParams.get('sala');  
const andar = urlParams.get('andar');
const dia = urlParams.get('dia');

// Set the values in the filters
if (bloco != null && bloco != "") {
    document.getElementById('bloco-filter').value = bloco;
}
else{
    document.getElementById('bloco-filter').value = "";
    document.getElementById('schedule-table').innerHTML = "<h1 style='text-align: center;'>Selecione um bloco para visualizar as salas</h1>";
}
if (sala != null) {
    document.getElementById('sala-filter').value = sala;
    if(document.getElementById('sala-filter').value == '' && sala != "")
        reloadPage();
}
if (andar != null) {
    document.getElementById('andar-filter').value = andar;
    if((andar > 3 || andar < 1) && andar != ""){
        alert("Andar inválido, voltando para todos os andares");
        document.getElementById('andar-filter').value = "";
        const selectedBloco = document.getElementById('bloco-filter').value;
        const salafilter = document.getElementById('sala-filter').value;
        const andarfilter = document.getElementById('andar-filter').value;
        const diafilter = document.getElementById('dia-filter').value;
        const queryString = `?sala=${salafilter}&andar=${andarfilter}&dia=${diafilter}`;
        window.location.href = `/salas/Blocos/?bloco=${selectedBloco}&${queryString}`;
    }
}
if (dia != null ) {
    document.getElementById('dia-filter').value = dia;
    if(!["Segunda", "Terça", "Quarta", "Quinta", "Sexta"].includes(dia)){
        alert("Dia inválido, voltando para segunda-feira");
        document.getElementById('dia-filter').value = "Segunda";
        const selectedBloco = document.getElementById('bloco-filter').value;
        const salafilter = document.getElementById('sala-filter').value;
        const andarfilter = document.getElementById('andar-filter').value;
        const diafilter = document.getElementById('dia-filter').value;
        const queryString = `?sala=${salafilter}&andar=${andarfilter}&dia=${diafilter}`;
        window.location.href = `/salas/Blocos/?bloco=${selectedBloco}&${queryString}`;
    }
} else{
    today = new Date();
    const day = today.getDay()-1;
    dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
    document.getElementById('dia-filter').value = dias[day];
    reloadPage();
}
filterTable();
//Recarrega a cada meia hora
setInterval(function() {
    location.reload();
},  60000);

//1 minuto = 60000
//30 minutos = 1800000
}

//Filtro de sala e andar
function filterTable() {
    const filterSala = document.getElementById('sala-filter').value.toLowerCase();
    const filterAndar = document.getElementById('andar-filter').value;
    
    const table = document.getElementById('schedule-table');
    const trs = table.getElementsByTagName('tr');

    for (let i = 1; i < trs.length; i++) {
        const tds = trs[i].getElementsByTagName('td');
        const sala = tds[0].textContent.toLowerCase();
        const andar = sala.charAt(0);
        
        if ((filterSala === '' || sala.startsWith(filterSala)) &&
            (filterAndar === '' || andar === filterAndar)
            ) {
            trs[i].style.display = '';
        } else {
            trs[i].style.display = 'none';
        }
    }
}
// Attach filterTable function to input events
document.getElementById('sala-filter').addEventListener('input', filterTable);
document.getElementById('andar-filter').addEventListener('change', filterTable);

//Função para voltar para a tela inicial
function backToHome() {
    if(confirm('Deseja voltar para a tela Inicial?')) {
        window.location.href = 'https://www.dcc.ufrrj.br/salas';
    }
};