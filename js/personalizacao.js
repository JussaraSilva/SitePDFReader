document.addEventListener("DOMContentLoaded", async () => {
  // Roda nas outras páginas (como a paginaInicial.html)

  setupToggleTema();
  animateThemeChange();
  trocarImagensTema();

});


// Modifique sua função para isso:
function setupToggleTema() {
  const toggle = document.getElementById('theme');
  if (!toggle) return;

  const html = document.documentElement;

  const applyTheme = (theme) => {
    html.setAttribute('data-theme', theme);
  };

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme);
    toggle.checked = savedTheme === 'dark';
  }

  toggle.addEventListener('change', () => {
    const newTheme = toggle.checked ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });
}


function animateThemeChange() {
  const fill = document.querySelector(".theme__fill");
  fill.style.transition = "none";
  fill.style.transform = "translateX(0)";
  setTimeout(() => {
    fill.style.transition = "transform 0.6s ease-in-out";
    fill.style.transform = "translateX(-100%)";
  }, 50);
}

document.querySelector(".theme__toggle").addEventListener("change", function () {
  const theme = this.checked ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  animateThemeChange();
});

// Função principal: troca imagens conforme o tema
function trocarImagensTema() {
  const temaAtual = document.documentElement.getAttribute('data-theme');
  const ehEscuro = temaAtual === 'dark'; // Verifica se o tema é 'dark'

  // Seleciona todas as imagens com a classe .chapter-img
  const imagens = document.querySelectorAll('.chapter-img');

  imagens.forEach((img) => {
    const nomeBase = img.dataset.nomeBase;
    if (!nomeBase) return; // Se não tiver data-nome-base, ignora

    // Define o caminho da imagem (White para dark, Black para light)
    const novoSrc = `./assets/imagens-capitulos/${nomeBase}-${ehEscuro ? 'White' : 'Black'}.png`;
    img.src = novoSrc;


  });
}

// --- Configuração dos Eventos ---
// 1. Botão de troca de tema (exemplo genérico)
document.getElementById('theme')?.addEventListener('click', () => {
  const html = document.documentElement;
  const temaAtual = html.getAttribute('data-theme');
  const novoTema = temaAtual === 'light' ? 'dark' : 'light';

  // Atualiza o tema no HTML
  html.setAttribute('data-theme', novoTema);

  // Chama a função para trocar as imagens
  trocarImagensTema();
});

// 2. Executa ao carregar a página
document.addEventListener('DOMContentLoaded', trocarImagensTema);

// 3. Opcional: Força atualização se o tema mudar via sistema/Saved Preference
// (Útil se o tema for salvo em localStorage, por exemplo)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', trocarImagensTema);

// Quando clicar no botão de tema:
const botaoTema = document.getElementById('theme');
botaoTema.addEventListener('click', () => {
  document.body.classList.toggle('tema-escuro');
  trocarImagensTema();
});

// E no carregamento da página também:
window.addEventListener('DOMContentLoaded', trocarImagensTema);