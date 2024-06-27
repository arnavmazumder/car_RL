from flask import Flask, request

app = Flask(__name__)

@app.route('/api/sendState', methods=['POST'])
def receiveState():
    raw = request.get_json()
    print(raw)
    return {'msg': 'success'}


if __name__== '__main__':
    app.run(host='0.0.0.0', port=8088, debug=True)