
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

// ========================================
// CONFIGURAÇÃO DO FIREBASE
// Projeto: datavotocesf-brugala
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyAjZ2u0T-UM8qkX5ZOsE2x7KACMBL4iz-A",
    authDomain: "datavotocesf-brugala.firebaseapp.com",
    databaseURL: "https://datavotocesf-brugala-default-rtdb.firebaseio.com",
    projectId: "datavotocesf-brugala",
    storageBucket: "datavotocesf-brugala.firebasestorage.app",
    messagingSenderId: "111172208486",
    appId: "1:111172208486:web:8d016eb2061c508b216aa7"
};

// ========================================
// INICIALIZAÇÃO
// ========================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("Firebase inicializado!");
console.log("Firestore preparado!");

// ========================================
// AUTENTICAÇÃO ANÔNIMA
// ========================================

const autenticacaoPronta = signInAnonymously(auth)
    .then(() => {
        console.log("Autenticação anônima concluída!");
    })
    .catch((erro) => {
        console.error("Erro na autenticação anônima:", erro);
        throw erro;
    });

// ========================================
// SALVAR RESPOSTA NO FIRESTORE
// ========================================

async function salvarResposta(dados) {
    await autenticacaoPronta;

    const documento = await addDoc(
        collection(db, "datavoto_cesf_respostas"),
        {
            faixaEtaria: dados.faixaEtaria,
            genero: dados.genero,
            bairro: dados.bairro,
            rotina: dados.rotina,
            rendaFamiliar: dados.rendaFamiliar,
            moradores: dados.moradores,
            trabalhadores: dados.trabalhadores,
            certezaVoto: dados.certezaVoto,
            votoPresidente: dados.votoPresidente,
            pautas: dados.pautas,
            criadoEm: serverTimestamp()
        }
    );

    console.log("Documento salvo:", documento.id);

    return documento.id;
}

// ========================================
// FORMULÁRIO DE PESQUISA
// ========================================

const formulario = document.getElementById("form-pesquisa");

if (formulario) {
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        // Identifica as seções do formulário
        const secoes = formulario.querySelectorAll(
            ".form-group-section"
        );

        const secaoSocioeconomica = secoes[0];
        const secaoEleitoral = secoes[1];

        if (!secaoSocioeconomica || !secaoEleitoral) {
            alert("Não foi possível localizar os campos do formulário.");
            return;
        }

        // Captura os campos socioeconômicos
        const selects =
            secaoSocioeconomica.querySelectorAll("select");

        const faixaEtaria = selects[0]?.value ?? "";
        const genero = selects[1]?.value ?? "";
        const bairro = selects[2]?.value ?? "";
        const rendaFamiliar = selects[3]?.value ?? "";

        // Captura a rotina
        const rotinaSelecionada = formulario.querySelector(
            'input[name="rotina"]:checked'
        );

        // Captura o grau de certeza do voto
        const camposCerteza =
            secaoEleitoral.querySelector(".form-control");

        const certezaSelecionada =
            camposCerteza?.querySelector(
                'input[type="radio"]:checked'
            );

        // Captura a intenção de voto presidencial
        const camposVotoPresidente =
            secaoEleitoral.querySelectorAll(".form-control")[1];

        const votoSelecionado =
            camposVotoPresidente?.querySelector(
                'input[name="voto-presidente"]:checked'
            );

        // Captura as pautas selecionadas
        const pautas = [
            ...formulario.querySelectorAll(
                'input[name="pautas"]:checked'
            )
        ].map((opcao) => opcao.value);

        // Captura os números de moradores e trabalhadores
        const moradoresTexto =
            document.getElementById("num-moradores")?.value ?? "";

        const trabalhadoresTexto =
            document.getElementById("num-trabalhadores")?.value ?? "";

        const moradores = Number(moradoresTexto);
        const trabalhadores = Number(trabalhadoresTexto);

        // ========================================
        // VALIDAÇÕES
        // ========================================

        if (
            !faixaEtaria ||
            !genero ||
            !bairro ||
            !rendaFamiliar
        ) {
            alert("Preencha os campos socioeconômicos obrigatórios.");
            return;
        }

        if (!rotinaSelecionada) {
            alert("Selecione sua rotina atual.");
            return;
        }

        if (
            moradoresTexto === "" ||
            trabalhadoresTexto === "" ||
            !Number.isInteger(moradores) ||
            !Number.isInteger(trabalhadores) ||
            moradores < 1 ||
            moradores > 30 ||
            trabalhadores < 0 ||
            trabalhadores > moradores
        ) {
            alert(
                "Confira os números de moradores e trabalhadores da residência."
            );
            return;
        }

        if (!certezaSelecionada) {
            alert("Selecione seu grau de certeza do voto.");
            return;
        }

        if (!votoSelecionado) {
            alert("Selecione uma opção de voto presidencial.");
            return;
        }

        if (pautas.length === 0) {
            alert("Selecione pelo menos uma pauta prioritária.");
            return;
        }

        // Organiza os dados para envio
        const dados = {
            faixaEtaria,
            genero,
            bairro,
            rotina: rotinaSelecionada.value,
            rendaFamiliar,
            moradores,
            trabalhadores,
            certezaVoto: certezaSelecionada.value,
            votoPresidente: votoSelecionado.value,
            pautas
        };

        // Evita envios duplicados durante o processamento
        const botao = formulario.querySelector(".btn-submit");
        const textoOriginal = botao?.textContent;

        if (botao) {
            botao.disabled = true;
            botao.textContent = "Enviando...";
        }

        try {
            await salvarResposta(dados);

            alert("Resposta enviada com sucesso!");

            formulario.reset();

            console.log("Resposta salva com sucesso!");

        } catch (erro) {
            console.error("Erro ao salvar resposta:", erro);

            alert(
                "Não foi possível enviar sua resposta. " +
                "Verifique a autenticação e as regras do Firestore."
            );

        } finally {
            if (botao) {
                botao.disabled = false;
                botao.textContent =
                    textoOriginal || "Enviar Resposta";
            }
        }
    });
} else {
    console.warn(
        "Formulário form-pesquisa não encontrado nesta página."
    );
}
