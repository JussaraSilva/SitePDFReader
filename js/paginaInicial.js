document.addEventListener("DOMContentLoaded", async () => {
  initSwiperCarrossel();
  initSwiperGostar();

  atualizarLeiturasRecentes();
  atualizarRecomendados();
  calcularSlidesVisiveis();

  // Roda nas outras páginas (como a paginaInicial.html)
  lucide.createIcons();

  setupDropdowns();

  setupToggleTema();

});


// Swiper Carrossel Leituras
function initSwiperCarrossel() {
  const el = document.querySelector('.carrossel-container');
  if (el) {
    new Swiper(el, {
      slidesPerView: 15.5,
      spaceBetween: 20,
      grabCursor: true,
    });
  }
}

// Swiper Destaque
function initSwiperDestaque() {
  const el = document.querySelector('.swiper-destaque');
  if (el) {
    new Swiper(el, {
      slidesPerView: 12,
      spaceBetween: 20,
      grabCursor: true,
    });
  }
}

// Swiper Gostar
function initSwiperGostar() {
  const el = document.querySelector('.swiper-gostar');
  if (el) {
    new Swiper(el, {
      slidesPerView: 2,
      slidesPerGroup: 2, // ESSENCIAL pra não repetir
      spaceBetween: 15,
      pagination: {
        el: '.swiper-gostar .swiper-pagination',
        clickable: true,
      },
    });
    console.log("Swiper Gostar funcionando");
  }
}


function limparEstilosHTML(texto) {
  if (typeof texto !== 'string') return texto;

  // Remove tags HTML básicas mas mantém quebras de linha e parágrafos
  return texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}


//Adicionar informações ao carrossel da Página Principal//

// IDs dos livros no Archive.org
// IDs dos livros no Archive.org
const livrosLeiturasRecentes = [
  "aespadaselvagemdeconan2",
  "v-for-vendetta-by-alan-moore-david-lloyd",
  "the-walking-dead-compendium-v-01-2011-digital-empire",
  "murderwithmirror01chri",
  "secretofchimneys0000agat_j5a4",
  "bigfourmurderinm0000agat",
  "hunterbrowneyeof0000mill",
  "invincible-compendiums",
  "spider-man-3-the-black",
  "TheKillingJoke_201804",
  "the-legend-of-zelda-hyrule-historia",
  "BarbieMarvelComics",
  "TheFlintstonesMarvelComics",
  "amazing-spider-man-masterworks-v-5-2014-digital-kileko-empire",
  "uncanny-x-men-150-1981-digital-minutemen-syl-3nt-bob",
  "deadpool-vs.-carnage-001-2014",
  "absolute-carnage-2019-01"

];

const livrosRecomendados = [
  "a-menina-que-roubava-livros",
  "InfernoDanBrown_201707",
  "orwell-a-revolucao-dos-bichos",
  "captain-america-vol-1-scans",
  "x-men-v1-the-silver-age",
  "odiriodeumbanana0000jeff"
];


// Função para atualizar o carrossel "Leituras Recentes" com verificação de elementos
async function atualizarLeiturasRecentes() {
  const container = document.querySelector('#carrossel .swiper-wrapper');

  if (!container) {
    console.warn("Container de leituras recentes não encontrado → pulando atualização.");
    console.error('Container de leituras recentes não encontrado');
    return;
  }

  // Limpa tudo antes de criar do zero
  container.innerHTML = '';

  try {
    const livros = await Promise.all(
      livrosLeiturasRecentes.map(id => carregarDadosLivro(id))
    );

    livros.forEach(livro => {
      if (!livro) return;

      // Cria o slide inteiro do zero, igual ao seu modelo
      const slide = document.createElement('div');
      slide.className = 'swiper-slide item';

      const link = document.createElement('a');
      link.href = `paginaLivro.html?id=${livro.identifier}`;

      const img = document.createElement('img');
      img.src = livro.capaUrl;
      img.alt = livro.titulo;
      img.onerror = function() {
        this.src = './assets/capas-books/default-book.png';
      };

      const p = document.createElement('p');
      p.textContent = livro.titulo;

      // Monta o slide
      link.appendChild(img);
      link.appendChild(p);
      slide.appendChild(link);
      container.appendChild(slide);
    });

    // Atualiza o swiper
    if (window.swiperLeituras) {
      window.swiperLeituras.update();
    }
  } catch (error) {
    console.error('Erro ao atualizar leituras recentes:', error);
  }
}


async function atualizarRecomendados() {
  const container = document.querySelector('.swiper-gostar .swiper-wrapper');

  if (!container) {
    console.error('Container de livros recomendados não encontrado');
    return;
  }

  // Limpa o container pra criar do zero
  container.innerHTML = '';

  try {
    const livros = await Promise.all(
      livrosRecomendados.map(id => carregarDadosLivro(id))
    );

    livros.forEach(livro => {
      if (!livro) return;

      const slide = document.createElement('div');
      slide.className = 'sugestao-livro-destaque swiper-slide';

      // Parte da imagem
      const imgDiv = document.createElement('div');
      imgDiv.className = 'imagem-destaque';
      const img = document.createElement('img');
      img.src = livro.capaUrl;
      img.alt = livro.titulo;
      img.onerror = () => { img.src = './assets/capas-books/default-book.png'; };
      imgDiv.appendChild(img);

      // Parte das infos
      const infoDiv = document.createElement('div');
      infoDiv.className = 'info-destaque';

      const h3 = document.createElement('h3');
      h3.textContent = livro.titulo;

      const autor = document.createElement('p');
      autor.className = 'autor';
      autor.textContent = livro.autor || 'Autor desconhecido';

      const descricao = document.createElement('p');
      descricao.className = 'descricao';

      if (livro.descricao && typeof livro.descricao === 'string') {
        descricao.textContent = livro.descricao.length > 200
          ? livro.descricao.substring(0, 200) + '...'
          : livro.descricao;
      } else {
        descricao.textContent = 'Descrição não disponível';
      }

      // Monta a info
      infoDiv.appendChild(h3);
      infoDiv.appendChild(autor);
      infoDiv.appendChild(descricao);

      // Monta o slide completo
      slide.appendChild(imgDiv);
      slide.appendChild(infoDiv);

      container.appendChild(slide);
    });

    // Atualiza o swiper com paginação, seta, etc
    if (window.swiperGostar) {
      window.swiperGostar.update();
    }
  } catch (error) {
    console.error('Erro ao atualizar livros recomendados:', error);
  }
}


// Função para alterar nome e foto dos autores em destaque carrossel Página Inicial

// Lista de autores que você quer destacar (modifica à vontade)
const autoresEmDestaque = [
  "Marian Keyes",
  "Taylor Jenkins Reid",
  "Dan Brown",
  "Paulo Coelho",
  "Rick Riordan",
  "Markus Zusak",
  "Agatha Christie",
  "George R.R. Martin",
  "Ashley Herring Blake",
  "William Shakespeare",
  "Jules Verne",
  "Charles Dickens",
  "Leo Tolstoy",
  "Fyodor Dostoevsky",
  "Hans Christian Andersen",
  "Mark Twain",
  "Jane Austen",
  "George Orwell",
  "Gabriel García Márquez",
  "Ernest Hemingway",
  "J.R.R. Tolkien",
  "Stephen King",
  "William Faulkner",
  "Virginia Woolf",
  "Miguel de Cervantes",
  "Dante Alighieri",
  "Antoine de Saint-Exupéry",
  "J.K. Rowling",
  "Chinua Achebe",
  "Toni Morrison",
  "Franz Kafka",
  "Jorge Luis Borges",
  "Isabel Allende"



];

// Função que busca o livro mais relevante de um autor via Google Books API
async function buscarLivroDoAutor(autor) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodeURIComponent(autor)}&orderBy=relevance&maxResults=1`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.totalItems > 0) {
      const livro = data.items[0].volumeInfo;
      return {
        titulo: livro.title || "Título Indisponível",
        capa: livro.imageLinks?.thumbnail || "./assets/autores/autor-placeholder.jpg",
        infoLink: livro.infoLink || "#"
      };
    } else {
      return null;
    }
  } catch (err) {
    console.error(`Erro ao buscar dados do autor ${autor}:`, err);
    return null;
  }
}

// Função principal que preenche o carrossel
// Variável para armazenar a instância do Swiper
let swiperInstance = null;

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
    const response = await fetch(`https://archive.org/metadata/${identifier}`);  // Repare aqui que é /metadata/ pra pegar JSON
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
      console.log("🔍 precisaPDF está ativado");
      // Pega o primeiro PDF da lista (sem muita firula)
      const pdfs = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));
      if (pdfs.length > 0) {
        const arquivoPDF = pdfs[0];

        const pdfUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(arquivoPDF.name)}`;

          console.log("📄 PDF encontrado:");
          console.log("- Nome original:", arquivoPDF.name);
          console.log("- Nome codificado:", encodeURIComponent(arquivoPDF.name));
          console.log("- URL final gerada:", pdfUrl);

        pdfInfo = {
          url: `https://archive.org/download/${identifier}/${encodeURIComponent(arquivoPDF.name)}`,
          nomeArquivo: arquivoPDF.name,
          tamanho: arquivoPDF.size
        };
      }
        else {
          console.warn("⚠️ Nenhum PDF encontrado nos arquivos.");
      }

      // Continua pegando EPUB como antes
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
    localStorage.setItem(cacheKey, JSON.stringify(resultado));

    return resultado;

  } catch (error) {
    console.error(`Erro ao carregar livro ${identifier}:`, error);
    return null;
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

async function preencherCarrosselAutores() {
  const container = document.querySelector("#carrossel-autores .swiper-wrapper");
  container.innerHTML = "";


  const requisicoes = autoresEmDestaque.map(async (autorNome) => {

    const url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodeURIComponent(autorNome)}&maxResults=1`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      let livroTitulo = "Livro em destaque não disponível";
      let autorImagem = "./assets/autores/default-author.jpg";

      if (data.totalItems > 0) {
        const livro = data.items[0].volumeInfo;
        livroTitulo = livro.title || livroTitulo;

        if (livro.imageLinks?.thumbnail) {
          autorImagem = livro.imageLinks.thumbnail.replace("http://", "https://");
        }
      }

      return `
        <div class="swiper-slide item-destaque">
          <a href="#">
            <img src="${autorImagem}" alt="Foto do autor ${autorNome}" />
            <p class="nomeAutor-destaque" title="${autorNome}">${autorNome}</p>
            <p class="livro-autor" title="${livroTitulo}">${livroTitulo}</p>
          </a>
        </div>
      `;
    } catch (error) {
      console.warn(`Erro ao buscar dados do autor ${autorNome}`, error);
      return "";
    }
  });

  const slides = (await Promise.all(requisicoes)).filter(slide => slide.trim() !== "");
  container.innerHTML = slides.join("");

  const totalSlides = slides.length;

  if (totalSlides > calcularSlidesVisiveis(totalSlides)) {
    const swiperContainer = document.querySelector('.swiper-destaque');
    swiperContainer.style.overflow = 'hidden';
    swiperContainer.style.width = '100%';

    const wrapper = document.querySelector('#carrossel-autores .swiper-wrapper');
    wrapper.style.marginLeft = '0';
    wrapper.style.paddingLeft = '0';
  }

  if (totalSlides <= calcularSlidesVisiveis(totalSlides)) {
    container.style.justifyContent = 'flex-start';
    container.style.overflowX = 'hidden';
  } else {
    container.style.justifyContent = '';
    container.style.overflowX = '';
  }

  if (swiperInstance) {
    swiperInstance.destroy(true, true);
    swiperInstance = null;
  }

  if (totalSlides < 1) return;

  const slidesVisiveis = calcularSlidesVisiveis(totalSlides);

  if (totalSlides > slidesVisiveis) {
    swiperInstance = new Swiper(".swiper-destaque", {
      spaceBetween: 20,
      grabCursor: true,
      loop: false,
      resistanceRatio: 0.9,
      watchOverflow: true,
      resizeObserver: true,
      slidesOffsetBefore: 0,
      slidesOffsetAfter: 0,
      freeMode: {
        enabled: true,
        sticky: true,
        momentum: false,
        momentumBounce: false,
        momentumRatio: 0,
        momentumVelocityRatio: 0
      },
      breakpoints: {
        320: {
          slidesPerView: Math.min(totalSlides, 1),
          spaceBetween: 10
        },
        640: {
          slidesPerView: Math.min(totalSlides, 2),
          spaceBetween: 15
        },
        1024: {
          slidesPerView: Math.min(totalSlides, 3),
          spaceBetween: 20
        },
        1280: {
          slidesPerView: Math.min(totalSlides, 4),
          spaceBetween: 25
        }
      }
    });
  } else {
    swiperInstance = new Swiper(".swiper-destaque", {
      slidesPerView: "auto",
      spaceBetween: 20,
      grabCursor: true,
      loop: false,
      watchOverflow: true,
      resistance: false,
      resistanceRatio: 0,
      navigation: {
        disabledClass: "swiper-button-disabled"
      },
      breakpoints: {
        320: {
          slidesPerView: 1,
          spaceBetween: 10
        },
        640: {
          slidesPerView: 2,
          spaceBetween: 15
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 20
        },
        1280: {
          slidesPerView: Math.min(totalSlides, 11),
          spaceBetween: 25
        }
      }
    });
  }

  console.log({
    containerWidth: container.offsetWidth,
    contentWidth: container.scrollWidth,
    totalSlides: totalSlides,
    slidesToShow: calcularSlidesVisiveis(totalSlides),
    needsSwiper: totalSlides > calcularSlidesVisiveis(totalSlides),
    currentJustifyContent: container.style.justifyContent
  });
}

function calcularSlidesVisiveis(totalSlides) {
  const width = window.innerWidth;
  const container = document.querySelector('.swiper-destaque');
  const containerWidth = container?.offsetWidth || width;

  let slideWidth = 180;
  if (width < 640) slideWidth = 160;
  if (width >= 640 && width < 1024) slideWidth = 170;
  if (width >= 1024 && width < 1280) slideWidth = 180;
  if (width >= 1280) slideWidth = 200;

  const visibleSlides = Math.floor(containerWidth / slideWidth);
  return Math.min(visibleSlides, totalSlides);
}

function observarMudancasAutores() {
  let listaAtual = [...autoresEmDestaque];

  setInterval(() => {
    if (autoresEmDestaque.length !== listaAtual.length ||
        !autoresEmDestaque.every((autor, i) => autor === listaAtual[i])) {
      listaAtual = [...autoresEmDestaque];
      preencherCarrosselAutores();
    }
  }, 500);
}

function adicionarAutor(nome) {
  autoresEmDestaque.push(nome);
  preencherCarrosselAutores();
}

function removerAutor(nome) {
  const index = autoresEmDestaque.indexOf(nome);
  if (index > -1) {
    autoresEmDestaque.splice(index, 1);
    preencherCarrosselAutores();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  preencherCarrosselAutores();
  observarMudancasAutores();
});