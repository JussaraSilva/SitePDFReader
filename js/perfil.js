document.addEventListener("DOMContentLoaded", async () => {
  showMoreDescriptions();
  setupReadMoreButton();
  handleShowHideCards();
  iniciarToggleMensagemOptions();

  lucide.createIcons();

  setupAbasConversas();
  setupRespostaComentarios();
  initBotaoPostar();

});

function showMoreDescriptions() {
  const cards = document.querySelectorAll('.book-card');

  cards.forEach(card => {
    const btn = card.querySelector('.read-more');
    const desc = card.querySelector('.book-desc');

    if (!btn || !desc || btn.dataset.listener === 'true') return;

    btn.dataset.listener = 'true'; // Marca que já foi adicionado o listener

    btn.addEventListener('click', () => {
      const isExpanded = card.classList.toggle('expanded');
      btn.innerText = isExpanded ? 'Mostrar menos' : 'Leia mais';

      document.querySelectorAll('.book-card.expanded').forEach(otherCard => {
        if (otherCard !== card) {
          otherCard.classList.remove('expanded');
          const otherBtn = otherCard.querySelector('.read-more');
          if (otherBtn) otherBtn.innerText = 'Leia mais';
        }
      });
    });
  });
}

function setupReadMoreButton() {
  const readMoreButtons = document.querySelectorAll('.read-more');

  readMoreButtons.forEach(button => {
    const description = button.previousElementSibling;

    // Verifica se o texto precisa do botão (se excede 3 linhas)
    if (description.scrollHeight > description.clientHeight) {
      button.style.display = 'block'; // Mostra o botão se necessário
    } else {
      button.style.display = 'none'; // Esconde se não for necessário
    }

    button.addEventListener('click', function() {
      description.classList.toggle('expanded');

      if (description.classList.contains('expanded')) {
        button.textContent = 'Leia Menos';
      } else {
        button.textContent = 'Leia Mais';
      }
    });
  });
}


function setupAbasConversas() {
  const tabSobre = document.querySelector('.tab-perfil.perfilSobre');
  const tabConversas = document.querySelector('.tab-perfil.perfilConversas');
  const secaoLista = document.querySelector('.list-section');
  const secaoConversas = document.querySelector('.conversas-section');

  if (tabSobre && tabConversas && secaoLista && secaoConversas) {
    tabSobre.addEventListener('click', () => {
      tabSobre.classList.add('active');
      tabConversas.classList.remove('active');
      secaoLista.classList.remove('hidden');
      secaoConversas.classList.add('hidden');
    });

    tabConversas.addEventListener('click', () => {
      tabConversas.classList.add('active');
      tabSobre.classList.remove('active');
      secaoConversas.classList.remove('hidden');
      secaoLista.classList.add('hidden');
    });
  }
}

// Respostas em comentários
function setupRespostaComentarios() {
  const botoesResponder = document.querySelectorAll('.responder-btn');

  if (botoesResponder.length > 0) {
    botoesResponder.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.caixa-resposta').forEach(caixa => {
          caixa.classList.add('hidden');
          const textarea = caixa.querySelector('textarea');
          if (textarea) textarea.value = '';
        });

        document.querySelectorAll('.botoes-resposta').forEach(b => b.style.display = 'none');
        document.querySelectorAll('.enviar-btn').forEach(b => {
          b.classList.remove('ativo');
          b.disabled = true;
        });

        const comentarioCard = btn.closest('.comentario-card');
        const caixa = comentarioCard.querySelector('.caixa-resposta');
        const textarea = caixa.querySelector('textarea');
        const enviarBtn = comentarioCard.querySelector('.enviar-btn');
        const botoes = comentarioCard.querySelector('.botoes-resposta');

        caixa.classList.remove('hidden');
        botoes.style.display = 'flex';
        textarea.focus();

        textarea.addEventListener('input', () => {
          const temTexto = textarea.value.trim().length > 0;
          enviarBtn.classList.toggle('ativo', temTexto);
          enviarBtn.disabled = !temTexto;
        });

        comentarioCard.querySelector('.cancelar-btn').addEventListener('click', () => {
          textarea.value = '';
          enviarBtn.classList.remove('ativo');
          enviarBtn.disabled = true;
          caixa.classList.add('hidden');
          botoes.style.display = 'none';
        });

        enviarBtn.addEventListener('click', () => {
          console.log(`Comentário respondido: ${textarea.value}`);
          textarea.value = '';
          enviarBtn.classList.remove('ativo');
          enviarBtn.disabled = true;
          caixa.classList.add('hidden');
          botoes.style.display = 'none';
        });
      });
    });
  }
}

// Expandir página mostrar novos cards
function handleShowHideCards() {
  const allCards = document.querySelectorAll('.book-card');
  const showMoreBtn = document.querySelector('.btn-verMais');
  const cardsToShow = 6;
  let expanded = false;

  if (!showMoreBtn || allCards.length <= cardsToShow) return;

  // Esconde os cards extras inicialmente usando classe .hide
  allCards.forEach((card, index) => {
    if (index >= cardsToShow) {
      card.classList.add('hide');
    }
  });

  showMoreBtn.addEventListener('click', () => {
    expanded = !expanded;

    allCards.forEach((card, index) => {
      if (index >= cardsToShow) {
        card.classList.toggle('hide', !expanded);
      }
    });

    showMoreBtn.innerText = expanded ? 'Ver menos' : 'Ver mais';

    // Reaplica os eventos do botão Leia mais nos cards que aparecerem
    showMoreDescriptions();
  });
}


function iniciarToggleMensagemOptions() {
  const opcoes = document.querySelectorAll('.opcoesMensagem');

  opcoes.forEach(opcao => {
    const icone = opcao.querySelector('i');
    const menu = opcao.querySelector('.mensagemOptions');

    // Esconde o menu inicialmente
    menu.style.display = 'none';

    icone.addEventListener('click', function (e) {
      e.stopPropagation();

      // Fecha todos os outros menus antes de abrir o atual (opcional)
      document.querySelectorAll('.mensagemOptions').forEach(m => {
        if (m !== menu) m.style.display = 'none';
      });

      // Alterna o display do menu atual
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });
  });

  // Fecha qualquer menu aberto ao clicar fora
  document.addEventListener('click', function () {
    document.querySelectorAll('.mensagemOptions').forEach(menu => {
      menu.style.display = 'none';
    });
  });
}

function initBotaoPostar() {
  const textarea = document.querySelector('.areaMensagem');
  const btnPostar = document.querySelector('.btnPostar');
  const formMensagem = document.querySelector('.post-mensagem');

  if (!textarea || !btnPostar || !formMensagem) return;

  textarea.addEventListener('focus', () => {
    btnPostar.classList.add('show');
  });

  document.addEventListener('click', (e) => {
    if (!formMensagem.contains(e.target)) {
      btnPostar.classList.remove('show');
    }
  });
}