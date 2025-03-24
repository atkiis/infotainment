import requests
from bs4 import BeautifulSoup

def get_lunch_lists():
    url = 'https://www.lounaat.info/lounas/food-co-tulli-business-park/tampere'
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    menu_container = soup.find('div', id='menu')
    items = menu_container.find_all('div', class_='item') if menu_container else []
    
    menu_data = []

    for item in items:
        date = item.find('div', class_='item-header').text.strip() if item.find('div', class_='item-header') else 'Unknown date'
        menu_items = []

        for menu_item in item.find_all('li', class_='menu-item'):
            price = menu_item.find('p', class_='price').text.strip() if menu_item.find('p', class_='price') else 'N/A'
            dish = menu_item.find('p', class_='dish').text.strip() if menu_item.find('p', class_='dish') else 'N/A'
            info = menu_item.find('p', class_='info').text.strip() if menu_item.find('p', class_='info') else 'N/A'

            menu_items.append({
                "dish": dish,
                "price": price,
                "info": info
            })
        
        menu_data.append({
            "date": date,
            "menu": menu_items
        })

    return menu_data
