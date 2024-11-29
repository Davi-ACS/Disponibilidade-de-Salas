// Dados passados pelo Flask para o JavaScript
const urlParams = new URLSearchParams(window.location.search);
const bloco = urlParams.get('bloco');
const andar = urlParams.get('andar');
const dia = urlParams.get('dia');
// Verifica se algum dos parâmetros está vazio
if (!bloco || !andar || !dia) {
    alert('Selecione os parâmetros para visualizar as salas.');
    showParameterSelection();
}

function showParameterSelection() {
    document.body.innerHTML = `
    <div style="text-align: center; color: #e0e0e0;">
    <h2>Selecione os parâmetros:</h2>
    <select id="bloco-select">
    <option value="">Selecione o Bloco</option>
    <option value="Administrativo">Administrativo</option>
    <option value="Biblioteca">Biblioteca</option>
    <option value="Informática">Informática</option>
    <option value="Multimídia">Multimídia</option>
    </select>
    <select id="andar-select">
    <option value="">Selecione o Andar</option>
    <option value="1">1º Andar</option>
    <option value="2">2º Andar</option>
    <option value="3">3º Andar</option>
    </select>
    <select id="dia-select">
    <option value="">Selecione o Dia</option>
    <option value="Segunda">Segunda-Feira</option>
    <option value="Terça">Terça-Feira</option>
    <option value="Quarta">Quarta-Feira</option>
    <option value="Quinta">Quinta-Feira</option>
    <option value="Sexta">Sexta-Feira</option>
    </select>
    <button onclick="updateURL()">Confirmar</button>
    <button onclick="if(confirm('Deseja cancelar a seleção de parâmetros?')) { window.location.href = 'https://www.dcc.ufrrj.br/salas/'; }">Cancelar</button>
    </div>
    `;

    const today = new Date();
    const daysOfWeek = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", ""];
    const todayDay = daysOfWeek[today.getDay()];
    document.getElementById('dia-select').value = todayDay; 
}

    // Função para atualizar a URL com os parâmetros selecionados
    function updateURL() {
    const bloco = document.getElementById('bloco-select').value;
    const andar = document.getElementById('andar-select').value;
    const dia = document.getElementById('dia-select').value;
    if (bloco && andar && dia) {
        const newURL = `${window.location.pathname}?bloco=${bloco}&andar=${andar}&dia=${dia}`;
        window.location.href = newURL;
    } else {
        alert('Por favor, selecione todos os parâmetros.');
    }
    }
if(bloco && andar && dia){
const backButton = document.getElementById('back-button');
const changeParamsButton = document.getElementById('change-params-button');

backButton.addEventListener('mouseover', () => {
    backButton.style.opacity = "1";
});
backButton.addEventListener('mouseout', () => {
    backButton.style.opacity = "0.2";
});

changeParamsButton.addEventListener('mouseover', () => {
    changeParamsButton.style.opacity = "1";
});
changeParamsButton.addEventListener('mouseout', () => {
    changeParamsButton.style.opacity = "0.2";
});

backButton.addEventListener('click', () => {
    if(confirm('Deseja voltar para a tela Inicial?')) {
        window.location.href = 'https://www.dcc.ufrrj.br/salas/';
    }
});

changeParamsButton.addEventListener('click', () => {
    if(confirm('Deseja alterar os parâmetros?')) {
        showParameterSelection();
    }
});


// Configurações de slide
let currentSlide = 0;
const slideInterval = 10000; // 5 segundos em milissegundos
const roomsPerSlide = 4;
const rooms = Object.keys(schedule).filter(room => room.startsWith(andar));
Object.freeze(schedule);
Object.freeze(rooms);

if (rooms.length === 0) {
    alert('Não há salas disponíveis para o andar selecionado.');
    showParameterSelection();
}

// Função para atualizar o slide com 4 salas de cada vez
function updateSlide() {
    const container = document.getElementById("kiosk-container");
    container.innerHTML = ''; // Limpa o conteúdo atual

    // Seleciona 4 salas para o slide atual
    const start = currentSlide * roomsPerSlide;
    const end = start + roomsPerSlide;
    const roomsToShow = rooms.slice(start, end);
    Object.freeze(roomsToShow);

    // Index da hora atual
    const now = new Date();
    const currentHour = now.getHours() + ":00-" + (now.getHours() + 1) + ":00";
    let index;
    index = Object.keys(schedule[roomsToShow[0]]).indexOf(currentHour);
    if (index === -1) {
        if(currentHour =="12:00-13:00")
            index = 4;
        else
        index = 0;
    }


    // Cria os cartões para as salas selecionadas
    roomsToShow.forEach(room => {
        const firstHour = Object.keys(schedule[room])[index];
        if (firstHour) {
            const data = schedule[room][firstHour];
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h2>${room}</h2>
                <p class="highlight">${data.main}</p>
                <p style="font-size: 1.6em;">Horário: ${firstHour}</p>
                <p>${data.details}</p>
            `;
            container.appendChild(card);
            if(card.querySelector('.highlight').innerText == "Livre")
                card.style.border = "2px solid Green";
            else
                card.style.border = "2px solid Red";
            if (roomsToShow.length === 1) {
                card.style.gridColumn = "span 2";
            } else if (roomsToShow.length === 3 && roomsToShow.indexOf(room) === 2) {
                card.style.gridColumn = "span 2";
            }
        }
    });
}

// Função para ir para o proximo dia

function nextDay() {
    const today = new Date();
    const daysOfWeek = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", ""];
    const todayDay = daysOfWeek[today.getDay()];
    if (todayDay === "") {
        
    }
    if (todayDay === "") {
        document.body.innerHTML = `
        <div style="text-align: center; color: #e0e0e0;">
            <h2 style="font-size: 2.5em;">Hoje não há aulas programadas. Aproveite o seu dia!</h2>
        </div>
        <div style="position: absolute; top: 25px; left: 10px;">
            <button id="back-button" style="opacity: 0.2;">Voltar</button>
            <button id="change-params-button" style="opacity: 0.2;">Alterar Parâmetros</button>
        </div>
        `;
        return;
    }

    const newURL = `${window.location.pathname}?bloco=${bloco}&andar=${andar}&dia=${todayDay}`;
    window.location.href = newURL;
}

// Função para alternar o slide
function nextSlide() {
    currentSlide = (currentSlide + 1) % Math.ceil(rooms.length / roomsPerSlide);
    if (currentSlide === 0) {
        nextDay();
    }
    updateSlide();
}

// Inicializa o primeiro slide e configura a mudança automática
updateSlide();
setInterval(nextSlide, slideInterval);
}
