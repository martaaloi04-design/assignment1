// Array che conserva i prodotti della categoria attualmente selezionata
var prodottiCaricati = [];

// Indica se è stata caricata correttamente una categoria
var categoriaCaricata = false;

// Indica se la finestra modale è aperta
var modaleAperta = false;

$(document).ready(function() {

    // Rilevo quando l'utente cambia categoria
    $("#category-selector").change(function() {

        // Svuoto il campo di ricerca quando cambia categoria
        $("#search-input").val("");

        // Resetto il criterio di ordinamento
        $("#sort-selector").val("");

        // Azzero i prodotti della categoria precedente
        prodottiCaricati = [];
        categoriaCaricata = false;

        // Svuoto la visualizzazione precedente
        $("#products-container").html("");

        // Nascondo il messaggio di assenza dei risultati
        $("#no-results-message").hide();

        // Recupero la categoria selezionata
        var categoria = this.value;
        var fileXML = "";

        // Determino il file XML da caricare
        if (categoria === "elettronica") {
            fileXML = "xml/elettronica.xml";
        }
        else if (categoria === "libri") {
            fileXML = "xml/libri.xml";
        }
        else if (categoria === "abbigliamento") {
            fileXML = "xml/abbigliamento.xml";
        }

        // Se è stata selezionata una categoria valida, carico il relativo XML
        if (fileXML !== "") {
            caricaProdotti(fileXML);
        }
    });


    // Rilevo quando l'utente rilascia un tasto nel campo di ricerca
    $("#search-input").keyup(function() {
        aggiornaVisualizzazione();
    });


    // Rilevo quando l'utente cambia il criterio di ordinamento
    $("#sort-selector").change(function() {
        aggiornaVisualizzazione();
    });


    // Nascondo inizialmente il messaggio di assenza dei risultati
    $("#no-results-message").hide();

    caricaContatoreCarrello();

    // Gestisco i clic su immagine, nome e pulsante dettagli.
    // L'evento funziona anche sulle schede create successivamente grazie a .on()
    $("#products-container").on("click", ".product-image, .product-name, .details-button", function() {

            // Risalgo alla scheda del prodotto cliccato tramite .closest()
            var scheda = $(this).closest(".product-card");

            // Recupero l'ID del prodotto dalla scheda
            var id = scheda.attr("data-id");

            // Apro la modale con i dati del prodotto
            apriModale(id);
        }
    );


    // Chiudo la modale quando si clicca sul pulsante X
    $("#close-modal").click(function() {
        chiudiModale();
    });

    // Chiudo la modale quando si clicca sull'area esterna.
    // Il clic dentro la finestra non deve chiuderla.
    $("#product-modal").click(function(event) {

        if (event.target === this) {
            chiudiModale();
        }

    });

    // Chiudo la modale quando viene premuto ESC
    $(document).keydown(function(event) {

        if (modaleAperta === true && event.which === 27) {
            chiudiModale();
        }
    });

    // Gestisco i pulsanti delle schede e della modale
    $(document).on("click", ".add-to-cart-button", function() {

        // Recupero l'ID del prodotto dal pulsante
        var id = $(this).attr("data-id");

        // Cerco il prodotto nell'array completo
        var prodotto = cercaProdottoPerId(id);

        // Se il prodotto esiste, richiamo la funzione dedicata
        if (prodotto !== null) {
            aggiungiAlCarrello(prodotto.id, prodotto.nome);
        }

    });

});

function caricaProdotti(fileXML) {

    $.ajax({
        url: fileXML,
        dataType: "xml",

        // Questa funzione viene eseguita quando la richiesta ha successo
        success: function(xml) {
            leggiProdotti(xml);
            categoriaCaricata = true;
            aggiornaVisualizzazione();
        },

        // Questa funzione viene eseguita quando si verifica un errore
        error: function() {
            categoriaCaricata = false;
            alert("Errore durante il caricamento dei prodotti.");
        }
    });
}

function leggiProdotti(xml) {

    // Azzero l'array prima di inserire i prodotti della nuova categoria
    prodottiCaricati = [];

    var prodotti = xml.getElementsByTagName("prodotto");

    for (var i = 0; i < prodotti.length; i++) {

        var id = prodotti[i].getElementsByTagName("id")[0].childNodes[0].nodeValue;
        var nome = prodotti[i].getElementsByTagName("nome")[0].childNodes[0].nodeValue;
        var marca = prodotti[i].getElementsByTagName("marca")[0].childNodes[0].nodeValue;
        var descrizione = prodotti[i].getElementsByTagName("descrizione")[0].childNodes[0].nodeValue.trim();
        var prezzo = prodotti[i].getElementsByTagName("prezzo")[0].childNodes[0].nodeValue;
        var immagine = prodotti[i].getElementsByTagName("immagine")[0].childNodes[0].nodeValue;
        var disponibilita = prodotti[i].getElementsByTagName("disponibilita")[0].childNodes[0].nodeValue;

        // Creo un oggetto con i dati del singolo prodotto
        var prodotto = {
            id: id,
            nome: nome,
            marca: marca,
            descrizione: descrizione,
            prezzo: prezzo,
            immagine: immagine,
            disponibilita: disponibilita
        };

        // Inserisco il prodotto nell'array
        prodottiCaricati.push(prodotto);
    }
}

// Verifica se un prodotto corrisponde alla ricerca
function prodottoCorrisponde(prodotto, parolaRicerca) {

    // Normalizzo la parola di ricerca e i campi del prodotto in minuscolo
    var ricerca = parolaRicerca.toLowerCase().trim();
    var nome = prodotto.nome.toLowerCase();
    var marca = prodotto.marca.toLowerCase();
    var descrizione = prodotto.descrizione.toLowerCase();

    // Ritorna vero se la parola è presente in almeno uno dei tre
    return nome.includes(ricerca) ||
        marca.includes(ricerca) ||
        descrizione.includes(ricerca);
}


// Filtra l'array e restituisce i prodotti corrispondenti
function filtraProdotti(prodotti, parolaRicerca) {

    var prodottiFiltrati = [];

    for (var i = 0; i < prodotti.length; i++) {

        if (prodottoCorrisponde(prodotti[i], parolaRicerca)) {
            prodottiFiltrati.push(prodotti[i]);
        }
    }

    return prodottiFiltrati;
}

// Restituisce la funzione di confronto in base al criterio scelto
function ottieniConfronto(criterio) {

    // Prezzo dal più basso al più alto
    if (criterio === "prezzo-crescente") {
        return function(a, b) {
            return (a.prezzo * 1) - (b.prezzo * 1);
        };
    }

    // Prezzo dal più alto al più basso
    if (criterio === "prezzo-decrescente") {
        return function(a, b) {
            return (b.prezzo * 1) - (a.prezzo * 1);
        };
    }

    // Nome dalla A alla Z
    if (criterio === "nome-crescente") {
        return function(a, b) {
            return a.nome.toLowerCase().localeCompare(b.nome.toLowerCase(), "it");
        };
    }

    // Nome dalla Z alla A
    if (criterio === "nome-decrescente") {
        return function(a, b) {
            return b.nome.toLowerCase().localeCompare(a.nome.toLowerCase(), "it");
        };
    }
}


// Crea una copia e la ordina secondo il criterio scelto
function ordinaProdotti(prodotti, criterio) {

    // Creo una copia dell'array ricevuto
    var prodottiOrdinati = prodotti.slice();

    // Se il criterio è vuoto, ritorno l'ordine originale
    if (criterio === "") {
        return prodottiOrdinati;
    }

    // Recupero la funzione di confronto corrispondente
    var confronta = ottieniConfronto(criterio);

    // Ordino la copia dell'array
    prodottiOrdinati.sort(confronta);

    return prodottiOrdinati;
}

function aggiornaVisualizzazione() {

    // Se non è stata caricata una categoria, non eseguo la ricerca
    if (categoriaCaricata === false) {
        return;
    }

    // Leggo il testo inserito e lo converto in minuscolo
    var parolaRicerca = $("#search-input").val().toLowerCase();

    // Leggo il criterio di ordinamento selezionato
    var criterio = $("#sort-selector").val();

    // Filtro esclusivamente i prodotti della categoria caricata
    var prodottiFiltrati = filtraProdotti(prodottiCaricati, parolaRicerca);

    // Ordino una copia dei prodotti filtrati
    var prodottiVisualizzati = ordinaProdotti(prodottiFiltrati, criterio);

    // Se non ci sono risultati, mostro il messaggio
    if (prodottiVisualizzati.length === 0) {
        $("#products-container").html("");
        $("#no-results-message").show();
    }
    else {
        // Se ci sono risultati, nascondo il messaggio e mostro i prodotti
        $("#no-results-message").hide();
        visualizzaProdotti(prodottiVisualizzati);
    }
}


// Restituisce il prezzo con due cifre decimali
function formattaPrezzo(prezzo) {
    return (prezzo * 1).toFixed(2);
}


function creaSchedaProdotto(id, nome, marca, descrizione, prezzo, immagine, disponibilita) {

    var prezzoFormattato = formattaPrezzo(prezzo);
    var classeDisponibilita = "";

    if (disponibilita === "Disponibile") {
        classeDisponibilita = "availability-available";
    }
    else {
        classeDisponibilita = "availability-unavailable";
    }

    var scheda = "";

    // L'ID del prodotto viene conservato nella scheda
    scheda += "<article class='product-card' data-id='" + id + "'>";

    scheda += "<img class='product-image' src='" + immagine + "' alt='" + nome + "'>";

    scheda += "<h3 class='product-name'>" + nome + "</h3>";

    scheda += "<p class='product-brand'>" + marca + "</p>";

    scheda += "<p class='product-description'>" + descrizione + "</p>";

    scheda += "<p class='product-price'>" + prezzoFormattato + " €</p>";

    scheda += "<p class='product-availability " + classeDisponibilita + "'>";
    scheda += disponibilita;
    scheda += "</p>";

    // Contenitore dei pulsanti
    scheda += "<div class='product-actions'>";
    //pulsante per aprire la modale
    scheda += "<button type='button' class='details-button'>";
    scheda += "Visualizza dettagli";
    scheda += "</button>";

    // Pulsante del carrello
    scheda += "<button type='button' class='add-to-cart-button' data-id='" + id + "'>";
    scheda += "Aggiungi al carrello";
    scheda += "</button>";

    scheda += "</div>";

    scheda += "</article>";

    return scheda;
}


function visualizzaProdotti(prodotti) {

    var contenuto = "";

    for (var i = 0; i < prodotti.length; i++) {

        contenuto += creaSchedaProdotto(
            prodotti[i].id,
            prodotti[i].nome,
            prodotti[i].marca,
            prodotti[i].descrizione,
            prodotti[i].prezzo,
            prodotti[i].immagine,
            prodotti[i].disponibilita
        );
    }

    $("#products-container").html(contenuto);
}


// Cerca un prodotto per ID nell'array completo della categoria
function cercaProdottoPerId(id) {

    for (var i = 0; i < prodottiCaricati.length; i++) {

        if (prodottiCaricati[i].id === id) {
            return prodottiCaricati[i];
        }
    }

    // Se il prodotto non viene trovato, restituisco null
    return null;
}


// Costruisce il contenuto HTML della modale
function creaContenutoModale(prodotto) {

    var prezzoFormattato = formattaPrezzo(prodotto.prezzo);
    var classeDisponibilita = "";

    if (prodotto.disponibilita === "Disponibile") {
        classeDisponibilita = "availability-available";
    }
    else {
        classeDisponibilita = "availability-unavailable";
    }

    var contenuto = "";

    // Contenitore principale delle due colonne
    contenuto += "<div class='modal-product-layout'>";

    // Colonna sinistra: immagine
    contenuto += "<div class='modal-product-image-container'>";
    contenuto += "<img class='modal-product-image' src='" + prodotto.immagine + "' alt='" + prodotto.nome + "'>";
    contenuto += "</div>";

    // Colonna destra: informazioni del prodotto
    contenuto += "<div class='modal-product-info'>";

    contenuto += "<h2 class='modal-product-name'>" + prodotto.nome + "</h2>";

    contenuto += "<p class='modal-product-brand'>" + prodotto.marca + "</p>";

    contenuto += "<p class='modal-product-description'>" + prodotto.descrizione + "</p>";

    contenuto += "<p class='modal-product-price'>" + prezzoFormattato + " €</p>";

    contenuto += "<p class='product-availability " + classeDisponibilita + "'>";
    contenuto += prodotto.disponibilita;
    contenuto += "</p>";

    // Pulsante per aggiungere il prodotto al carrello
    contenuto += "<button type='button' class='add-to-cart-button' data-id='" + prodotto.id + "'>";
    contenuto += "Aggiungi al carrello";
    contenuto += "</button>";

    contenuto += "</div>";

    contenuto += "</div>";

    return contenuto;
}


// Apre la modale e la popola con i dati del prodotto selezionato
function apriModale(id) {

    // Cerco il prodotto nell'array completo
    var prodotto = cercaProdottoPerId(id);

    // Se il prodotto non esiste, interrompo la funzione
    if (prodotto === null) {
        return;
    }

    // Costruisco il contenuto aggiornato della modale
    var contenuto = creaContenutoModale(prodotto);

    // Sostituisco il contenuto precedente con quello nuovo
    $("#modal-content").html(contenuto);

    // Mostro la modale
    $("#product-modal").show();

    // Blocco lo scorrimento della pagina sottostante
    $("body").addClass("modal-open");

    // Aggiorno lo stato della modale
    modaleAperta = true;
}


// Chiude la modale
function chiudiModale() {

    $("#product-modal").hide();

    // Ripristino lo scorrimento della pagina
    $("body").removeClass("modal-open");

    // Aggiorno lo stato della modale
    modaleAperta = false;
}

// Funzione dedicata all'aggiunta del prodotto simulata tramite alert
function aggiungiAlCarrello(id, nome) {

    alert("Prodotto aggiunto al carrello: " + nome + " (id: " + id + ")");
}

function caricaContatoreCarrello() {
    $.ajax({
        url: "xml/carrello.xml",
        dataType: "xml",

        success: function(xml) {
            var elementi = xml.getElementsByTagName("elemento");
            var numeroElementi = elementi.length;

            $("#cart-count").html(numeroElementi);
        },
        error: function() {
            $("#cart-count").html("");
        }
    });
}