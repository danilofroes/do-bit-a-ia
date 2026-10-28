/* Do Bit à IA — comportamentos da página
   1. Reservas para imagens que ainda não foram adicionadas
   2. Nome em bits
   3. Compartilhar (menu do celular ou WhatsApp)
   4. Barra fixa de inscrição no celular */

(() => {
  'use strict';

  /* 1. Reservas --------------------------------------------------------------
     data-reserva="remover"  some com a figura inteira
     data-reserva="iniciais" mostra as iniciais no lugar da foto
     data-reserva="texto"    troca a logo pelo nome da instituição */

  const aplicarReserva = (img) => {
    const modo = img.dataset.reserva;
    const figura = img.closest('figure');

    if (modo === 'remover' && figura) {
      figura.remove();
    } else if (modo === 'iniciais' && figura) {
      figura.classList.add('sem-foto');
      img.remove();
    } else if (modo === 'texto') {
      const nome = document.createElement('span');
      nome.className = 'logo-texto';
      nome.textContent = img.alt;
      img.replaceWith(nome);
    }
  };

  document.querySelectorAll('img[data-reserva]').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) {
      aplicarReserva(img);
    } else {
      img.addEventListener('error', () => aplicarReserva(img), { once: true });
    }
  });

  /* 2. Nome em bits ----------------------------------------------------------- */

  const entrada = document.getElementById('nome');
  const lista = document.getElementById('bytes');
  const resumo = document.getElementById('bytes-resumo');
  const EXEMPLO = 'Nave';
  let anterior = '';

  // Cada caractere vira 8 bits (latin-1), o suficiente para nomes com acento.
  const paraBits = (c) => c.charCodeAt(0).toString(2).padStart(8, '0');

  const textoValido = () =>
    [...entrada.value]
      .filter((c) => c.length === 1 && c.charCodeAt(0) <= 255)
      .slice(0, 14)
      .join('');

  const criarLinha = (c, nova) => {
    const bits = paraBits(c);
    const linha = document.createElement('li');
    linha.className = nova ? 'byte-linha nova' : 'byte-linha';
    linha.setAttribute('aria-label', `${c === ' ' ? 'espaço' : c}: ${bits}`);

    const letra = document.createElement('span');
    letra.className = 'byte-letra';
    letra.textContent = c === ' ' ? '␣' : c;
    letra.setAttribute('aria-hidden', 'true');

    const quadros = document.createElement('span');
    quadros.className = 'quadros';
    quadros.setAttribute('aria-hidden', 'true');
    for (const v of bits) {
      const bit = document.createElement('span');
      bit.className = 'bit';
      bit.dataset.v = v;
      quadros.append(bit);
    }

    const codigo = document.createElement('code');
    codigo.textContent = bits;
    codigo.setAttribute('aria-hidden', 'true');

    linha.append(letra, quadros, codigo);
    return linha;
  };

  const desenhar = () => {
    const digitado = textoValido();
    const texto = digitado.trim() ? digitado : EXEMPLO;

    // só as letras novas acendem; as que já estavam ficam paradas
    let comum = 0;
    while (comum < texto.length && texto[comum] === anterior[comum]) comum += 1;

    lista.replaceChildren(...[...texto].map((c, i) => criarLinha(c, i >= comum)));
    anterior = texto;

    const n = texto.length;
    const quem = digitado.trim() ? 'Seu nome' : 'A palavra Nave';
    resumo.textContent = `${quem} ocupa ${n} ${n === 1 ? 'byte' : 'bytes'}, ou ${n * 8} bits.`;
  };

  if (entrada && lista && resumo) {
    entrada.addEventListener('input', desenhar);
    desenhar();
  }

  /* 3. Compartilhar ------------------------------------------------------------
     O link vai dentro do próprio texto: assim o WhatsApp mostra a prévia do
     site e o endereço não aparece duplicado. */

  const enderecoSite = () =>
    document.querySelector('link[rel="canonical"]')?.href || location.href.split('#')[0];

  const compartilhar = async (texto) => {
    if (navigator.share) {
      try {
        await navigator.share({ text: texto });
        return;
      } catch (erro) {
        if (erro && erro.name === 'AbortError') return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  };

  const textoCurso = () =>
    [
      '🤖 *Do Bit à IA: curso gratuito de inteligência artificial*',
      '',
      'Na Nave do Conhecimento Penha, dias 3, 5 e 10 de novembro, das 17h30 às 20h30. Não precisa saber programar!',
      '',
      `Saiba mais e faça sua inscrição: ${enderecoSite()}`,
    ].join('\n');

  // O nome vai num bloco monoespaçado do WhatsApp (entre ```), com uma letra
  // por linha para os zeros e uns ficarem alinhados. O curso entra só no fim.
  const textoNome = (nome) => {
    const linhas = [...nome].map((c) => `${c === ' ' ? '␣' : c}  ${paraBits(c)}`).join('\n');
    return [
      '🤖 *Meu nome na língua do computador:*',
      '',
      '```' + linhas + '```',
      '',
      `São ${nome.length * 8} bits. Cada 1 é um interruptor ligado lá dentro da máquina 💡`,
      '',
      `Faz o seu também 👉 ${enderecoSite()}`,
      '',
      '_Do Bit à IA, curso gratuito de IA na Nave do Conhecimento Penha_',
    ].join('\n');
  };

  document.getElementById('compartilhar-curso')?.addEventListener('click', () => {
    compartilhar(textoCurso());
  });

  document.getElementById('compartilhar-nome')?.addEventListener('click', () => {
    const digitado = textoValido().trim();
    if (!digitado) {
      resumo.textContent = 'Digite seu nome no campo acima para compartilhar.';
      entrada.focus();
      return;
    }
    compartilhar(textoNome(digitado));
  });

  /* 4. Barra fixa ----------------------------------------------------------------
     Aparece só quando nenhum outro botão de inscrição está na tela. */

  const barra = document.querySelector('.barra-inscricao');
  const chamadas = document.querySelectorAll('[data-cta]');

  if (barra && chamadas.length && 'IntersectionObserver' in window) {
    // conta como "na tela" só o botão que aparece inteiro; meio escondido
    // na borda da tela não vale, e a barra cobre essa borda
    const naTela = new Set();
    const observador = new IntersectionObserver((itens) => {
      itens.forEach((item) => {
        if (item.intersectionRatio > 0.98) naTela.add(item.target);
        else naTela.delete(item.target);
      });
      const mostrar = naTela.size === 0;
      barra.classList.toggle('visivel', mostrar);
      barra.inert = !mostrar;
    }, { threshold: [0, 1] });
    chamadas.forEach((c) => observador.observe(c));
  }
})();
