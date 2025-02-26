from serpapi import GoogleSearch
import json
from server import execute_query
import psycopg2


params = {
    'api_key': '7b3597a88211ee7ed2673057a9b15564d83b1e2fc5882d8ef72fd541d1071ff6',
    'engine': 'home_depot',
    'q': 'sleeper couch'  # Replace with actual search value
}

try:
    search = GoogleSearch(params)
    results = search.get_dict()
    for product in results.get('products', []):
        #print(product)
        product_title = product.get('title')
        product_id = product.get('product_id')
        product_price = product.get('price')
        product_images = product.get('thumbnails')

        #print(f"Product Title: {product_title}")
        #print(f"Product ID: {product_id}")
        #print(f"Price: ${product_price}")
        #print(f"Image Links: {product_images[0][0]}")
        query1 = "SELECT * FROM furniture2 WHERE id = %s"
        result = execute_query(query1, (product_id,))
        if not result:
            print(product_title)
            query = "INSERT INTO furniture2(id, title, price, image, qty) VALUES(%s , %s , %s, %s, 10)"
            execute_query(query, (product_id, product_title, product_price, product_images[0][0],), False)
except Exception as e:
    print("An error occurred:", e)

