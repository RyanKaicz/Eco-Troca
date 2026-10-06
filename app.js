// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Elementos do DOM
const itemForm = document.getElementById('item-form');
const itemsGrid = document.getElementById('items-grid');
const filterCategoria = document.getElementById('filter-categoria');

let allItemsArray = [];

// 3. Escutar atualizações na nuvem em tempo real
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

// 4. Renderizar itens na tela (com suporte a foto)
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

    // Se tiver imagem, insere a tag <img>, senão não mostra nada
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
      <div class="contact-info">
        📍 <strong>Localização:</strong> ${escapeHTML(item.localizacao)}<br>
        👤 <strong>Contato:</strong> ${escapeHTML(item.contato)}
      </div>
    `;

    itemsGrid.appendChild(card);
  });
}

// 5. Cadastrar item (convertendo e comprimindo imagem se houver)
itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const titulo = document.getElementById('titulo').value.trim();
  const categoria = document.getElementById('categoria').value;
  const descricao = document.getElementById('descricao').value.trim();
  const localizacao = document.getElementById('localizacao').value.trim();
  const contato = document.getElementById('contato').value.trim();
  const imageInput = document.getElementById('imagem');

  if (!titulo || !categoria || !descricao || !localizacao || !contato) {
    alert('Por favor, preencha todos os campos obrigatórios!');
    return;
  }

  let imagemBase64 = '';

  // Processa a imagem se o usuário selecionou alguma
  if (imageInput.files && imageInput.files[0]) {
    try {
      imagemBase64 = await compressAndConvertToBase64(imageInput.files[0]);
    } catch (err) {
      alert('Erro ao carregar a imagem. Tente uma imagem menor.');
      return;
    }
  }

  // Salva na nuvem (Firebase)
  itemsRef.push({
    titulo,
    categoria,
    descricao,
    localizacao,
    contato,
    imagemBase64,
    timestamp: Date.now()
  }).then(() => {
    itemForm.reset();
  }).catch((error) => {
    alert('Erro ao publicar item: ' + error.message);
  });
});

// Evento de mudança de filtro
filterCategoria.addEventListener('change', renderItems);

// Função auxiliar para redimensionar e comprimir a foto antes de enviar
function compressAndConvertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500; // Largura máxima da imagem em pixels
        const scaleSize = MAX_WIDTH / img.width;
        
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('canvas');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Retorna a imagem comprimida em formato WebP/JPEG leve
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
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
