// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCdyDOxecBHTESa9l7nM5fk4E-bpvF_9HA",
  authDomain: "ecotroca-811fc.firebaseapp.com",
  databaseURL: "https://ecotroca-811fc-default-rtdb.firebaseio.com",
  projectId: "ecotroca-811fc",
  storageBucket: "ecotroca-811fc.firebasestorage.app",
  messagingSenderId: "127196018508",
  appId: "1:127196018508:web:72581573287f1d2dcec1e9",
  measurementId: "G-CCYHQ4WX95"
};

// Inicializar Firebase e Realtime Database
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const itemsRef = database.ref('itens_ecotroca_geral');

// Elementos da interface
const itemForm = document.getElementById('item-form');
const itemsGrid = document.getElementById('items-grid');
const filterCategoria = document.getElementById('filter-categoria');

let allItemsArray = [];

// Escutar atualizações da nuvem em tempo real
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
    allItemsArray.reverse();
  }

  renderItems();
});

// Renderizar cards na tela
function renderItems() {
  const selectedFilter = filterCategoria.value;
  itemsGrid.innerHTML = '';

  const filteredItems = selectedFilter === 'TODAS'
    ? allItemsArray
    : allItemsArray.filter(item => item.categoria === selectedFilter);

  if (filteredItems.length === 0) {
    itemsGrid.innerHTML = `<p class="empty-message">Nenhum item disponível nesta categoria no momento.</p>`;
    return;
  }

  filteredItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const imgHTML = item.imagemBase64 
      ? `<img src="${item.imagemBase64}" alt="${escapeHTML(item.titulo)}" class="card-img">`
      : '';

    card.innerHTML = `
      <div>
        ${imgHTML}
        <span class="tag">${escapeHTML(item.categoria)}</span>
        <h3>${escapeHTML(item.titulo)}</h3>
        <p>${escapeHTML(item.descricao)}</p>
      </div>
      <div>
        <div class="contact-info">
          📍 <strong>Localização:</strong> ${escapeHTML(item.localizacao)}<br>
          👤 <strong>Contato:</strong> ${escapeHTML(item.contato)}
        </div>
        <button class="btn-delete" onclick="removerItem('${item.id}', '${item.pin}')">
          🗑️ Remover (Já doado/trocado)
        </button>
      </div>
    `;

    itemsGrid.appendChild(card);
  });
}

// Função para remover item validando o PIN/Senha ou a Senha Mestre (0000)
function removerItem(itemId, pinCorreto) {
  const pinDigitado = prompt("Digite o PIN/Senha que você criou ao cadastrar este item (ou a senha mestre):");

  if (pinDigitado === null) return; // Se o usuário clicou em cancelar

  const pinLimpo = pinDigitado.trim();

  // Aceita o PIN criado OU a senha mestre 0000
  if (pinLimpo === pinCorreto || pinLimpo === '0000') {
    itemsRef.child(itemId).remove()
      .then(() => {
        alert("Item removido com sucesso!");
      })
      .catch((error) => {
        alert("Erro ao remover item: " + error.message);
      });
  } else {
    alert("❌ PIN/Senha incorreto! Apenas o criador do anúncio ou o administrador pode removê-lo.");
  }
}

// Cadastrar item no Firebase
itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const titulo = document.getElementById('titulo').value.trim();
  const categoria = document.getElementById('categoria').value;
  const descricao = document.getElementById('descricao').value.trim();
  const localizacao = document.getElementById('localizacao').value.trim();
  const contato = document.getElementById('contato').value.trim();
  const pin = document.getElementById('pin').value.trim();
  const imageInput = document.getElementById('imagem');

  if (!titulo || !categoria || !descricao || !localizacao || !contato || !pin) {
    alert('Por favor, preencha todos os campos obrigatórios!');
    return;
  }

  let imagemBase64 = '';

  if (imageInput.files && imageInput.files[0]) {
    try {
      imagemBase64 = await compressAndConvertToBase64(imageInput.files[0]);
    } catch (err) {
      alert('Erro ao processar imagem. Tente uma foto diferente.');
      return;
    }
  }

  itemsRef.push({
    titulo,
    categoria,
    descricao,
    localizacao,
    contato,
    pin,
    imagemBase64,
    timestamp: Date.now()
  }).then(() => {
    itemForm.reset();
  }).catch((error) => {
    alert('Erro ao publicar item: ' + error.message);
  });
});

filterCategoria.addEventListener('change', renderItems);

// Redimensiona e comprime imagens antes de enviar para economizar espaço
function compressAndConvertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const scaleSize = MAX_WIDTH / img.width;
        
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Proteção XSS
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      
