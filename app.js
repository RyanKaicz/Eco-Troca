// 1. Configuração do Firebase (Substitua pelas suas chaves do Firebase Console)
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// 2. Inicializar o Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const itemsRef = database.ref('itens_ecotroca_geral');

// Elementos do DOM
const itemForm = document.getElementById('item-form');
const itemsGrid = document.getElementById('items-grid');
const filterCategoria = document.getElementById('filter-categoria');

let allItemsArray = [];

// 3. Escutar mudanças na nuvem em TEMPO REAL
itemsRef.on('value', (snapshot) => {
  const data = snapshot.val();
  allItemsArray = [];

  if (data) {
    Object.keys(data).forEach(key => {
      allItemsArray.push({
        id: key,
        ...data[key]
      });
    });
    allItemsArray.reverse(); // Exibe os cadastros mais recentes primeiro
  }

  renderItems();
});

// 4. Renderizar os cards na tela
function renderItems() {
  const selectedFilter = filterCategoria.value;
  itemsGrid.innerHTML = '';

  const filteredItems = selectedFilter === 'TODAS'
    ? allItemsArray
    : allItemsArray.filter(item => item.categoria === selectedFilter);

  if (filteredItems.length === 0) {
    itemsGrid.innerHTML = `<p class="empty-message">Nenhum item disponível nesta categoria momento.</p>`;
    return;
  }

  filteredItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    card.innerHTML = `
      <div>
        <span class="tag">${escapeHTML(item.categoria)}</span>
        <h3>${escapeHTML(item.titulo)}</h3>
        <p>${escapeHTML(item.descricao)}</p>
      </div>
      <div class="contact-info">
        📍 <strong>Localização:</strong> ${escapeHTML(item.localizacao)}<br>
        👤 <strong>Contato:</strong> ${escapeHTML(item.contato)}
      </div>
    `;

    itemsGrid.appendChild(card);
  });
}

// 5. Cadastrar novo item no Firebase
itemForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const titulo = document.getElementById('titulo').value.trim();
  const categoria = document.getElementById('categoria').value;
  const descricao = document.getElementById('descricao').value.trim();
  const localizacao = document.getElementById('localizacao').value.trim();
  const contato = document.getElementById('contato').value.trim();

  if (!titulo || !categoria || !descricao || !localizacao || !contato) {
    alert('Por favor, preencha todos os campos!');
    return;
  }

  itemsRef.push({
    titulo,
    categoria,
    descricao,
    localizacao,
    contato,
    timestamp: Date.now()
  }).then(() => {
    itemForm.reset();
  }).catch((error) => {
    alert('Erro ao publicar item: ' + error.message);
  });
});

// Evento do filtro de categoria
filterCategoria.addEventListener('change', renderItems);

// Proteção XSS
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
