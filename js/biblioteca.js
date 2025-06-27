document.addEventListener("DOMContentLoaded", async () => {

  setupToggleTema();

  setupFiltros();


  // Roda nas outras páginas (como a paginaInicial.html)
  lucide.createIcons();
  setupDropdowns();

});

// Botões de filtro
function setupFiltros() {
  const botoes = document.querySelectorAll('.filter-btn');
  if (botoes.length > 0) {
    botoes.forEach(button => {
      button.addEventListener('click', function () {
        botoes.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }
}


