from flask import Flask, jsonify, render_template
from scraper import get_lunch_lists

app = Flask(__name__)

# List of lunch URLs
LUNCH_URLS = [
    'https://lounaat.info/lounas/food-co-tulli-business-park/tampere',
    'https://lounaat.info/lounas/myllarit/tampere',
    'https://lounaat.info/lounas/old-mates-tampere/tampere',
    'https://lounaat.info/lounas/aleksis/tampere',
    'https://lounaat.info/lounas/edun-herkkukeidas-eetwartti/tampere',
    'https://www.lounaat.info/lounas/le-momento-ratina/tampere'
]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/lunch', methods=['GET'])
def lunch_api():
    menus = get_lunch_lists(LUNCH_URLS)
    return jsonify(menus)

if __name__ == '__main__':
    app.run(debug=True)
