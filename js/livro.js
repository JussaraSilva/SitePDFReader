document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();
  setupDropdowns();
  setupDrawerCapitulos();
  setupAbasComentarios();
  setupRespostaComentarios();
  setupToggleTema();
  setupBibliotecaBtns();
  setupReadMoreButton();
});


// Pega o id do livro da URL uma vez só
const urlParams = new URLSearchParams(window.location.search);
const livroId = urlParams.get('id');

async function carregarDetalhesLivro(livroId) {
  const erroDiv = document.getElementById('mensagemErro');
  // Esconde qualquer mensagem de erro visível no início
  if (erroDiv) {
    erroDiv.style.display = 'none';
    erroDiv.innerHTML = '';
  }

  // 1) Tenta buscar no Archive.org (via carregarDadosLivro)
  let dadosArchive = null;
  try {
    dadosArchive = await carregarDadosLivro(livroId, { precisaDescricao: true });
  } catch (e) {
    console.warn(`Falha ao buscar dados no Archive.org para ${livroId}:`, e);
  }

  // 2) Se não veio nada do Archive.org, tenta Google Books (via buscarDadosNoGoogleBooks)
  let dadosGoogle = null;
  if (!dadosArchive) {
    try {
      dadosGoogle = await buscarDadosNoGoogleBooks(livroId);
    } catch (e) {
      console.warn(`Falha ao buscar dados no Google Books para "${livroId}":`, e);
    }
  }

  // 3) Se ambas as buscas retornaram null → ID não encontrado em nenhuma fonte → erro
  if (!dadosArchive && !dadosGoogle) {
    if (erroDiv) {
      erroDiv.style.display = 'block';
      erroDiv.innerHTML = '<h1>Não foi possível encontrar o livro pelo ID fornecido.</h1>';
    }
    return;
  }

  // 4) Caso contrário, escondemos qualquer erro pendente e preenchemos o DOM
  if (erroDiv) {
    erroDiv.style.display = 'none';
    erroDiv.innerHTML = '';
  }

  // Escolhe a fonte principal: Archive.org se existir, senão Google
  const fonte = dadosArchive || dadosGoogle;

  // 5) Atualiza o DOM com título, autor e descrição
  const tituloLivro   = document.getElementById('tituloLivro');
  const autorLivro    = document.getElementById('autorLivro');
  const descricaoEl   = document.getElementById('descricao');
  const capaDiv       = document.querySelector('.hero-bg-livro');
  const btnVisualizar = document.querySelector('.btn-action.visualizar.btn');

  if (tituloLivro) {
    tituloLivro.textContent = fonte.titulo || livroId;
  }
  if (autorLivro) {
    autorLivro.textContent = fonte.autor || 'Autor não disponível';
  }
  if (descricaoEl) {
    descricaoEl.textContent = fonte.descricao || 'Descrição não disponível';
  }

  // 6) Define a capa de fundo:
  //    - Primeiro tenta a imagem do Google Books (dadosGoogle.imagem)
  //    - Senão, tenta capaUrl do Archive.org (dadosArchive.capaUrl)
  let urlCapa = null;
  if (dadosGoogle && dadosGoogle.imagem) {
    urlCapa = dadosGoogle.imagem;
  } else if (dadosArchive && dadosArchive.capaUrl) {
    urlCapa = dadosArchive.capaUrl;
  }
  if (capaDiv && urlCapa) {
    console.log("URL da capa escolhida:", urlCapa);
    capaDiv.style.backgroundImage = `url(${urlCapa})`;
  }

  // 7) Atualiza o botão "Visualizar" para incluir ?id=livroId
  if (btnVisualizar) {
    btnVisualizar.href = `paginaLeitura.html?id=${livroId}`;
  }
}

// 8) Chama a função assim que a página carregar (se houver `?id=...` na URL)
if (livroId) {
  carregarDetalhesLivro(livroId);
} else {
  const erroDiv = document.getElementById('mensagemErro');
  if (erroDiv) {
    erroDiv.style.display = 'block';
    erroDiv.innerHTML = '<h1>ID do livro não fornecido</h1>';
  }
}


async function buscarDadosNoGoogleBooks(titulo) {
  const query = encodeURIComponent(titulo);
  const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erro ${response.status} na busca do Google Books`);

    const data = await response.json();
    if (data.totalItems === 0) return null;

    const livro = data.items[0].volumeInfo;
    return {
      descricao: livro.description || "Descrição não disponível",
      autor: (livro.authors && livro.authors.join(', ')) || "Autor desconhecido",
      imagem: livro.imageLinks?.thumbnail?.replace('http://', 'https://') || null
    };
  } catch (err) {
    console.warn(`Erro ao buscar dados no Google Books para "${titulo}"`, err);
    return null;
  }
}
async function carregarDadosLivro(identifier, options = {}) {
  const cacheKey = `cacheArchive_${identifier}`;
  const cache = localStorage.getItem(cacheKey);
  if (cache) {
    return JSON.parse(cache);
  }

  const isPaginaLeitura = document.getElementById("descricaoLivro") !== null;

  if (isPaginaLeitura && !options.force) {
    return null;
  }

  const {
    precisaPDF = false,
    precisaDescricao = true,
    limparHTML = false
  } = options;

  if (!identifier) {
    console.error('Identificador do livro não fornecido');
    return null;
  }

  try {
    const response = await fetch(`https://archive.org/details/${identifier}`);
    if (!response.ok) {
      console.error(`Livro ${identifier} não encontrado (status ${response.status})`);
      return null;
    }

    const data = await response.json();
    if (!data || !data.metadata) {
      console.error(`Dados inválidos para o livro ${identifier}`);
      return null;
    }

    const metadata = data.metadata;
    const files = data.files || [];

    // Debug: Mostra todos os arquivos disponíveis
    console.log('Arquivos disponíveis:', files.map(f => ({
      name: f.name,
      format: f.format,
      size: f.size
    })));

    // PDF, se necessário - Versão melhorada
    let pdfInfo = null;
    if (precisaPDF) {
      let arquivoPDF = null;
      const titleKeywords = metadata.title ? metadata.title.toLowerCase().split(/\s+/) : [];

      // 1. Busca por formato Text PDF (mais confiável)
      arquivoPDF = files.find(file => file.format === 'Text PDF');

      // 2. Busca por extensão .pdf (case insensitive)
      if (!arquivoPDF) {
        arquivoPDF = files.find(file =>
          file.name.toLowerCase().endsWith('.pdf')
        );
      }

      // 3. Busca por palavras-chave do título
      if (!arquivoPDF && titleKeywords.length > 0) {
        arquivoPDF = files.find(file =>
          file.name.toLowerCase().endsWith('.pdf') &&
          titleKeywords.some(keyword =>
            file.name.toLowerCase().includes(keyword)
          )
        );
      }

      // 4. Fallback: primeiro PDF encontrado
      if (!arquivoPDF) {
        const pdfs = files.filter(file =>
          file.name.toLowerCase().endsWith('.pdf')
        );
        if (pdfs.length > 0) {
          arquivoPDF = pdfs[0];
          console.warn(`Usando fallback de PDF: ${arquivoPDF.name}`);
        }
      }

      if (arquivoPDF) {
        pdfInfo = {
          // Use a versão /stream/ que é mais amigável para CORS
          url: `https://archive.org/stream/${identifier}/${encodeURIComponent(arquivoPDF.name)}`,
          nomeArquivo: arquivoPDF.name,
          tamanho: arquivoPDF.size
        };
        console.log('PDF detectado:', pdfInfo.url);
      }
    }

    const titulo = metadata.title || "Título desconhecido";

    // Google Books: buscar descrição, autor e imagem
    let descricao = "Descrição não disponível";
    let autor = "Autor desconhecido";
    let capaUrl = './assets/capas-books/default-book.png';

    if (precisaDescricao) {
      const dadosGoogle = await buscarDadosNoGoogleBooks(titulo);
      if (dadosGoogle) {
        descricao = dadosGoogle.descricao;
        autor = dadosGoogle.autor;
        if (dadosGoogle.imagem) {
          capaUrl = dadosGoogle.imagem;
        }
      }
    }

    // Se ainda não temos imagem, tenta pegar do Archive
    if (capaUrl === './assets/capas-books/default-book.png') {
      const capa = files.find(file =>
        file.format === 'JPEG' ||
        file.name.toLowerCase().endsWith('.jpg') ||
        file.name.toLowerCase().endsWith('.png')
      );
      if (capa) {
        capaUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(capa.name)}`;
      }
    }

    if (limparHTML && typeof descricao === 'string') {
      descricao = limparEstilosHTML(descricao);
    }

    const resultado = {
      identifier,
      titulo,
      autor,
      descricao: descricao.trim(),
      capaUrl,
      metadadosCompletos: metadata
    };

    if (precisaPDF) {
      resultado.pdf = pdfInfo;
    }

    // Salva no cache localStorage
    localStorage.setItem(cacheKey, JSON.stringify(resultado));

    return resultado;

  } catch (error) {
    console.error(`Erro ao carregar livro ${identifier}:`, error);
    return null;
  }
}

async function carregarMetadados(identifier) {
  if (!document.getElementById('pdf-viewer-container')) return;
  try {
    const response = await fetch(`https://archive.org/metadata/${identifier}`);
    const metadados = await response.json();

    // Limpa estilo da descrição
    const descricaoBruta = metadados.metadata.description || "Sem descrição disponível.";
    const descricaoSemEstilo = limparEstilosHTML(descricaoBruta);

    // Verifica se o elemento existe antes de atualizar
    const descricaoElement = document.getElementById("descricaoLivro");
    if (descricaoElement) {
      descricaoElement.innerHTML = descricaoSemEstilo;
    }

    // Preenche título e autor (verificando se os elementos existem)
    const tituloElement = document.getElementById("tituloLivro");
    if (tituloElement) {
      tituloElement.textContent = metadados.metadata.title || "Sem título";
    }

    const autorElement = document.getElementById("autorLivro");
    if (autorElement) {
      autorElement.textContent = metadados.metadata.creator || "Autor desconhecido";
    }

    // Processamento do PDF (apenas se estiver na página de leitura)
    const arquivoPDF = metadados.files.find(file => file.name.endsWith('.pdf'));
    if (arquivoPDF && typeof initPDFViewer === 'function') {
      const proxyURL = "https://cors-anywhere.herokuapp.com/";
      const pdfURL = `${proxyURL}https://archive.org/download/${identifier}/${arquivoPDF.name}`;
      initPDFViewer(pdfURL).init();
    }

  } catch (erro) {
    console.error("Erro ao carregar metadados:", erro);
  }
}

function limparEstilosHTML(html) {
  const div = document.createElement("div");
  div.innerHTML = html;

  const elementos = div.querySelectorAll("*");
  elementos.forEach(el => el.removeAttribute("style"));

  return div.innerHTML;
}

// Drawer de capítulos
function setupDrawerCapitulos() {
  const btn = document.querySelector('#btnVerCapitulos');
  const drawer = document.querySelector('#drawerCapitulos');
  const fechar = document.querySelector('#fecharDrawer');
  const overlay = document.querySelector('#overlayDrawer');

  if (btn && drawer && fechar && overlay) {
    btn.addEventListener('click', () => {
      drawer.classList.add('ativo');
      overlay.classList.add('ativo');
    });

    [fechar, overlay].forEach(el => el.addEventListener('click', () => {
      drawer.classList.remove('ativo');
      overlay.classList.remove('ativo');
    }));
  }
}

// Botões de adicionar/remover livro
// Botões de adicionar/remover livro
function setupBibliotecaBtns() {
  const btnAdicionar = document.querySelector('.add-btn');
  const btnRemover = document.querySelector('.remover-btn');

  if (btnAdicionar && btnRemover) {
    btnRemover.style.display = 'none';
    btnAdicionar.classList.add('ativo');

    btnAdicionar.addEventListener('click', () => {
      btnAdicionar.style.display = 'none';
      btnRemover.style.display = 'inline-flex';
      btnAdicionar.classList.remove('ativo');
      btnRemover.classList.add('ativo');
      console.log('Livro adicionado à biblioteca');
    });

    btnRemover.addEventListener('click', () => {
      btnRemover.style.display = 'none';
      btnAdicionar.style.display = 'inline-flex';
      btnRemover.classList.remove('ativo');
      btnAdicionar.classList.add('ativo');
      console.log('Livro removido da biblioteca');
    });
  }
}

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

// Abas Avaliações e Comentários
function setupAbasComentarios() {
  const tabAvaliacoes = document.querySelector('.tab.avaliacoes');
  const tabComentarios = document.querySelector('.tab.comentarios');
  const secaoAvaliacoes = document.querySelector('.feedbakCards');
  const secaoComentarios = document.querySelector('.comentariosCards');

  if (tabAvaliacoes && tabComentarios && secaoAvaliacoes && secaoComentarios) {
    tabAvaliacoes.addEventListener('click', () => {
      tabAvaliacoes.classList.add('active');
      tabComentarios.classList.remove('active');
      secaoAvaliacoes.classList.remove('hidden');
      secaoComentarios.classList.add('hidden');
    });

    tabComentarios.addEventListener('click', () => {
      tabComentarios.classList.add('active');
      tabAvaliacoes.classList.remove('active');
      secaoComentarios.classList.remove('hidden');
      secaoAvaliacoes.classList.add('hidden');
    });
  }
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