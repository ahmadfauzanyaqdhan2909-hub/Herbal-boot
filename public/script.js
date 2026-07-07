const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const heroSection = document.getElementById('hero-section');
const sendBtn = document.getElementById('send-btn');
const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat-btn');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const koleksiBtn = document.getElementById('koleksi-btn');
const heroText = document.getElementById('hero-text');

let chats = JSON.parse(localStorage.getItem('gemini_chats')) || [];

// Migrasi data koleksi ke format Object jika ada yang masih string
let savedRecipesRaw = JSON.parse(localStorage.getItem('gemini_saved_recipes')) || [];
let savedRecipes = savedRecipesRaw.map(recipe => {
  if (typeof recipe === 'string') {
    const lines = recipe.split('\n');
    let title = 'Resep Tersimpan';
    for (let line of lines) {
      if (line.startsWith('### Resep Herbal')) {
        title = line.replace('### ', '').trim();
        break;
      }
    }
    return {
      id: 'coll_' + Date.now() + Math.random().toString(36).substring(2, 9),
      title: title,
      content: recipe
    };
  }
  return recipe;
});

let currentChatId = null;
let draggedItemIndex = null;
let showingKoleksi = false;
let draggedColIndex = null;

// Initialize app
function init() {
  renderHistory();
  startNewChat(); 
}

function saveChats() {
  localStorage.setItem('gemini_chats', JSON.stringify(chats));
}

function saveCollection() {
  localStorage.setItem('gemini_saved_recipes', JSON.stringify(savedRecipes));
}

function startNewChat() {
  showingKoleksi = false;
  koleksiBtn.style.color = '';
  heroText.textContent = 'Masukkan resep herbal yang anda cari';
  
  currentChatId = Date.now().toString();
  chats.unshift({
    id: currentChatId,
    title: 'Percakapan Baru',
    messages: []
  });
  saveChats();
  renderHistory();
  clearChatArea();
  heroSection.style.display = 'flex';
}

function loadChat(chatId) {
  showingKoleksi = false;
  koleksiBtn.style.color = '';
  heroText.textContent = 'Masukkan resep herbal yang anda cari';

  currentChatId = chatId;
  const chat = chats.find(c => c.id === chatId);
  clearChatArea();
  
  if (chat && chat.messages && chat.messages.length > 0) {
    heroSection.style.display = 'none';
    chat.messages.forEach(msg => {
      appendMessage(msg.sender, msg.text, false);
    });
  } else {
    heroSection.style.display = 'flex';
  }
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';
  chats.forEach((chat, index) => {
    if (chat.messages.length === 0 && chat.id !== currentChatId) return;

    const li = document.createElement('li');
    li.className = 'history-item';
    li.setAttribute('draggable', 'true');
    li.dataset.index = index;
    if (chat.id === currentChatId && !showingKoleksi) li.classList.add('active');

    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragenter', handleDragEnter);
    li.addEventListener('dragleave', handleDragLeave);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'history-item-title';
    titleSpan.textContent = chat.title;
    
    li.onclick = (e) => {
      if (e.target === li || e.target === titleSpan) {
        loadChat(chat.id);
      }
    };

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'history-actions';

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      startEditing(chat, titleSpan);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    };

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(titleSpan);
    li.appendChild(actionsDiv);
    historyList.appendChild(li);
  });
}

function deleteChat(chatId) {
  chats = chats.filter(c => c.id !== chatId);
  saveChats();
  if (currentChatId === chatId) {
    startNewChat();
  } else {
    renderHistory();
  }
}

function startEditing(chat, titleSpan) {
  const currentTitle = chat.title;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentTitle;
  
  titleSpan.textContent = '';
  titleSpan.appendChild(input);
  input.focus();

  const saveEdit = () => {
    const newTitle = input.value.trim() || 'Percakapan';
    chat.title = newTitle;
    saveChats();
    renderHistory();
  };

  input.addEventListener('blur', saveEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      input.removeEventListener('blur', saveEdit);
      saveEdit();
    }
  });
}

// Drag & Drop Handlers (Sidebar History)
function handleDragStart(e) { draggedItemIndex = this.dataset.index; e.dataTransfer.effectAllowed = 'move'; this.classList.add('dragging'); }
function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; }
function handleDragEnter(e) { e.preventDefault(); this.classList.add('drag-over'); }
function handleDragLeave(e) { this.classList.remove('drag-over'); }
function handleDrop(e) {
  e.stopPropagation();
  this.classList.remove('drag-over');
  const targetIndex = this.dataset.index;
  if (draggedItemIndex !== targetIndex && draggedItemIndex !== null) {
    const draggedItem = chats.splice(draggedItemIndex, 1)[0];
    chats.splice(targetIndex, 0, draggedItem);
    saveChats();
    renderHistory();
  }
  draggedItemIndex = null;
  return false;
}

document.addEventListener('dragend', () => {
  document.querySelectorAll('.history-item').forEach(item => {
    item.classList.remove('dragging');
    item.classList.remove('drag-over');
  });
});

function clearChatArea() {
  chatBox.innerHTML = '';
  chatBox.appendChild(heroSection);
}

newChatBtn.addEventListener('click', startNewChat);

input.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
  if (this.value.trim().length > 0) {
    sendBtn.removeAttribute('disabled');
  } else {
    sendBtn.setAttribute('disabled', 'true');
  }
});

input.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) {
      form.dispatchEvent(new Event('submit'));
    }
  }
});

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  if (showingKoleksi) startNewChat(); // reset if in koleksi mode

  const userMessage = input.value.trim();
  if (!userMessage) return;

  if (heroSection && heroSection.style.display !== 'none') {
    heroSection.style.display = 'none';
  }

  appendMessage('user', userMessage);
  
  const chat = chats.find(c => c.id === currentChatId);
  if (chat && chat.messages.length === 1 && chat.title === 'Percakapan Baru') {
    chat.title = userMessage.length > 25 ? userMessage.substring(0, 25) + '...' : userMessage;
    renderHistory();
    saveChats();
  }
  
  input.value = '';
  input.style.height = 'auto';
  sendBtn.setAttribute('disabled', 'true');

  appendMessage('bot', 'Mencari resep herbal dan panduan medis...', false, true); 
  const tempMsg = chatBox.lastElementChild;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    });

    if (!response.ok) throw new Error('Network error');

    const data = await response.json();
    tempMsg.remove(); 
    
    appendMessage('bot', data.reply); 
    
  } catch (error) {
    console.error('Error:', error);
    tempMsg.textContent = 'Maaf, terjadi kesalahan pada server.';
  }
});

function appendMessage(sender, text, saveToHistory = true, isTemp = false) {
  const msgWrapper = document.createElement('div');
  msgWrapper.classList.add('message', sender);
  
  const contentDiv = document.createElement('div');
  
  if (sender === 'bot' && typeof marked !== 'undefined') {
    contentDiv.innerHTML = marked.parse(text);
  } else {
    contentDiv.textContent = text;
  }
  
  msgWrapper.appendChild(contentDiv);
  
  // Inject Save Button for Bot messages that contain Tables (only if not viewing collection)
  if (sender === 'bot' && !isTemp && text.includes('|') && !showingKoleksi) {
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-recipe-btn';
    
    // Check if content already in savedRecipes
    const isAlreadySaved = savedRecipes.some(r => r.content === text);
    if (isAlreadySaved) {
      saveBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F4B400" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Tersimpan!';
      saveBtn.style.color = '#F4B400';
    } else {
      saveBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Simpan ke Koleksi';
    }
    
    saveBtn.onclick = () => {
      if (!savedRecipes.some(r => r.content === text)) {
        // Extract Title
        let title = 'Resep Herbal Tersimpan';
        const lines = text.split('\n');
        for (let line of lines) {
          if (line.startsWith('### Resep Herbal')) {
            title = line.replace('### ', '').trim();
            break;
          }
        }
        
        savedRecipes.push({
          id: 'coll_' + Date.now() + Math.random().toString(36).substring(2, 9),
          title: title,
          content: text
        });
        saveCollection();
        saveBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F4B400" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Tersimpan!';
        saveBtn.style.color = '#F4B400';
      }
    };
    msgWrapper.appendChild(saveBtn);
  }
  
  chatBox.appendChild(msgWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
  
  if (saveToHistory && !isTemp) {
    const chat = chats.find(c => c.id === currentChatId);
    if (chat) {
      chat.messages.push({ sender, text });
      saveChats();
    }
  }
}

// Fitur Pencarian (Search)
searchBtn.addEventListener('click', () => {
  if (searchInput.style.display === 'none') {
    searchInput.style.display = 'block';
    searchInput.focus();
  } else {
    searchInput.style.display = 'none';
    searchInput.value = '';
    renderHistory();
  }
});

searchInput.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const items = historyList.querySelectorAll('.history-item');
  items.forEach(li => {
    const title = li.querySelector('.history-item-title').textContent.toLowerCase();
    li.style.display = title.includes(term) ? 'flex' : 'none';
  });
});

// Fitur Koleksi Manual Terstruktur
koleksiBtn.addEventListener('click', () => {
  showingKoleksi = !showingKoleksi;
  
  if (showingKoleksi) {
    koleksiBtn.style.color = '#8ab4f8';
    heroText.textContent = 'Koleksi Resep Herbal Anda';
    heroSection.style.display = 'none';
    renderCollectionItems();
    renderHistory(); 
  } else {
    koleksiBtn.style.color = '';
    heroText.textContent = 'Masukkan resep herbal yang anda cari';
    if (currentChatId) {
      loadChat(currentChatId);
    } else {
      startNewChat();
    }
  }
});

function renderCollectionItems() {
  clearChatArea();
  
  if (savedRecipes.length === 0) {
    heroSection.style.display = 'none';
    const msg = document.createElement('div');
    msg.className = 'message bot';
    msg.textContent = 'Belum ada resep herbal yang Anda simpan. Klik tombol "Simpan ke Koleksi" pada jawaban bot untuk menambahkannya ke sini.';
    chatBox.appendChild(msg);
    return;
  }

  const listContainer = document.createElement('div');
  listContainer.className = 'collection-list';

  savedRecipes.forEach((recipe, index) => {
    const itemCard = document.createElement('div');
    itemCard.className = 'collection-item';
    itemCard.setAttribute('draggable', 'true');
    itemCard.dataset.index = index;

    itemCard.addEventListener('dragstart', handleColDragStart);
    itemCard.addEventListener('dragover', handleColDragOver);
    itemCard.addEventListener('drop', handleColDrop);
    itemCard.addEventListener('dragenter', handleColDragEnter);
    itemCard.addEventListener('dragleave', handleColDragLeave);

    const header = document.createElement('div');
    header.className = 'collection-header';
    
    // Toggle body visibility
    header.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && !e.target.closest('button')) {
        const body = itemCard.querySelector('.collection-body');
        const icon = header.querySelector('.collapse-icon');
        if (body.style.display === 'none') {
          body.style.display = 'block';
          icon.style.transform = 'rotate(180deg)';
        } else {
          body.style.display = 'none';
          icon.style.transform = 'rotate(0deg)';
        }
      }
    });

    const dragHandle = document.createElement('span');
    dragHandle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>';
    dragHandle.style.cursor = 'grab';
    dragHandle.style.marginRight = '8px';
    
    const collapseIcon = document.createElement('span');
    collapseIcon.className = 'collapse-icon';
    collapseIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
    collapseIcon.style.marginRight = '8px';
    collapseIcon.style.transition = 'transform 0.2s';
    collapseIcon.style.transform = 'rotate(180deg)'; 

    const titleSpan = document.createElement('span');
    titleSpan.className = 'collection-title';
    titleSpan.textContent = recipe.title;

    const headerActions = document.createElement('div');
    headerActions.className = 'collection-actions';

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'text';
      input.value = recipe.title;
      
      titleSpan.textContent = '';
      titleSpan.appendChild(input);
      input.focus();

      const saveEdit = () => {
        recipe.title = input.value.trim() || 'Resep Tersimpan';
        saveCollection();
        titleSpan.textContent = recipe.title;
      };

      input.addEventListener('blur', saveEdit);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          input.removeEventListener('blur', saveEdit);
          saveEdit();
        }
      });
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if(confirm('Hapus resep ini dari Koleksi?')) {
        savedRecipes = savedRecipes.filter(r => r.id !== recipe.id);
        saveCollection();
        renderCollectionItems(); 
      }
    };

    headerActions.appendChild(editBtn);
    headerActions.appendChild(deleteBtn);

    header.appendChild(dragHandle);
    header.appendChild(collapseIcon);
    header.appendChild(titleSpan);
    header.appendChild(headerActions);

    const body = document.createElement('div');
    body.className = 'collection-body message bot';
    if (typeof marked !== 'undefined') {
      body.innerHTML = marked.parse(recipe.content);
    } else {
      body.textContent = recipe.content;
    }

    itemCard.appendChild(header);
    itemCard.appendChild(body);
    listContainer.appendChild(itemCard);
  });

  chatBox.appendChild(listContainer);
}

// Drag & Drop Handlers (Collection List)
function handleColDragStart(e) { draggedColIndex = this.dataset.index; e.dataTransfer.effectAllowed = 'move'; this.classList.add('dragging'); }
function handleColDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; }
function handleColDragEnter(e) { e.preventDefault(); this.classList.add('drag-over'); }
function handleColDragLeave(e) { this.classList.remove('drag-over'); }
function handleColDrop(e) {
  e.stopPropagation();
  this.classList.remove('drag-over');
  const targetIndex = this.dataset.index;
  if (draggedColIndex !== targetIndex && draggedColIndex !== null) {
    const draggedItem = savedRecipes.splice(draggedColIndex, 1)[0];
    savedRecipes.splice(targetIndex, 0, draggedItem);
    saveCollection();
    renderCollectionItems();
  }
  draggedColIndex = null;
  return false;
}

document.addEventListener('dragend', () => {
  document.querySelectorAll('.collection-item').forEach(item => {
    item.classList.remove('dragging');
    item.classList.remove('drag-over');
  });
});

init();
