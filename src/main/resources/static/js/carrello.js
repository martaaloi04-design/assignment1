var elementiCarrello = [];

$(document).ready(function() {

    // Caricamento iniziale dei prodotti del carrello dal file XML
    caricaCarrello("xml/carrello.xml");

    // Gestore eventi con delegazione .on() per i pulsanti di modifica quantità generati dinamicamente
    $(document).on("click", ".quantity-button", function() {

        // Recupero la riga del prodotto cliccato
        var riga = $(this).closest(".cart-item");

        // Recupero l'ID del prodotto
        var idProdotto = parseInt(riga.attr("data-id"));

        // Cerco il prodotto nell'array
        var elemento = trovaElementoCarrello(idProdotto);

        // Verifico che il prodotto esista
        if (elemento !== null) {

            // Recupero l'operazione richiesta se - o +
            var operazione = $(this).html();

            var nuovaQuantita = elemento.quantita;

            // Incremento la quantità
            if (operazione === "+") {
                nuovaQuantita = nuovaQuantita + 1;
            }

            // Decremento la quantità solo se maggiore di 1
            else if (operazione === "-" && elemento.quantita > 1) {
                nuovaQuantita = nuovaQuantita - 1;
            }

            // Se la quantità è cambiata
            if (nuovaQuantita !== elemento.quantita) {

                // Richiamo la funzione dedicata
                aggiornaQuantitaNelCarrello(elemento.nome, nuovaQuantita);

                // Aggiorno la quantità nell'array
                elemento.quantita = nuovaQuantita;

                // Aggiorno la visualizzazione del carrello
                aggiornaVisualizzazioneCarrello();
            }
        }
    });

    //Gestore eventi con delegazione per i pulsanti di rimozione generati dinamicamente
    $(document).on("click", ".remove-cart-button", function() {

        // Recupero la riga del prodotto cliccato
        var riga = $(this).closest(".cart-item");

        // Recupero l'ID del prodotto
        var idProdotto = parseInt(riga.attr("data-id"));

        // Cerco il prodotto nell'array
        var elemento = trovaElementoCarrello(idProdotto);

        // Verifico che il prodotto esista
        if (elemento !== null) {

            // Richiamo la funzione dedicata
            rimuoviDalCarrello(elemento.nome);

            // Creo un nuovo array
            var nuoviElementi = [];

            // Copio tutti i prodotti tranne quello da rimuovere
            for (var i = 0; i < elementiCarrello.length; i++) {

                if (elementiCarrello[i].idProdotto !== idProdotto) {
                    nuoviElementi.push(elementiCarrello[i]);
                }
            }

            // Aggiorno l'array del carrello
            elementiCarrello = nuoviElementi;

            // Aggiorno la visualizzazione
            aggiornaVisualizzazioneCarrello();
        }
    });
});

//Carico i dati del carrello tramite AJAX e ne gestisco successo ed errori
function caricaCarrello(fileXML) {
    $.ajax({
        url: fileXML,
        dataType: "xml",

        success: function(xml) {
            leggiCarrello(xml);
            aggiornaVisualizzazioneCarrello();
        },

        error: function() {
            $("#cart-error-message").html("Errore nel caricamento del carrello.");
            $("#cart-total").html("");
            $("#cart-count").html("");
        }
    });
}

function leggiCarrello(xml) {
    var elementi = xml.getElementsByTagName("elemento");

    for (var i = 0; i < elementi.length; i++) {
        var elemento = elementi[i];

        var idProdotto = parseInt(elemento.getElementsByTagName("idProdotto")[0].childNodes[0].nodeValue);
        var nome = elemento.getElementsByTagName("nome")[0].childNodes[0].nodeValue;
        var prezzoUnitario = parseFloat(elemento.getElementsByTagName("prezzoUnitario")[0].childNodes[0].nodeValue);
        var quantita = parseInt(elemento.getElementsByTagName("quantita")[0].childNodes[0].nodeValue);
        var immagine = elemento.getElementsByTagName("immagine")[0].childNodes[0].nodeValue;

        //Inserisco l'oggetto del prodotto nell'array del carrello
        elementiCarrello.push({
            idProdotto: idProdotto,
            nome: nome,
            prezzoUnitario: prezzoUnitario,
            quantita: quantita,
            immagine: immagine
        });
    }
}


function creaRigaCarrello(elemento) {
    var subtotale = calcolaTotaleParziale(elemento);

    // Costruisco la struttura HTML del singolo prodotto nel carrello
    var riga = `
        <article class="cart-item" data-id="${elemento.idProdotto}">
            <img src="${elemento.immagine}" alt="${elemento.nome}" class="cart-item-image">

            <div class="cart-item-details">
                <h3 class="cart-product-name">${elemento.nome}</h3>
                <p>Prezzo unitario: ${formattaPrezzo(elemento.prezzoUnitario)} €</p>

                <div class="quantity-controls">
                    <button class="quantity-button">-</button>
                    <span>${elemento.quantita}</span>
                    <button class="quantity-button">+</button>
                </div>

                <button class="remove-cart-button">Rimuovi</button>
            </div>

            <div class="cart-item-subtotal">
                <p>Subtotale</p>
                <strong>${formattaPrezzo(subtotale)} €</strong>
            </div>
        </article>
    `;

    return riga;
}

function visualizzaRigheCarrello(elementi) {
    var contenuto = "";

    for (var i = 0; i < elementi.length; i++) {
        contenuto += creaRigaCarrello(elementi[i]);
    }

    // Rendering nel DOM: aggiorno il contenuto del contenitore con l'HTML generato in creaRigheCarrello()
    $("#cart-items-container").html(contenuto);
}

function calcolaTotaleParziale(elemento) {
    return elemento.prezzoUnitario * elemento.quantita;
}

function calcolaTotaleComplessivo(elementi) {
    var totale = 0;

    for (var i = 0; i < elementi.length; i++) {
        totale += calcolaTotaleParziale(elementi[i]);
    }

    return totale;
}

function visualizzaTotaleComplessivo(totale) {
    $("#cart-total").html("Totale: " + formattaPrezzo(totale) + " €");
}

function aggiornaContatoreCarrello(elementi) {
    var numeroElementi = elementi.length;
    $("#cart-count").html(numeroElementi);
}

function rimuoviDalCarrello(nome) {
    alert("Hai rimosso dal carrello: " + nome);
}

function gestisciCarrelloVuoto(elementi) {

    if (elementi.length === 0) {
        $("#empty-cart-message").show();
    }
    else {
        $("#empty-cart-message").hide();
    }
}

function trovaElementoCarrello(idProdotto) {

    for (var i = 0; i < elementiCarrello.length; i++) {

        if (elementiCarrello[i].idProdotto === idProdotto) {
            return elementiCarrello[i];
        }
    }
    return null;
}

function aggiornaQuantitaNelCarrello(nome, nuovaQuantita) {

    alert("Hai modificato la quantità di " + nome +
        ". Nuova quantità: " + nuovaQuantita);
}

function aggiornaVisualizzazioneCarrello() {

    // Ridisegno tutte le righe
    visualizzaRigheCarrello(elementiCarrello);

    // Ricalcolo il totale complessivo
    var totale = calcolaTotaleComplessivo(elementiCarrello);

    // Visualizzo il nuovo totale
    visualizzaTotaleComplessivo(totale);

    // Aggiorno il contatore
    aggiornaContatoreCarrello(elementiCarrello);

    // Gestisco il messaggio del carrello vuoto
    gestisciCarrelloVuoto(elementiCarrello);
}

function formattaPrezzo(prezzo) {
    return (prezzo * 1).toFixed(2);
}