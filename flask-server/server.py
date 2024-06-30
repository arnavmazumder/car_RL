from flask import Flask, request
from Agent import Agent
from utils import set_seed


app = Flask(__name__)
agent = None

@app.route('/api/sendState', methods=['POST'])
def receiveState():

    # Sanitization
    state = request.get_json()
    if not isinstance(state, dict): return {'msg': 'failed'}, 400
    if not all(key in state for key in ('carPosX', 'carPosY', 'carSpeed', 'carAngle', 'N_trackDist', 'NE_trackDist', 'NW_trackDist', 'S_trackDist', 'SE_trackDist', 'SW_trackDist', 'E_trackDist', 'W_trackDist', 'reward', 'done')): return {'msg': 'failed'}, 400

    for key in ('carSpeed', 'carAngle', 'reward'):
        if isinstance(state[key], int):
            state[key] = float(state['carSpeed'])


    if not all(isinstance(state[val], float) for val in ('carPosX', 'carPosY', 'carSpeed', 'carAngle', 'N_trackDist', 'NE_trackDist', 'NW_trackDist', 'S_trackDist', 'SE_trackDist', 'SW_trackDist', 'E_trackDist', 'W_trackDist', 'reward')): return {'msg': 'failed'}, 400
    if not isinstance(state['done'], bool): return {'msg': 'failed'}, 400

    reward = state['reward']
    done = state['done']
    del state['done']
    del state['reward']
    action = ''

    if not agent is None:
        
        # Save state and reward and update agent
        agent.step(state, reward, done)

        # Produce new action
        action = agent.selectAction(state, done)

        # Save state and action
        agent.saveAsPrev(state, action, done)

    # Send back new action
    return {'action': action}




@app.route('/api/startTraining', methods=['POST'])
def startTraining():

    # Sanitization
    state = request.get_json()
    if not isinstance(state, dict): return {'msg': 'failed'}, 400
    if not all(key in state for key in ('carPosX', 'carPosY', 'carSpeed', 'carAngle', 'N_trackDist', 'NE_trackDist', 'NW_trackDist', 'S_trackDist', 'SE_trackDist', 'SW_trackDist', 'E_trackDist', 'W_trackDist')): return {'msg': 'failed'}, 400

    for key in ('carSpeed', 'carAngle'):
        if isinstance(state[key], int):
            state[key] = float(state['carSpeed'])

    if not all(isinstance(state[val], float) for val in ('carPosX', 'carPosY', 'carSpeed', 'carAngle', 'N_trackDist', 'NE_trackDist', 'NW_trackDist', 'S_trackDist', 'SE_trackDist', 'SW_trackDist', 'E_trackDist', 'W_trackDist')): return {'msg': 'failed'}, 400
    
    
    #initialize agent
    set_seed(42)
    agent = Agent(num_hidden_layers=4, hidden_layer_size=15, epsilon=0.9, eps_decay=0.99, min_eps=0.1, gamma=0.95, targetRefreshRate=10, batch_size=30, learning_rate=0.001, initial_state=state)

    # Produce new action
    action = agent.selectAction(state, False)

    # Save state, action
    agent.saveAsPrev(state, action, False)

    # Send back new action
    return {'action': action}







@app.route('/api/stopTraining', methods=['POST'])
def stopTraining():
    return {'msg': 'success'}







if __name__== '__main__':
    app.run(host='0.0.0.0', port=8088, debug=True)