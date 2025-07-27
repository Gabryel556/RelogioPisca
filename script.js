document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE NAVEGAÇÃO E RÁDIOS (INALTERADA) ---
    const navItems = document.querySelectorAll('.sidebar ul li');
    const pages = document.querySelectorAll('.page');
    navItems.forEach(item => {
        item.addEventListener('mouseover', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));
            item.classList.add('active');
            const targetId = item.getAttribute('data-target') + '-section';
            document.getElementById(targetId).classList.add('active');
        });
    });
    const playButtons = document.querySelectorAll('.play-btn');
    const audioPlayers = document.querySelectorAll('.radio-player');
    const volumeSlider = document.getElementById('volume-slider');
    let currentPlayingAudio = null;
    let audioWasPlayingBeforeAlarm = null;
    playButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const audioToPlay = audioPlayers[index];
            if (currentPlayingAudio && currentPlayingAudio === audioToPlay) {
                audioToPlay.pause();
                currentPlayingAudio = null;
                btn.classList.remove('fa-pause', 'playing');
                btn.classList.add('fa-play');
            } else {
                audioPlayers.forEach((player, playerIndex) => {
                    player.pause();
                    playButtons[playerIndex].classList.remove('fa-pause', 'playing');
                    playButtons[playerIndex].classList.add('fa-play');
                });
                const playPromise = audioToPlay.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        currentPlayingAudio = audioToPlay;
                        btn.classList.remove('fa-play');
                        btn.classList.add('fa-pause', 'playing');
                    }).catch(error => { console.error("Erro ao tocar a rádio:", error); currentPlayingAudio = null; });
                }
            }
        });
    });
    volumeSlider.addEventListener('input', (e) => { audioPlayers.forEach(player => player.volume = e.target.value); });

    // --- LÓGICA DO RELÓGIO E ALARME (VERSÃO FINAL COM UNIX TIMESTAMP) ---
    const elementoRelogio = document.getElementById('relogio');
    const elementoData = document.getElementById('data');
    const elementoRelogioNoronha = document.getElementById('relogio-noronha');
    const elementoRelogioManaus = document.getElementById('relogio-manaus');
    const elementoRelogioAcre = document.getElementById('relogio-acre');
    const elementoRelogioUtc = document.getElementById('relogio-UTC');
    const elementoPreAlarmeSom = document.getElementById('pre-alarme-som');
    const elementoAlarmePrincipalSom = document.getElementById('alarme-principal-som');
    const elementoAlarmeGif = document.getElementById('alarme-gif');
    const muteButton = document.getElementById('mute-button');
    let preAlarmeTocou = false;
    let alarmePrincipalTocouHoje = false;
    let isMuted = false;
    let clockIntervalId = null;
    
    // Formatadores de data, criados uma única vez para performance
    const opcoesHora = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const formatadorBrasilia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...opcoesHora });
    const formatadorDataBrasilia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formatadorNoronha = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Noronha', ...opcoesHora });
    const formatadorManaus = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Manaus', ...opcoesHora });
    const formatadorAcre = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Rio_Branco', ...opcoesHora });
    const formatadorUtc = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', ...opcoesHora });

    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        muteButton.classList.toggle('muted', isMuted);
        if (isMuted) {
            pararPreAlarme();
            elementoAlarmePrincipalSom.pause();
            elementoAlarmePrincipalSom.currentTime = 0;
        }
    });

    function exibirHorarios(dataUTC) {
        const horaBrasilia = formatadorBrasilia.format(dataUTC);
        
        // A lógica de exibição, que já estava correta, permanece
        elementoRelogio.textContent = horaBrasilia;
        elementoData.textContent = capitalizarPrimeiraLetra(formatadorDataBrasilia.format(dataUTC));
        elementoRelogioNoronha.textContent = formatadorNoronha.format(dataUTC);
        elementoRelogioManaus.textContent = formatadorManaus.format(dataUTC);
        elementoRelogioAcre.textContent = formatadorAcre.format(dataUTC);
        elementoRelogioUtc.textContent = formatadorUtc.format(dataUTC);

        [elementoRelogio, elementoRelogioNoronha, elementoRelogioManaus, elementoRelogioAcre, elementoRelogioUtc].forEach(el => {
            el.style.visibility = 'visible';
            el.style.opacity = 1;
        });

        return horaBrasilia;
    }

    async function iniciarRelogiosSincronizados() {
        let dataUTC;
        try {
            const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
            if (!response.ok) throw new Error('API primária falhou');
            const data = await response.json();
            // PONTO CRÍTICO: Criamos a data a partir do NÚMERO (unixtime), não do texto!
            dataUTC = new Date(data.unixtime * 1000);
        } catch (error) {
            console.warn("API falhou. Usando time.json como Plano B.", error);
            try {
                const response = await fetch('./time.json');
                const data = await response.json();
                // O Plano B também usa o unixtime, que o robô agora salva
                dataUTC = new Date(data.unixtime * 1000);
            } catch (fallbackError) {
                console.error("Falha crítica ao carregar a hora.", fallbackError);
                elementoRelogio.textContent = "Erro"; return;
            }
        }
        
        if (isNaN(dataUTC.getTime())) {
            console.error("Data obtida é inválida.");
            elementoRelogio.textContent = "Erro"; return;
        }
        
        let horaBrasilia = exibirHorarios(dataUTC);
        verificarAlarmes(horaBrasilia);

        clockIntervalId = setInterval(() => {
            dataUTC.setSeconds(dataUTC.getSeconds() + 1);
            horaBrasilia = exibirHorarios(dataUTC);
            verificarAlarmes(horaBrasilia);
        }, 1000);
    }

    // O restante das funções (alarme, etc.) não precisa de alteração
    function verificarAlarmes(hora) {
        if (isMuted) return;
        const [horas, minutos, segundos] = hora.split(':');
        if (horas === '23' && minutos === '59' && segundos >= '50' && !preAlarmeTocou) { tocarPreAlarme(); preAlarmeTocou = true; }
        if (horas === '00' && minutos === '00' && segundos >= '00' && !alarmePrincipalTocouHoje) { pararPreAlarme(); tocarAlarmePrincipal(); alarmePrincipalTocouHoje = true; }
        if (horas === '00' && minutos === '01') { preAlarmeTocou = false; alarmePrincipalTocouHoje = false; }
    }
    function tocarPreAlarme() {
        if (isMuted) return;
        if (currentPlayingAudio) { audioWasPlayingBeforeAlarm = currentPlayingAudio; currentPlayingAudio.pause(); } else { audioWasPlayingBeforeAlarm = null; }
        elementoPreAlarmeSom.currentTime = 0; elementoPreAlarmeSom.play();
    }
    function pararPreAlarme() {
        elementoPreAlarmeSom.pause(); elementoPreAlarmeSom.currentTime = 0;
    }
    function tocarAlarmePrincipal() {
        if (isMuted) return;
        if (currentPlayingAudio && !audioWasPlayingBeforeAlarm) { audioWasPlayingBeforeAlarm = currentPlayingAudio; currentPlayingAudio.pause(); }
        elementoAlarmeGif.style.display = 'block';
        elementoAlarmePrincipalSom.currentTime = 0; elementoAlarmePrincipalSom.loop = true; elementoAlarmePrincipalSom.play();
        setTimeout(() => {
            elementoAlarmeGif.style.display = 'none';
            elementoAlarmePrincipalSom.pause(); elementoAlarmePrincipalSom.currentTime = 0; elementoAlarmePrincipalSom.loop = false;
            if (audioWasPlayingBeforeAlarm) { audioWasPlayingBeforeAlarm.play(); }
        }, 10000);
    }
    function capitalizarPrimeiraLetra(string) {
        return string.replace(/\b\w/g, char => char.toUpperCase());
    }

    // A lógica de re-sincronização não é mais necessária com este método robusto
    if (clockIntervalId) clearInterval(clockIntervalId);
    iniciarRelogiosSincronizados();
});