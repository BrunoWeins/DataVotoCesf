
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

// Configuração do Firebase DataVotoCesf
const firebaseConfig = {
    apiKey: "AIzaSyB6tekjyarX_aKwfvCe-CeEvs0qLEUuASLQ",
    authDomain: "datavotocesf.firebaseapp.com",
    projectId: "datavotocesf",
    storageBucket: "datavotocesf.firebasestorage.app",
    messagingSenderId: "794786594690",
    appId: "1:794786594690:web:2d86dcb5a9f3577ecc199b",
    measurementId: "G-EHRDCTFCFH"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase inicializado!");
console.log("Firestore preparado!");

// Salva as respostas no Firestore
async function salvarResposta(dados) {
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

    return documento.id;
}

// Formulário de pesquisa
const formulario = document.getElementById("form-pesquisa");

if (formulario) {
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        // Identifica as duas seções do formulário original
        const secoes = formulario.querySelectorAll(
            ".form-group-section"
        );

        const secaoSocioeconomica = secoes[0];
        const secaoEleitoral = secoes[1];

        if (!secaoSocioeconomica || !secaoEleitoral) {
            alert("Não foi possível localizar os campos do formulário.");
            return;
        }

        // Os selects estão nesta ordem no HTML original:
        // faixa etária, gênero, bairro e renda familiar.
        const selects = secaoSocioeconomica.querySelectorAll("select");

        const faixaEtaria = selects[0]?.value ?? "";
        const genero = selects[1]?.value ?? "";
        const bairro = selects[2]?.value ?? "";
        const rendaFamiliar = selects[3]?.value ?? "";

        // Captura a rotina
        const rotinaSelecionada = formulario.querySelector(
            'input[name="rotina"]:checked'
        );

        // Captura o grau de certeza do voto
        const camposCerteza = secaoEleitoral.querySelector(
            ".form-control"
        );

        const certezaSelecionada = camposCerteza?.querySelector(
            'input[type="radio"]:checked'
        );

        // Captura a intenção de voto presidencial.
        // O HTML original usa três names diferentes para estas opções.
        const camposVotoPresidente =
            secaoEleitoral.querySelectorAll(".form-control")[1];

        const votoSelecionado =
            camposVotoPresidente?.querySelector(
                'input[type="radio"]:checked'
            );

        // Captura todas as pautas selecionadas
        const pautas = [
            ...formulario.querySelectorAll(
                'input[name="pautas"]:checked'
            )
        ].map((opcao) => opcao.value);

        // Captura e valida os números
        const moradoresTexto =
            document.getElementById("num-moradores").value;

        const trabalhadoresTexto =
            document.getElementById("num-trabalhadores").value;

        const moradores = Number(moradoresTexto);
        const trabalhadores = Number(trabalhadoresTexto);

        if (!rotinaSelecionada) {
            alert("Selecione sua rotina atual.");
            return;
        }

        if (!faixaEtaria || !genero || !bairro || !rendaFamiliar) {
            alert("Preencha os campos socioeconômicos obrigatórios.");
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

        if (pautas.length === 0) {
            alert("Selecione pelo menos uma pauta prioritária.");
            return;
        }

        // Organiza os dados antes de enviar
        const dados = {
            faixaEtaria,
            genero,
            bairro,
            rotina: rotinaSelecionada.value,
            rendaFamiliar,
            moradores,
            trabalhadores,
            certezaVoto: certezaSelecionada?.value ?? "",
            votoPresidente: votoSelecionado?.value ?? "",
            pautas
        };

        // Evita múltiplos envios enquanto salva
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

            console.log("Resposta salva com sucesso.");
        } catch (erro) {
            console.error("Erro ao salvar resposta:", erro);

            alert(
                "Não foi possível enviar sua resposta. Verifique a conexão e tente novamente."
            );
        } finally {
            if (botao) {
                botao.disabled = false;
                botao.textContent = textoOriginal || "Enviar Resposta";
            }
        }
    });
}
