check_logged_in().then(isLoggedIn => {
    if (isLoggedIn)
    {
        update_cart_count();
    }
    else
    {
        if(window.location.href == 'http://127.0.0.1:5000/cart')
        {
            window.location.href = '/'
        }
    }
})


//function that checks validity of registration info and inserts it into database
function Register() {
    var username = document.getElementById("register-username").value;
    var password = document.getElementById("register-password").value;
    var email = document.getElementById("register-email").value;

    if(username=="" || password=="" || email=="")
    {
        alert("One or more empty inputs");
        return;
    }
    if(username.length < 5)
    {
        alert("Username must be at least 5 characters")
        return;
    }
    if(password.length < 5)
    {
        alert("Password must be at least 5 characters")
        return;
    }
        
    fetch('/check_registration' , {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username: username, email: email, password: password})
    }).then(response => {
        if(response.ok) {
            return response.json();
        }
    }).then(data => {
        if (data == "Bad Username") {
            console.log("Bad username");
            alert("Username already taken");
        }
        else if (data == "Bad Email") {
            console.log("Bad Email");
            alert("Email already associated with account");
        }
        else {
            console.log("Good username and email");
            alert("Successfully Registered!");
            window.location.href = "/login";
        }
    })
}

//function that opens log in page
function openLogin()
{
    window.location.href = '/login'
}

//function that opens register page
function openRegister()
{
    window.location.href = '/register'
}

//function that checks whether entered username/password combination are in database or not
function confirmLogin()
{
    var username = document.getElementById("login-username").value;
    var password = document.getElementById("login-password").value;
    fetch('/confirm_login' , {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username: username, password: password})
    }).then(response => {
        if(response.ok) {
            window.location.href = "/search";
        }
        else
        {
            alert("Nice try! Incorrect Login");
        }
    })
}

//function that opens about page
function openAbout()
{
    window.location.href = '/about'  
}

//function that opens search page
function openSearch()
{
    window.location.href = '/search';  
}

//function that opens cart page
function openCart()
{
    window.location.href = '/cart';
}

//function that opens account page
function openAccount()
{
    window.location.href = '/account';   
}

//function that updates the current number of items being displayed in your cart (based on qty attr in cart table)
function update_cart_count()
{
    fetch('/update_cart_count')
        .then(response => {
            return response.json();
        })
        .then(data =>{
            if (data == "")
            {
                data=0
            }
            cartLink = document.getElementById("cartLink");
            cartLink.textContent = "Cart (" + data + ")";
        })
}

//function that adds item to user cart
function add_to_cart(item)
{
    fetch('/add_to_cart' , {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({product:item[0]})
    }).then(response =>{
        update_cart_count();
    });
}

//function that clears user cart of all items
function clearCart()
{
    fetch('/clear_cart')
    .then(response => {
        Refresh()
        return response.ok;
    });
}

//function that displays account information
function display_account_info()
{
    fetch('/display_account_info')
    .then(response => {
        if(response.ok)
        {
            return response.json();
        }
    }).then(data => {
        var username = document.getElementById("account-username");
        username.textContent = "Username: " + data[0];

        var email = document.getElementById("account-email");
        email.textContent = "Email: " + data[1];
    })
}

//function that searches database for results based on search input and then displays them dynamically
function submitSearch() {
    var parent = document.getElementById("results");
    removeAllChildren(parent);

    var searchValue = document.getElementById("searchInput").value;
    var sortValue = document.getElementById("filter-dropdown").value

    const url = `/results?term=${encodeURIComponent(searchValue)}&sort=${encodeURIComponent(sortValue)}`;

    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json(); // Server returns search results in JSON format
        } else {
            throw new Error('Search request failed');
        }
    })
    .then(data => {
        var numResults = document.getElementById("numResults");

        if (data.length==0)
        {
            numResults.textContent = "No results";
            return;
        }
        if (data.length == 1)
        {
            numResults.textContent = data.length + " result";
        }
        numResults.textContent = data.length + " results";
        
        data.forEach(item => {
            var newDiv = document.createElement("div");
            newDiv.style.padding = '10px';
            var newP1 = document.createElement("p");
            newP1.textContent = item[1]; 

            var newP2 = document.createElement("p");
            newP2.textContent = "Price: $" + item[2];

            var newP3 = document.createElement("p");
            newP3.textContent = "Number In Stock: " + item[4];

            var newLine = document.createElement("br");
            var image = document.createElement("img");
            image.src = item[3];

            var newLink = document.createElement("a");
            newLink.textContent = "Add to Cart";

            newLink.addEventListener("click", function(event) {
                check_logged_in().then(isLoggedIn => {
                    if (isLoggedIn) {
                        add_to_cart(item);
                        alert(item[1] + " added to cart");
                    } 
                    else 
                    {
                        alert("You must be logged in to add items to cart");
                    }
                });
                
            });
            

            newDiv.appendChild(newP1);
            newDiv.appendChild(newP2);
            newDiv.appendChild(image);
            newDiv.appendChild(newLine);
            newDiv.appendChild(newLine);
            newDiv.appendChild(newP3);
            newDiv.appendChild(newLink);

            // Style the div as needed
            newDiv.style.width = "100px";
            //newDiv.style.height = "100px";
            newDiv.style.backgroundColor = "#F5F5DC";
            parent.appendChild(newDiv);
        });
    })
    .catch(error => {
        console.error('Error fetching search results:', error);
    });
}

//function that completes a user purchase
function purchase()
{
    fetch('/complete_purchase' , {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(response => {
        if(response.ok) {
            return response.json();
        }
    })
}

function remove_item(id,item)
{
    confirmRemove = confirm("Are you sure you want to remove " + item + " from cart?");
    if(!confirmRemove)
    {
        return;
    }
    fetch('/remove_item' , {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({item:id})
    }).then(response => {
        if (response.ok)
        {
            Refresh();
            return response.json()
        }
    })
    
}


//function that displays user cart items on cart page
function displayCart()
{
    let total_cost = 0;
    var cart = document.getElementById("cart-products");

    fetch('/displayCart')
    .then(response => {
        if (response.ok) {
            return response.json(); 
        } else {
            throw new Error('Cart display failed');
        }
    })
    .then(data => {
        total_cost = 0
        data.forEach(item => {
            total_cost += Number(item[2] * item[4]);

            var title = document.createElement("p");
            var price = document.createElement("p")
            var qty = document.createElement("p")
            var image = document.createElement("img");
            var remove = document.createElement("img");
            var bottom = document.createElement("div");


            image.src = item[3];
            title.textContent = "Product: " + item[1];
            title.style.fontWeight = 'bold';
            qty.textContent = "Qty: " + item[4];
            bottom.style.display = 'flex'
            bottom.style.flexDirection = 'row'
            price.textContent = "Price: $" + item[4] * item[2];
            bottom.style.marginBottom = '50px';
            bottom.style.height = '10%'
            remove.src = 'static/remove.png';
            remove.style.height = '75%';
            remove.style.marginLeft = '5%'
            remove.style.marginTop = '1%'
            remove.style.cursor = 'pointer'
            remove.addEventListener("click" , function(event){
                remove_item(item[0],item[1])
            })
            


            cart.appendChild(title);
            cart.appendChild(image);
            cart.appendChild(qty);
            bottom.appendChild(price)
            bottom.appendChild(remove);
            cart.appendChild(bottom);

        })

        if (data.length != 0)
        {
            var purchase_section = document.createElement("div")
            purchase_section.style.display = 'flex';
            purchase_section.style.flexDirection = 'row';
            purchase_section.style.justifyContent = 'center';
            cart.appendChild(purchase_section);

            var total = document.createElement("p");
            var purchase_button = document.createElement("button");
            var clear_cart = document.createElement("button")

            purchase_button.id = 'purchase-button';
            clear_cart.id = "clearCart-button";

            clear_cart.textContent = "Clear Cart";
            clear_cart.addEventListener("click" , function(event) {
                var confirmClear = confirm("Are you sure you want to clear cart?");
                if(confirmClear)
                {
                    clearCart();
                }
            });

            purchase_button.textContent = "Purchase";
            purchase_button.addEventListener("click", function(event) {
                var confirmPurchase = confirm("Are you sure you want to purchase?");
                if (confirmPurchase)
                {
                    purchase();
                    alert("Purchase successful!");
                    Refresh()
                }
            });
            total.textContent = "Total Cost: $" + total_cost.toFixed(2);
            purchase_section.appendChild(total);
            purchase_section.appendChild(clear_cart);
            purchase_section.appendChild(purchase_button);
        }
        else
        {
            var empty = document.createElement("h2");
            var shop_now = document.createElement("a");
            var sadface = document.createElement("img");

            empty.style.fontSize = '45px';
            empty.style.marginBottom = '1%';
            empty.textContent = "Your Sofa King cart is empty";
            shop_now.textContent = "Shop Now!"
            sadface.src = "static/sadface.png";
            sadface.style.marginTop = '1%';
            sadface.style.height = '40%';

            shop_now.addEventListener("click" ,function(event) {
                openSearch()
            })

            cart.appendChild(empty);
            cart.appendChild(sadface);
            cart.appendChild(shop_now);
        }
    });
}

//function that logs user out and ends their session
function logout()
{
    var result = confirm("Are you sure you want to log out?");
    if (!result)
    {
        return;
    }
    fetch('/logout')
        .then(response => {
            if(!response.ok)
            {
                alert("Page not available");
                return response.ok;
            }
            window.location.href = '/search'
        })
}

//function that checks if user is currently logged in
async function check_logged_in() {
    try {
        const response = await fetch('/check_logged_in');
        const data = await response.json();
        if (data.loggedIn) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

//function that refreshes page
function Refresh()
{
    location.reload();
}

//function that removes all children elements from a parent (used for clearing the search page before new results are displayed)
function removeAllChildren(parentElement) {
    while (parentElement.firstChild) {
        parentElement.removeChild(parentElement.firstChild);
    }
}
