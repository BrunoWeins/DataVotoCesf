
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

// ======================================================
// 1. CONFIGURAÇÃO DO FIREBASE
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyAjZ2u0T-UM8qkX5ZOsE2x7KACMBL4iz-A",
  authDomain: "datavotocesf-brugala.firebaseapp.com",
  databaseURL: "https://datavotocesf-brugala-default-rtdb.firebaseio.com",
  projectId: "datavotocesf-brugala",
  storageBucket: "datavotocesf-brugala.firebasestorage.app",
  messagingSenderId: "111172208486",
  appId: "1:111172208486:web:8d016eb2061c508b216aa7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Altere se o e-mail autorizado for outro.

const EMAILS_ADMIN_AUTORIZADOS = [
  "gabriela.augusto@escola.pr.gov.br",
  "larissa.cys@escola.pr.gov.br",
  "bruno.weinschutz@escola.pr.gov.br",
  "marcelo.krayevski@escola.pr.gov.br"
];

const COLECAO_RESPOSTAS = "datavoto_cesf_respostas";

// ======================================================
// 2. ELEMENTOS DA PÁGINA
// ======================================================

const formLogin = document.getElementById("form-login");
const inputSenha = document.getElementById("senha-admin");
const inputEmail = document.getElementById("email-admin");

const loginContainer = document.getElementById("login-container");
const dashboardContainer = document.getElementById("dashboard-container");

const btnLogout = document.getElementById("btn-logout");
const btnLimparDados = document.getElementById("btn-limpar-dados");

let instanciacoesGraficos = {};
let carregandoPainel = false;

// ======================================================
// 3. LOGIN COM FIREBASE AUTHENTICATION
// ======================================================

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const email = inputEmail.value.trim();
  const senha = inputSenha.value;
  const botao = formLogin.querySelector('button[type="submit"]');

  if (botao) {
    botao.disabled = true;
    botao.textContent = "Entrando...";
  }

  try {
    await signInWithEmailAndPassword(auth, email, senha);

    const usuario = auth.currentUser;

    if (usuario && !usuario.emailVerified) {
      await sendEmailVerification(usuario);

      alert(
        "Enviamos um e-mail de verificação para " +
        usuario.email +
        ". Abra sua caixa de entrada e clique no link para confirmar."
      );

      await signOut(auth);
    }

    // A verificação de autorização acontece no observador abaixo.
  } catch (erro) {
    console.error("Erro no login:", erro);

    alert(
      "Não foi possível entrar. Confira o e-mail e a senha " +
      "e verifique se a conta está cadastrada no Firebase."
    );

    inputSenha.value = "";
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = "Entrar no Painel";
    }
  }
});

// ======================================================
// 4. VERIFICAÇÃO DA SESSÃO E ÇÃO
// ======================================================

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    carregandoPainel = false;
    dashboardContainer.style.display = "none";
    loginContainer.style.display = "block";
    return;
  }

  const autorizado =
    EMAILS_ADMIN_AUTORIZADOS.includes(
      (usuario.email || "").trim().toLowerCase()
    ) && usuario.emailVerified === true;



  console.log("E-mail conectado:", usuario.email);
  console.log("E-mail verificado:", usuario.emailVerified);
  console.log("E-mails permitidos:", EMAILS_ADMIN_AUTORIZADOS);


  if (!autorizado) {
    dashboardContainer.style.display = "none";
    loginContainer.style.display = "block";

    alert(
      "Esta conta não tem autorização para acessar o painel. " +
      "Use a conta administrativa autorizada e verifique seu e-mail."
    );

    await signOut(auth);
    return;
  }

  loginContainer.style.display = "none";
  dashboardContainer.style.display = "block";

  if (!carregandoPainel) {
    carregandoPainel = true;

    try {
      await carregarDadosEGerarRelatorios();
    } finally {
      carregandoPainel = false;
    }
  }
});

// ======================================================
// 5. SAIR DO PAINEL
// ======================================================

btnLogout.addEventListener("click", async () => {
  try {
    await signOut(auth);
    inputSenha.value = "";
    inputEmail.value = "";
  } catch (erro) {
    console.error("Erro ao sair:", erro);
    alert("Não foi possível encerrar a sessão.");
  }
});

// ======================================================
// 6. CARREGAR RESPOSTAS E ATUALIZAR O PAINEL
// ======================================================

async function carregarDadosEGerarRelatorios() {
  try {
    const consulta = await getDocs(
      collection(db, COLECAO_RESPOSTAS)
    );

    const respostas = [];

    consulta.forEach((documento) => {
      respostas.push(documento.data());
    });

    const total = respostas.length;

    document.getElementById("total-respostas").textContent = total;

    if (total === 0) {
      document.getElementById("media-moradores").textContent = "0";
      document.getElementById("media-trabalhadores").textContent = "0";

      limparGraficosExistentes();
      return;
    }

    // Médias de moradores e trabalhadores
    const somaMoradores = respostas.reduce(
      (total, resposta) =>
        total + (Number(resposta.moradores) || 0),
      0
    );

    const somaTrabalhadores = respostas.reduce(
      (total, resposta) =>
        total + (Number(resposta.trabalhadores) || 0),
      0
    );

    document.getElementById("media-moradores").textContent =
      (somaMoradores / total).toFixed(1);

    document.getElementById("media-trabalhadores").textContent =
      (somaTrabalhadores / total).toFixed(1);

    // Contagem das respostas
    const contagemPresidencia = contagemFrequencia(
      respostas,
      "votoPresidente"
    );

    const contagemCerteza = contagemFrequencia(
      respostas,
      "certezaVoto"
    );

    const contagemBairros = contagemFrequencia(
      respostas,
      "bairro"
    );

    // Contagem de pautas prioritárias
    const contagemPautas = {};

    respostas.forEach((resposta) => {
      if (Array.isArray(resposta.pautas)) {
        resposta.pautas.forEach((pauta) => {
          contagemPautas[pauta] =
            (contagemPautas[pauta] || 0) + 1;
        });
      }
    });

    // Renderização dos gráficos
    renderizarGraficoPie(
      "chartPresidencia",
      Object.keys(contagemPresidencia),
      Object.values(contagemPresidencia)
    );

    renderizarGraficoDoughnut(
      "chartCerteza",
      Object.keys(contagemCerteza),
      Object.values(contagemCerteza)
    );

    renderizarGraficoBar(
      "chartBairros",
      Object.keys(contagemBairros),
      Object.values(contagemBairros),
      "Respostas por Bairro"
    );

    renderizarGraficoBar(
      "chartPautas",
      Object.keys(contagemPautas),
      Object.values(contagemPautas),
      "Respostas por Pauta"
    );

  } catch (erro) {
    console.error("Erro ao carregar dados do Firestore:", erro);

    alert(
      "Não foi possível carregar os dados. " +
      "Confira o login e as regras do Firestore."
    );
  }
}

// ======================================================
// 7. LIMPAR A BASE DE DADOS
// ======================================================

btnLimparDados.addEventListener("click", async () => {
  const usuario = auth.currentUser;


  if (
    !usuario ||
    !EMAILS_ADMIN_AUTORIZADOS.includes(
      (usuario.email || "").trim().toLowerCase()
    ) ||
    !usuario.emailVerified
  ) {
    alert("Você não tem autorização para apagar os dados.");
    return;
  };

  const confirmacao1 = confirm(
    "ATENÇÃO: deseja realmente apagar TODAS as respostas da pesquisa?"
  );

  if (!confirmacao1) return;

  const confirmacao2 = prompt(
    'Para confirmar a exclusão permanente, digite "DELETAR":'
  );

  if (confirmacao2 !== "DELETAR") {
    alert("Exclusão cancelada.");
    return;
  }

  btnLimparDados.disabled = true;
  btnLimparDados.textContent = "Apagando dados...";

  try {
    const consulta = await getDocs(
      collection(db, COLECAO_RESPOSTAS)
    );

    if (consulta.empty) {
      alert("A base de dados já está vazia!");
      return;
    }

    const exclusoes = [];

    consulta.forEach((documento) => {
      exclusoes.push(
        deleteDoc(doc(db, COLECAO_RESPOSTAS, documento.id))
      );
    });

    await Promise.all(exclusoes);

    alert("Base de dados limpa com sucesso!");

    await carregarDadosEGerarRelatorios();

  } catch (erro) {
    console.error("Erro ao limpar a base de dados:", erro);

    alert(
      "Não foi possível apagar os dados. " +
      "Confira as permissões administrativas do Firestore."
    );
  } finally {
    btnLimparDados.disabled = false;
    btnLimparDados.textContent = "🗑️ Limpar Base de Dados";
  }
});

// ======================================================
// 8. FUNÇÕES AUXILIARES
// ======================================================

function contagemFrequencia(respostas, chave) {
  return respostas.reduce((contagem, resposta) => {
    const valor = resposta[chave] || "Não Informado";

    contagem[valor] = (contagem[valor] || 0) + 1;

    return contagem;
  }, {});
}

function destruirGraficoSeExiste(idElemento) {
  if (instanciacoesGraficos[idElemento]) {
    instanciacoesGraficos[idElemento].destroy();
    delete instanciacoesGraficos[idElemento];
  }
}

function limparGraficosExistentes() {
  Object.keys(instanciacoesGraficos).forEach((id) => {
    instanciacoesGraficos[id].destroy();
  });

  instanciacoesGraficos = {};
}

// ======================================================
// 9. CONFIGURAÇÃO DOS GRÁFICOS
// ======================================================

const CORES_AZUL = [
  "#003366",
  "#0056b3",
  "#3385ff",
  "#80bdff",
  "#b3d7ff",
  "#002244",
  "#004488"
];

function renderizarGraficoPie(idElemento, labels, data) {
  destruirGraficoSeExiste(idElemento);

  instanciacoesGraficos[idElemento] = new Chart(
    document.getElementById(idElemento),
    {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: CORES_AZUL
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true
      }
    }
  );
}

function renderizarGraficoDoughnut(idElemento, labels, data) {
  destruirGraficoSeExiste(idElemento);

  instanciacoesGraficos[idElemento] = new Chart(
    document.getElementById(idElemento),
    {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: CORES_AZUL
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true
      }
    }
  );
}

function renderizarGraficoBar(idElemento, labels, data, labelDataset) {
  destruirGraficoSeExiste(idElemento);

  instanciacoesGraficos[idElemento] = new Chart(
    document.getElementById(idElemento),
    {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: labelDataset,
          data,
          backgroundColor: "#0056b3",
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    }
  );
}
