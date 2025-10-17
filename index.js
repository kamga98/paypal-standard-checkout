import express from 'express';
import fetch from 'node-fetch';
import cors from "cors";
import 'dotenv/config';
 
import path from 'path'; 
import { fileURLToPath } from 'url';

 
const app = express();  
const cartDatas = [];  // Déclaration d'une variable globale pour récupérer les données du panier.  
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

  
app.set('view engine', 'ejs'); // Active EJS

// __dirname : Dossier où se trouve index.ejs
app.set('views', path.join(__dirname, 'views'));
 

//const data = {};
  
   
// C'est cette fonction qui est appelée après un clique de l'utilisateur sur le bouton Checkout.
// A cette étapes précises, les données du panier sont initialisées.  
app.get('/', async (req, res) => { 
      
        const response = await fetch('http://localhost:8000/api/cart'); // Symfony
        const data = await response.json();
 
        // const cartDatas = {
        //     currency: data.currency,
        //     total: data.total  
        // };          
              
        console.log("cart datas");  
        console.log(data);        
        //console.log(data.total);  
             
        // return data                  
  
        // Affichage de la page index.html 
    
        res.render('index', { CART_DATA: JSON.stringify(cartDatas) });
        // res.sendFile(process.cwd() + '/index.html'); 

});  

//Servers the style.css file
app.get('/style.css', (req, res) => {
    res.sendFile(process.cwd() + '/style.css');
});
//Servers the script.js file
app.get('/script.js', (req, res) => {
    res.sendFile(process.cwd() + '/script.js');
});


 
app.use(express.static('.'));

// Autoriser les requêtes depuis cette origine (ou "*")
app.use(cors({
  origin: "http://127.0.0.1:3001",
  methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Accept"]
}));

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
const port = process.env.PORT || 3001;
const environment = process.env.ENVIRONMENT || 'sandbox';
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const endpoint_url = environment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

/**  
 * Creates an order and returns it as a JSON response.
 * @function  
 * @name createOrder
 * @memberof module:routes
 * @param {object} req - The HTTP request object.
 * @param {object} req.body - The request body containing the order information.
 * @param {string} req.body.intent - The intent of the order.
 * @param {object} res - The HTTP response object.
 * @returns {object} The created order as a JSON response.
 * @throws {Error} If there is an error creating the order.
 */
app.post('/create_order', (req, res) => {
    get_access_token()
        .then(access_token => {
            let order_data_json = {
                'intent': req.body.intent.toUpperCase(),
                'purchase_units': [{
                    'amount': {      
                        
                        'currency_code': 'USD', 
                        'value': '1'   
                          
                        // 'currency_code': data.currency,
                        // 'value': data.total               
                       
                       }           
                }]         
            };
            const data = JSON.stringify(order_data_json)

            fetch(endpoint_url + '/v2/checkout/orders', { //https://developer.paypal.com/docs/api/orders/v2/#orders_create
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    },
                    body: data
                })
                .then(res => res.json())
                .then(json => {
                    res.send(json);
                }) //Send minimal data to client
        })
        .catch(err => {
            console.log(err);
            res.status(500).send(err)
        })
});

/**
 * Completes an order and returns it as a JSON response.
 * @function
 * @name completeOrder
 * @memberof module:routes
 * @param {object} req - The HTTP request object.
 * @param {object} req.body - The request body containing the order ID and intent.
 * @param {string} req.body.order_id - The ID of the order to complete.
 * @param {string} req.body.intent - The intent of the order.
 * @param {object} res - The HTTP response object.
 * @returns {object} The completed order as a JSON response.
 * @throws {Error} If there is an error completing the order.
 */
app.post('/complete_order', (req, res) => {
    get_access_token()
        .then(access_token => {
            fetch(endpoint_url + '/v2/checkout/orders/' + req.body.order_id + '/' + req.body.intent, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    }
                })
                .then(res => res.json())
                .then(json => {
                    console.log(json);
                    res.send(json);
                }) //Send minimal data to client
        })
        .catch(err => {
            console.log(err);
            res.status(500).send(err)
        })
});

// Helper / Utility functions

//Servers the index.html file 
// app.get('/', (req, res) => { 
//     // Affichage de la page index.html 
//     res.sendFile(process.cwd() + '/index.html'); 

// });



//PayPal Developer YouTube Video:
//How to Retrieve an API Access Token (Node.js)
//https://www.youtube.com/watch?v=HOkkbGSxmp4
function get_access_token() {
    const auth = `${client_id}:${client_secret}`
    const data = 'grant_type=client_credentials'
    return fetch(endpoint_url + '/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`
            },
            body: data
        })
        .then(res => res.json())
        .then(json => {
            return json.access_token;
        })
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
})
