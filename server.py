import psycopg2
from flask import Flask, render_template, jsonify, request, session
import random
import os
from collections import Counter

app = Flask(__name__)

# Set a secret key for the session
# In a production environment, use a random and secure key,
# and consider loading it from an environment variable or a config file
app.secret_key = os.urandom(24)

def execute_query(query, params=None, fetch_results = True):
    conn = None
    result = None
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            user="jaydenstilla",
            password="seminole13",
            dbname="jaydenstilla"
        )
        cursor = conn.cursor()
        cursor.execute(query, params)
        if fetch_results == True:
            result = cursor.fetchall()
        else:
            result = None
        conn.commit()
    except psycopg2.Error as e:
        print("Error executing query:", e)
    finally:
        if conn:
            conn.close()
    return result

def get_UserID(username):
    query = "SELECT id FROM users WHERE username = %s"
    id = execute_query(query,(username,))
    return id[0]

def check_cart(user,product):
    query = "SELECT * FROM cart WHERE userid = %s AND productid = %s"
    result = execute_query(query,(user,product,))
    if result:
        return True
    else:
        return False

def clearCart(user):
    query = "DELETE FROM cart WHERE userid = %s"
    execute_query(query,(user,),False)



@app.route('/')
def index():
    return render_template('search.html')


@app.route('/check_registration' , methods = ['POST'])
def verify_input():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    query = "SELECT * FROM users WHERE username = %s"
    result_username = execute_query(query, (username,))

    query = "SELECT * FROM users WHERE email = %s"
    result_email = execute_query(query, (email,))

    if result_username:
        return jsonify("Bad Username")
    elif result_email:
        return jsonify("Bad Email")
    else:
        query = "SELECT id FROM users"
        result_ids = execute_query(query)
        ids = [row[0] for row in result_ids]

        new_id = str(random.randint(0, 999999999)).zfill(9)

        while new_id in ids:
            new_id = random.randint(100000000, 999999999)
        
        query = "INSERT INTO users(id, username, password, email) VALUES(%s , %s , %s , %s)"
        execute_query(query, (new_id, username, password, email,), False)
        return jsonify("Good username and password")  


@app.route('/login')
def openLogin():
    return render_template('login.html')

@app.route('/about')
def openAbout():
    return render_template('about.html')

@app.route('/search')
def openSearch():
    return render_template('search.html')

@app.route('/confirm_login' , methods = ['POST'])
def confirmLogin():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    query = "SELECT * FROM users WHERE username = %s AND password = %s"
    result = execute_query(query, (username, password,))

    if result:
        session['logged_in'] = True 
        session['username'] = username  
        return jsonify(message='Logged in successfully'), 200
    else:
        return jsonify(message='Failed Log in'), 401

@app.route('/results' , methods = ['GET'])
def submit_search():
    search_terms = request.args.get('term', '').split()
    sort = request.args.get('sort', '')
    result = []

    if sort=="price_high":
        query = "SELECT id, title, price, image, qty FROM furniture2 WHERE LOWER(title) LIKE LOWER(%s) OR id = %s ORDER BY price DESC"
    elif sort=="price_low":
        query = "SELECT id, title, price, image, qty FROM furniture2 WHERE LOWER(title) LIKE LOWER(%s) OR id = %s ORDER BY price"
    elif sort=="qty":
        query = "SELECT id, title, price, image, qty FROM furniture2 WHERE LOWER(title) LIKE LOWER(%s) OR id = %s ORDER BY qty"
    else:
        query = "SELECT id, title, price, image, qty FROM furniture2 WHERE LOWER(title) LIKE LOWER(%s) OR id = %s"

    for term in search_terms:
        search_term_title = '%' + term + '%'
        result += execute_query(query, (search_term_title, term,))
    
    if len(search_terms) >=2:
        count = Counter(result)
        result = [item for item, freq in count.items() if freq > 1]
    return jsonify(result)
    
    '''
    search_term = request.args.get('term', '')
    
    sort = request.args.get('sort', '')
    if sort=="price_high":
        query = "SELECT id, title, price, image, qty FROM furniture2 WHERE LOWER(title) LIKE LOWER(%s) OR id = %s ORDER BY price DESC LIMIT 100"
    elif sort=="price_low":
        query = "SELECT id, title, price, image, qty FROM furniture2 WHERE LOWER(title) LIKE LOWER(%s) OR id = %s ORDER BY price LIMIT 100"
    elif sort=="qty":
        query = "SELECT id, title, price, image, qty FROM furniture2 WHERE LOWER(title) LIKE LOWER(%s) OR id = %s ORDER BY qty LIMIT 100"
    else:
        query = "SELECT id, title, price, image, qty FROM furniture2 WHERE LOWER(title) LIKE LOWER(%s) OR id = %s LIMIT 100"

    search_term_title = '%' + search_term + '%'
    result = execute_query(query, (search_term_title, search_term,))

    return jsonify(result)
    '''


@app.route('/register')
def openRegister():
    return render_template('register.html')

@app.route('/cart')
def openCart():
    return render_template('cart.html')

@app.route('/account')
def openAccount():
    return render_template('account.html')

@app.route('/display_account_info')
def display_account_info():
    user = get_UserID(session['username'])
    query = "SELECT username, email FROM users WHERE id = %s"
    result = execute_query(query,(user,))
    return jsonify(result[0])

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('username', None)
    return render_template('search.html')

@app.route('/check_logged_in')
def check_logged_in():
    if session.get('logged_in') == True:
         return {'loggedIn': True},200
    else:
        return {'loggedIn': False}, 200
    

@app.route('/add_to_cart',  methods = ['POST'])
def add_to_cart():
    data = request.get_json()
    product = data.get('product')
    user = get_UserID(session['username'])

    if check_cart(user,product):
        query = "UPDATE cart SET qty = qty+1 WHERE userid = %s AND productid = %s"
        execute_query(query,(user,product,) , False)
    else:
        query = "INSERT INTO cart(userid, productid, date_added, qty) VALUES (%s , %s , CURRENT_DATE , 1)"
        execute_query(query, (user,product,) , False)

    return jsonify({'message': 'Product added to cart successfully'}), 200


@app.route('/displayCart')
def displayCart():
    if 'username' in session:
        user = get_UserID(session['username'])
    else:
        return 'User is not logged in', 401
    
    query = "SELECT f.id,title,price,image,c.qty FROM cart c INNER JOIN users u ON c.userid = u.id INNER JOIN furniture2 f ON c.productid = f.id WHERE userid = %s"
    result = execute_query(query,(user,))

    return jsonify(result)

@app.route('/update_cart_count')
def update_cart_count():
    user = get_UserID(session['username'])
    query = "SELECT SUM(qty) FROM cart WHERE userid = %s"
    result = execute_query(query,(user,))
    return jsonify(result),200

@app.route('/clear_cart')
def clear():
    user = get_UserID(session['username'])
    clearCart(user)
    return 200

@app.route('/remove_item', methods = ['POST'])
def remove_item():
    data = request.get_json()
    product = data.get('item')
    user = get_UserID(session['username'])
    query = "DELETE FROM cart WHERE userid = %s AND productid = %s"
    execute_query(query,(user,product,),False)
    return jsonify({'message': 'Product successfully removed'}), 200

@app.route('/complete_purchase',  methods = ['POST'])
def completePurchase():
    user = get_UserID(session['username'])
    query = "SELECT c.productid , c.qty FROM cart c INNER JOIN users u ON c.userid = u.id INNER JOIN furniture2 f ON c.productid = f.id WHERE userid = %s"
    result = execute_query(query,(user,))
    for product, cart_qty in result:
        query = "UPDATE furniture2 SET qty = qty - %s WHERE id = %s"
        execute_query(query,(cart_qty,product,),False)

        new_id = str(random.randint(0, 999999999)).zfill(9)
        query = "INSERT INTO orders(id,userid,productid,qty,date) VALUES(%s, %s , %s , %s, CURRENT_DATE)"
        execute_query(query,(new_id,user,product,cart_qty,),False)

    
    clearCart(user)
    return jsonify({'message': 'Product successfully completed'}), 200


if __name__ == '__main__':
    app.run(debug=True)
        


