// Helper / Utility functions


/* Nous devons importer les données du panier du fichier index.js pour les transmettre
à la fonction createOrder() de ce fichier pour que paypal reçoive le montant total du panier 
et la propriété currency (la monnaie de la commande). */ 

  


let url_to_head = (url) => {
    return new Promise(function(resolve, reject) {
        var script = document.createElement('script');
        script.src = url;
        script.onload = function() {
            resolve();
        };
        script.onerror = function() {
            reject('Error loading script.');
        };
        document.head.appendChild(script);
    });
}
let handle_close = (event) => {
    event.target.closest(".ms-alert").remove();
}
let handle_click = (event) => {
    if (event.target.classList.contains("ms-close")) {
        handle_close(event);
    }
}   

document.addEventListener("click", handle_click);
const paypal_sdk_url = "https://www.paypal.com/sdk/js";
const client_id = "ASAPZ1xxwEQx-Kdr2s6rtj70ExFrqbwPIJ3Vh_Qstmu2q51oPknbQvspagXSKe5fiM85-fowDFGICyQb";
const currency = "USD";
const intent = "capture";      
let alerts = document.getElementById("alerts");
 

//PayPal Code
//https://developer.paypal.com/sdk/js/configuration/#link-queryparameters
url_to_head(paypal_sdk_url + "?client-id=" + client_id + "&enable-funding=venmo&currency=" + currency + "&intent=" + intent)
.then(async () => {  
     
    // Récupération dynamique des données du panier dynamiquement avant l'affichage 
    // de l'interface de paiement.  
    // const response = await fetch('http://localhost:8000/api/cart');
    // const cartDatas = response.json(); // Example : { currency: "USD", total: "65.18" }
    // console.log("cartDatas dans script.js"); 
    // console.log(cartDatas);     

     
    //Handle loading spinner
    document.getElementById("loading").classList.add("hide");
    document.getElementById("content").classList.remove("hide");
    let alerts = document.getElementById("alerts");
    let paypal_buttons = paypal.Buttons({ // https://developer.paypal.com/sdk/js/reference
        onClick: (data) => { // https://developer.paypal.com/sdk/js/reference/#link-oninitonclick
            //Custom JS here

           
        },         
        style: { //https://developer.paypal.com/sdk/js/reference/#link-style
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'paypal'  
        },
  
        // Cette fonction est appellée après un clic sur le bouton paypal.    
        createOrder: function(data, actions) { //https://developer.paypal.com/docs/api/orders/v2/#orders_create
            return fetch("http://localhost:3001/create_order", {
                method: "post", headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({
                     "intent": intent,
                     // "amount": cartDatas.total,       // Passe le total dynamique ici
                    // "currency": cartDatas.currency   // Passe la devise dynamique ici 
                     "amount": 72.18,       // Passe le total dynamique ici
                     "currency": 'USD'   // Passe la devise dynamique ici      
                                           
                    })        
            })    
            .then((response) => response.json())
            .then((order) => { return order.id; });
        },
  
        onApprove: function(data, actions) {
            let order_id = data.orderID;
            return fetch("http://localhost:3001/complete_order", {
                method: "post", headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({
                    "intent": intent,
                    "order_id": order_id
                })
            })
            .then((response) => response.json())
            .then((order_details) => {
                console.log(order_details); //https://developer.paypal.com/docs/api/orders/v2/#orders_capture!c=201&path=create_time&t=response
                let intent_object = intent === "authorize" ? "authorizations" : "captures";
                //Custom Successful Message
                alerts.innerHTML = `<div class=\'ms-alert ms-action\'>Thank you ` + order_details.payer.name.given_name + ` ` + order_details.payer.name.surname + ` for your payment of ` + order_details.purchase_units[0].payments[intent_object][0].amount.value + ` ` + order_details.purchase_units[0].payments[intent_object][0].amount.currency_code + `!</div>`;

                //Close out the PayPal buttons that were rendered
                paypal_buttons.close();     

                // Redirection vers le dashboard client de Sylius. Au lieu de "en_US", nous devrons avoir {_locale} pour que la route 
                // soit dynamique.  
                window.location.href = "http://localhost:8000/en_US"; 
             })      
             .catch((error) => {
                console.log(error);
                alerts.innerHTML = `<div class="ms-alert ms-action2 ms-small"><span class="ms-close"></span><p>An Error Ocurred!</p>  </div>`;
             });
        },

        onCancel: function (data) {
            alerts.innerHTML = `<div class="ms-alert ms-action2 ms-small"><span class="ms-close"></span><p>Order cancelled!</p>  </div>`;
        },

        onError: function(err) {
            console.log(err);
        }
    });
    // "#payment_options" permet de lier la variable paypal_buttons de notre fichier à la balise <div> du fichier
    // index.ejs qui contient l'id du bouton de paiement paypaL : <div id="payment_options"></div> 
    paypal_buttons.render('#payment_options');

 
})
.catch((error) => {   
    console.error(error);
});
