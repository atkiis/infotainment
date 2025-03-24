import requests
from bs4 import BeautifulSoup
from datetime import datetime

def get_lunch_lists():
    url = 'https://www.lounaat.info/lounas/food-co-tulli-business-park/tampere'
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    # Get today's date in the format used on the website (e.g., "Tiistaina 25.3.")
    weekday = datetime.today().strftime('%A')  # Get the weekday (e.g., "Tuesday")
    day = datetime.today().day  # Get the day number
    month = datetime.today().month  # Get the month number

    # Convert weekday to Finnish manually (since locale may not work)
    weekdays_fi = {
        "Monday": "Maanantaina",
        "Tuesday": "Tiistaina",
        "Wednesday": "Keskiviikkona",
        "Thursday": "Torstaina",
        "Friday": "Perjantaina",
        "Saturday": "Lauantaina",
        "Sunday": "Sunnuntaina"
    }
    
    today_date = f"{weekdays_fi[weekday]} {day}.{month}."

    menu_container = soup.find('div', id='menu')
    items = menu_container.find_all('div', class_='item') if menu_container else []

    for item in items:
        item_header = item.find('div', class_='item-header')
        if item_header:
            date = item_header.text.strip()
            print(f"Extracted date: {date}")  # Debugging line

            if date != today_date:
                continue  # Skip if not today's menu

            print(f'\n{date}')  # Print today's date
        
        menu_items = item.find_all('li', class_='menu-item')
        for menu_item in menu_items:
            price = menu_item.find('p', class_='price').text.strip() if menu_item.find('p', class_='price') else 'N/A'
            dish = menu_item.find('p', class_='dish').text.strip() if menu_item.find('p', class_='dish') else 'N/A'
            info = menu_item.find('p', class_='info').text.strip() if menu_item.find('p', class_='info') else 'N/A'
            print(f'Päivän menu: {dish} ({price}) - {info}')
        
        print('-' * 40)
        break  # Stop after today's menu

if __name__ == '__main__':
    get_lunch_lists()
