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
    const lofiPlayer = document.getElementById('lofi-music');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const volumeSlider = document.getElementById('volume-slider');
    let lofiEstavaTocando = false;
    let clockIntervalId = null;

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
    let dataInicial; // Esta variável guardará nossa data de partida

    // --- PLANO A: TENTAR BUSCAR A HORA DA API EM TEMPO REAL ---
    try {
        // Vamos tentar a primeira API novamente, que é muito boa e pode funcionar agora
        const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
        if (!response.ok) {
            // Se a resposta não for bem-sucedida (ex: erro 500), força a ida para o catch
            throw new Error('API primária falhou com status: ' + response.status);
        }
        const data = await response.json();
        dataInicial = new Date(data.utc_datetime);
        console.log("Sucesso! Usando hora da API em tempo real.");

    } catch (error) {
        // --- PLANO B: SE A API FALHAR, USAR O ARQUIVO LOCAL COMO FALLBACK ---
        console.warn("A API em tempo real falhou. Usando o arquivo time.json como Plano B.", error);
        try {
            const response = await fetch('./time.json');
            const data = await response.json();
            dataInicial = new Date(data.dateTime);
        } catch (fallbackError) {
            // --- PLANO C: SE ATÉ O ARQUIVO LOCAL FALHAR, MOSTRAR ERRO ---
            console.error("Falha crítica: não foi possível carregar nem a API nem o time.json.", fallbackError);
            elementoRelogio.textContent = "Erro de dados";
            return; // Para a execução completamente
        }
    }

    // --- LÓGICA DO RELÓGIO (INALTERADA) ---
    // A partir daqui, o código usa a 'dataInicial' que foi obtida com sucesso
    let dataAtualSincronizada = dataInicial;
    
    // Atualiza a tela pela primeira vez imediatamente
    atualizarTelaDeRelogios(dataAtualSincronizada);

    // Inicia o loop para os próximos segundos
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
    // Se a página NÃO estiver escondida (ou seja, o usuário acabou de voltar)
        if (!document.hidden) {
            console.log("Aba reativada. Sincronizando o relógio...");
            // 1. Limpa o timer antigo que pode estar dessincronizado
            if (clockIntervalId) {
                clearInterval(clockIntervalId);
            }
            // 2. Chama a função principal novamente para buscar a hora fresca e reiniciar o timer
            iniciarRelogiosSincronizados();
        }
    });
    // Inicia todo o processo
    iniciarRelogiosSincronizados();
});