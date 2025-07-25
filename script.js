document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE NAVEGAÇÃO DAS ABAS ---
    const navItems = document.querySelectorAll('.sidebar ul li');
    const pages = document.querySelectorAll('.page');
    const lofiPlayer = document.getElementById('lofi-music');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const volumeSlider = document.getElementById('volume-slider');
    let lofiEstavaTocando = false;

    navItems.forEach(item => {
        item.addEventListener('mouseover', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));

            item.classList.add('active');
            const targetId = item.getAttribute('data-target') + '-section';
            document.getElementById(targetId).classList.add('active');
        });
    });

    playPauseBtn.addEventListener('click', () => {
        if (lofiPlayer.paused) {
            lofiPlayer.play();
            playPauseBtn.classList.remove('fa-play');
            playPauseBtn.classList.add('fa-pause');
        } else {
            lofiPlayer.pause();
            playPauseBtn.classList.remove('fa-pause');
            playPauseBtn.classList.add('fa-play');
        }
    });

    volumeSlider.addEventListener('input', (e) => {
        lofiPlayer.volume = e.target.value;
    });
    
    // --- LÓGICA DO RELÓGIO E ALARME ---
    const elementoRelogio = document.getElementById('relogio');
    const elementoData = document.getElementById('data');
    const elementoPreAlarmeSom = document.getElementById('pre-alarme-som');
    const elementoAlarmePrincipalSom = document.getElementById('alarme-principal-som');
    const elementoAlarmeGif = document.getElementById('alarme-gif');
    const muteButton = document.getElementById('mute-button'); // Novo

    let preAlarmeTocou = false;
    let alarmePrincipalTocouHoje = false;
    let isMuted = false; // NOVO: Variável de controle para o mudo

    // --- NOVO: LÓGICA DO BOTÃO DE MUTAR ---
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted; // Inverte o estado (true/false)
        muteButton.classList.toggle('muted', isMuted); // Adiciona/remove a classe 'muted'

        // Se o usuário mutar enquanto um alarme está tocando, para o som
        if (isMuted) {
            pararPreAlarme();
            elementoAlarmePrincipalSom.pause();
            elementoAlarmePrincipalSom.currentTime = 0;
        }
    });

    function atualizarRelogio() {
        const opcoesHora = {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        };
        const opcoesData = {
            timeZone: 'America/Sao_Paulo',
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        };

        const dataAtual = new Date();
        const formatadorHora = new Intl.DateTimeFormat('pt-BR', opcoesHora);
        const formatadorData = new Intl.DateTimeFormat('pt-BR', opcoesData);

        const horaFormatada = formatadorHora.format(dataAtual);
        const dataFormatada = formatadorData.format(dataAtual);

        elementoRelogio.textContent = horaFormatada;
        elementoData.textContent = capitalizarPrimeiraLetra(dataFormatada);

        verificarAlarmes(horaFormatada);
    }

    function verificarAlarmes(hora) {
        if (isMuted) return; // Se estiver mutado, não faz nada

        const [horas, minutos, segundos] = hora.split(':');

        if (horas === '23' && minutos === '59' && segundos >= '50' && !preAlarmeTocou) {
            tocarPreAlarme();
            preAlarmeTocou = true;
        }

        if (horas === '00' && minutos === '00' && segundos >= '00' && !alarmePrincipalTocouHoje) {
            pararPreAlarme();
            tocarAlarmePrincipal();
            alarmePrincipalTocouHoje = true;
        }
        
        if (horas === '00' && minutos === '01') {
            preAlarmeTocou = false;
            alarmePrincipalTocouHoje = false;
        }
    }

    function tocarPreAlarme() {
    if (isMuted) return;
    // Pausa a música Lo-Fi e guarda o estado
    if (!lofiPlayer.paused) {
        lofiEstavaTocando = true;
        lofiPlayer.pause();
    } else {
        lofiEstavaTocando = false;
    }

    console.log("PRÉ-ALARME! Faltam 10 segundos para a meia-noite!");
    elementoPreAlarmeSom.currentTime = 0;
    elementoPreAlarmeSom.play();
}

    function pararPreAlarme() {
        elementoPreAlarmeSom.pause();
        elementoPreAlarmeSom.currentTime = 0;
    }

    function tocarAlarmePrincipal() {
        if (isMuted) return; 

        // Pausa a música Lo-Fi caso o pré-alarme não tenha tocado
        if (!lofiPlayer.paused) {
            lofiEstavaTocando = true;
            lofiPlayer.pause();
        }
        console.log("ALARME! É meia-noite!");
        elementoAlarmeGif.style.display = 'block';
        elementoAlarmePrincipalSom.currentTime = 0;
        elementoAlarmePrincipalSom.play();

        setTimeout(() => {
        elementoAlarmeGif.style.display = 'none';
        elementoAlarmePrincipalSom.pause();
        elementoAlarmePrincipalSom.currentTime = 0;
        elementoAlarmePrincipalSom.loop = false;

        // Retoma a música Lo-Fi se ela estava tocando antes
        if (lofiEstavaTocando) {
            lofiPlayer.play();
        }

    }, 10000); 
}

    function capitalizarPrimeiraLetra(string) {
        return string.replace(/\b\w/g, char => char.toUpperCase());
    }

    setInterval(atualizarRelogio, 1000);
    atualizarRelogio();
});