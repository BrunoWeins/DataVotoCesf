// 1. Importação dos módulos do Firebase (v10 SDK em ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Configurações do seu projeto no Firebase Console
// (Insira aqui as credenciais passadas pelo integrante do Firebase)
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Inicialização da aplicação e conexão com o Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Seleção do formulário
const form = document.getElementById("form-pesquisa");

// 3. Ocultar ou desabilitar botão durante envio para evitar duplo clique
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Feedback visual para o usuário
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";

  try {
    // Leitura dos campos de seleção e texto
    const faixaEtaria = document.getElementById("faixa-etaria").value;
    const bairro = document.getElementById("bairro").value;
    const rendaFamiliar = document.getElementById("renda-familiar").value;

    // CONVERSÃO OBRIGATÓRIA PARA NUMBER
    const numMoradores = Number(document.getElementById("num-moradores").value);
    const numTrabalhadores = Number(document.getElementById("num-trabalhadores").value);

    // Leitura dos seletores de rádio
    const rotinaEl = document.querySelector('input[name="rotina"]:checked');
    const rotina = rotinaEl ? rotinaEl.value : "";

    const candidatoEl = document.querySelector('input[name="candidato-presidencia"]:checked');
    const candidatoPresidencia = candidatoEl ? candidatoEl.value : "";

    const certezaEl = document.querySelector('input[name="certeza-voto"]:checked');
    const certezaVoto = certezaEl ? certezaEl.value : "";

    // Leitura das pautas prioritárias (Array de Checkboxes)
    const pautasCheckboxes = document.querySelectorAll('input[name="pautas"]:checked');
    const pautas = Array.from(pautasCheckboxes).map(cb => cb.value);

    // Montagem do objeto de dados conforme exigido pelo professor
    const respostaData = {
      faixaEtaria: faixaEtaria,
      bairro: bairro,
      rotina: rotina,
      rendaFamiliar: rendaFamiliar,
      numMoradores: numMoradores,             // Gravado estritamente como Number
      numTrabalhadores: numTrabalhadores,     // Gravado estritamente como Number
      candidatoPresidencia: candidatoPresidencia,
      certezaVoto: certezaVoto,
      pautas: pautas,                         // Array de strings
      criadoEm: serverTimestamp()             // Marcação temporal do servidor
    };

    // Gravação assíncrona na coleção datavoto_cesf_respostas
    await addDoc(collection(db, "datavoto_cesf_respostas"), respostaData);

    alert("Resposta enviada com sucesso! Obrigado pela participação.");
    form.reset();

  } catch (error) {
    console.error("Erro ao gravar dados no Firestore:", error);
    alert("Ocorreu um erro ao enviar seus dados. Por favor, tente novamente.");
  } finally {
    // Reativa o botão
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar Resposta";
  }
});
