import requests
from bs4 import BeautifulSoup
from datetime import datetime

def get_lunch_lists(urls):
    weekdays_fi = {
        "Monday": "Maanantaina",
        "Tuesday": "Tiistaina",
        "Wednesday": "Keskiviikkona",
        "Thursday": "Torstaina",
        "Friday": "Perjantaina",
        "Saturday": "Lauantaina",
        "Sunday": "Sunnuntaina"
    }
    
    weekday = datetime.today().strftime('%A')
    today_date = f"{weekdays_fi[weekday]} {datetime.today().day}.{datetime.today().month}."

    all_menus = []

    for url in urls:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.RequestException as e:
            all_menus.append({"restaurant": url, "error": f"Failed to fetch data: {str(e)}"})
            continue

        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract restaurant name from the page title
        restaurant_name = soup.find('title').text.strip().split(' | ')[0] if soup.find('title') else url

        menu_container = soup.find('div', id='menu')
        items = menu_container.find_all('div', class_='item') if menu_container else []

        menu_data = []
        for item in items:
            item_header = item.find('div', class_='item-header')
            if item_header:
                date = item_header.text.strip()
                if date != today_date:
                    continue  # Skip if not today's menu

                menu_items = []
                for menu_item in item.find_all('li', class_='menu-item'):
                    price = menu_item.find('p', class_='price').text.strip() if menu_item.find('p', class_='price') else 'N/A'
                    dish = menu_item.find('p', class_='dish').text.strip() if menu_item.find('p', class_='dish') else 'N/A'
                    info = menu_item.find('p', class_='info').text.strip() if menu_item.find('p', class_='info') else ''

                    menu_items.append({
                        "dish": dish,
                        "price": price,
                        "info": info
                    })

                menu_data.append({
                    "date": date,
                    "menu": menu_items
                })
                break  # Stop after today's menu

        all_menus.append({
            "restaurant": restaurant_name,
            "menu": menu_data if menu_data else [{"date": today_date, "message": "No menu found for today"}]
        })

    return all_menus

if __name__ == '__main__':
    urls = [
        'https://www.lounaat.info/lounas/food-co-tulli-business-park/tampere',
        'https://lounaat.info/lounas/myllarit/tampere'
    ]
    menus = get_lunch_lists(urls)
    print(menus)
