document.addEventListener("DOMContentLoaded", async () => {
  setupControleFonte();
  setupCapitulosLeitura();
  setupSidebar();
  setupTriggerMenuLeitura();
  setupToggleTema();



});

// Variavel usada para calcular a página do livro
let paginaAtual = 1;



// Essa parte tem que estar FORA da função acima 👇
function setupTriggerMenuLeitura() {
  const trigger = document.querySelector(".trigger-menu-leitura");
  const menu = document.querySelector(".menu-oculto-page-leitura");

  if (!trigger || !menu) return;

  const topoFechado = '-18px';
  const topoAberto = '24px';

  function toggleMenu() {
    const isOpen = menu.classList.toggle("ativo");
    trigger.classList.add("transparente");

    if (isOpen) {
      trigger.style.top = topoAberto;
      trigger.classList.add("rotacionado");
    } else {
      trigger.style.top = topoFechado;
      trigger.classList.remove("rotacionado");
    }

    setTimeout(() => {
      trigger.classList.remove("transparente");
    }, 500);
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", (e) => {
    const isClickInside = menu.contains(e.target) || trigger.contains(e.target);
    if (!isClickInside && menu.classList.contains("ativo")) {
      menu.classList.remove("ativo");
      trigger.classList.add("transparente");
      trigger.style.top = topoFechado;
      trigger.classList.remove("rotacionado");

      setTimeout(() => {
        trigger.classList.remove("transparente");
      }, 500);
    }
  });

  trigger.style.top = topoFechado;
}


// Controle de fonte
function setupControleFonte() {
  const corpo = document.querySelector('.corpo-leitura');
  const aumentar = document.getElementById('aumentarFonte');
  const diminuir = document.getElementById('diminuirFonte');

  if (corpo && aumentar && diminuir) {
    let tamanhoFonte = 1;
    const min = 0.8;
    const max = 2;

    const atualizar = () => {
      corpo.style.fontSize = `${tamanhoFonte.toFixed(1)}rem`;
      aumentar.disabled = tamanhoFonte >= max;
      diminuir.disabled = tamanhoFonte <= min;
      aumentar.classList.toggle('desativado', tamanhoFonte >= max);
      diminuir.classList.toggle('desativado', tamanhoFonte <= min);
    };

    aumentar.addEventListener('click', () => {
      if (tamanhoFonte < max) {
        tamanhoFonte += 0.1;
        atualizar();
      }
    });

    diminuir.addEventListener('click', () => {
      if (tamanhoFonte > min) {
        tamanhoFonte -= 0.1;
        atualizar();
      }
    });

    atualizar();
  }
}

// Capítulos leitura toggle
function setupCapitulosLeitura() {
  document.querySelectorAll('.pagina-leitura-capitulo').forEach(capitulo => {
    const header = capitulo.querySelector('.pagina-leitura-capitulo-header');
    if (header) {
      header.addEventListener('click', () => {
        document.querySelectorAll('.pagina-leitura-capitulo').forEach(c => {
          if (c !== capitulo) c.classList.remove('ativo');
        });
        capitulo.classList.toggle('ativo');
      });
    }
  });
}

function limparEstilosHTML(html) {
  const div = document.createElement("div");
  div.innerHTML = html;

  const elementos = div.querySelectorAll("*");
  elementos.forEach(el => el.removeAttribute("style"));

  return div.innerHTML;
}
// Sidebar leitura
function setupSidebar() {
  const sidebar = document.querySelector('.pagina-leitura-sidebar');
  const toggleMenu = document.querySelector('.acionar-menu');
  if (sidebar && toggleMenu) {
    const iconBars = toggleMenu.querySelector('.fa-bars');
    const iconXmark = toggleMenu.querySelector('.fa-xmark');

    toggleMenu.addEventListener('click', () => {
      const isAtiva = sidebar.classList.toggle('ativa');
      iconBars.style.display = isAtiva ? 'none' : 'inline-block';
      iconXmark.style.display = isAtiva ? 'inline-block' : 'none';
    });
  }
}

async function fetchWithDelay(url, delay = 1000) {
    await new Promise(resolve => setTimeout(resolve, delay));
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}

// ==================== PDF VIEWER MODULE ====================
// Configuração do PDF Viewer com suporte a temas
function initPDFViewer(pdfURL) {


  // 1. Configuração do PDF.js com fallback para versão local se CDN falhar
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
  } catch (e) {
    console.warn('Falha ao carregar PDF.js do CDN, tentando local...');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/path/to/local/pdf.worker.min.js';
  }

  // 2. Estado do viewer
  let pdfDoc = null;
  let currentPage = 1;
  let paginaAtual = 1; // <-- aqui, fora de tudo
  let scale = 1.5;

  // 3. Elementos com fallback seguro
  const getElement = (id) => {
    const el = document.getElementById(id);
    if (!el) console.warn(`Elemento ${id} não encontrado`);
    return el;
  };

  const elements = {
    viewerContainer: getElement('pdf-viewer-container'),
    viewer: getElement('pdf-viewer'),
    prevPageBtn: getElement('prev-page'),
    nextPageBtn: getElement('next-page'),
    currentPageEl: getElement('current-page'),
    totalPagesEl: getElement('total-pages'),
    aumentarBtn: getElement('aumentarFonte'),
    diminuirBtn: getElement('diminuirFonte'),
    bypassCorsBtn: getElement('btn-bypass-cors'),
    accessControl: getElement('pdf-access-control')
  };

  // 4. Função para carregar PDF com múltiplas estratégias
  async function loadPDF(url, attempt = 1) {


    // Limpa o viewer
    if (elements.viewer) elements.viewer.innerHTML = '<div class="loading-pdf">Carregando PDF...</div>';

    try {
      // Tentativa direta primeiro
      if (attempt === 1) {
        return await tryDirectLoad(url);
      }
      // Tentativa com proxy CORS
      else if (attempt === 2) {
        return await tryCorsProxy(url);
      }
      // Tentativa com Archive.org stream
      else if (attempt === 3 && url.includes('archive.org')) {
        return await tryArchiveStream(url);
      }
      // Fallback final com Google Viewer
      else {
        return await tryGoogleViewer(url);
      }
    } catch (error) {


      // Se ainda não tentou todas as estratégias, tenta a próxima
      if (attempt < 4) {
        return loadPDF(url, attempt + 1);
      }

      // Todas as tentativas falharam
      showFinalError(url);
      throw error;
    }
  }

  // 5. Estratégias de carregamento
  async function tryDirectLoad(url) {


    const loadingTask = pdfjsLib.getDocument({
      url: url,
      withCredentials: false,
      httpHeaders: {
        'Accept': 'application/pdf',
        'Cache-Control': 'no-cache'
      },
      disableAutoFetch: false,
      disableStream: false,
      disableRange: true // Melhor para CORS
    });

    const pdf = await loadingTask.promise;
    return pdf;
  }

  async function tryCorsProxy(url) {
    console.log('Tentando com proxy CORS...');

    // Usa um proxy CORS alternativo
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;

    // Primeiro baixa o PDF inteiro
    const response = await fetch(proxyUrl, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) throw new Error(`Proxy falhou com status ${response.status}`);

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const loadingTask = pdfjsLib.getDocument(blobUrl);
    const pdf = await loadingTask.promise;
    console.log(`PDF carregado via proxy - ${pdf.numPages} páginas`);
    return pdf;
  }

  async function tryArchiveStream(url) {

    if (!elements.viewer) throw new Error('Elemento viewer não encontrado');

    const streamUrl = url.replace('/download/', '/stream/') + '?embed=true';
    elements.viewer.innerHTML = `
      <iframe
        src="${streamUrl}"
        style="width:100%;height:100%;border:none;"
        allowfullscreen
      ></iframe>
    `;

    toggleControls(false);
    throw new Error('Usando visualizador do Archive.org'); // Força sair do fluxo normal
  }

  async function tryGoogleViewer(url) {

    if (!elements.viewer) throw new Error('Elemento viewer não encontrado');

    elements.viewer.innerHTML = `
      <iframe
        src="https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true"
        style="width:100%;height:100%;border:none;"
      ></iframe>
    `;

    toggleControls(false);
    throw new Error('Usando Google Viewer'); // Força sair do fluxo normal
  }

  function showFinalError(url) {
    console.error('Todas as tentativas falharam para:', url);

    if (elements.viewer) {
      elements.viewer.innerHTML = `
        <div class="pdf-error">
          <p>Não foi possível carregar o PDF. Tente:</p>
          <ul>
            <li><a href="${url}" target="_blank">Abrir em nova aba</a></li>
            <li><button onclick="window.location.reload()">Recarregar página</button></li>
          </ul>
        </div>
      `;
    }

    if (elements.accessControl) {
      elements.accessControl.style.display = 'block';
    }
  }

  // 6. Funções auxiliares
  function toggleControls(show) {
    const display = show ? 'block' : 'none';
    if (elements.prevPageBtn) elements.prevPageBtn.style.display = display;
    if (elements.nextPageBtn) elements.nextPageBtn.style.display = display;
    if (elements.currentPageEl) elements.currentPageEl.style.display = display;
    if (elements.totalPagesEl) elements.totalPagesEl.style.display = display;
  }

  async function renderPage(pageNum, preserveScale = false) {
  if (!pdfDoc || !elements.viewerContainer) return;

  try {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });

    // Só recalcula o scale se não for para preservar o atual
    if (!preserveScale) {
      const containerWidth = elements.viewerContainer.clientWidth - 20;
      const calculatedScale = (containerWidth / viewport.width) * 0.95;
      scale = Math.min(3.0, Math.max(0.5, calculatedScale)); // Ajustei os limites para bater com os dos botões
    }

    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    if (elements.viewer) {
      elements.viewer.innerHTML = '';
      elements.viewer.appendChild(canvas);

      // Centraliza o canvas no viewer
      elements.viewer.style.textAlign = 'center';
      elements.viewer.style.overflow = 'auto';
    }

    await page.render({
      canvasContext: context,
      viewport: scaledViewport
    }).promise;

    if (elements.currentPageEl) elements.currentPageEl.textContent = pageNum;
  } catch (error) {
    console.error(`Erro ao renderizar página ${pageNum}:`, error);
    throw error;
  }
}


    // 7. Interface pública
  return {
    init: async function() {
      try {
        pdfDoc = await loadPDF(pdfURL);

        if (pdfDoc) {
          await renderPage(currentPage);
          if (elements.totalPagesEl) elements.totalPagesEl.textContent = pdfDoc.numPages;
          toggleControls(true);
        }

        // Controles de navegação e zoom...
        if (elements.prevPageBtn) {
          elements.prevPageBtn.onclick = async () => {
            if (currentPage > 1) await renderPage(--currentPage);
          };
        }

        if (elements.nextPageBtn) {
          elements.nextPageBtn.onclick = async () => {
            if (pdfDoc && currentPage < pdfDoc.numPages) await renderPage(++currentPage);
          };
        }

        if (elements.aumentarBtn) {
          elements.aumentarBtn.onclick = async () => {
            scale = Math.min(3.0, scale + 0.1);
            await renderPage(currentPage, true);
          };
        }

        if (elements.diminuirBtn) {
          elements.diminuirBtn.onclick = async () => {
            scale = Math.max(0.5, scale - 0.1);
            await renderPage(currentPage, true);
          };
        }

      } catch (error) {
        console.error('Erro fatal no PDFViewer:', error);
      }

      window.addEventListener('resize', () => {
        if (pdfDoc) renderPage(currentPage);
      });
    },

    // 👇 Adiciona isso aqui:
    getPdfDocument: function() {
      return pdfDoc;
    },

    renderPage: function(pageNumber) {
      return renderPage(pageNumber);
    }
  };

}

(async () => {
  const params = new URLSearchParams(window.location.search);
  const livroId = params.get('id');

  if (!livroId) {
    console.error('ID do livro não foi passado na URL!');
    return;
  }

  const identifier = livroId;
  const arquivoPDF = { name: `${livroId}.pdf` };
  const pdfURL = `https://archive.org/download/${identifier}/${encodeURIComponent(arquivoPDF.name)}`;

  console.log('URL do PDF:', pdfURL);

  const pdfViewer = initPDFViewer(pdfURL);
  await pdfViewer.init(); // espera o PDF carregar e renderizar a primeira página

  const pdfDoc = pdfViewer.getPdfDocument();
  if (!pdfDoc) {
    console.error('PDF não carregado corretamente.');
    return;
  }

  // Agora, depois do render, extrai e popula a sidebar com capítulos e páginas
  try {
    const paginas = await extrairEstruturaPaginas(pdfDoc);
    preencherSidebar(paginas, livroId);
    configurarNavegacao(pdfViewer, livroId);
  } catch (error) {
    console.error('Erro ao extrair e preencher capítulos/páginas:', error);
  }
})();







// USO NA PÁGINA DO LIVRO
// Função principal que carrega a página do livro (versão minimalista)
// Função principal para carregar a página do livro
async function carregarPaginaLivro() {

  const urlParams = new URLSearchParams(window.location.search);
  const identifier = urlParams.get('id');

  if (!identifier) {
    console.error('[carregarPaginaLivro] ID do livro não encontrado na URL');
    showError('ID do livro não encontrado na URL');
    return;
  }

  const pdfViewer = document.getElementById('pdf-viewer');
  pdfViewer.innerHTML = '<div class="loading">Carregando livro, aguarde...</div>';

  try {

    const livro = await carregarDadosLivro(identifier, {
      precisaPDF: true,
      precisaDescricao: true,
      limparHTML: true,
      force: true // Força a busca mesmo em página de leitura
    });

    if (!livro) {
      console.error('[carregarPaginaLivro] Livro não encontrado');
      showError('Não foi possível carregar os dados do livro.');
      return;
    }



    // Atualiza metadados
    document.getElementById('tituloLivro').textContent = livro.titulo;
    document.getElementById('autorLivro').textContent = livro.autor;
    document.getElementById('descricaoLivro').innerHTML = livro.descricao;

    // Verifica se tem PDF ou EPUB
    if (livro.pdf?.url) {

      pdfViewer.innerHTML = '<div class="loading">Preparando visualizador...</div>';
      initPDFViewer(livro.pdf.url).init();
      document.getElementById('pdf-access-control').style.display = 'none';
    } else if (livro.epub?.url) {

      pdfViewer.innerHTML = '';
      initEPUBViewer(livro.epub.url);
      document.getElementById('pdf-access-control').style.display = 'none';
    } else {
      console.warn('[carregarPaginaLivro] Nenhum formato disponível');
      showError('PDF/EPUB não encontrado para este livro.');
      // Mostra formatos disponíveis para debug
      if (livro.metadadosCompletos?.files) {
        console.log('Formatos disponíveis:', livro.metadadosCompletos.files.map(f => f.format || f.name));
      }
    }
  } catch (error) {

    showError(`Erro ao carregar o livro: ${error.message}`);
  }
}

function showError(message) {
  const pdfViewer = document.getElementById('pdf-viewer');
  pdfViewer.innerHTML = `
    <div class="error">
      ${message}
      <button onclick="carregarPaginaLivro()">Tentar novamente</button>
    </div>
  `;
  document.getElementById('pdf-access-control').style.display = 'block';
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', carregarPaginaLivro);


// Cache simples no localStorage para Archive.org
// Cache simples no localStorage para Archive.org
async function carregarDadosLivro(identifier, options = {}) {

  const {precisaPDF = false, precisaDescricao = true, limparHTML = false, force = false} = options;

  // Verificação de cache modificada
  const cacheKey = `cacheArchive_${identifier}`;
  const cache = localStorage.getItem(cacheKey);

  if (cache) {

    const cachedData = JSON.parse(cache);

    if (!precisaPDF || (precisaPDF && (cachedData.pdf || cachedData.epub))) {

      return cachedData;
    }
    console.log('[carregarDadosLivro] Cache não contém PDF/EPUB necessário, continuando...');


  }



  // Verificação de página de leitura ajustada
  const isPaginaLeitura = document.getElementById("descricaoLivro") !== null;
  console.log('[carregarDadosLivro] isPaginaLeitura:', isPaginaLeitura);

  if (isPaginaLeitura && !force && !precisaPDF) {
    console.log('[carregarDadosLivro] Retornando null (página de leitura sem force)');
    return null;
  }

  if (!identifier) {
    console.error('Identificador do livro não fornecido');
    return null;
  }

  try {

    const response = await fetch(`https://archive.org/metadata/${identifier}`);

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

    // Debug: mostra lista de arquivos
    console.log('Arquivos disponíveis:', files.map(f => ({ name: f.name, format: f.format, size: f.size })));

    // PDF e EPUB
    let pdfInfo = null;
    let epubInfo = null;

    if (precisaPDF) {

      // Filtro mais abrangente para PDFs
      const pdfs = files.filter(file => {
        const lowerName = file.name.toLowerCase();
        return lowerName.endsWith('.pdf') ||
               file.format === 'Text PDF' ||
               file.format === 'Adobe PDF';
      });

      if (pdfs.length > 0) {
        const arquivoPDF = pdfs[0];
        console.log("📄 PDF encontrado:", arquivoPDF);

        const pdfUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(arquivoPDF.name)}`;
        console.log("URL construída:", pdfUrl);

        pdfInfo = {
          url: pdfUrl,
          nomeArquivo: arquivoPDF.name,
          tamanho: arquivoPDF.size
        };
      } else {
        console.warn("⚠️ Nenhum PDF encontrado nos arquivos.");
      }

      // Continua pegando EPUB
      const epubs = files.filter(file => file.name.toLowerCase().endsWith('.epub'));
      if (epubs.length > 0) {
        const arquivoEPUB = epubs[0];
        epubInfo = {
          url: `https://archive.org/download/${identifier}/${encodeURIComponent(arquivoEPUB.name)}`,
          nomeArquivo: arquivoEPUB.name,
          tamanho: arquivoEPUB.size
        };
        console.log('EPUB detectado:', epubInfo.url);
      }
    }

    // Título e metadados
    const titulo = metadata.title || "Título desconhecido";

    // Pega descrição e autor pelo Google Books, se precisar
    let descricao = "Descrição não disponível";
    let autor = "Autor desconhecido";
    let capaUrl = './assets/capas-books/default-book.png';

    if (precisaDescricao) {
      console.log('[carregarDadosLivro] Buscando dados no Google Books...');
      const dadosGoogle = await buscarDadosNoGoogleBooks(titulo);
      if (dadosGoogle) {
        descricao = dadosGoogle.descricao;
        autor = dadosGoogle.autor;
        if (dadosGoogle.imagem) {
          capaUrl = dadosGoogle.imagem;
        }
      }
    }

    // Se não achou imagem no Google, tenta pegar a capa do archive
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
      resultado.epub = epubInfo;
    }

    // Cache localStorage
    console.log('[carregarDadosLivro] Salvando no cache...');
    localStorage.setItem(cacheKey, JSON.stringify(resultado));

    return resultado;

  } catch (error) {
    console.error(`[carregarDadosLivro] Erro ao carregar livro ${identifier}:`, error);
    return null;
  }
}

// Função para carregar PDF com cache
async function loadPDFWithCache(url, livroId) {
    const cacheKey = `pdfCache_${livroId}`;
    const cachedPDF = localStorage.getItem(cacheKey);

    if (cachedPDF) {
        return JSON.parse(cachedPDF);
    }

    try {
        // Adiciona delay para evitar 429
        await new Promise(resolve => setTimeout(resolve, 2000));

        const loadingTask = pdfjsLib.getDocument({
            url: url,
            withCredentials: false,
            httpHeaders: {
                'Accept': 'application/pdf',
                'Cache-Control': 'no-cache'
            },
            disableAutoFetch: false,
            disableStream: false,
            disableRange: true
        });

        const pdf = await loadingTask.promise;

        // Armazena no cache local (apenas metadados)
        localStorage.setItem(cacheKey, JSON.stringify({
            numPages: pdf.numPages,
            url: url,
            cachedAt: new Date().toISOString()
        }));

        return pdf;
    } catch (error) {
        console.error('Erro ao carregar PDF:', error);
        throw error;
    }
}

// Função auxiliar para buscar no Google Books
async function buscarDadosNoGoogleBooks(titulo) {
  const query = encodeURIComponent(titulo);
  const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}`;

  try {
    console.log(`[buscarDadosNoGoogleBooks] Buscando: ${titulo}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erro ${response.status} na busca do Google Books`);

    const data = await response.json();
    if (data.totalItems === 0) {
      console.log('[buscarDadosNoGoogleBooks] Nenhum resultado encontrado');
      return null;
    }

    const livro = data.items[0].volumeInfo;
    return {
      descricao: livro.description || "Descrição não disponível",
      autor: (livro.authors && livro.authors.join(', ')) || "Autor desconhecido",
      imagem: livro.imageLinks?.thumbnail?.replace('http://', 'https://') || null
    };
  } catch (err) {
    console.warn(`[buscarDadosNoGoogleBooks] Erro ao buscar dados para "${titulo}"`, err);
    return null;
  }
}


document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('pdf-viewer-container')) {
    carregarPaginaLivro();
  }
});

//Função leitura EPUB

function initEPUBViewer(epubURL) {
  console.log('[EPUB Viewer] Initializing with URL:', epubURL);

  // Elementos necessários
  const viewerContainer = document.getElementById('pdf-viewer-container');
  const viewer = document.getElementById('pdf-viewer');

  if (!viewer) {
    console.error('Elemento do visualizador não encontrado');
    return;
  }

  // Limpa o viewer
  viewer.innerHTML = '';

  // Cria um elemento div específico para o EPUB
  const epubContainer = document.createElement('div');
  epubContainer.id = 'epub-viewer';
  epubContainer.style.width = '100%';
  epubContainer.style.height = '100%';
  viewer.appendChild(epubContainer);

  // Inicializa o EPUB.js
  const book = ePub(epubURL);
  const rendition = book.renderTo('epub-viewer', {
    width: '100%',
    height: '100%',
    spread: 'none'
  });

  // Configura a navegação
  rendition.display().then(() => {
    console.log('EPUB carregado com sucesso');

    // Atualiza controles de navegação
    document.getElementById('prev-page').onclick = () => {
      rendition.prev();
      updatePageInfo();
    };

    document.getElementById('next-page').onclick = () => {
      rendition.next();
      updatePageInfo();
    };
  });

  // Função para atualizar a página atual (simulada)
  function updatePageInfo() {
    const currentPageEl = document.getElementById('current-page');
    if (currentPageEl) {
      // EPUB não tem numeração fixa de páginas, usamos um contador
      currentPageEl.textContent = rendition.location?.start?.displayed.page || '1';
    }
  }

  // Retorna a API do EPUB.js para controle externo
  return {
    book,
    rendition,
    destroy: () => {
      book.destroy();
      viewer.innerHTML = '';
    }
  };
}

// Função principal para gerenciar capítulos e progresso
async function gerenciarCapitulosEPaginas(pdfDoc, pdfViewer, livroId) {

    try {
        // 1. Extrai a estrutura de páginas
        const paginas = await extrairEstruturaPaginas(pdfDoc);

        // 2. Preenche a sidebar
        preencherSidebar(paginas, livroId);

        // 3. Configura eventos e recupera progresso
        configurarNavegacao(pdfViewer, livroId);

    } catch (error) {
        console.error('Erro ao gerenciar capítulos:', error);
    }
}

// Função para extrair estrutura simplificada
async function extrairEstruturaPaginas(pdfDoc) {
    const paginas = [];

    for (let i = 0; i < pdfDoc.numPages; i++) {
        try {
            const page = await pdfDoc.getPage(i + 1);
            const textContent = await page.getTextContent();

            // Detecta título real ou usa "Página X"
            const tituloDetectado = detectarTitulo(textContent);
            const tituloFinal = tituloDetectado || `Página ${i + 1}`;

            paginas.push({
                numero: i + 1,
                titulo: tituloFinal.trim()
            });

        } catch (err) {
            paginas.push({
                numero: i + 1,
                titulo: `Página ${i + 1}`
            });
        }
    }

    return paginas;
}

// Detector de título real (caixa alta com + de 2 palavras)
function detectarTitulo(textContent) {
    const itens = textContent.items;

    for (let item of itens) {
        const texto = item.str.trim();
        const isCaixaAlta = texto === texto.toUpperCase();
        const palavras = texto.split(/\s+/).length;

        if (isCaixaAlta && palavras >= 2 && texto.length > 5) {
            return texto;
        }
    }

    return null;
}


// Função para preencher a sidebar
function preencherSidebar(paginas, livroId) {
  const listaCapitulos = document.querySelector('.pagina-leitura-lista');
  if (!listaCapitulos) return;

  listaCapitulos.innerHTML = paginas.map(pagina => `
    <li>
      <a href="#" class="link-página" data-page="${pagina.numero}">
        <span class="nome-subpagina">${pagina.titulo}</span>
        <span class="numero-pagina">${String(pagina.numero).padStart(2, '0')}</span>
        <span class="marcador-progresso" data-page="${pagina.numero}"></span>
      </a>
    </li>
  `).join('');
}


// Função para configurar navegação e progresso
function configurarNavegacao(pdfViewer, livroId) {
  const ultimaPagina = localStorage.getItem(`progresso-${livroId}`) || 1;
  paginaAtual = ultimaPagina; // 🧠 Atualiza também aqui

  document.querySelectorAll('.link-página').forEach(link => {
    const pagina = parseInt(link.dataset.page);

    if (pagina <= ultimaPagina) {
      link.classList.add('lido');
      link.querySelector('.marcador-progresso').innerHTML = '✓';
    }

    link.addEventListener('click', (e) => {
  e.preventDefault();
  pdfViewer.renderPage(pagina);

  paginaAtual = pagina; // 🔥 Aqui é o segredo

  localStorage.setItem(`progresso-${livroId}`, pagina);

  document.querySelectorAll('.link-página').forEach(el => {
    const elPagina = parseInt(el.dataset.page);
    el.classList.toggle('lido', elPagina <= pagina);
    el.querySelector('.marcador-progresso').innerHTML = elPagina <= pagina ? '✓' : '';
  });
    });

  });

  // Vai direto para a última página lida no load
  pdfViewer.renderPage(paginaAtual);
}
