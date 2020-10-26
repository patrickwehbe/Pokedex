(function() {

    
  
    const POKEMON_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";

    const STARTER_POKEMON = ["Bulbasaur", "Charmander", "Squirtle"];
    let guid;
    let pid;
    let myPokemonHP;
    let gameStarted = false;

    window.addEventListener("load", initialize);
  
   
    function initialize() {
      loadPokemon();
    }
  

    function loadPokemon() {
      let url = POKEMON_URL + "pokedex.php?pokedex=all";
      fetch(url)
        .then(checkStatus)
        .then(splitNewLines)
        .then(displayPokemon)
        .catch(console.log);
    }
  
    
    function splitNewLines(text) {
      return text.split("\n");
    }
  
    
    function displayPokemon(response) {
      for (let i = 0; i < response.length; i++) {
        let sprite = response[i].split(":");
        let spriteName = sprite[0];
        let spriteImgPath = POKEMON_URL + "sprites/" + sprite[1] + ".png";
        let spriteImg = document.createElement("img");
        spriteImg.src = spriteImgPath;
        spriteImg.classList.add("sprite");
        spriteImg.id = spriteName;
        spriteImg.alt = spriteName;
        starterPokemon(spriteImg);
        $("pokedex-view").appendChild(spriteImg);
        spriteImg.addEventListener("click", pokemonData);
      }
    }
  
   
    function starterPokemon(spriteImg) {
      let spriteName = spriteImg.id;
      for (let i = 0; i < STARTER_POKEMON.length; i++) {
        if (spriteName === STARTER_POKEMON[i]) {
          spriteImg.classList.add("found");
        }
      }
    }
  
   
    function pokemonData() {
      if (this.classList.contains("found")) {
        removeHidden($("start-btn"));
  
       ;
  
        $("start-btn").addEventListener("click", gameStart);
        let url = POKEMON_URL + "pokedex.php?pokemon=" + this.id;
        fetch(url)
          .then(checkStatus)
          .then(JSON.parse)
          .then(importMyPokemonData)
          .catch(console.log);
      }
    }
  
  
    function importMyPokemonData(pokemonData) {
      importData(pokemonData, "#p1");
    }
  
    function importData(pokemonData, card) {
      let name = pokemonData.name;
      qs(card + " .name").innerText = name;
      let photoPath = POKEMON_URL + pokemonData.images.photo;
      let photo = qs(card + " .pokepic");
      photo.src = photoPath;
      photo.alt = pokemonData.images.photo;
      let typePath = POKEMON_URL + pokemonData.images.typeIcon;
      let type = qs(card + " .type");
      type.src = typePath;
      type.alt = pokemonData.images.typeIcon;
      let weaknessPath = POKEMON_URL + pokemonData.images.weaknessIcon;
      let weakness = qs(card + " .weakness");
      weakness.src = weaknessPath;
      weakness.alt = pokemonData.images.weaknessIcon;
      let hp = pokemonData.hp + "HP";
      qs(card + " .hp").innerText = hp;
      let description = pokemonData.info.description;
      qs(card + " .info").innerText = description;
      moveInfo(pokemonData, card);
    }
  
  
    function moveInfo(pokemonData, card) {
      let moves = pokemonData.moves;
      let moveButtons = qs(card + " .moves").children;
      let button;
      // hide the extra buttons.
      if (moves.length < moveButtons.length) {
        for (let i = moves.length; i < moveButtons.length; i++) {
          moveButtons[i].classList.add("hidden");
        }
      }
      for (let i = 0; i < moves.length; i++) {
        // enable the move buttons for P1
        if (card === "#p1") {
          moveButtons[i].disabled = false;
        } else {
          moveButtons[i].disabled = true;
        }
        removeHidden(moveButtons[i]);
        button = moveButtons[i].children;
        moveButtons[i].id = moves[i].name;
        button[0].innerText = moves[i].name;
        if (moves[i].dp) {
          button[1].innerText = moves[i].dp + " DP";
        } else {
          button[1].innerText = "";
        }
        button[2].src = POKEMON_URL + "icons/" + moves[i].type + ".jpg";
        button[2].alt = moves[i].type;
        moveButtons[i].addEventListener("click", gamePlay);
      }
    }
  
   
    function gamePlay() {
      if (gameStarted) {
        toggleHidden($("loading"));
        let moveName = this.id.replace(/\s+/g, '').toLowerCase();
        fetchMovesAndResults(moveName);
      }
    }
  
    function fetchMovesAndResults(moveName) {
      let url = POKEMON_URL + "game.php";
      let params = new FormData();
      params.append("guid", guid);
      params.append("pid", pid);
      params.append("movename", moveName);
      fetch(url, {method: "POST", body: params})
        .then(checkStatus)
        .then(JSON.parse)
        .then(moveUpdate)
        .catch(console.log);
    }
  
    function moveUpdate(response) {
      let results = response.results;
      moveResults(results, "p1", 1);
      moveResults(results, "p2", 2);
      hpCalculator(response.p1, "#p1");
      hpCalculator(response.p2, "#p2");
      buffHandler(response.p1, "#p1");
      buffHandler(response.p2, "#p2");
      toggleHidden($("loading"));
    }
  
    
    function moveResults(results, player, playerNumber) {
      let move = results[player + "-move"];
      let result = results[player + "-result"];
      let resultDisplay = $(player + "-turn-results");
      removeHidden(resultDisplay);
      if (player === "p2" && (!move || !result)) {
        toggleHidden($("p2-turn-results"));
      }
      resultDisplay.innerText = "Player " + playerNumber + " played " + move +
                                " and " + result + "!";
    }
  
    function hpCalculator(pokemonData, card) {
      let hp = pokemonData.hp;
      let currentHp = pokemonData["current-hp"];
      let hpPercentage = currentHp * 100 / hp;
      qs(card + " .hp").innerText = currentHp + "HP";
      if (hp !== currentHp) {
        qs(card + " .health-bar").style.width = hpPercentage + "%";
      }
      hpBarColor(hpPercentage, card);
      if (hpPercentage === 0) {
        gameStarted = false;
        gameOver(card);
      }
    }
  

    function hpBarColor(hpPercentage, card) {
      if (hpPercentage < 20) {
        qs(card + " .health-bar").classList.add("low-health");
      } else {
        if (qs(card + " .health-bar").classList.contains("low-health")) {
          qs(card + " .health-bar").classList.remove("low-health");
        }
      }
    }
  
    
    function buffHandler(pokemonData, card) {
      let buffContainer = qs(card + " .buffs");
      clearBuffs(buffContainer);
      let buffs = pokemonData.buffs;
      buffHandlerHelper(buffs, "buff", card);
      let debuffs = pokemonData.debuffs;
      buffHandlerHelper(debuffs, "debuff", card);
    }
  
  
    function clearBuffs(buffContainer) {
      if (buffContainer.hasChildNodes()) {
        while(buffContainer.childNodes[0]) {
          buffContainer.removeChild(buffContainer.childNodes[0]);
        }
      }
    }
  
    
    function buffHandlerHelper(givenBuffs, className, card) {
      if (givenBuffs.length !== 0) {
        for (let i = 0; i < givenBuffs.length; i++) {
          let givenBuff = document.createElement("div");
          givenBuff.classList.add(className);
          givenBuff.classList.add(givenBuffs[i]);
          qs(card + " .buffs").appendChild(givenBuff);
        }
      }
    }
  
    
    function gameStart() {
      gameStarted = true;
      let url = POKEMON_URL + "game.php";
      let name = qs("#p1 .name").innerText.toLowerCase();
      let params =  new FormData();
      params.append("startgame", "true");
      params.append("mypokemon", name);
      fetch(url, {method: "POST", body: params})
        .then(checkStatus)
        .then(JSON.parse)
        .then(initializeGame)
        .catch(console.log);
    }
  

    function initializeGame(response) {
      guid = response.guid;
      pid = response.pid;
      myPokemonHP = qs("#p1 .hp").innerText;
      let pokemonData = response.p2;
      importData(pokemonData, "#p2");
      $("pokedex-view").classList.add("hidden");
      qs("#p1 .hp-info").classList.remove("hidden");
      $("p2").classList.remove("hidden");
      $("results-container").classList.remove("hidden");
      toggleHidden($("start-btn"));
      toggleHidden($("flee-btn"));
      $("flee-btn").addEventListener("click", fleeBattle);
      qs("h1").innerText = "Pokemon Battle Mode!";
      toggleHidden(qs("#p1 .buffs"));
    }
  
  
    function gameOver(card) {
      toggleHidden($("flee-btn"));
      toggleHidden($("endgame"));
      $("endgame").addEventListener("click", backToMain);
      if (card === "#p1") {
        qs("h1").innerText = "You lost!";
      } else {
        qs("h1").innerText = "You won!";
        updatePokedex();
      }
    }
  

    function updatePokedex() {
      let newPokemonName = qs("#p2 .name").innerText;
      $(newPokemonName).classList.add("found");
    }
  
    
    function backToMain() {
      toggleHidden($("endgame"));
      toggleHidden($("results-container"));
      toggleHidden($("p2"));
      toggleHidden($("pokedex-view"));
      toggleHidden($("start-btn"));
      qs("h1").innerText = "Your Pokedex";
      qs("#p1 .hp").innerText = myPokemonHP;
      toggleHidden(qs("#p1 .buffs"));
      toggleHidden(qs("#p1 .hp-info"));
      resetInfo("p1");
      resetInfo("p2");
    }
  
  
    function resetInfo(card) {
      qs("#" + card + " .health-bar").style.width = "100%";
      hpBarColor(100, "#" + card);
      clearBuffs(qs("#" + card + " .buffs"));
      $(card + "-turn-results").innerText = "";
    }
  
    
    function fleeBattle() {
      toggleHidden($("loading"));
      fetchMovesAndResults("flee");
    }
  
   
    function toggleHidden(item) {
      item.classList.toggle("hidden");
    }
  
   
    function removeHidden(item) {
      if (item.classList.contains("hidden")) {
        item.classList.remove("hidden");
      }
    }
   
    function checkStatus(response) {
      if (response.status >= 200 && response.status < 300 || response.status == 0) {
        return response.text();
      } else {
        return Promise.reject(new Error(response.status + ": " + response.statusText));
      }
    }
  
  
    function $(id) {
      return document.getElementById(id);
    }
  
 
    function qs(query) {
      return document.querySelector(query);
    }
  
  })();