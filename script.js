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
        try {
            // 1. Busca a hora UTC de uma fonte confiável
            const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Etc/UTC');
            const data = await response.json();
            
            // 2. Cria um objeto Date com a hora UTC exata, ignorando o relógio local
            let dataAtualSincronizada = new Date(data.dateTime);
            atualizarTelaDeRelogios(dataAtualSincronizada);
            // 3. Inicia o loop que atualiza os relógios a cada segundo
            setInterval(() => {
                // Incrementa o tempo em 1 segundo localmente para evitar chamadas de API constantes
                dataAtualSincronizada.setSeconds(dataAtualSincronizada.getSeconds() + 1);
                
                // Chama a função que atualiza a tela
                atualizarTelaDeRelogios(dataAtualSincronizada);

            }, 1000);

        } catch (error) {
            console.error("Erro ao buscar a hora universal:", error);
            // Mostra uma mensagem de erro se a API falhar
            elementoRelogio.textContent = "Erro de conexão";
        }
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

    // Inicia todo o processo
    iniciarRelogiosSincronizados();
});