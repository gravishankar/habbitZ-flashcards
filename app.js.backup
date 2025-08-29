/* Habbitz Flashcards: offline-first, static, localStorage-powered */

// --- Utility ---
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Lightweight RNG for shuffling
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr }

// Local storage
const STORE_KEY = "habbitz.flashcards.v1";

// SM-2-ish scheduling (simplified)
function nextInterval(card, quality){
  // card fields: reps, interval, ease
  let { reps=0, interval=0, ease=2.5 } = card;
  if(quality < 3){
    reps = 0; interval = 1;
  } else {
    reps += 1;
    if(reps === 1) interval = 1;
    else if(reps === 2) interval = 3;
    else interval = Math.round(interval * ease);
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }
  const due = Date.now() + interval*24*60*60*1000;
  return { reps, interval, ease, due };
}

// --- Data model ---
const Model = {
  state: {
    decks: {},   // deckName -> array of card objects
    activeDeck: "All Words",
    version: 1,
  },

  load(){
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){
      try{ this.state = JSON.parse(raw) }catch(e){}
    }
  },
  save(){
    localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
  },
  ensureDeck(name){
    if(!this.state.decks[name]) this.state.decks[name] = [];
  },
  addCard(deck, card){
    this.ensureDeck(deck);
    const exists = this.state.decks[deck].some(c => c.word.toLowerCase() === card.word.toLowerCase());
    if(!exists) this.state.decks[deck].push({...card, id: crypto.randomUUID(), reps:0, interval:0, ease:2.5, due: Date.now()});
  },
  removeCard(deck, id){
    this.state.decks[deck] = this.state.decks[deck].filter(c => c.id !== id);
  },
  updateCard(deck, id, patch){
    const idx = this.state.decks[deck].findIndex(c => c.id === id);
    if(idx>=0) this.state.decks[deck][idx] = { ...this.state.decks[deck][idx], ...patch };
  },
  moveCard(oldDeck, newDeck, id){
    const card = this.state.decks[oldDeck].find(c=>c.id===id);
    if(!card) return;
    this.addCard(newDeck, card);
    this.removeCard(oldDeck, id);
  },
  exportJSON(){
    return JSON.stringify(this.state, null, 2);
  },
  importJSON(obj){
    if(obj && obj.decks){
      this.state = obj;
      this.save();
    }
  }
};

// --- Initial bootstrapping: load baked words.json into "All Words" deck on first run ---
async function bootstrap(){
  Model.load();
  if(Object.keys(Model.state.decks).length === 0){
    const resp = await fetch("words.json");
    const words = await resp.json();
    Model.ensureDeck("All Words");
    // Map to cards
    for(const w of words){
      Model.addCard("All Words", {
        word: w.word || "",
        definition: w.definition || "",
        example: w.example || "",
        tip: w.tip || "",
        pos: w.pos || "",
        source: w.source || "",
      });
    }
    Model.save();
  }
}

// --- UI rendering ---
const UI = {
  init(){
    // buttons
    $("#btnStudy").addEventListener("click", ()=>this.showStudy());
    $("#btnQuiz").addEventListener("click", ()=>this.showQuiz());
    $("#btnShuffle").addEventListener("click", ()=>this.renderCards({shuffle:true}));
    $("#btnSortAlpha").addEventListener("click", ()=>this.renderCards({sort:"alpha"}));
    $("#btnAddWord").addEventListener("click", ()=>this.openAddWord());
    $("#btnManageDecks").addEventListener("click", ()=>this.openDecks());
    $("#btnImport").addEventListener("click", ()=>$("#fileImport").click());
    $("#btnExport").addEventListener("click", ()=>this.exportData());
    $("#btnReset").addEventListener("click", ()=>this.resetData());
    $("#search").addEventListener("input", ()=>this.renderCards());
    $("#filterDue").addEventListener("change", ()=>this.renderCards());
    $("#filterNew").addEventListener("change", ()=>this.renderCards());
    $("#filterLeech").addEventListener("change", ()=>this.renderCards());
    $("#fileImport").addEventListener("change", (e)=>this.handleImport(e));

    $("#btnNextQuestion").addEventListener("click", ()=>this.nextQuestion());

    this.renderDeckSelect();
    this.showStudy(); // default
  },

  renderDeckSelect(){
    const sel = $("#deckSelect");
    sel.innerHTML = "";
    Object.keys(Model.state.decks).forEach(name=>{
      const opt = document.createElement("option");
      opt.value = name; opt.textContent = name;
      if(name === Model.state.activeDeck) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", ()=>{
      Model.state.activeDeck = sel.value; Model.save();
      this.renderCards();
      this.updateDeckMeta();
    });
    this.updateDeckMeta();
    this.renderCards();
    this.renderTable();
  },

  updateDeckMeta(){
    const deck = Model.state.decks[Model.state.activeDeck] || [];
    const due = deck.filter(c => !$("#filterDue").checked || (c.due||0) <= Date.now()).length;
    $("#deckMeta").textContent = `${deck.length} cards • ${due} due`;
  },

  getActiveCards(){
    let cards = Model.state.decks[Model.state.activeDeck] || [];
    const q = $("#search").value.trim().toLowerCase();
    if(q){
      cards = cards.filter(c =>
        (c.word||"").toLowerCase().includes(q) ||
        (c.definition||"").toLowerCase().includes(q) ||
        (c.example||"").toLowerCase().includes(q)
      );
    }
    if($("#filterDue").checked){
      cards = cards.filter(c => (c.due||0) <= Date.now());
    }
    if(!$("#filterNew").checked){
      cards = cards.filter(c => (c.reps||0) > 0);
    }
    if($("#filterLeech").checked){
      cards = cards.filter(c => (c.ease||2.5) > 1.4);
    }
    return cards;
  },

  renderCards(opts={}){
    const area = $("#cardArea");
    area.innerHTML = "";
    let cards = this.getActiveCards();
    if(opts.sort==="alpha") cards = cards.slice().sort((a,b)=>a.word.localeCompare(b.word));
    if(opts.shuffle) cards = shuffle(cards.slice());
    for(const card of cards){
      area.appendChild(this.cardView(card));
    }
    this.updateDeckMeta();
    this.renderTable();
  },

  cardView(card){
    const el = document.createElement("article");
    el.className = "card";
    el.innerHTML = `
      <div class="meta">${card.reps||0}🔁 • ${Math.round(card.ease||2.5*100)/100}⚙︎</div>
      <div class="word">${card.word}</div>
      <div class="definition">${card.definition}</div>
      <div class="example">${card.example ? "“"+card.example+"”" : ""}</div>
      ${card.tip ? `<div class="tip">💡 ${card.tip}</div>` : ""}
      <div class="spaced">
        <button class="grade again">Again</button>
        <button class="grade hard">Hard</button>
        <button class="grade good">Good</button>
        <button class="grade easy">Easy</button>
      </div>
      <div class="actions">
        <button class="edit">Edit</button>
        <button class="del">Delete</button>
      </div>
    `;
    const grades = $$(".grade", el);
    const [btnAgain, btnHard, btnGood, btnEasy] = grades;
    btnAgain.addEventListener("click", ()=>this.grade(card, 1));
    btnHard.addEventListener("click", ()=>this.grade(card, 3));
    btnGood.addEventListener("click", ()=>this.grade(card, 4));
    btnEasy.addEventListener("click", ()=>this.grade(card, 5));
    $(".edit", el).addEventListener("click", ()=>this.openAddWord(card));
    $(".del", el).addEventListener("click", ()=>{ 
      if(confirm(`Delete "${card.word}"?`)){ 
        Model.removeCard(Model.state.activeDeck, card.id); Model.save(); this.renderCards(); 
      }
    });
    return el;
  },

  grade(card, quality){
    const sched = nextInterval(card, quality);
    Model.updateCard(Model.state.activeDeck, card.id, sched);
    Model.save();
    this.renderCards();
  },

  renderTable(){
    const tbody = $("#wordsTable tbody"); tbody.innerHTML = "";
    for(const card of (Model.state.decks[Model.state.activeDeck]||[])){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${card.word}</td>
        <td>${card.definition}</td>
        <td>${card.example||""}</td>
        <td>${card.tip||""}</td>
        <td>
          <button data-id="${card.id}" class="mini edit">Edit</button>
          <button data-id="${card.id}" class="mini remove">Remove</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
    $$(".mini.edit", tbody).forEach(b => b.addEventListener("click", e=>{
      const id = e.currentTarget.getAttribute("data-id");
      const card = (Model.state.decks[Model.state.activeDeck]||[]).find(c=>c.id===id);
      if(card) this.openAddWord(card);
    }));
    $$(".mini.remove", tbody).forEach(b => b.addEventListener("click", e=>{
      const id = e.currentTarget.getAttribute("data-id");
      Model.removeCard(Model.state.activeDeck, id); Model.save(); this.renderCards();
    }));
  },

  openAddWord(card=null){
    const dlg = $("#dlgAddWord");
    $("#inWord").value = card?.word || "";
    $("#inDefinition").value = card?.definition || "";
    $("#inExample").value = card?.example || "";
    $("#inTip").value = card?.tip || "";
    dlg.showModal();
    $("#btnSaveWord").onclick = ()=>{
      const payload = {
        word: $("#inWord").value.trim(),
        definition: $("#inDefinition").value.trim(),
        example: $("#inExample").value.trim(),
        tip: $("#inTip").value.trim(),
      };
      if(!payload.word || !payload.definition){ return }
      if(card){
        Model.updateCard(Model.state.activeDeck, card.id, payload);
      }else{
        Model.addCard(Model.state.activeDeck, payload);
      }
      Model.save();
      dlg.close();
      this.renderCards();
    };
  },

  openDecks(){
    const list = $("#deckList");
    list.innerHTML = "";
    Object.entries(Model.state.decks).forEach(([name, cards])=>{
      const row = document.createElement("div");
      row.className = "row";
      const btnUse = document.createElement("button"); btnUse.textContent = "Use";
      const btnRename = document.createElement("button"); btnRename.textContent = "Rename";
      const btnDelete = document.createElement("button"); btnDelete.textContent = "Delete";
      const span = document.createElement("span"); span.textContent = `${name} (${cards.length})`;
      span.style.flex = "1";
      row.appendChild(span); row.appendChild(btnUse); row.appendChild(btnRename); row.appendChild(btnDelete);
      list.appendChild(row);

      btnUse.addEventListener("click", ()=>{ Model.state.activeDeck = name; Model.save(); this.renderDeckSelect(); });
      btnRename.addEventListener("click", ()=>{
        const nn = prompt("New deck name", name); 
        if(!nn || nn===name) return;
        if(Model.state.decks[nn]) return alert("Deck exists");
        Model.state.decks[nn] = Model.state.decks[name];
        delete Model.state.decks[name];
        if(Model.state.activeDeck===name) Model.state.activeDeck = nn;
        Model.save(); this.renderDeckSelect(); 
      });
      btnDelete.addEventListener("click", ()=>{
        if(name==="All Words") return alert("Cannot delete the default deck");
        if(confirm(`Delete deck "${name}"?`)){
          delete Model.state.decks[name];
          if(Model.state.activeDeck===name) Model.state.activeDeck = "All Words";
          Model.save(); this.renderDeckSelect();
        }
      });
    });

    $("#btnCreateDeck").onclick = (e)=>{
      e.preventDefault();
      const name = $("#inNewDeck").value.trim();
      if(!name) return;
      if(Model.state.decks[name]) return alert("Deck exists");
      Model.ensureDeck(name); Model.save(); $("#inNewDeck").value=""; this.renderDeckSelect();
    };

    $("#dlgDecks").showModal();
  },

  async exportData(){
    const blob = new Blob([Model.exportJSON()], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = $("#downloadData");
    a.href = url; a.click();
    await sleep(3000);
    URL.revokeObjectURL(url);
  },

  handleImport(e){
    const file = e.target.files?.[0];
    if(!file) return;
    const name = file.name.toLowerCase();
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        if(name.endsWith(".json")){
          const obj = JSON.parse(reader.result);
          Model.importJSON(obj);
          this.renderDeckSelect();
        }else if(name.endsWith(".csv")){
          // parse CSV: expects headers word,definition,example,tip
          const text = String(reader.result);
          const rows = text.split(/\r?\n/).filter(Boolean);
          const headers = rows.shift().split(",").map(h=>h.trim().toLowerCase());
          const idx = {
            word: headers.indexOf("word"),
            definition: headers.indexOf("definition"),
            example: headers.indexOf("example"),
            tip: headers.indexOf("tip"),
          };
          const deck = prompt("Import into which deck? (blank = Active)", "") || Model.state.activeDeck;
          for(const line of rows){
            const cols = line.split(",");
            const card = {
              word: (cols[idx.word]||"").trim(),
              definition: (cols[idx.definition]||"").trim(),
              example: (idx.example>=0 ? (cols[idx.example]||"").trim() : ""),
              tip: (idx.tip>=0 ? (cols[idx.tip]||"").trim() : ""),
            };
            if(card.word && card.definition) Model.addCard(deck, card);
          }
          Model.save();
          this.renderDeckSelect();
        } else {
          alert("Unsupported file type");
        }
      }catch(err){
        alert("Import failed: "+err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  },

  resetData(){
    if(!confirm("This clears your local progress and data. Continue?")) return;
    localStorage.removeItem(STORE_KEY);
    location.reload();
  },

  // --- Quiz mode ---
  showQuiz(){
    $("#cardArea").classList.add("hidden");
    $("#tableArea").classList.add("hidden");
    $("#quizArea").classList.remove("hidden");
    this.generateQuestionBank();
    this.nextQuestion();
  },

  // Build multiple choice questions from current deck
  generateQuestionBank(){
    const cards = Model.state.decks[Model.state.activeDeck] || [];
    this.qBank = [];
    const pool = cards.slice();
    for(const c of cards){
      const distractors = shuffle(pool.filter(x => x.word !== c.word)).slice(0,3).map(x=>x.word);
      const choices = shuffle([c.word, ...distractors]);
      this.qBank.push({
        prompt: c.definition || `Choose the word for: ${c.example||c.word}`,
        answer: c.word,
        choices
      });
    }
    shuffle(this.qBank);
    this.qIdx = -1; this.correct = 0;
  },

  nextQuestion(){
    if(!this.qBank || this.qBank.length===0){ this.generateQuestionBank(); }
    this.qIdx++;
    if(this.qIdx >= this.qBank.length){
      $("#quizQuestion").textContent = "Quiz complete!";
      $("#quizChoices").innerHTML = "";
      $("#quizFeedback").textContent = `Score: ${this.correct} / ${this.qBank.length}`;
      $("#quizProgress").textContent = "";
      return;
    }
    const q = this.qBank[this.qIdx];
    $("#quizQuestion").textContent = q.prompt;
    $("#quizChoices").innerHTML = "";
    q.choices.forEach(choice=>{
      const btn = document.createElement("button");
      btn.textContent = choice;
      btn.addEventListener("click", ()=>{
        if(choice === q.answer){
          $("#quizFeedback").textContent = "✅ Correct!";
          this.correct++;
        }else{
          $("#quizFeedback").textContent = "❌ " + q.answer;
        }
        $("#quizProgress").textContent = `Q ${this.qIdx+1} / ${this.qBank.length} • Score ${this.correct}`;
      });
      $("#quizChoices").appendChild(btn);
    });
    $("#quizFeedback").textContent = "";
    $("#quizProgress").textContent = `Q ${this.qIdx+1} / ${this.qBank.length} • Score ${this.correct}`;
  },

  // --- Study mode ---
  showStudy(){
    $("#quizArea").classList.add("hidden");
    $("#tableArea").classList.remove("hidden");
    $("#cardArea").classList.remove("hidden");
    this.renderCards();
  },
};

(async function(){
  await bootstrap();
  UI.init();
})();
