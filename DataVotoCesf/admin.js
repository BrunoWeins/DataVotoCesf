import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB6tekjyarX_aKwfvCe-CeEvs0qLEUuASLQ",
  authDomain: "datavotocesf.firebaseapp.com",
  projectId: "datavotocesf",
  storageBucket: "datavotocesf.firebasestorage.app",
  messagingSenderId: "794786594690",
  appId: "1:794786594690:web:2d86dcb5a9f3577ecc199b",
  measurementId: "G-EHRDCTFCFH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Definindo a senha de acesso ao painel
const SENHA_CORRETA = "admin123";

// Seleção de elementos do DOM
const formLogin = document.getElementById("form-login");
const inputSenha = document.getElementById("senha-admin");
const loginContainer = document.getElementById("login-container");
const dashboardContainer = document.getElementById("dashboard-container");
const btnLogout = document.getElementById("btn-logout");

// Controle de Login
formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  if (inputSenha.value === SENHA_CORRETA) {
    loginContainer.style.display = "none";
    dashboardContainer.style.display = "block";
    carregarDadosEGerarRelatorios();
  } else {
    alert("Senha incorreta! Tente novamente.");
    inputSenha.value = "";
  }
});

btnLogout.addEventListener("click", () => {
  dashboardContainer.style.display = "none";
  loginContainer.style.display = "block";
  inputSenha.value = "";
});

// Função principal de carregamento e agregação dos dados
async function carregarDadosEGerarRelatorios() {
  try {
    const querySnapshot = await getDocs(collection(db, "datavoto_cesf_respostas"));
    const respostas = [];

    querySnapshot.forEach((doc) => {
      respostas.push(doc.data());
    });

    const total = respostas.length;
    document.getElementById("total-respostas").textContent = total;

    if (total === 0) {
      alert("Nenhuma resposta encontrada no banco de dados.");
      return;
    }

    // 1. Cálculo das Média de Moradores e Trabalhadores
    const somaMoradores = respostas.reduce((acc, curr) => acc + (Number(curr.moradores) || 0), 0);
    const somaTrabalhadores = respostas.reduce((acc, curr) => acc + (Number(curr.trabalhadores) || 0), 0);

    const mediaMoradores = (somaMoradores / total).toFixed(1);
    const mediaTrabalhadores = (somaTrabalhadores / total).toFixed(1);

    document.getElementById("media-moradores").textContent = mediaMoradores;
    document.getElementById("media-trabalhadores").textContent = mediaTrabalhadores;

    // 2. Processamento para Gráficos
    
    // Contagem: Presidência
    const contagemPresidencia = contagemFrequencia(respostas, "votoPresidente");
    // Contagem: Certeza do Voto
    const contagemCerteza = contagemFrequencia(respostas, "certezaVoto");
    // Contagem: Bairros
    const contagemBairros = contagemFrequencia(respostas, "bairro");
    
    // Contagem: Pautas (Array)
    const contagemPautas = {};
    respostas.forEach(r => {
      if (Array.isArray(r.pautas)) {
        r.pautas.forEach(pauta => {
          contagemPautas[pauta] = (contagemPautas[pauta] || 0) + 1;
        });
      }
    });

    // 3. Renderização dos Gráficos com Chart.js
    renderizarGraficoPie("chartPresidencia", Object.keys(contagemPresidencia), Object.values(contagemPresidencia), "Votos");
    renderizarGraficoDoughnut("chartCerteza", Object.keys(contagemCerteza), Object.values(contagemCerteza));
    renderizarGraficoBar("chartBairros", Object.keys(contagemBairros), Object.values(contagemBairros), "Respostas por Bairro");
    renderizarGraficoBar("chartPautas", Object.keys(contagemPautas), Object.values(contagemPautas), "Votos em Pautas");

  } catch (error) {
    console.error("Erro ao carregar dados do Firestore:", error);
    alert("Erro ao carregar dados do Firestore.");
  }
}

// Função auxiliar para contar frequências de strings
function contagemFrequencia(arr, chave) {
  return arr.reduce((acc, obj) => {
    const valor = obj[chave] || "Não Informado";
    acc[valor] = (acc[valor] || 0) + 1;
    return acc;
  }, {});
}

/* ==========================================================================
   Funções de Renderização com Chart.js (Estilo em Tons de Azul)
   ========================================================================== */
const CORES_AZUL = ["#003366", "#0056b3", "#3385ff", "#80bdff", "#b3d7ff", "#002244", "#004488"];

function renderizarGraficoPie(idElemento, labels, data, titulo) {
  new Chart(document.getElementById(idElemento), {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: CORES_AZUL
      }]
    }
  });
}

function renderizarGraficoDoughnut(idElemento, labels, data) {
  new Chart(document.getElementById(idElemento), {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: CORES_AZUL
      }]
    }
  });
}

function renderizarGraficoBar(idElemento, labels, data, labelDataset) {
  new Chart(document.getElementById(idElemento), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: labelDataset,
        data: data,
        backgroundColor: '#0056b3',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}
