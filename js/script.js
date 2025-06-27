document.addEventListener("DOMContentLoaded", async () => {

  setupDropdowns();

});



// Dropdowns (usuário, config, notificações)
function setupDropdowns() {
  const dropdowns = [
    { btn: '.foto-perfil', menu: '.menu-usuario-detalhado' },
    { btn: '#btnConfig', menu: '#menuConfig' },
    { btn: '#btnNotific', menu: '#menuNotific' }
  ];

  dropdowns.forEach(({ btn, menu }) => {
    const button = document.querySelector(btn);
    const dropdown = document.querySelector(menu);

    if (button && dropdown) {
      button.addEventListener('click', () => dropdown.classList.toggle('ativo'));
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !button.contains(e.target)) {
          dropdown.classList.remove('ativo');
        }
      });
    }
  });
}





// Expandir descrição do Livro











