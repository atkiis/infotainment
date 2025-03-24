from flask import Flask, jsonify, render_template
from scraper import get_lunch_lists

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/lunch', methods=['GET'])
def lunch_api():
    return jsonify(get_lunch_lists())

if __name__ == '__main__':
    app.run(debug=True)
