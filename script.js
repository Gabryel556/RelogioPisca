document.addEventListener('DOMContentLoaded', () => {

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

    const categoryTitles = document.querySelectorAll('.category-title');

    categoryTitles.forEach(title => {
        title.addEventListener('click', () => {
            const parentCategory = title.parentElement;
            const wasActive = parentCategory.classList.contains('active');

            document.querySelectorAll('.radio-category').forEach(category => {
                category.classList.remove('active');
            });
            if (!wasActive) {
                parentCategory.classList.add('active');
            }
        });
    });
    const playButtons = document.querySelectorAll('.play-btn');
    const audioPlayers = document.querySelectorAll('.radio-player');
    const volumeSlider = document.getElementById('volume-slider');
    let currentPlaying = null;
    let audioWasPlayingBeforeAlarm = null;
    let youtubePlayer;
    let currentYoutubeVideoId = null;

    window.onYouTubeIframeAPIReady = function() {
        console.log("API do YouTube pronta.");
        youtubePlayer = new YT.Player('youtube-player', {
            height: '0',
            width: '0',
            playerVars: { 'autoplay': 0, 'controls': 0 },
            events: { 'onReady': onPlayerReady }
        });
    };

    function onPlayerReady(event) {
        console.log("Player do YouTube pronto.");
        youtubePlayer.setVolume(volumeSlider.value * 100);
    }

    const pauseEverything = () => {
        audioPlayers.forEach(p => p.pause());
        if (youtubePlayer && youtubePlayer.pauseVideo) {
            youtubePlayer.pauseVideo();
        }
        playButtons.forEach(b => {
            b.classList.remove('fa-pause', 'playing');
            b.classList.add('fa-play');
        });
        currentPlaying = null;
    };

    playButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const stationDiv = btn.closest('.radio-station');
            const stationType = stationDiv.dataset.stationType;

            if (stationType === 'youtube') {
                const videoId = stationDiv.dataset.videoId;
                if (currentPlaying && currentPlaying.type === 'youtube' && currentYoutubeVideoId === videoId) {
                    pauseEverything();
                } else {
                    pauseEverything();
                    if (youtubePlayer && youtubePlayer.loadVideoById) {
                        youtubePlayer.loadVideoById(videoId);
                        currentYoutubeVideoId = videoId;
                        currentPlaying = { type: 'youtube', player: youtubePlayer, button: btn };
                        btn.classList.remove('fa-play');
                        btn.classList.add('fa-pause', 'playing');
                    }
                }
            } else {
                const audioPlayer = stationDiv.querySelector('.radio-player');
                if (currentPlaying && currentPlaying.type === 'audio' && currentPlaying.player === audioPlayer) {
                    pauseEverything();
                } else {
                    pauseEverything();
                    const playPromise = audioPlayer.play();
                    if (playPromise !== undefined) {
                        playPromise.then(_ => {
                            currentPlaying = { type: 'audio', player: audioPlayer, button: btn };
                            btn.classList.remove('fa-play');
                            btn.classList.add('fa-pause', 'playing');
                        }).catch(error => { console.error("Erro ao tocar a rádio:", error); });
                    }
                }
            }
        });
    });

    volumeSlider.addEventListener('input', (e) => {
        const newVolume = e.target.value;
        audioPlayers.forEach(player => player.volume = newVolume);
        if (youtubePlayer && youtubePlayer.setVolume) {
            youtubePlayer.setVolume(newVolume * 100);
        }
    });

    function tocarPreAlarme() {
        if (isMuted) return;
        if (currentPlaying) {
            audioWasPlayingBeforeAlarm = currentPlaying;
            if (currentPlaying.type === 'youtube') {
                currentPlaying.player.pauseVideo();
            } else {
                currentPlaying.player.pause();
            }
        } else {
            audioWasPlayingBeforeAlarm = null;
        }
        elementoPreAlarmeSom.currentTime = 0;
        elementoPreAlarmeSom.play();
    }

    function tocarAlarmePrincipal() {
        if (isMuted) return;
        if (currentPlaying && !audioWasPlayingBeforeAlarm) {
            audioWasPlayingBeforeAlarm = currentPlaying;
            if (currentPlaying.type === 'youtube') {
                currentPlaying.player.pauseVideo();
            } else {
                currentPlaying.player.pause();
            }
        }
        elementoAlarmeGif.style.display = 'block';
        elementoAlarmePrincipalSom.currentTime = 0;
        elementoAlarmePrincipalSom.loop = true;
        elementoAlarmePrincipalSom.play();
        setTimeout(() => {
            elementoAlarmeGif.style.display = 'none';
            elementoAlarmePrincipalSom.pause();
            elementoAlarmePrincipalSom.currentTime = 0;
            elementoAlarmePrincipalSom.loop = false;
            if (audioWasPlayingBeforeAlarm) {
                if (audioWasPlayingBeforeAlarm.type === 'youtube') {
                    audioWasPlayingBeforeAlarm.player.playVideo();
                } else {
                    audioWasPlayingBeforeAlarm.player.play();
                }
            }
        }, 10000);
    }
    volumeSlider.addEventListener('input', (e) => { audioPlayers.forEach(player => player.volume = e.target.value); });

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
    let authoritativeStartTime = null; 
    let localStartTime = null; 

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

    function iniciarLoopDoRelogio(dataDePartida) {
        let dataAtualSincronizada = dataDePartida;
        const horaBrasilia = exibirHorarios(dataAtualSincronizada);
        verificarAlarmes(horaBrasilia);

        if (clockIntervalId) clearInterval(clockIntervalId);
        clockIntervalId = setInterval(() => {
            dataAtualSincronizada.setSeconds(dataAtualSincronizada.getSeconds() + 1);
            const horaAtualBrasilia = exibirHorarios(dataAtualSincronizada);
            verificarAlarmes(horaAtualBrasilia);
        }, 1000);
    }

    async function sincronizacaoInicial() {
        let dataUTC;
        try {
            const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
            if (!response.ok) throw new Error('API primária falhou');
            const data = await response.json();
            dataUTC = new Date(data.unixtime * 1000);
        } catch (error) {
            console.warn("API falhou. Usando time.json como Plano B.", error);
            try {
                const response = await fetch('./time.json');
                const data = await response.json();
                dataUTC = new Date(data.unixtime * 1000);
            } catch (fallbackError) {
                console.error("Falha crítica ao carregar a hora.", fallbackError);
                elementoRelogio.textContent = "Erro de Dados"; return;
            }
        }
        
        if (isNaN(dataUTC.getTime())) {
            console.error("Data obtida é inválida.");
            elementoRelogio.textContent = "Data Inválida"; return;
        }
        
        authoritativeStartTime = dataUTC;
        localStartTime = Date.now();
        iniciarLoopDoRelogio(authoritativeStartTime);
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            clearInterval(clockIntervalId);
        } else {
            if (!authoritativeStartTime || !localStartTime) return;

            const elapsedMilliseconds = Date.now() - localStartTime;
            
            const correctedDate = new Date(authoritativeStartTime.getTime() + elapsedMilliseconds);

            iniciarLoopDoRelogio(correctedDate);
        }
    });

    sincronizacaoInicial();

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
});