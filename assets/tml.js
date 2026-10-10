/* Temalli® v2 — interações das seções Temalli (tema Shopify).
   Compra: adiciona ao carrinho via /cart/add.js e vai para /cart, onde o script da Yampi
   leva ao checkout. Não usar links /cart/ID:QTD nem /checkout: pulariam a Yampi. */
(function(){
  function comprar(itens, botao){
    if(!itens || !itens.length){ return; }
    var texto = botao ? botao.textContent : '', t0 = Date.now();
    if(botao){ botao.disabled = true; graosVoam(botao); graoGirando(botao, 'Adicionando…'); }
    fetch('/cart/add.js', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: JSON.stringify({items: itens})
    }).then(function(r){
      if(!r.ok){ throw r; }
      // deixa os grãos terminarem de voar e abre a gaveta de carrinho (sem gaveta: vai para /cart)
      setTimeout(function(){
        if(botao){ botao.disabled = false; botao.textContent = texto; }
        if(!window.TML_ABRIR_CARRINHO || !window.TML_ABRIR_CARRINHO()){ window.location.href = '/cart'; }
      }, Math.max(0, 650 - (Date.now() - t0)));
    }).catch(function(){
      if(botao){ botao.disabled = false; botao.textContent = 'Não foi possível adicionar. Tente de novo'; setTimeout(function(){ botao.textContent = texto; }, 3500); }
    });
  }
  window.TML_COMPRAR = comprar;

  // ===== microanimações do café =====
  var REDUZ = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // grãos pulando a partir do botão de compra
  function graosVoam(botao){
    if(REDUZ || !botao){ return; }
    var r = botao.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for(var i = 0; i < 10; i++){
      var g = document.createElement('span');
      var ang = Math.PI * 2 * i / 10 + Math.random() * 0.5, dist = 60 + Math.random() * 55;
      g.className = 'grao-voa';
      g.style.left = cx + 'px'; g.style.top = cy + 'px';
      g.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
      g.style.setProperty('--dy', Math.round(Math.sin(ang) * dist - 45) + 'px');
      g.style.setProperty('--r', Math.round(Math.random() * 540 - 270) + 'deg');
      document.body.appendChild(g);
      setTimeout(g.remove.bind(g), 950);
    }
  }
  function graoGirando(botao, texto){ botao.innerHTML = '<span class="grao-gira" aria-hidden="true"></span>' + texto; }
  // 4º pacote (grátis) cai no kit
  function pacoteCai(box){
    if(REDUZ){ return; }
    var p = box.querySelector('.pac.gratis'); if(!p){ return; }
    p.classList.remove('cai'); void p.offsetWidth; p.classList.add('cai');
  }
  // números contando quando aparecem
  if(!REDUZ && 'IntersectionObserver' in window){
    var padrao = /^(\D*)(\d+(?:,\d+)?)(.*)$/;
    var obsNum = new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(!en.isIntersecting){ return; }
        obsNum.unobserve(en.target);
        var el = en.target, m = el.dataset.final.match(padrao);
        var alvo = parseFloat(m[2].replace(',', '.')), casas = (m[2].split(',')[1] || '').length, t0 = null;
        function passo(t){
          if(!t0){ t0 = t; }
          var p = Math.min(1, (t - t0) / 1300), v = alvo * (1 - Math.pow(1 - p, 3));
          el.textContent = p < 1 ? m[1] + v.toFixed(casas).replace('.', ',') + m[3] : el.dataset.final;
          if(p < 1){ requestAnimationFrame(passo); }
        }
        requestAnimationFrame(passo);
      });
    }, {threshold: 0.6});
    document.querySelectorAll('.selos li b, .dep-nota b, .lancamento b').forEach(function(el){
      if(el.children.length || !padrao.test(el.textContent.trim())){ return; }
      el.dataset.final = el.textContent.trim();
      obsNum.observe(el);
    });
  }
  // o pacote grátis cai a primeira vez que a caixa de compra aparece
  if('IntersectionObserver' in window){
    var obsKit = new IntersectionObserver(function(es){
      es.forEach(function(en){ if(en.isIntersecting){ obsKit.unobserve(en.target); pacoteCai(en.target); } });
    }, {threshold: 0.5});
    document.querySelectorAll('.opcao.kit').forEach(function(k){ obsKit.observe(k); });
  }
  var brl = function(v){ return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); };

  // menu mobile
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.menu-toggle');
  if(nav && toggle){
    toggle.addEventListener('click', function(){
      var aberto = nav.classList.toggle('aberto');
      toggle.setAttribute('aria-expanded', aberto);
    });
  }

  // cabeçalho fixo só ao rolar para cima: some ao descer (mais espaço para ler) e volta no primeiro movimento para cima.
  // No topo da página e com o menu aberto ele fica sempre visível. Tema: o bloco fixo é .tml-secao-header; protótipo: header.site
  var cab = document.querySelector('.tml-secao-header') || document.querySelector('header.site');
  if(cab){
    var ultimoY = window.scrollY, pendenteCab = false;
    window.addEventListener('scroll', function(){
      if(pendenteCab){ return; }
      pendenteCab = true;
      requestAnimationFrame(function(){
        var y = window.scrollY, delta = y - ultimoY, menuAberto = document.querySelector('.nav.aberto');
        if(y < cab.offsetHeight + 40 || menuAberto){ cab.classList.remove('cab-oculto'); }
        else if(delta > 8){ cab.classList.add('cab-oculto'); }
        else if(delta < -8){ cab.classList.remove('cab-oculto'); }
        if(Math.abs(delta) > 8){ ultimoY = y; }
        pendenteCab = false;
      });
    }, {passive: true});
  }

  // caixa de compra: quantidade (1 ou kit 4) + formato (grão/moído) -> link de carrinho
  document.querySelectorAll('[data-buybox]').forEach(function(box){
    var preco = parseFloat(box.dataset.preco);
    var cta = box.querySelector('[data-cta]');
    var total = box.querySelector('[data-total]');
    var barPreco = document.querySelector('[data-buybar-preco]');
    var barInfo = document.querySelector('[data-buybar-info]');
    var barCta = document.querySelector('[data-buybar-cta]');
    var itens = [];

    function atualiza(){
      var qtd = parseInt(box.querySelector('input[name="qtd"]:checked').value, 10);
      var formato = box.querySelector('input[name="formato"]:checked').value;
      var variante = box.dataset[formato];
      if(qtd === 4 && box.dataset.qtdAnterior && box.dataset.qtdAnterior !== '4'){ pacoteCai(box); }
      box.dataset.qtdAnterior = qtd;
      var pagas = qtd === 4 ? 3 : qtd;               // Pague 3 Leve 4
      var valor = preco * pagas;
      itens = /^\d+$/.test(variante) ? [{id: +variante, quantity: qtd}] : [];
      total.textContent = brl(valor);
      cta.disabled = !itens.length;
      var eco = box.querySelector('[data-economia]');
      if(eco){ eco.textContent = qtd === 4 ? 'Você economiza ' + brl(preco) : ''; }
      cta.textContent = qtd === 4 ? 'Comprar 4 pacotes, pague 3' : 'Comprar ' + qtd + (qtd > 1 ? ' pacotes' : ' pacote');
      if(barPreco){ barPreco.textContent = brl(valor); }
      if(barInfo){ barInfo.textContent = qtd === 4 ? 'Pague 3, leve 4 + frete grátis' : qtd + (qtd > 1 ? ' unidades' : ' unidade'); }
    }
    box.addEventListener('change', atualiza);
    cta.addEventListener('click', function(e){ e.preventDefault(); comprar(itens, cta); });
    if(barCta){ barCta.addEventListener('click', function(e){ e.preventDefault(); comprar(itens, barCta); }); }
    atualiza();
  });

  // galeria: carrossel com miniaturas numa linha, setas, arrastar no celular e contador
  document.querySelectorAll('[data-galeria]').forEach(function(g){
    var principal = g.querySelector('.principal img');
    var area = g.querySelector('.principal');
    var thumbs = Array.prototype.slice.call(g.querySelectorAll('.thumbs button'));
    var cont = g.querySelector('.gal-cont');
    var atual = 0;
    if(!principal || thumbs.length < 2){ return; }
    function mostra(i){
      atual = (i + thumbs.length) % thumbs.length;
      var b = thumbs[atual];
      principal.removeAttribute('srcset'); principal.removeAttribute('sizes');
      principal.src = b.dataset.src;
      principal.alt = b.querySelector('img').alt;
      thumbs.forEach(function(x, j){ x.setAttribute('aria-pressed', j === atual ? 'true' : 'false'); });
      var trilho = b.parentNode;
      // centraliza a miniatura ativa: na horizontal (computador) ou na vertical (celular, coluna à esquerda)
      trilho.scrollTo({left: b.offsetLeft - trilho.clientWidth / 2 + b.clientWidth / 2, top: b.offsetTop - trilho.clientHeight / 2 + b.clientHeight / 2, behavior: 'smooth'});
      if(cont){ cont.textContent = (atual + 1) + ' / ' + thumbs.length; }
    }
    thumbs.forEach(function(b, i){ b.addEventListener('click', function(){ mostra(i); }); });
    var ant = g.querySelector('[data-gal-ant]'), prox = g.querySelector('[data-gal-prox]');
    if(ant){ ant.addEventListener('click', function(){ mostra(atual - 1); }); }
    if(prox){ prox.addEventListener('click', function(){ mostra(atual + 1); }); }
    var x0 = null;
    area.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, {passive: true});
    area.addEventListener('touchend', function(e){
      if(x0 === null){ return; }
      var dx = e.changedTouches[0].clientX - x0;
      if(Math.abs(dx) > 40){ mostra(atual + (dx < 0 ? 1 : -1)); }
      x0 = null;
    });
  });

  // barra fixa mobile aparece depois que a caixa de compra sai da tela
  var buybar = document.querySelector('.buybar');
  var alvo = document.querySelector('[data-buybox]');
  if(buybar && alvo && 'IntersectionObserver' in window){
    document.body.classList.add('tem-buybar');
    new IntersectionObserver(function(e){
      var passou = !e[0].isIntersecting && e[0].boundingClientRect.top < 0;
      buybar.classList.toggle('on', passou);
    }).observe(alvo);
  }

  // depoimentos: mostrar mais
  document.querySelectorAll('[data-dep-mais]').forEach(function(b){
    b.addEventListener('click', function(){
      var dep = b.closest('.dep');
      var aberto = dep.classList.toggle('aberto');
      b.textContent = aberto ? 'Mostrar menos' : b.dataset.label;
      b.setAttribute('aria-expanded', aberto);
    });
    b.dataset.label = b.textContent;
  });

  // kit degustação: 1 Clássico + 1 Arara, cada um em grão ou moído -> link de carrinho com os dois
  document.querySelectorAll('[data-degustacao]').forEach(function(box){
    var cta = box.querySelector('[data-deg-cta]');
    function atualiza(){
      var ids = Array.prototype.map.call(box.querySelectorAll('.deg-itens li'), function(li){
        return li.dataset[li.querySelector('[data-formato][aria-pressed="true"]').dataset.formato];
      });
      var ok = ids.every(function(id){ return /^\d+$/.test(id); });
      box.itens = ok ? ids.map(function(id){ return {id: +id, quantity: 1}; }) : [];
      cta.disabled = !ok;
    }
    cta.addEventListener('click', function(e){ e.preventDefault(); comprar(box.itens, cta); });
    box.addEventListener('click', function(e){
      var b = e.target.closest('[data-formato]'); if(!b) return;
      b.parentNode.querySelectorAll('[data-formato]').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      atualiza();
    });
    atualiza();
  });

  // assinatura: monta o pedido e abre o WhatsApp com a mensagem pronta
  document.querySelectorAll('[data-assinatura]').forEach(function(m){
    var cafes = m.querySelectorAll('.m-cafe');
    var cta = m.querySelector('[data-assinar]');
    var aviso = m.querySelector('[data-aviso]');
    function estado(){
      return Array.prototype.map.call(cafes, function(c){
        return { nome: c.dataset.cafe, preco: parseFloat(c.dataset.preco),
                 qtd: parseInt(c.querySelector('output').textContent, 10),
                 formato: c.querySelector('[data-formato][aria-pressed="true"]').dataset.formato };
      }).filter(function(c){ return c.qtd > 0; });
    }
    function atualiza(){
      var itens = estado();
      var freq = m.querySelector('input[name="freq"]:checked').value;
      var total = itens.reduce(function(s, c){ return s + c.preco * c.qtd; }, 0);
      m.querySelector('[data-resumo-itens]').innerHTML = itens.length
        ? itens.map(function(c){ return '<li><b>' + c.qtd + '×</b> ' + c.nome + ' <span>(' + c.formato + ')</span></li>'; }).join('')
        : '<li class="vazio">Nenhum café escolhido</li>';
      m.querySelector('[data-resumo-freq]').textContent = freq;
      m.querySelector('[data-resumo-total]').textContent = brl(total);
      cafes.forEach(function(c){ c.classList.toggle('ativo', parseInt(c.querySelector('output').textContent, 10) > 0); });
      var msg = 'Olá! Quero fazer a assinatura Temalli.\n\nFrequência: ' + freq + '\nCafés em cada entrega:\n' +
        itens.map(function(c){ return '- ' + c.qtd + 'x ' + c.nome + ' (' + c.formato + ')'; }).join('\n') +
        '\n\nPode me passar os próximos passos?';
      cta.href = 'https://wa.me/' + m.dataset.whats + '?text=' + encodeURIComponent(msg);
      cta.setAttribute('aria-disabled', itens.length ? 'false' : 'true');
      aviso.hidden = true;
    }
    m.addEventListener('click', function(e){
      var b = e.target.closest('button'); if(!b || !m.contains(b)) return;
      var cafe = b.closest('.m-cafe');
      if(b.hasAttribute('data-mais') || b.hasAttribute('data-menos')){
        var o = cafe.querySelector('output');
        o.textContent = Math.max(0, Math.min(10, parseInt(o.textContent, 10) + (b.hasAttribute('data-mais') ? 1 : -1)));
      } else if(b.dataset.formato){
        cafe.querySelectorAll('[data-formato]').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      }
      atualiza();
    });
    m.addEventListener('change', atualiza);
    cta.addEventListener('click', function(e){
      if(cta.getAttribute('aria-disabled') === 'true'){ e.preventDefault(); aviso.hidden = false; }
    });
    atualiza();
  });

  // todas as avaliações: janela na própria página (dados em assets/js/avaliacoes.js)
  var AV = window.TEMALLI_AVALIACOES || [];
  var MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  var esc = function(t){ return String(t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var dialogo = null;
  function montaDialogo(){
    var n5 = AV.filter(function(r){ return r.r === 5; }).length;
    var n4 = AV.filter(function(r){ return r.r === 4; }).length;
    var nf = AV.filter(function(r){ return r.f.length; }).length;
    var media = AV.reduce(function(s, r){ return s + r.r; }, 0) / AV.length;
    dialogo = document.createElement('dialog');
    dialogo.className = 'av-dialogo tml';
    dialogo.setAttribute('aria-labelledby', 'av-titulo');
    dialogo.innerHTML =
      '<div class="av-topo">' +
        '<div><b class="av-media">' + media.toFixed(2).replace('.', ',') + '</b><span class="estrelas" aria-hidden="true">★★★★★</span></div>' +
        '<div><h2 id="av-titulo">Todas as avaliações</h2><p>' + AV.length + ' avaliações reais do Temalli Clássico</p></div>' +
        '<button type="button" class="av-fechar" aria-label="Fechar">×</button>' +
      '</div>' +
      '<div class="av-filtros" role="group" aria-label="Filtrar avaliações">' +
        '<button type="button" data-filtro="todas" aria-pressed="true">Todas (' + AV.length + ')</button>' +
        '<button type="button" data-filtro="fotos" aria-pressed="false">Com fotos (' + nf + ')</button>' +
        '<button type="button" data-filtro="5" aria-pressed="false">5 estrelas (' + n5 + ')</button>' +
        '<button type="button" data-filtro="4" aria-pressed="false">4 estrelas (' + n4 + ')</button>' +
      '</div>' +
      '<div class="av-lista"></div>';
    document.body.appendChild(dialogo);
    var lista = dialogo.querySelector('.av-lista');
    function render(filtro){
      var itens = AV.filter(function(r){
        return filtro === 'todas' || (filtro === 'fotos' ? r.f.length : r.r === +filtro);
      });
      lista.innerHTML = itens.map(function(r){
        var d = r.d.split('-');
        var fotos = r.f.map(function(f){
          return '<button type="button" class="av-foto"><img src="' + (window.TML_AV_BASE || '') + f + '" alt="Foto enviada por ' + esc(r.n) + '" loading="lazy"></button>';
        }).join('');
        return '<article class="dep-card">' +
          '<span class="estrelas" aria-label="' + r.r + ' de 5 estrelas">' + '★★★★★'.slice(0, r.r) + '☆☆☆☆☆'.slice(0, 5 - r.r) + '</span>' +
          '<p>“' + esc(r.t) + '”</p>' + (fotos ? '<div class="av-fotos">' + fotos + '</div>' : '') +
          '<footer><b>' + esc(r.n) + '</b><span>' + d[2] + ' ' + MESES[+d[1] - 1] + ' ' + d[0] + '</span>' +
          (r.v ? '<span class="verif"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>Compra verificada</span>' : '') +
          '</footer></article>';
      }).join('');
      lista.scrollTop = 0;
    }
    dialogo.querySelectorAll('[data-filtro]').forEach(function(b){
      b.addEventListener('click', function(){
        dialogo.querySelectorAll('[data-filtro]').forEach(function(x){ x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        render(b.dataset.filtro);
      });
    });
    lista.addEventListener('click', function(e){
      var f = e.target.closest('.av-foto'); if(f) f.classList.toggle('ampliada');
    });
    dialogo.querySelector('.av-fechar').addEventListener('click', function(){ dialogo.close(); });
    dialogo.addEventListener('click', function(e){ if(e.target === dialogo) dialogo.close(); }); // clique fora
    dialogo.addEventListener('close', function(){ document.documentElement.classList.remove('sem-rolagem'); });
    render('todas');
  }
  document.querySelectorAll('[data-abrir-avaliacoes]').forEach(function(b){
    if(!AV.length){ b.hidden = true; return; }
    b.addEventListener('click', function(){
      if(!dialogo) montaDialogo();
      dialogo.showModal();
      document.documentElement.classList.add('sem-rolagem');
    });
  });

  // glossário (i): textos num lugar só; o HTML usa <button class="info" data-termo="sca">
  var GLOSSARIO = {
    catuai: ['Catuaí', 'Uma das variedades de arábica mais tradicionais do Brasil, desenvolvida pelo Instituto Agronômico de Campinas. Dá cafés doces, equilibrados e de corpo médio, com notas de caramelo e chocolate.'],
    natural: ['Processo natural', 'O fruto do café seca inteiro, com a casca, antes de o grão ser retirado. Durante a secagem o grão absorve açúcares da polpa, o que deixa a bebida mais doce e encorpada.'],
    sca: ['SCA', 'Specialty Coffee Association, entidade internacional que define como cafés são avaliados. Provadores certificados dão notas de 0 a 100. A partir de 80 pontos o café é considerado especial; a maioria do café vendido no mercado fica abaixo disso.'],
    mole: ['Bebida mole', 'Classificação brasileira da prova de xícara, feita por provadores. “Mole” indica um café suave e adocicado, sem aspereza nem adstringência. É o oposto das bebidas “dura” e “rio”, de gosto áspero e medicinal, comuns nos cafés de mercado.'],
    corpo: ['Corpo', 'É a textura e o “peso” do café na boca, como a diferença entre leite desnatado e integral. Corpo cremoso é denso e aveludado; equilibrado fica no meio, nem ralo nem pesado.'],
    acidez: ['Acidez', 'Não é azedume nem causa azia: é a vivacidade que dá brilho ao sabor, como numa fruta madura. Acidez equilibrada aparece sem dominar a xícara.'],
    torra: ['Torra média', 'Ponto entre a torra clara e a escura. Preserva a doçura e as notas naturais do grão, sem o amargor de queimado das torras escuras usadas para disfarçar grãos de baixa qualidade.'],
    arabica: ['100% Arábica', 'Coffea arabica, a espécie de café mais valorizada do mundo. É mais aromática e doce que o robusta (conilon), com menos amargor. Todo café especial é arábica.'],
    notas: ['Notas sensoriais', 'Aromas e sabores que o próprio grão revela, por causa da variedade, do solo, do clima e da torra. Nada é adicionado: o mel e o caramelo que você sente vêm do café.'],
    finalizacao: ['Finalização', 'Também chamada de retrogosto: é o sabor que fica na boca depois de engolir. Um final longo e limpo, sem amargor, é sinal de café de qualidade.'],
    docura: ['Doçura', 'Doçura natural do grão colhido maduro e bem torrado. Café especial bom costuma dispensar o açúcar.'],
    suspensa: ['Secagem suspensa', 'Os grãos secam sobre telas elevadas do chão, com o ar circulando por baixo. A secagem fica mais uniforme e limpa, o que preserva aromas e doçura.'],
    arara: ['Variedade Arara', 'Cultivar de arábica brasileira, de frutos amarelos, desenvolvida pela Fundação Procafé. É conhecida pela resistência natural a doenças e pela bebida doce e de boa qualidade.'],
    colheita: ['Colheita manual', 'Os frutos são colhidos à mão, escolhendo os que estão no ponto ideal de maturação. Dá mais trabalho, mas evita grãos verdes ou passados na xícara.'],
    terroir: ['Terroir', 'O conjunto de solo, clima, altitude e manejo de um lugar. É o que dá identidade ao café, como acontece com o vinho e com o queijo da Canastra.'],
    defeitos: ['Defeitos', 'Grãos imperfeitos ou impurezas encontrados numa amostra: grãos pretos, ardidos (fermentados), verdes, brocados (furados por inseto) e quebrados, além de cascas, paus e pedras. Quanto menos defeitos, mais limpo e doce o café.'],
    graos: ['Em grãos ou moído', 'Em grãos você mói na hora, e o aroma fica mais preservado. O moído vem pronto, com moagem média para coador, cafeteira elétrica, italiana e prensa.']
  };
  var tip = document.createElement('div');
  tip.id = 'glossario-tip'; tip.setAttribute('role','tooltip');
  document.body.appendChild(tip);
  var atual = null, fixo = false; // fixo = aberto por clique/toque (não fecha ao tirar o mouse)
  function abre(btn){
    var t = GLOSSARIO[btn.dataset.termo]; if(!t) return;
    if(atual && atual !== btn){ atual.setAttribute('aria-expanded','false'); atual.removeAttribute('aria-describedby'); }
    atual = btn;
    tip.innerHTML = '<b>' + t[0] + '</b>' + t[1] + (btn.dataset.termo === 'sca' && document.getElementById('piramide') && !btn.closest('#piramide') ? ' <a href="#piramide" class="tip-link">Ver a pirâmide do café</a>' : '');
    tip.classList.add('on');
    btn.setAttribute('aria-expanded','true');
    btn.setAttribute('aria-describedby','glossario-tip');
    var r = btn.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, m = 12;
    var left = Math.min(Math.max(m, r.left + r.width/2 - w/2), window.innerWidth - w - m);
    var top = r.top - h - 10; if(top < m) top = r.bottom + 10;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function fecha(){
    tip.classList.remove('on');
    if(atual){ atual.setAttribute('aria-expanded','false'); atual.removeAttribute('aria-describedby'); }
    atual = null; fixo = false;
  }
  var temHover = window.matchMedia('(hover:hover)').matches;
  document.querySelectorAll('.info[data-termo]').forEach(function(btn){
    btn.type = 'button';
    btn.setAttribute('aria-expanded','false');
    if(!btn.getAttribute('aria-label')) btn.setAttribute('aria-label','O que é ' + (GLOSSARIO[btn.dataset.termo]||[''])[0] + '?');
    btn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      if(atual === btn && fixo){ fecha(); return; }
      abre(btn); fixo = true;
    });
    if(temHover){
      btn.addEventListener('mouseenter', function(){ if(!fixo) abre(btn); });
      btn.addEventListener('mouseleave', function(){ if(!fixo) fecha(); });
    }
    btn.addEventListener('keyup', function(e){ if(e.key === 'Tab') abre(btn); }); // foco via teclado
    btn.addEventListener('blur', function(){ if(!fixo) fecha(); });
  });
  document.addEventListener('click', function(e){ if(atual && !tip.contains(e.target)) fecha(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') fecha(); });
  window.addEventListener('scroll', function(){ if(atual) fecha(); }, {passive:true});

  // vídeos do YouTube: só carregam ao clicar (página mais leve)
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-yt]'); if(!b) return;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + b.dataset.yt + '?autoplay=1&playsinline=1&rel=0';
    f.title = b.getAttribute('aria-label') || 'Vídeo';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    b.replaceWith(f);
  });


  // carrinho real da Shopify (AJAX Cart API)
  var API = {
    carrinho: function(){ return fetch('/cart.js', {headers: {'Accept': 'application/json'}}).then(function(r){ return r.json(); }); },
    alterar: function(linha, qtd){ return fetch('/cart/change.js', {method: 'POST', headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, body: JSON.stringify({line: linha, quantity: Math.max(0, qtd)})}).then(function(r){ return r.json(); }); },
    // tira todas as linhas de um café de uma vez (a Shopify pode ter dividido o café em várias linhas por causa do desconto)
    remover: function(chaves){ var u = {}; chaves.forEach(function(k){ u[k] = 0; }); return fetch('/cart/update.js', {method: 'POST', headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, body: JSON.stringify({updates: u})}).then(function(r){ if(!r.ok){ throw r; } return r.json(); }); },
    adicionar: function(itens){ return fetch('/cart/add.js', {method: 'POST', headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, body: JSON.stringify({items: itens})}).then(function(r){ if(!r.ok){ throw r; } return r.json(); }); },
    checkout: function(){ return CFG.checkout || '/checkout'; }
  };

  // ===== gaveta de carrinho (mesmo desenho no tema e no protótipo; muda só a API) =====
  var CFG = window.TML_CARRINHO || {};
  var gaveta = document.querySelector('[data-gaveta]');
  var paginaCarrinho = document.querySelector('[data-carrinho-pagina]');
  function dinheiro(c){ return (c / 100).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}); }
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(x){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]; }); }
  function nomeCurto(t){ return String(t || '').split('•')[0].trim(); }
  function bonito(v){ return String(v || '').split('•').map(function(p){ p = p.trim(); return /^\d/.test(p) ? p : p.charAt(0) + p.slice(1).toLowerCase(); }).join(' • '); }
  function miniatura(u){ if(!u || u.indexOf('cdn.shopify') < 0){ return u || ''; } return /width=\d+/.test(u) ? u.replace(/width=\d+/, 'width=160') : u + (u.indexOf('?') > -1 ? '&' : '?') + 'width=160'; }
  function ehKit(id){ return (CFG.kits || []).map(String).indexOf(String(id)) > -1; }
  var VAZIO_XICARA = '<span class="xicara-vapor" aria-hidden="true"><span class="vapor"><i></i><i></i><i></i></span><svg viewBox="0 0 44 34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6h26v10a11 11 0 01-11 11h-4A11 11 0 016 16z"/><path d="M32 9h3a5 5 0 010 10h-3"/><path d="M3 31h34"/></svg></span>';

  var ultimo = {items: []};   // último carrinho recebido: as ações da gaveta usam as linhas reais dele
  var brindesVistos = {};     // brindes por café no desenho anterior (para destacar quando ganha um novo)
  var ICONE_PRESENTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v7a1 1 0 001 1h12a1 1 0 001-1v-7M12 8.5v12"/><path d="M12 8.5C10.5 5 7 4.5 7 6.6 7 8.5 12 8.5 12 8.5zM12 8.5c1.5-3.5 5-4 5-1.9 0 1.9-5 1.9-5 1.9z"/></svg>';
  function desenha(c, raiz, naGaveta){
    ultimo = c;
    var minimo = CFG.freteMinimo || 15000;
    var cont = raiz.querySelector('[data-gav-count]');
    if(cont){ cont.textContent = c.item_count ? '(' + c.item_count + (c.item_count > 1 ? ' itens)' : ' item)') : ''; }
    document.querySelectorAll('.nav-carrinho').forEach(function(a){
      var s = a.querySelector('span');
      if(c.item_count){ if(!s){ s = document.createElement('span'); a.appendChild(s); } s.textContent = c.item_count; } else if(s){ s.remove(); }
    });
    var frete = raiz.querySelector('[data-gav-frete]'), corpo = raiz.querySelector('[data-gav-corpo]'), rodape = raiz.querySelector('[data-gav-rodape]');
    if(!c.item_count){
      frete.innerHTML = ''; rodape.innerHTML = '';
      corpo.innerHTML = '<div class="gav-vazio">' + VAZIO_XICARA + '<h3>Seu carrinho está vazio</h3><p>Que tal começar pelo café da casa?</p>' +
        (CFG.links || []).map(function(l){ return '<a class="btn ' + (l.classe || '') + '" href="' + l.url + '">' + esc(l.texto) + '</a>'; }).join('') + '</div>';
      return;
    }
    if(c.total_price >= minimo){
      frete.innerHTML = '<div class="gav-frete ok"><b>Seu pedido tem frete grátis</b> para todo o Brasil.<div class="gav-trilho"><i style="--p:100%"></i></div></div>';
    } else {
      frete.innerHTML = '<div class="gav-frete">Faltam <b>' + dinheiro(minimo - c.total_price) + '</b> para o frete grátis.<div class="gav-trilho"><i style="--p:' + Math.round(c.total_price / minimo * 100) + '%"></i></div></div>';
    }
    var noCarrinho = c.items.map(function(it){ return String(it.product_id); });
    // a Shopify divide o mesmo café em várias linhas quando aplica o "Pague 3, Leve 4" (ex.: 1 + 1 grátis + 3):
    // na gaveta cada café/variante aparece uma vez só, e as unidades grátis ganham uma faixa de brinde
    var grupos = [], porVar = {};
    c.items.forEach(function(it){
      var g = porVar[it.variant_id];
      if(!g){ g = porVar[it.variant_id] = {it: it, quantidade: 0, original: 0, final: 0, desc: 0}; grupos.push(g); }
      g.quantidade += it.quantity; g.original += it.original_line_price; g.final += it.final_line_price;
      g.desc += (it.line_level_discount_allocations || []).reduce(function(s, a){ return s + a.amount; }, 0);
    });
    var totalKit = 0, varBrinde = null, menor = Infinity;
    grupos.forEach(function(g){
      if(!ehKit(g.it.product_id)){ return; }
      totalKit += g.quantidade;
      var unit = g.original / g.quantidade;
      if(unit < menor){ menor = unit; varBrinde = g.it.variant_id; }
    });
    // quantos pacotes faltam para o próximo 4º grátis (1, 2 ou 3); 0 = o kit já fechou
    var falta = totalKit ? (4 - totalKit % 4) % 4 : 0;
    if(!falta){ varBrinde = null; }
    var brindesAntes = brindesVistos; brindesVistos = {};
    var itens = grupos.map(function(g){
      var it = g.it, v = it.variant_id, unit = g.original / g.quantidade;
      var gratis = g.desc ? Math.round(g.desc / unit) : 0;
      brindesVistos[v] = gratis;
      // compre 3, ganhe 1 (vale misturado): faltando 1 pacote, o aviso fica no café mais barato, que é o que sai de graça
      var aviso = v === varBrinde
        ? '<button type="button" class="gav-brinde" data-gav-acao="mais" data-gav-n="' + falta + '" data-gav-var="' + v + '"><span>' +
          (falta === 1 ? 'Adicione o ' + (totalKit + 1) + 'º pacote de graça' : 'Leve mais ' + falta + ' e o 4º sai de graça, com frete grátis') +
          '</span><b>' + (falta === 1 ? 'Pague 3, Leve 4' : '+ ' + falta + ' pacotes') + '</b></button>' : '';
      var presente = gratis
        ? '<div class="gav-presente' + (gratis > (brindesAntes[v] || 0) && brindesAntes._pronto ? ' novo' : '') + '"><span class="gav-presente-ic" aria-hidden="true">' + ICONE_PRESENTE + '</span>' +
          '<div><b>' + gratis + (gratis > 1 ? ' unidades' : ' unidade') + ' de brinde</b><small>Pague 3, Leve 4</small></div>' +
          '<div class="gav-presente-valor"><s>' + dinheiro(g.desc) + '</s><span>Grátis</span></div></div>' : '';
      return '<div class="gav-item" data-gav-item="' + v + '"><img src="' + esc(miniatura(it.image)) + '" alt="" width="76" height="76" loading="eager" decoding="async"><div class="gav-info">' +
        '<div class="gav-linha1"><div><a class="gav-nome" href="' + esc(it.url) + '">' + esc(nomeCurto(it.product_title)) + '</a><span class="gav-var">' + esc(bonito(it.variant_title)) + '</span></div>' +
        '<div class="gav-preco">' + (g.desc ? '<s>' + dinheiro(g.original) + '</s>' : '') + dinheiro(g.final) + '</div></div>' +
        '<div class="gav-linha2"><div class="gav-qtd"><button type="button" data-gav-acao="menos" data-gav-var="' + v + '" aria-label="Menos um">−</button><output>' + g.quantidade + '</output>' +
        '<button type="button" data-gav-acao="mais" data-gav-var="' + v + '" aria-label="Mais um">+</button></div>' +
        '<button type="button" class="gav-remover" data-gav-acao="remover" data-gav-var="' + v + '">Remover</button></div></div>' + presente + aviso + '</div>';
    }).join('');
    brindesVistos._pronto = true;
    var sug = (CFG.sugestoes || []).filter(function(s){ return noCarrinho.indexOf(String(s.produtoId)) < 0; })[0];
    var sugHtml = sug ? '<div class="gav-sugestao"><small>Que tal provar também?</small><div class="gav-sug"><img src="' + esc(sug.img) + '" alt="" width="56" height="56" loading="lazy">' +
      '<div><b>' + esc(sug.titulo) + '</b><span>' + esc(sug.descricao) + ' • ' + dinheiro(sug.preco) + '</span></div>' +
      '<button type="button" data-gav-add="' + sug.variantId + '">Adicionar</button></div></div>' : '';
    corpo.innerHTML = itens + sugHtml;
    rodape.innerHTML = '<div class="gav-rodape">' +
      (c.total_discount ? '<div class="gav-eco"><span>Você economiza</span><span>' + dinheiro(c.total_discount) + '</span></div>' : '') +
      '<div class="gav-total"><span>Total</span><b>' + dinheiro(c.total_price) + '</b></div>' +
      '<p class="gav-nota">' + (c.total_price >= minimo ? 'Frete grátis. ' : 'Frete calculado no checkout. ') + 'Pague com Pix ou cartão no checkout seguro da Shopify.</p>' +
      '<a class="btn btn-bloco" href="' + esc(API.checkout(c)) + '" data-gav-checkout>Finalizar compra</a>' +
      (naGaveta ? '<button type="button" class="gav-continuar" data-gav-fechar>Continuar comprando</button>' : '') + '</div>';
  }
  function redesenha(c){
    if(gaveta){ desenha(c, gaveta, true); }
    if(paginaCarrinho){ desenha(c, paginaCarrinho, false); }
  }
  function abrirGaveta(){
    if(!gaveta){ return false; }
    API.carrinho().then(redesenha);
    if(!gaveta.open){ gaveta.showModal(); document.documentElement.classList.add('sem-rolagem'); }
    return true;
  }
  window.TML_ABRIR_CARRINHO = abrirGaveta;
  [gaveta, paginaCarrinho].forEach(function(raiz){
    if(!raiz){ return; }
    raiz.addEventListener('click', function(e){
      var ac = e.target.closest('[data-gav-acao]'), add = e.target.closest('[data-gav-add]');
      if(e.target.closest('[data-gav-fechar]') || e.target === gaveta){ gaveta.close(); return; }
      if(!ac && !add){ return; }
      if(raiz.classList.contains('gav-carregando')){ return; }   // um pedido por vez
      raiz.classList.add('gav-carregando');
      var p;
      if(add){
        p = API.adicionar([{id: +add.dataset.gavAdd, quantity: 1}]).then(API.carrinho);
      } else {
        var v = +ac.dataset.gavVar, acao = ac.dataset.gavAcao, n = +ac.dataset.gavN || 1;
        // linhas reais desse café no carrinho (a Shopify pode ter dividido em várias)
        var linhas = ultimo.items.map(function(it, i){ return {linha: i + 1, q: it.quantity, v: it.variant_id, chave: it.key}; }).filter(function(l){ return l.v === v; });
        var total = linhas.reduce(function(s, l){ return s + l.q; }, 0), ult = linhas[linhas.length - 1];
        // resposta na hora: o número muda já e só o preço desse café fica esperando a Shopify (nada de apagar a gaveta inteira)
        var item = raiz.querySelector('[data-gav-item="' + v + '"]'), out = item && item.querySelector('output');
        if(item){ item.classList.add('gav-atualizando'); }
        if(out){ out.textContent = acao === 'mais' ? total + n : acao === 'menos' ? Math.max(0, total - 1) : 0; }
        if(!ult){ p = API.carrinho(); }
        else if(acao === 'mais'){ p = API.alterar(ult.linha, ult.q + n); }
        else if(acao === 'menos'){ p = API.alterar(ult.linha, ult.q - 1); }
        else { p = API.remover(linhas.map(function(l){ return l.chave; }), v); }
      }
      p.then(redesenha).catch(function(){ return API.carrinho().then(redesenha); })
       .finally(function(){ raiz.classList.remove('gav-carregando'); });
    });
  });
  if(gaveta){
    gaveta.addEventListener('close', function(){ document.documentElement.classList.remove('sem-rolagem'); });
    document.addEventListener('click', function(e){
      var a = e.target.closest('.nav-carrinho');
      if(a){ e.preventDefault(); abrirGaveta(); }
    });
  }
  if(paginaCarrinho){ API.carrinho().then(redesenha); }

  // serra em paralaxe: as linhas deslizam com a rolagem (celular) e com o mouse (computador)
  if(!REDUZ){
    var serras = document.querySelectorAll('.hero-home, .lp-hero');
    if(serras.length){
      var mouseX = 0, pendente = false;
      var aplicaSerra = function(){
        pendente = false;
        var x = -window.scrollY * 0.6 + mouseX;
        serras.forEach(function(s){ s.style.setProperty('--serra-x', x.toFixed(1) + 'px'); });
      };
      var agendaSerra = function(){ if(!pendente){ pendente = true; requestAnimationFrame(aplicaSerra); } };
      window.addEventListener('scroll', agendaSerra, {passive: true});
      if(window.matchMedia('(hover: hover)').matches){
        window.addEventListener('mousemove', function(e){ mouseX = (e.clientX / window.innerWidth - 0.5) * -90; agendaSerra(); }, {passive: true});
      }
      aplicaSerra();
    }
  }

  // pirâmide da qualidade: tocar/passar o mouse em um nível mostra a explicação
  document.querySelectorAll('[data-piramide]').forEach(function(p){
    var niveis = Array.prototype.slice.call(p.querySelectorAll('.pir-nivel'));
    var nome = p.querySelector('[data-pir-nome]'), crit = p.querySelector('[data-pir-criterio]'), desc = p.querySelector('[data-pir-desc]');
    var pir = p.querySelector('.piramide'), info = p.querySelector('.pir-info'), ponte = p.querySelector('.pir-ponte'), atual = null;
    function preenche(b){ nome.textContent = b.dataset.nome; crit.textContent = b.dataset.criterio; desc.textContent = b.dataset.desc; }
    // conector tracejado do (i) da faixa ativa até o painel (só com as duas colunas lado a lado)
    function liga(){
      if(!ponte || !atual) return;
      var ic = atual.querySelector('.pir-i');
      if(!ic || window.matchMedia('(max-width:860px)').matches){ ponte.classList.remove('vis'); return; }
      var g = p.getBoundingClientRect(), r = ic.getBoundingClientRect(), pr = info.getBoundingClientRect();
      var x = r.right - g.left + 6;
      ponte.style.top = (r.top + r.height / 2 - g.top) + 'px';
      ponte.style.left = x + 'px';
      ponte.style.width = Math.max(0, pr.left - g.left - x) + 'px';
      ponte.classList.add('vis');
    }
    // o painel fica com a altura da maior explicação: trocar de faixa não empurra a página (sem "piscar")
    function fixaAltura(){
      info.style.minHeight = '';
      var max = 0;
      niveis.forEach(function(b){ preenche(b); max = Math.max(max, info.offsetHeight); });
      if(atual){ preenche(atual); }
      info.style.minHeight = max + 'px';
    }
    function ativa(b){
      if(b === atual) return;
      atual = b;
      niveis.forEach(function(x){ x.classList.toggle('ativo', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      preenche(b);
      liga();
    }
    niveis.forEach(function(b){
      b.addEventListener('click', function(){ ativa(b); });
      if(window.matchMedia('(hover: hover)').matches){ b.addEventListener('mouseenter', function(){ ativa(b); }); }
    });
    if(niveis.length){
      ativa(niveis[0]); fixaAltura();
      if(document.fonts && document.fonts.ready){ document.fonts.ready.then(function(){ fixaAltura(); liga(); }); }
      var tm; window.addEventListener('resize', function(){ clearTimeout(tm); tm = setTimeout(function(){ fixaAltura(); liga(); }, 150); });
      // depois que a pirâmide termina de se montar, liga o conector e tira os atrasos da animação de entrada
      var monta = function(){ setTimeout(function(){ pir.classList.add('montada'); liga(); }, 1400); };
      if(pir.classList.contains('on') || !pir.classList.contains('reveal')){ monta(); }
      else { new MutationObserver(function(m, o){ if(pir.classList.contains('on')){ o.disconnect(); monta(); } }).observe(pir, {attributes:true, attributeFilter:['class']}); }
    }
  });

  // rodapé: momento do dia do céu e, se a seção logo acima for escura, transição sem a bruma clara
  (function(){
    var rod = document.querySelector('footer.site'); if(!rod) return;
    // céu pela hora de quem visita: dia 6h–17h, entardecer 17h–19h, noite no resto (?ceu=dia|entardecer|noite para testar)
    var h = new Date().getHours(), forcado = (location.search.match(/[?&]ceu=(dia|entardecer|noite)/) || [])[1];
    var momento = forcado || (h >= 6 && h < 17 ? 'dia' : h >= 17 && h < 19 ? 'entardecer' : 'noite');
    if(momento !== 'noite'){ rod.classList.add('ceu-' + momento); }
    // cor do que encosta no rodapé: desce da <main> sempre pelo filho que chega até a borda do rodapé
    // e guarda o último fundo opaco de largura total (body se nenhum). Não depende de ser <section>.
    var topo = rod.getBoundingClientRect().top, fundoAcima = getComputedStyle(document.body).backgroundColor;
    for(var el = document.querySelector('main') || document.body; el; ){
      var cs = getComputedStyle(el), m = cs.backgroundColor.match(/[\d.]+/g);
      if(m && (m.length < 4 || +m[3] > .5) && el.getBoundingClientRect().width >= window.innerWidth * .9){ fundoAcima = cs.backgroundColor; }
      var filhos = Array.prototype.filter.call(el.children, function(c){
        var r = c.getBoundingClientRect(), p = getComputedStyle(c).position;
        return r.height > 0 && r.bottom >= topo - 4 && p !== 'fixed' && p !== 'absolute';
      });
      el = filhos[filhos.length - 1];
    }
    var rgb = fundoAcima.match(/[\d.]+/g) || [255, 255, 255];
    rod.style.setProperty('--cor-acima', fundoAcima);   // o céu nasce da cor do que está logo acima
    if((.2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]) / 255 < .35){ rod.classList.add('sobre-escuro'); }
  })();

  // políticas (texto cadastrado na Shopify): índice "Nesta página" a partir dos títulos do texto
  document.querySelectorAll('[data-pol]').forEach(function(art){
    var corpo = art.querySelector('.shopify-policy__body') || art;
    var toc = document.querySelector('[data-pol-toc]');
    var tits = Array.prototype.slice.call(corpo.querySelectorAll('h2, h3'));
    if(tits.length < 3){
      // muitas políticas usam parágrafos só em negrito como títulos
      corpo.querySelectorAll('p').forEach(function(p){
        var txt = p.textContent.trim(), b = p.querySelector('strong, b');
        if(b && txt && b.textContent.trim() === txt && txt.length < 90){ p.classList.add('pol-titulo'); tits.push(p); }
      });
      tits.sort(function(a, b){ return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    }
    if(!toc || tits.length < 3) return;
    var lista = toc.querySelector('ol'), links = [];
    tits.forEach(function(t, i){
      if(!t.id){ t.id = 'secao-' + (i + 1) + '-' + t.textContent.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); }
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + t.id; a.textContent = t.textContent.trim().replace(/[:.]$/, '');
      li.appendChild(a); lista.appendChild(li); links.push(a);
    });
    toc.hidden = false;
    if('IntersectionObserver' in window){
      var vis = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(en.isIntersecting){ links.forEach(function(a){ a.classList.toggle('ativo', a.getAttribute('href') === '#' + en.target.id); }); }
        });
      }, {rootMargin: '-110px 0px -70% 0px'});
      tits.forEach(function(t){ vis.observe(t); });
    }
  });

  // revelar ao rolar
  var els = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('on'); io.unobserve(en.target); } });
    },{threshold:.12});
    // a pirâmide só se monta quando está bem visível (não na beirada da tela)
    var ioPir = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('on'); ioPir.unobserve(en.target); } });
    },{threshold:.55});
    els.forEach(function(el){ (el.classList.contains('piramide') ? ioPir : io).observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('on'); });
  }
})();
