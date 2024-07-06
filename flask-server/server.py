from flask import Flask, request
from Agent import Agent
from utils import set_seed
import joblib


app = Flask(__name__)
agent = None

@app.route('/api/sendState', methods=['POST'])
def receiveState():
    global agent

    # Sanitization
    state = request.get_json()
    if not isinstance(state, dict): return {'msg': 'failed'}, 400
    if not all(key in state for key in ('carPosX', 'carPosY', 'carSpeed', 'sineAngle', 'cosineAngle', 'N_trackDist', 'S_trackDist', 'E_trackDist', 'W_trackDist', 'reward', 'done', 'isTrain')): return {'msg': 'failed'}, 400

    for key in ('carSpeed', 'sineAngle', 'cosineAngle', 'reward'):
        if isinstance(state[key], int):
            state[key] = float(state['carSpeed'])


    if not all(isinstance(state[val], float) for val in ('carPosX', 'carPosY', 'carSpeed', 'sineAngle', 'cosineAngle', 'N_trackDist', 'S_trackDist', 'E_trackDist', 'W_trackDist', 'reward')): return {'msg': 'failed'}, 400
    if not all(isinstance(state[val], bool) for val in ('done', 'isTrain')): return {'msg': 'failed'}, 400

    reward = state['reward']
    done = state['done']
    isTrain = state['isTrain']
    del state['done']
    del state['reward']
    del state['isTrain']
    action = ''

    if agent is None: return {'msg': 'failed'}, 400

        
    # Save state and reward and update agent
    if isTrain:
        agent.step(state, reward, done)

        # Produce new action
        action = agent.selectAction(state, done)

        # Save state and action
        agent.saveAsPrev(state, action, done)
    else:
        action = agent.inferAction(state)
    
    # Send back new action
    return {'action': action}




@app.route('/api/startTraining', methods=['POST'])
def startTraining():
    global agent

    # Sanitization
    state = request.get_json()
    if not isinstance(state, dict): return {'msg': 'failed'}, 400
    if not all(key in state for key in ('carPosX', 'carPosY', 'carSpeed', 'sineAngle', 'cosineAngle', 'N_trackDist', 'S_trackDist', 'E_trackDist', 'W_trackDist')): return {'msg': 'failed'}, 400

    for key in ('carSpeed', 'sineAngle', 'cosineAngle'):
        if isinstance(state[key], int):
            state[key] = float(state['carSpeed'])

    if not all(isinstance(state[val], float) for val in ('carPosX', 'carPosY', 'carSpeed', 'sineAngle', 'cosineAngle', 'N_trackDist', 'S_trackDist', 'E_trackDist', 'W_trackDist')): return {'msg': 'failed'}, 400
    
    
    #initialize agent
    set_seed(21)
    agent = Agent(num_hidden_layers=5, hidden_layer_size=10, epsilon=0.9, eps_decay=0.9999, min_eps=0.05, gamma=0.95, targetRefreshRate=1000, batch_size=512, learning_rate=0.001, initial_state=state)

    # Produce new action
    action = agent.selectAction(state, done=False)

    # Save state, action
    agent.saveAsPrev(state, action, done=False)

    # Send back new action
    return {'action': action}




@app.route('/api/stopTraining', methods=['POST'])
def stopTraining():
    global agent

    joblib.dump(agent, 'new_agent.pkl')
    agent = None

    return {'msg': 'success'}


@app.route('/api/startAI', methods=['POST'])
def startAI():
    global agent

    # Sanitization
    state = request.get_json()
    if not isinstance(state, dict): return {'msg': 'failed'}, 400
    if not all(key in state for key in ('carPosX', 'carPosY', 'carSpeed', 'sineAngle', 'cosineAngle', 'N_trackDist', 'S_trackDist', 'E_trackDist', 'W_trackDist')): return {'msg': 'failed'}, 400

    for key in ('carSpeed', 'sineAngle', 'cosineAngle'):
        if isinstance(state[key], int):
            state[key] = float(state['carSpeed'])

    if not all(isinstance(state[val], float) for val in ('carPosX', 'carPosY', 'carSpeed', 'sineAngle', 'cosineAngle', 'N_trackDist', 'S_trackDist', 'E_trackDist', 'W_trackDist')): return {'msg': 'failed'}, 400

    agent = joblib.load('new_agent.pkl')
    newAction = agent.inferAction(state)

    return {'action': newAction}



@app.route('/api/stopAI', methods=['POST'])
def stopAI():
    global agent
    agent = None
    return {'msg': 'success'}


if __name__== '__main__':
    app.run(host='0.0.0.0', port=8088, debug=True)