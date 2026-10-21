
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAjZ2u0T-UM8qkX5ZOsE2x7KACMBL4iz-A",
    authDomain: "datavotocesf-brugala.firebaseapp.com",
    databaseURL: "https://datavotocesf-brugala-default-rtdb.firebaseio.com",
    projectId: "datavotocesf-brugala",
    storageBucket: "datavotocesf-brugala.firebasestorage.app",
    messagingSenderId: "111172208486",
    appId: "1:111172208486:web:8d016eb2061c508b216aa7"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Autenticação anônima
const autenticacaoPronta = signInAnonymously(auth)
    .then(() => {
        console.log("Autenticação anônima concluída!");
    })
    .catch((erro) => {
        console.error("Erro na autenticação:", erro);
        throw erro;
    });

// Salvar resposta no Firestore

async function salvarResposta(dados) {
    console.log("1. Aguardando autenticação...");

    await autenticacaoPronta;

    console.log("2. Autenticação concluída!");
    console.log("3. Tentando salvar no Firestore...");


    const documento = await Promise.race([
        addDoc(collection(db, "datavoto_cesf_respostas"), {
            ...dados,
            criadoEm: serverTimestamp()
        }),
        new Promise((_, rejeitar) => {
            setTimeout(() => {
                rejeitar(new Error(
                    "Tempo esgotado: o Firestore não confirmou a gravação em 15 segundos."
                ));
            }, 15000);
        })
    ]);


    console.log("4. Resposta salva! ID:", documento.id);

    return documento.id;
}


// Manipulação do formulário
const formulario = document.getElementById("form-pesquisa");
const mensagemSucesso = document.getElementById("mensagem-sucesso");

if (formulario) {
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        // Captura dos campos
        const faixaEtaria =
            document.getElementById("faixa-etaria")?.value || "";

        const genero =
            document.getElementById("genero")?.value || "";

        const bairro =
            document.getElementById("bairro")?.value || "";

        const rendaFamiliar =
            document.getElementById("renda-familiar")?.value || "";

        const rotinaSelecionada =
            formulario.querySelector('input[name="rotina"]:checked')?.value || "";

        const certezaSelecionada =
            formulario.querySelector('input[name="certeza-voto"]:checked')?.value || "";

        const votoSelecionado =
            formulario.querySelector('input[name="voto-presidente"]:checked')?.value || "";

        const pautas = [
            ...formulario.querySelectorAll('input[name="pautas"]:checked')
        ].map((opcao) => opcao.value);

        const moradoresTexto =
            document.getElementById("num-moradores")?.value ?? "";

        const trabalhadoresTexto =
            document.getElementById("num-trabalhadores")?.value ?? "";

        const moradores = Number(moradoresTexto);
        const trabalhadores = Number(trabalhadoresTexto);

        // Validações
        if (!faixaEtaria || !genero || !bairro || !rendaFamiliar) {
            alert("Por favor, preencha todos os campos do Perfil Socioeconômico.");
            return;
        }

        if (!rotinaSelecionada) {
            alert("Por favor, selecione sua rotina atual.");
            return;
        }

        if (
            moradoresTexto === "" ||
            trabalhadoresTexto === "" ||
            moradores < 1 ||
            trabalhadores < 0 ||
            trabalhadores > moradores
        ) {
            alert(
                "Confira os números de moradores e trabalhadores. " +
                "O número de trabalhadores não pode ser maior que o de moradores."
            );
            return;
        }

        if (!certezaSelecionada) {
            alert("Selecione seu grau de certeza do voto.");
            return;
        }

        if (!votoSelecionado) {
            alert("Selecione uma opção de voto para presidente.");
            return;
        }

        if (pautas.length === 0) {
            alert("Selecione pelo menos uma pauta prioritária.");
            return;
        }

        const dados = {
            faixaEtaria,
            genero,
            bairro,
            rotina: rotinaSelecionada,
            rendaFamiliar,
            moradores,
            trabalhadores,
            certezaVoto: certezaSelecionada,
            votoPresidente: votoSelecionado,
            pautas
        };

        const botao = formulario.querySelector(".btn-submit");

        // Evita envios repetidos enquanto salva
        if (botao) {
            botao.disabled = true;
            botao.textContent = "Enviando...";
        }

        try {
            await salvarResposta(dados);

            console.log("Resposta salva com sucesso!");

            // Mostra a confirmação somente depois de salvar
            formulario.style.display = "none";

            if (mensagemSucesso) {
                mensagemSucesso.style.display = "block";
            } else {
                alert("Resposta enviada com sucesso!");
            }

            window.scrollTo({ top: 0, behavior: "smooth" });

        } catch (erro) {
            console.error("Erro ao salvar a resposta:", erro);

            alert(
                "Não foi possível enviar sua resposta. " +
                "Verifique sua conexão e tente novamente. " +
                "Se o erro continuar, abra o console com F12."
            );

        } finally {
            // Restaura o botão caso o formulário continue visível
            if (botao && formulario.style.display !== "none") {
                botao.disabled = false;
                botao.textContent = "Enviar Resposta";
            }
        }
    });
}

// Botão para responder novamente
document.addEventListener("click", (evento) => {
    const botaoNovaResposta = evento.target.closest("#btn-nova-resposta");

    if (!botaoNovaResposta) return;

    if (mensagemSucesso) {
        mensagemSucesso.style.display = "none";
    }

    if (formulario) {
        formulario.reset();
        formulario.style.display = "block";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
});


function confirmarAcessoAdmin(event) {
    event.preventDefault();
  
    const confirmar = confirm(
      "Área restrita!\n\n" +
      "Você está entrando no painel administrativo " +
      "do DataVoto CESF.\n\n" +
      "Deseja continuar?"
    );
  
    if (confirmar) {
      window.location.href = "admin.html";
    }
  
    return false;
  }
  