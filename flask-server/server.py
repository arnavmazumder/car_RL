from flask import Flask, request, Response

app = Flask(__name__)

@app.route('/api/sendState', methods=['POST'])
def receiveState():

    # Sanitization
    raw = request.get_json()
    if not isinstance(raw, dict): return {'msg': 'failed'}, 400
    if not all(key in raw for key in ('carPosX', 'carPosY', 'carSpeed', 'carAngle', 'track', 'reward')): return {'msg': 'failed'}, 400

    raw['carSpeed'] = float(raw['carSpeed'])
    raw['carAngle'] = float(raw['carAngle'])

    if not all(isinstance(val, float) for val in (raw['carPosX'], raw['carPosY'], raw['carSpeed'], raw['carAngle'], raw['reward'])): return {'msg': 'failed'}, 400
    if not isinstance(raw['track'], list): return {'msg': 'failed'}, 400
    

    for point in raw['track']:
        if not isinstance(point, dict): return {'msg': 'failed'}, 400
        if not 'x' in point or not 'y' in point: return {'msg': 'failed'}, 400
        if not isinstance(point['x'], float) or not isinstance(point['y'], float): return {'msg': 'failed'}, 400
    
    #print(raw)
    # Send back new action
    return {'action': 'DownLeft'}




@app.route('/api/startTraining', methods=['POST'])
def startTraining():

    # Sanitization
    raw = request.get_json()
    if not isinstance(raw, dict): return {'msg': 'failed'}, 400
    if not all(key in raw for key in ('carPosX', 'carPosY', 'carSpeed', 'carAngle', 'track')): return {'msg': 'failed'}, 400

    raw['carSpeed'] = float(raw['carSpeed'])
    raw['carAngle'] = float(raw['carAngle'])

    if not all(isinstance(val, float) for val in (raw['carPosX'], raw['carPosY'], raw['carSpeed'], raw['carAngle'])): return {'msg': 'failed'}, 400
    if not isinstance(raw['track'], list): return {'msg': 'failed'}, 400
    

    for point in raw['track']:
        if not isinstance(point, dict): return {'msg': 'failed'}, 400
        if not 'x' in point or not 'y' in point: return {'msg': 'failed'}, 400
        if not isinstance(point['x'], float) or not isinstance(point['y'], float): return {'msg': 'failed'}, 400
    
    #Save to agent state
    #produce new action

    # Send back new action
    return {'action': 'DownUp'}







@app.route('/api/stopTraining', methods=['POST'])
def stopTraining():
    return {'msg': 'success'}







if __name__== '__main__':
    app.run(host='0.0.0.0', port=8088, debug=True)