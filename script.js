document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE NAVEGAÇÃO DAS ABAS ---
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

    // --- LÓGICA DO PLAYER DE MÚSICA ---
    const playButtons = document.querySelectorAll('.play-btn');
    const audioPlayers = document.querySelectorAll('.radio-player');
    const volumeSlider = document.getElementById('volume-slider');
    let currentPlayingAudio = null;
    let audioWasPlayingBeforeAlarm = null;
    let authoritativeStartTime = null; // Guardará a hora inicial exata da API
    let localStartTime = null;       // Guardará quando a página carregou no relógio local

    playButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const audioToPlay = audioPlayers[index];

            if (currentPlayingAudio && currentPlayingAudio === audioToPlay) {
                // Se clicar no botão da rádio que já está tocando, pausa
                audioToPlay.pause();
                currentPlayingAudio = null;
                btn.classList.remove('fa-pause', 'playing');
                btn.classList.add('fa-play');
            } else {
                // Pausa todas as outras rádios
                audioPlayers.forEach((player, playerIndex) => {
                    player.pause();
                    playButtons[playerIndex].classList.remove('fa-pause', 'playing');
                    playButtons[playerIndex].classList.add('fa-play');
                });

                // Toca a rádio selecionada
                audioToPlay.play();
                currentPlayingAudio = audioToPlay;
                btn.classList.remove('fa-play');
                btn.classList.add('fa-pause', 'playing');
            }
        });
    });

    volumeSlider.addEventListener('input', (e) => {
        const newVolume = e.target.value;
        audioPlayers.forEach(player => {
            player.volume = newVolume;
        });
    });

    // --- LÓGICA DO RELÓGIO E ALARME (VERSÃO ATUALIZADA) ---
    const elementoRelogio = document.getElementById('relogio');
    const elementoData = document.getElementById('data');
    const elementoRelogioNoronha = document.getElementById('relogio-noronha');
    const elementoRelogioManaus = document.getElementById('relogio-manaus');
    const elementoRelogioAcre = document.getElementById('relogio-acre');

    const elementoPreAlarmeSom = document.getElementById('pre-alarme-som');
    const elementoAlarmePrincipalSom = document.getElementById('alarme-principal-som');
    const elementoAlarmeGif = document.getElementById('alarme-gif');
    const muteButton = document.getElementById('mute-button');

    let preAlarmeTocou = false;
    let alarmePrincipalTocouHoje = false;
    let isMuted = false;

    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        muteButton.classList.toggle('muted', isMuted);
        if (isMuted) {
            pararPreAlarme();
            elementoAlarmePrincipalSom.pause();
            elementoAlarmePrincipalSom.currentTime = 0;
        }
    });

    // --- NOVO: FUNÇÃO PARA BUSCAR HORA UNIVERSAL E INICIAR OS RELÓGIOS ---
    async function iniciarRelogiosSincronizados() {
    let dataInicial;

    // --- PLANO A: TENTAR A NOVA API, MAIS LEVE E DIRETA ---
    try {
        // Esta API retorna apenas o texto da data, nada mais.
        const response = await fetch('https://www.timeapi.org/utc/now');
        if (!response.ok) {
            throw new Error('API primária (timeapi.org) falhou com status: ' + response.status);
        }
        // Usamos .text() pois a resposta não é JSON
        const dataTexto = await response.text();
        dataInicial = new Date(dataTexto);
        console.log("Sucesso! Usando hora da API em tempo real (timeapi.org).");

    } catch (error) {
        // --- PLANO B: SE A API FALHAR, USAR O ARQUIVO LOCAL COMO FALLBACK ---
        console.warn("A API em tempo real falhou. Usando o arquivo time.json como Plano B.", error);
        try {
            const response = await fetch('./time.json');
            const data = await response.json();
            dataInicial = new Date(data.dateTime);
        } catch (fallbackError) {
            // --- PLANO C: SE TUDO FALHAR, MOSTRAR ERRO ---
            console.error("Falha crítica: não foi possível carregar nem a API nem o time.json.", fallbackError);
            elementoRelogio.textContent = "Erro";
            // Para os outros relógios também
            elementoRelogioNoronha.textContent = "Erro";
            elementoRelogioManaus.textContent = "Erro";
            elementoRelogioAcre.textContent = "Erro";
            return;
        }
    }

    // Se a data obtida for inválida por algum motivo, para a execução.
    if (isNaN(dataInicial.getTime())) {
        console.error("A data obtida é inválida.");
        elementoRelogio.textContent = "Data inválida";
        return;
    }

    // --- LÓGICA DO RELÓGIO (INALTERADA) ---
    let dataAtualSincronizada = dataInicial;
    
    atualizarTelaDeRelogios(dataAtualSincronizada);

    clockIntervalId = setInterval(() => {
        dataAtualSincronizada.setSeconds(dataAtualSincronizada.getSeconds() + 1);
        atualizarTelaDeRelogios(dataAtualSincronizada);
    }, 1000);
}

    // --- NOVO: FUNÇÃO QUE APENAS ATUALIZA A TELA ---
    function atualizarTelaDeRelogios(dataAtual) {
        const formatarEAtualizar = (timeZone, elementoRelogio, elementoData = null) => {
            const opcoesHora = { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            const formatadorHora = new Intl.DateTimeFormat('pt-BR', opcoesHora);
            const horaFormatada = formatadorHora.format(dataAtual);
            elementoRelogio.textContent = horaFormatada;

            if (elementoData) {
                const opcoesData = { timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const formatadorData = new Intl.DateTimeFormat('pt-BR', opcoesData);
                elementoData.textContent = capitalizarPrimeiraLetra(formatadorData.format(dataAtual));
            }
            return horaFormatada;
        };

        const horaBrasilia = formatarEAtualizar('America/Sao_Paulo', elementoRelogio, elementoData);
        formatarEAtualizar('America/Noronha', elementoRelogioNoronha);
        formatarEAtualizar('America/Manaus', elementoRelogioManaus);
        formatarEAtualizar('America/Rio_Branco', elementoRelogioAcre);

        // --- ADICIONE ESTE BLOCO NO FINAL DA FUNÇÃO ---
        // Torna os relógios visíveis após a primeira atualização
        elementoRelogio.style.opacity = 1;
        elementoRelogioNoronha.style.opacity = 1;
        elementoRelogioManaus.style.opacity = 1;
        elementoRelogioAcre.style.opacity = 1;
        // ---------------------------------------------

        verificarAlarmes(horaBrasilia);
    }

    // As funções de alarme e auxiliares permanecem as mesmas
    function verificarAlarmes(hora) {
        if (isMuted) return;
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
        if (!lofiPlayer.paused) {
            lofiEstavaTocando = true;
            lofiPlayer.pause();
        }
        console.log("ALARME! É meia-noite!");
        elementoAlarmeGif.style.display = 'block';
        elementoAlarmePrincipalSom.currentTime = 0;
        elementoAlarmePrincipalSom.loop = true;
        elementoAlarmePrincipalSom.play();
        setTimeout(() => {
            elementoAlarmeGif.style.display = 'none';
            elementoAlarmePrincipalSom.pause();
            elementoAlarmePrincipalSom.currentTime = 0;
            elementoAlarmePrincipalSom.loop = false;
            if (lofiEstavaTocando) {
                lofiPlayer.play();
            }
        }, 10000);
    }

    function capitalizarPrimeiraLetra(string) {
        return string.replace(/\b\w/g, char => char.toUpperCase());
    }
    document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        // A aba ficou inativa, apenas para o timer antigo
        clearInterval(clockIntervalId);
    } else {
        // A aba voltou a ficar ativa, vamos corrigir a hora
        console.log("Aba reativada. Corrigindo o relógio...");

        // Se não tivermos um ponto de partida, não faz nada
        if (!authoritativeStartTime || !localStartTime) return;

        // 1. Calcula quanto tempo (em milissegundos) se passou desde que a página carregou
        const elapsedMilliseconds = Date.now() - localStartTime;

        // 2. Cria a nova data correta, somando o tempo passado à hora inicial oficial
        let correctedDate = new Date(authoritativeStartTime.getTime() + elapsedMilliseconds);

        // 3. Reinicia o processo de atualização a partir da data corrigida
        let dataAtualSincronizada = correctedDate;
        atualizarTelaDeRelogios(dataAtualSincronizada);

        clockIntervalId = setInterval(() => {
            dataAtualSincronizada.setSeconds(dataAtualSincronizada.getSeconds() + 1);
            atualizarTelaDeRelogios(dataAtualSincronizada);
        }, 1000);
    }
});
    // Inicia todo o processo
    iniciarRelogiosSincronizados();
});