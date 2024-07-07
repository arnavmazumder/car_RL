from flask import Flask, request
from Agent import Agent
from utils import set_seed
import joblib


app = Flask(__name__)
agent = None

def sanitize(isStarter, state):

    if not isinstance(state, dict): return False
    if not all(key in state for key in ('carX', 'carY', 'sineAngle', 'cosAngle', 'carSpeed', 'NE_trackDist', 'NW_trackDist', 'N_trackDist', 'S_trackDist', 'E_trackDist', 'W_trackDist', 'up', 'left', 'right')): return False
    for val in ('sineAngle', 'cosAngle', 'carSpeed'): 
        if isinstance(state[val], int): state[val] = float(state[val])

    if not all(isinstance(state[val], float) for val in ('carX', 'carY', 'sineAngle', 'cosAngle', 'carSpeed', 'NE_trackDist', 'NW_trackDist', 'N_trackDist', 'S_trackDist', 'E_trackDist', 'W_trackDist')): return False
    if not all(isinstance(state[val], bool) for val in ('up', 'left', 'right')): return False

    if not isStarter:
        if not all(key in state for key in ('reward', 'done', 'isTrain')): return False
        if isinstance(state['reward'], int):
            state['reward'] = float(state['reward'])
        if not isinstance(state['reward'], float): return False
        if not all(isinstance(state[val], bool) for val in ('done', 'isTrain')): return False
        if agent is None: return False
    
    return True



    



@app.route('/api/sendState', methods=['POST'])
def receiveState():
    global agent

    # Sanitization
    state = request.get_json()
    if not sanitize(False, state): return {'msg': 'failed'}, 400


    reward = state['reward']
    done = state['done']
    isTrain = state['isTrain']
    del state['done']
    del state['reward']
    del state['isTrain']
    action = ''
        
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
    if not sanitize(True, state): return {'msg': 'failed'}, 400
    
    #initialize agent
    set_seed(42)
    agent = Agent(num_hidden_layers=5, hidden_layer_size=5, epsilon=0.9, eps_decay=0.99999, min_eps=0.05, gamma=0.9, targetRefreshRate=100, batch_size=128, learning_rate=0.001, initial_state=state)

    # Produce new action
    action = agent.selectAction(state, done=False)

    # Save state, action
    agent.saveAsPrev(state, action, done=False)

    # Send back new action
    return {'action': action}




@app.route('/api/stopTraining', methods=['POST'])
def stopTraining():
    global agent

    joblib.dump([agent.losses, agent.cum_reward, agent.replay_buffer], 'agent1_data.pkl')
    agent.losses = None
    agent.cum_reward = None
    agent.replay_buffer = None

    joblib.dump(agent, 'agent1.pkl')
    agent = None

    return {'msg': 'success'}




@app.route('/api/startAI', methods=['POST'])
def startAI():
    global agent

    # Sanitization
    state = request.get_json()
    if not sanitize(True, state): return {'msg': 'failed'}, 400

    agent = joblib.load('agent1.pkl')
    newAction = agent.inferAction(state)

    return {'action': newAction}




@app.route('/api/stopAI', methods=['POST'])
def stopAI():
    global agent
    agent = None
    return {'msg': 'success'}


if __name__== '__main__':
    app.run(host='0.0.0.0', port=8088, debug=True)